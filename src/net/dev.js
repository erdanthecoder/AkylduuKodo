// net/dev.js — talks to dev/server.mjs. Same interface as firebase.js.
//
// Only used on localhost when the dev server answers. Live data arrives over
// one server-sent-events stream per tab; writes are plain POSTs.

const TOKEN_KEY = 'quickzy.dev.token';

async function call(path, body = {}) {
  const res = await fetch(`/__dev/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data && data.error) {
    const err = new Error(data.error);
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function create() {
  /* ------------------------------------------------------------ auth */

  let user = null;
  const authListeners = new Set();
  const setUser = (u) => {
    user = u;
    authListeners.forEach((fn) => { try { fn(user); } catch (e) { console.error(e); } });
  };
  const session = (data) => {
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user || null);
    return user;
  };

  try {
    const me = await call('auth/me');
    user = me.user;
  } catch { user = null; }

  const auth = {
    current: () => user,
    onChange(fn) { authListeners.add(fn); fn(user); return () => authListeners.delete(fn); },
    anon: async () => session(await call('auth/anon')),
    google: async () => session(await call('auth/google', { email: sessionStorage.getItem('quickzy.dev.google') || undefined })),
    signUp: async (email, password) => session(await call('auth/signup', { email, password })),
    signIn: async (email, password) => session(await call('auth/signin', { email, password })),
    async signOut() { await call('auth/signout'); localStorage.removeItem(TOKEN_KEY); setUser(null); },
    sendReset: async (email) => { await call('auth/reset', { email }); },
    sendVerify: async () => { await call('auth/verify'); },
    async setDisplayName(name) { const r = await call('auth/profile', { name }); setUser(r.user); },
    changePassword: async (current, next) => { await call('auth/password', { current, next }); },
    reauth: async (password) => { await call('auth/reauth', { password }); },
    async deleteAccount() { await call('auth/delete'); localStorage.removeItem(TOKEN_KEY); setUser(null); },
    async reload() { const r = await call('auth/me'); setUser(r.user); return user; },
  };

  /* ----------------------------------------------------------- store */

  const SERVER_TIME = { __serverTime: true };
  const store = {
    async get(col, id) {
      const { data } = await call('store', { op: 'get', col, id });
      return data ? { id, ...data } : null;
    },
    set: (col, id, data, opts = {}) => call('store', { op: 'set', col, id, data, merge: Boolean(opts.merge) }),
    update: (col, id, data) => call('store', { op: 'update', col, id, data }),
    del: (col, id) => call('store', { op: 'delete', col, id }),
    add: async (col, data) => (await call('store', { op: 'add', col, data })).id,
    async query(col, q = {}) {
      const { rows } = await call('store', { op: 'query', col, ...q });
      return rows.map((r) => ({ id: r.id, ...r.data }));
    },
    count: async (col, q = {}) => (await call('store', { op: 'count', col, ...q })).count,
    batch: (steps) => call('store', { op: 'batch', steps: steps.map((s) => ({ ...s, op: s.op === 'del' ? 'delete' : s.op })) }),
    serverTime: () => SERVER_TIME,
    increment: (n) => ({ __increment: n }),
    deleteField: () => ({ __delete: true }),
  };

  /* ------------------------------------------------------------ live */

  let connId = null;
  let offset = 0;
  const subs = new Map();        // path -> Set<fn>
  const last = new Map();        // path -> latest value
  let ready;
  const opened = new Promise((r) => { ready = r; });

  const stream = new EventSource('/__dev/live/stream');
  stream.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'hello') {
      connId = msg.connId;
      offset = msg.now - Date.now();
      // re-subscribe after a reconnect
      for (const path of subs.keys()) call('live/sub', { connId, path, on: true });
      ready();
      return;
    }
    if (msg.type === 'value') {
      last.set(msg.path, msg.value);
      for (const fn of subs.get(msg.path) || []) {
        try { fn(msg.value); } catch (e) { console.error(e); }
      }
    }
  };
  await opened;

  const TIMESTAMP = { '.sv': 'timestamp' };
  const clean = (p) => String(p).split('/').filter(Boolean).join('/');

  const live = {
    TIMESTAMP,
    increment: (n) => ({ '.sv': { increment: n } }),
    now: () => Date.now() + offset,
    get: async (path) => (await call('live', { op: 'get', path: clean(path) })).value,
    set: (path, value) => call('live', { op: 'set', path: clean(path), value }),
    update: (path, value) => call('live', { op: 'update', path: clean(path), value }),
    remove: (path) => call('live', { op: 'remove', path: clean(path) }),
    push: async (path, value) => (await call('live', { op: 'push', path: clean(path), value })).key,
    query: async (path, opts = {}) => (await call('live', { op: 'query', path: clean(path), ...opts })).value,
    on(path, fn) {
      const p = clean(path);
      if (!subs.has(p)) {
        subs.set(p, new Set());
        call('live/sub', { connId, path: p, on: true });
      } else if (last.has(p)) {
        queueMicrotask(() => fn(last.get(p)));
      }
      subs.get(p).add(fn);
      return () => {
        const set = subs.get(p);
        if (!set) return;
        set.delete(fn);
        if (!set.size) {
          subs.delete(p);
          last.delete(p);
          call('live/sub', { connId, path: p, on: false }).catch(() => {});
        }
      };
    },
    /** Each child of `path` once, as it is added, in key order. */
    onChild(path, fn) {
      const seen = new Set();
      return live.on(path, (value) => {
        if (!value || typeof value !== 'object') return;
        for (const key of Object.keys(value).sort()) {
          if (seen.has(key)) continue;
          seen.add(key);
          try { fn(key, value[key]); } catch (e) { console.error(e); }
        }
      });
    },
    async transaction(path, fn) {
      const p = clean(path);
      for (let attempt = 0; attempt < 12; attempt++) {
        const current = (await call('live', { op: 'get', path: p })).value;
        const next = fn(current === undefined ? null : current);
        if (next === undefined) return { committed: false, value: current };
        const r = await call('live', { op: 'cas', path: p, expect: current, value: next });
        if (r.committed) return { committed: true, value: r.value };
      }
      return { committed: false, value: null };
    },
    onDisconnect(path, action) {
      const op = action.remove ? { op: 'remove', path: clean(path) } : { op: 'set', path: clean(path), value: action.set };
      call('live/ondisconnect', { connId, op });
      return () => call('live/ondisconnect', { connId, op, cancel: true });
    },
  };

  return { kind: 'dev', auth, store, live };
}
