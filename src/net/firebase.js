// net/firebase.js — the real servers: Firebase Auth, Firestore and the
// Realtime Database. Same interface as dev.js.
//
// Firestore holds things that last: accounts, quizzes, answer keys.
// The Realtime Database holds live games, because it pushes small changes to
// many players in a few tens of milliseconds and charges by bandwidth rather
// than by write, which is what a game needs.

import { firebaseConfig, FIREBASE_SDK } from '../config.js';
import { useEmulator } from './index.js';

export async function create() {
  // a school network can be slow or block the CDN; never hang for ever
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('sdk-timeout')), 15000));
  const [A, F, D, S] = await Promise.race([Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-database.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]), timeout]);

  const app = A.initializeApp(firebaseConfig);
  const fa = F.getAuth(app);
  const db = D.getDatabase(app);
  const fs = S.getFirestore(app);
  if (useEmulator()) {
    // tests on localhost: the real SDK and the real rules, on local emulators
    F.connectAuthEmulator(fa, 'http://127.0.0.1:9099', { disableWarnings: true });
    D.connectDatabaseEmulator(db, '127.0.0.1', 9000);
    S.connectFirestoreEmulator(fs, '127.0.0.1', 8080);
  }

  /* ------------------------------------------------------------ auth */

  const shape = (u) => (u ? {
    uid: u.uid,
    email: u.email || null,
    displayName: u.displayName || null,
    emailVerified: Boolean(u.emailVerified),
    isAnonymous: Boolean(u.isAnonymous),
    providers: (u.providerData || []).map((p) => p.providerId),
  } : null);

  // wait for the persisted session before the app draws anything
  await new Promise((resolve) => {
    const stop = F.onAuthStateChanged(fa, () => { stop(); resolve(); });
  });

  const auth = {
    current: () => shape(fa.currentUser),
    onChange: (fn) => F.onAuthStateChanged(fa, (u) => fn(shape(u))),
    anon: async () => shape((await F.signInAnonymously(fa)).user),
    async google() {
      const provider = new F.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // a pop-up keeps working when the site and the auth domain differ,
      // which is the case on quickzy.web.app (auth domain akylduukodo.firebaseapp.com); a redirect does not reliably
      return shape((await F.signInWithPopup(fa, provider)).user);
    },
    signUp: async (email, password) => shape((await F.createUserWithEmailAndPassword(fa, email, password)).user),
    signIn: async (email, password) => shape((await F.signInWithEmailAndPassword(fa, email, password)).user),
    signOut: () => F.signOut(fa),
    // Firebase sends these emails itself: no mail server of our own is needed
    sendReset: (email) => F.sendPasswordResetEmail(fa, email, { url: `${location.origin}/login` }),
    sendVerify: () => F.sendEmailVerification(fa.currentUser, { url: `${location.origin}/settings` }),
    setDisplayName: (name) => F.updateProfile(fa.currentUser, { displayName: name }),
    async changePassword(current, next) {
      const u = fa.currentUser;
      await F.reauthenticateWithCredential(u, F.EmailAuthProvider.credential(u.email, current));
      await F.updatePassword(u, next);
    },
    /** Prove it is really them before something drastic. */
    async reauth(password) {
      const u = fa.currentUser;
      if (password) await F.reauthenticateWithCredential(u, F.EmailAuthProvider.credential(u.email, password));
      else await F.reauthenticateWithPopup(u, new F.GoogleAuthProvider());
    },
    // call reauth() first: Firebase refuses to delete an account signed in long ago
    deleteAccount: async () => F.deleteUser(fa.currentUser),
    async reload() { if (fa.currentUser) await F.reload(fa.currentUser); return shape(fa.currentUser); },
  };

  /* ----------------------------------------------------------- store */

  // Firestore hands back Timestamp objects; the app works in milliseconds
  const plain = (v) => {
    if (v && typeof v === 'object') {
      if (typeof v.toMillis === 'function') return v.toMillis();
      if (Array.isArray(v)) return v.map(plain);
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = plain(x);
      return out;
    }
    return v;
  };
  const docRef = (col, id) => S.doc(fs, col, id);
  const build = (col, q = {}) => {
    const parts = [S.collection(fs, col)];
    for (const [field, op, value] of q.where || []) parts.push(S.where(field, op, value));
    if (q.orderBy) parts.push(S.orderBy(q.orderBy[0], q.orderBy[1] || 'asc'));
    if (q.limit) parts.push(S.limit(q.limit));
    return S.query(...parts);
  };

  const store = {
    async get(col, id) {
      const snap = await S.getDoc(docRef(col, id));
      return snap.exists() ? { id: snap.id, ...plain(snap.data()) } : null;
    },
    set: (col, id, data, opts = {}) => S.setDoc(docRef(col, id), data, { merge: Boolean(opts.merge) }),
    update: (col, id, data) => S.updateDoc(docRef(col, id), data),
    del: (col, id) => S.deleteDoc(docRef(col, id)),
    add: async (col, data) => (await S.addDoc(S.collection(fs, col), data)).id,
    async query(col, q = {}) {
      const snap = await S.getDocs(build(col, q));
      return snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) }));
    },
    async count(col, q = {}) {
      const snap = await S.getCountFromServer(build(col, { where: q.where }));
      return snap.data().count;
    },
    async batch(steps) {
      const b = S.writeBatch(fs);
      for (const s of steps) {
        const ref = docRef(s.col, s.id);
        if (s.op === 'set') b.set(ref, s.data, { merge: Boolean(s.merge) });
        else if (s.op === 'update') b.update(ref, s.data);
        else if (s.op === 'del' || s.op === 'delete') b.delete(ref);
      }
      await b.commit();
    },
    serverTime: () => S.serverTimestamp(),
    increment: (n) => S.increment(n),
    deleteField: () => S.deleteField(),
  };

  /* ------------------------------------------------------------ live */

  let offset = 0;
  D.onValue(D.ref(db, '.info/serverTimeOffset'), (snap) => { offset = Number(snap.val()) || 0; });

  const live = {
    TIMESTAMP: D.serverTimestamp(),
    increment: (n) => D.increment(n),
    now: () => Date.now() + offset,
    get: async (path) => (await D.get(D.ref(db, path))).val(),
    set: (path, value) => D.set(D.ref(db, path), value),
    update: (path, value) => D.update(D.ref(db, path), value),
    remove: (path) => D.remove(D.ref(db, path)),
    push: async (path, value) => (await D.push(D.ref(db, path), value)).key,
    async query(path, o = {}) {
      const parts = [D.ref(db, path)];
      if (o.orderBy === '$value') parts.push(D.orderByValue());
      else if (o.orderBy) parts.push(D.orderByChild(o.orderBy));
      if (o.equalTo !== undefined) parts.push(D.equalTo(o.equalTo));
      if (o.endAt !== undefined) parts.push(D.endAt(o.endAt));
      if (o.limitToFirst) parts.push(D.limitToFirst(o.limitToFirst));
      if (o.limitToLast) parts.push(D.limitToLast(o.limitToLast));
      return (await D.get(D.query(...parts))).val();
    },
    on(path, fn) {
      return D.onValue(D.ref(db, path), (snap) => fn(snap.val()), (err) => console.warn('live read refused', path, err.code));
    },
    /** Each child of `path` once, as it is added, oldest first. */
    onChild(path, fn) {
      return D.onChildAdded(D.ref(db, path), (snap) => fn(snap.key, snap.val()), (err) => console.warn('live read refused', path, err.code));
    },
    async transaction(path, fn) {
      const r = await D.runTransaction(D.ref(db, path), (current) => fn(current === undefined ? null : current));
      return { committed: r.committed, value: r.snapshot.val() };
    },
    onDisconnect(path, action) {
      const od = D.onDisconnect(D.ref(db, path));
      if (action.remove) od.remove(); else od.set(action.set);
      return () => od.cancel();
    },
  };

  // a refused write is reported in the console even where the caller shrugs
  // it off, so it never fails silently
  const loud = (obj, names, kind) => {
    for (const n of names) {
      const fn = obj[n];
      obj[n] = (...args) => {
        const out = fn(...args);
        if (out && typeof out.catch === 'function') {
          out.catch((err) => console.warn(`${kind}.${n} refused`, String(args[0]), err && (err.code || err.message)));
        }
        return out;
      };
    }
  };
  loud(live, ['set', 'update', 'remove', 'push'], 'live');
  loud(store, ['set', 'update', 'del', 'add', 'batch'], 'store');

  return { kind: 'firebase', auth, store, live };
}
