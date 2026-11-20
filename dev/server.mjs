// dev/server.mjs — a local stand-in for production, for development and tests.
//
// Two jobs:
//   1. Serve the site the way Firebase Hosting does it
//      itself: real files as themselves, every other path falls back to index.html.
//   2. Pretend to be Firebase, so a dozen browser tabs can play one game
//      against each other on this machine. The app talks to this through
//      src/net/dev.js, which implements exactly the same interface as
//      src/net/firebase.js.
//
// It is never deployed. Security rules are NOT enforced here — they live in
// rules/ and are what protects the real data.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

const ROOT = resolve(process.argv[2] || process.cwd());
const PORT = Number(process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

/* =========================================================== live (RTDB) */

const live = {};                       // the whole tree
const streams = new Map();             // connId -> { res, subs: Set<path>, onDisc: [] }

const split = (p) => String(p || '').split('/').filter(Boolean);

function getAt(path) {
  return asArrays(rawAt(path));
}

/** The stored node itself, for the code that changes the tree. */
function rawAt(path) {
  let node = live;
  for (const key of split(path)) {
    if (node === null || typeof node !== 'object' || !(key in node)) return null;
    node = node[key];
  }
  return node === undefined ? null : node;
}

/**
 * RTDB stores arrays as objects keyed 0, 1, 2… and hands them back as arrays
 * when the keys are whole numbers and more than half the slots are filled.
 * Do the same, so the app meets exactly what production gives it.
 */
function asArrays(node) {
  if (node === null || typeof node !== 'object') return node;
  const keys = Object.keys(node);
  const out = {};
  for (const k of keys) out[k] = asArrays(node[k]);
  if (keys.length && keys.every((k) => /^(0|[1-9]\d*)$/.test(k))) {
    const max = Math.max(...keys.map(Number));
    if (keys.length * 2 > max + 1) {
      const arr = new Array(max + 1).fill(null);
      for (const k of keys) arr[Number(k)] = out[k];
      return arr;
    }
  }
  return out;
}

/** Replace {".sv":"timestamp"} and drop nulls, the way RTDB does. */
function resolveValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value['.sv'] === 'timestamp') return Date.now();
    if (value['.sv'] && value['.sv'].increment !== undefined) return value;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const r = resolveValue(v);
      if (r !== null) out[k] = r;
    }
    return Object.keys(out).length ? out : null;
  }
  if (Array.isArray(value)) {
    const out = {};
    value.forEach((v, i) => { const r = resolveValue(v); if (r !== null) out[i] = r; });
    return Object.keys(out).length ? out : null;
  }
  return value;
}

function setAt(path, value) {
  const keys = split(path);
  if (!keys.length) {
    for (const k of Object.keys(live)) delete live[k];
    if (value && typeof value === 'object') Object.assign(live, value);
    return;
  }
  let node = live;
  for (const key of keys.slice(0, -1)) {
    if (node[key] === null || typeof node[key] !== 'object') node[key] = {};
    node = node[key];
  }
  const last = keys[keys.length - 1];
  const current = node[last];
  // increments read the current value
  if (value && typeof value === 'object' && value['.sv'] && value['.sv'].increment !== undefined) {
    node[last] = (typeof current === 'number' ? current : 0) + value['.sv'].increment;
  } else if (value === null) {
    delete node[last];
  } else {
    node[last] = value;
  }
  prune(keys);
}

/** Empty objects disappear, as they do in RTDB. */
function prune(keys) {
  for (let i = keys.length - 1; i > 0; i--) {
    const parent = rawAt(keys.slice(0, i).join('/'));
    if (parent && typeof parent === 'object' && Object.keys(parent).length === 0) {
      const grand = i === 1 ? live : rawAt(keys.slice(0, i - 1).join('/'));
      if (grand) delete grand[keys[i - 1]];
    }
  }
}

function overlaps(a, b) {
  const x = split(a).join('/');
  const y = split(b).join('/');
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`) || x === '' || y === '';
}

function notify(changedPaths) {
  for (const [, conn] of streams) {
    for (const sub of conn.subs) {
      if (changedPaths.some((p) => overlaps(p, sub))) {
        send(conn.res, { type: 'value', path: sub, value: getAt(sub) });
      }
    }
  }
}

function send(res, payload) {
  try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch { /* closed */ }
}

function applyLive(op) {
  const changed = [];
  if (op.op === 'set') {
    setAt(op.path, resolveValue(op.value));
    changed.push(op.path);
  } else if (op.op === 'update') {
    for (const [rel, v] of Object.entries(op.value || {})) {
      const full = split(op.path).concat(split(rel)).join('/');
      setAt(full, v && typeof v === 'object' && v['.sv'] && v['.sv'].increment !== undefined ? v : resolveValue(v));
      changed.push(full);
    }
  } else if (op.op === 'remove') {
    setAt(op.path, null);
    changed.push(op.path);
  }
  return changed;
}

function liveOp(body) {
  const { op } = body;
  if (op === 'get') return { value: getAt(body.path) };
  if (op === 'push') {
    const key = pushKey();
    const path = `${split(body.path).join('/')}/${key}`;
    notify(applyLive({ op: 'set', path, value: body.value }));
    return { key };
  }
  if (op === 'cas') {
    // compare-and-set: what a transaction is, underneath
    const current = getAt(body.path);
    if (JSON.stringify(current) !== JSON.stringify(body.expect ?? null)) {
      return { committed: false, value: current };
    }
    notify(applyLive({ op: 'set', path: body.path, value: body.value }));
    return { committed: true, value: getAt(body.path) };
  }
  if (op === 'query') {
    // orderByChild/equalTo or orderByValue with limits, enough for the app
    const node = getAt(body.path) || {};
    let entries = Object.entries(node);
    const { orderBy, equalTo, endAt, limitToFirst, limitToLast } = body;
    const val = (v) => (orderBy && orderBy !== '$value' ? (v && typeof v === 'object' ? v[orderBy] : undefined) : v);
    if (equalTo !== undefined) entries = entries.filter(([, v]) => val(v) === equalTo);
    if (endAt !== undefined) entries = entries.filter(([, v]) => val(v) <= endAt);
    entries.sort((a, b) => (val(a[1]) > val(b[1]) ? 1 : val(a[1]) < val(b[1]) ? -1 : 0));
    if (limitToFirst) entries = entries.slice(0, limitToFirst);
    if (limitToLast) entries = entries.slice(-limitToLast);
    return { value: Object.fromEntries(entries) };
  }
  notify(applyLive(body));
  return { ok: true };
}

const PUSH = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
let lastPush = 0;
let pushSeq = 0;
function pushKey() {
  let now = Date.now();
  if (now === lastPush) pushSeq += 1; else { pushSeq = 0; lastPush = now; }
  let key = '';
  for (let i = 0; i < 8; i++) { key = PUSH[now % 64] + key; now = Math.floor(now / 64); }
  key += PUSH[pushSeq % 64];
  for (let i = 0; i < 11; i++) key += PUSH[Math.floor(Math.random() * 64)];
  return key;
}

/* ========================================================= store (Firestore) */

const docs = new Map();                // "col/id" or "col/id/sub/id" -> data

function docPath(col, id) { return `${split(col).join('/')}/${id}`; }

function matches(data, [field, op, value]) {
  const v = field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
  if (op === '==') return v === value;
  if (op === '!=') return v !== value;
  if (op === '>') return v > value;
  if (op === '>=') return v >= value;
  if (op === '<') return v < value;
  if (op === '<=') return v <= value;
  if (op === 'array-contains') return Array.isArray(v) && v.includes(value);
  if (op === 'in') return Array.isArray(value) && value.includes(v);
  return false;
}

function inCollection(key, col) {
  const prefix = `${split(col).join('/')}/`;
  return key.startsWith(prefix) && !key.slice(prefix.length).includes('/');
}

function stamp(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.__serverTime) return Date.now();
    if (value.__increment !== undefined) return value;
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = stamp(v);
    return out;
  }
  if (Array.isArray(value)) return value.map(stamp);
  return value;
}

function mergeInto(base, patch) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && v.__delete) delete out[k];
    else if (v && typeof v === 'object' && v.__increment !== undefined) out[k] = (Number(out[k]) || 0) + v.__increment;
    else out[k] = v;
  }
  return out;
}

function storeOp(body) {
  const { op } = body;
  if (op === 'get') {
    const data = docs.get(docPath(body.col, body.id));
    return { data: data ? structuredClone(data) : null };
  }
  if (op === 'set') {
    const key = docPath(body.col, body.id);
    const value = stamp(body.data);
    docs.set(key, body.merge ? mergeInto(docs.get(key), value) : mergeInto({}, value));
    return { ok: true };
  }
  if (op === 'update') {
    const key = docPath(body.col, body.id);
    if (!docs.has(key)) return { error: 'not-found' };
    docs.set(key, mergeInto(docs.get(key), stamp(body.data)));
    return { ok: true };
  }
  if (op === 'delete') {
    docs.delete(docPath(body.col, body.id));
    return { ok: true };
  }
  if (op === 'add') {
    const id = randomBytes(10).toString('base64url').slice(0, 20);
    docs.set(docPath(body.col, id), mergeInto({}, stamp(body.data)));
    return { id };
  }
  if (op === 'query' || op === 'count') {
    let rows = [...docs.entries()]
      .filter(([k]) => inCollection(k, body.col))
      .map(([k, data]) => ({ id: k.split('/').pop(), data }))
      .filter((row) => (body.where || []).every((w) => matches(row.data, w)));
    if (op === 'count') return { count: rows.length };
    if (body.orderBy) {
      const [field, dir = 'asc'] = body.orderBy;
      rows.sort((a, b) => {
        const x = a.data[field]; const y = b.data[field];
        const c = x > y ? 1 : x < y ? -1 : 0;
        return dir === 'desc' ? -c : c;
      });
    }
    if (body.limit) rows = rows.slice(0, body.limit);
    return { rows: structuredClone(rows) };
  }
  if (op === 'batch') {
    for (const step of body.steps || []) storeOp(step);
    return { ok: true };
  }
  return { error: `unknown op ${op}` };
}

/* ================================================================ auth */

const users = new Map();               // uid -> { uid, email, passHash, name, provider, verified, anonymous }
const sessions = new Map();            // token -> uid
const outbox = [];                     // emails "sent", for tests to read

const hash = (s) => createHash('sha256').update(`quickzy-dev:${s}`).digest('hex');

function publicUser(u) {
  return {
    uid: u.uid, email: u.email || null, displayName: u.name || null,
    emailVerified: Boolean(u.verified), isAnonymous: Boolean(u.anonymous),
    providers: u.provider ? [u.provider] : [],
  };
}

function newSession(u) {
  const token = randomBytes(18).toString('hex');
  sessions.set(token, u.uid);
  return { token, user: publicUser(u) };
}

function authOp(path, body, token) {
  const me = token && users.get(sessions.get(token));
  if (path === 'anon') {
    const u = { uid: `anon_${randomBytes(8).toString('hex')}`, anonymous: true };
    users.set(u.uid, u);
    return newSession(u);
  }
  if (path === 'signup') {
    const email = String(body.email || '').toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'auth/invalid-email' };
    if ([...users.values()].some((u) => u.email === email)) return { error: 'auth/email-already-in-use' };
    if (String(body.password || '').length < 8) return { error: 'auth/weak-password' };
    // tests may ask for a fixed uid (the owner's, say); this server is never public
    const uid = typeof body.uid === 'string' && /^[A-Za-z0-9]{6,40}$/.test(body.uid) && !users.has(body.uid) ? body.uid : randomBytes(10).toString('hex');
    const u = { uid, email, passHash: hash(body.password), provider: 'password' };
    users.set(u.uid, u);
    return newSession(u);
  }
  if (path === 'signin') {
    const email = String(body.email || '').toLowerCase();
    const u = [...users.values()].find((x) => x.email === email);
    if (!u || u.passHash !== hash(body.password)) return { error: 'auth/invalid-credential' };
    return newSession(u);
  }
  if (path === 'google') {
    // a pretend Google account, so the button can be exercised locally
    const email = String(body.email || 'player@gmail.com').toLowerCase();
    let u = [...users.values()].find((x) => x.email === email);
    if (!u) {
      u = { uid: randomBytes(10).toString('hex'), email, provider: 'google.com', verified: true, name: body.name || 'Google Player' };
      users.set(u.uid, u);
    }
    return newSession(u);
  }
  if (path === 'me') return me ? { user: publicUser(me) } : { user: null };
  if (path === 'signout') { sessions.delete(token); return { ok: true }; }
  if (path === 'reset') {
    const email = String(body.email || '').toLowerCase();
    // like Firebase, never say whether the address exists
    if ([...users.values()].some((u) => u.email === email)) {
      outbox.push({ to: email, kind: 'reset', link: `/reset?oobCode=${randomBytes(8).toString('hex')}`, at: Date.now() });
    }
    return { ok: true };
  }
  if (!me) return { error: 'auth/requires-recent-login' };
  if (path === 'verify') {
    outbox.push({ to: me.email, kind: 'verify', at: Date.now() });
    me.verified = true;          // in dev, opening the email is instant
    return { ok: true };
  }
  if (path === 'profile') { if (body.name !== undefined) me.name = body.name; return { user: publicUser(me) }; }
  if (path === 'password') {
    if (me.passHash !== hash(body.current)) return { error: 'auth/invalid-credential' };
    if (String(body.next || '').length < 8) return { error: 'auth/weak-password' };
    me.passHash = hash(body.next);
    return { ok: true };
  }
  if (path === 'upgrade') {
    // turn an anonymous player into a real account, keeping their uid
    const email = String(body.email || '').toLowerCase();
    if ([...users.values()].some((u) => u.email === email)) return { error: 'auth/email-already-in-use' };
    Object.assign(me, { email, passHash: hash(body.password), provider: 'password', anonymous: false });
    return { user: publicUser(me) };
  }
  if (path === 'reauth') {
    if (me.provider === 'password' && me.passHash !== hash(body.password)) return { error: 'auth/invalid-credential' };
    me.reauthAt = Date.now();
    return { ok: true };
  }
  if (path === 'delete') {
    if (!me.reauthAt || Date.now() - me.reauthAt > 5 * 60 * 1000) return { error: 'auth/requires-recent-login' };
    users.delete(me.uid);
    sessions.delete(token);
    return { ok: true };
  }
  return { error: 'unknown' };
}

/* ============================================================== http */

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function serveFile(req, res) {
  const url = new URL(req.url, 'http://x');
  const clean = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, clean);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
    await stat(file);
  } catch {
    // a path with an extension that does not exist is a real 404; anything
    // else is a page of the app
    if (extname(clean)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    file = join(ROOT, 'index.html');
  }
  const body = await readFile(file);
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(body);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (!p.startsWith('/__dev/')) return serveFile(req, res);

    if (p === '/__dev/ping') return json(res, { dev: true, now: Date.now() });

    if (p === '/__dev/live/stream') {
      const connId = randomBytes(6).toString('hex');
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      streams.set(connId, { res, subs: new Set(), onDisc: [] });
      send(res, { type: 'hello', connId, now: Date.now() });
      const beat = setInterval(() => { try { res.write(': beat\n\n'); } catch { /* gone */ } }, 15000);
      req.on('close', () => {
        clearInterval(beat);
        const conn = streams.get(connId);
        streams.delete(connId);
        if (conn) for (const op of conn.onDisc) notify(applyLive(op));
      });
      return undefined;
    }

    const body = await readBody(req);
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');

    if (p === '/__dev/live/sub') {
      const conn = streams.get(body.connId);
      if (!conn) return json(res, { error: 'no-conn' }, 400);
      if (body.on) { conn.subs.add(body.path); send(conn.res, { type: 'value', path: body.path, value: getAt(body.path) }); }
      else conn.subs.delete(body.path);
      return json(res, { ok: true });
    }
    if (p === '/__dev/live/ondisconnect') {
      const conn = streams.get(body.connId);
      if (conn) {
        if (body.cancel) conn.onDisc = conn.onDisc.filter((o) => o.path !== body.op.path);
        else conn.onDisc.push(body.op);
      }
      return json(res, { ok: true });
    }
    if (p === '/__dev/live') return json(res, liveOp(body));
    if (p === '/__dev/store') return json(res, storeOp(body));
    if (p.startsWith('/__dev/auth/')) return json(res, authOp(p.slice('/__dev/auth/'.length), body, token));
    if (p === '/__dev/outbox') return json(res, outbox);
    if (p === '/__dev/reset-all') {
      for (const k of Object.keys(live)) delete live[k];
      docs.clear(); users.clear(); sessions.clear(); outbox.length = 0;
      return json(res, { ok: true });
    }
    return json(res, { error: 'unknown' }, 404);
  } catch (err) {
    return json(res, { error: String(err && err.message || err) }, 500);
  }
}).listen(PORT, () => console.log(`Quickzy dev server on http://localhost:${PORT}`));
