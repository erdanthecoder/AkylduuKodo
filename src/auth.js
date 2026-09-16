// auth.js — accounts for AkylduuKodo.
//
// Two backends behind one interface:
//   • cloud  — real Firebase Auth (Google + email/password) with progress saved
//              to Firestore, so a learner can log in from school and from home.
//   • device — used when firebase-config.js is still `null`. Sign-up works, but
//              the account lives in this browser only. The UI says so plainly.

import { firebaseConfig, FIREBASE_SDK } from './firebase-config.js';
import * as store from './state.js';

export const MODE = firebaseConfig ? 'cloud' : 'device';

const ACCOUNTS_KEY = 'akylduukodo.accounts.v1';
const SESSION_KEY = 'akylduukodo.session.v1';

let current = null;
let ready = false;
const listeners = new Set();

export function user() {
  return current;
}

export function isReady() {
  return ready;
}

export function onChange(fn) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(current);
    } catch {
      /* a broken listener must not break sign-in */
    }
  });
}

/** Called after any successful sign-in: point the save file at this account. */
async function adopt(profile, cloud) {
  current = profile;
  store.setProfile(profile.uid, { name: profile.name });
  if (cloud) {
    store.setCloud(cloud);
    try {
      const remote = await cloud.load();
      if (remote) store.mergeRemote(remote);
      else await cloud.save(store.get());
    } catch (err) {
      console.warn('Cloud load failed, staying on local progress:', err.message);
    }
  }
  emit();
}

// ------------------------------------------------------------------ cloud

let fb = null;

async function firebase() {
  if (fb) return fb;
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  fb = { app, auth: auth.getAuth(app), db: fs.getFirestore(app), a: auth, f: fs };
  return fb;
}

function cloudProfile(u) {
  return {
    uid: u.uid,
    name: u.displayName || (u.email || '').split('@')[0] || 'Coder',
    email: u.email || '',
    photo: u.photoURL || '',
    provider: (u.providerData?.[0]?.providerId || 'password').replace('.com', ''),
  };
}

function cloudStore(uid) {
  return {
    async load() {
      const { db, f } = await firebase();
      const snap = await f.getDoc(f.doc(db, 'learners', uid));
      return snap.exists() ? snap.data() : null;
    },
    async save(state) {
      const { db, f } = await firebase();
      await f.setDoc(f.doc(db, 'learners', uid), { ...state, updatedAt: Date.now() }, { merge: true });
    },
  };
}

// ----------------------------------------------------------------- device

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** Never store the password itself — salted SHA-256 only. */
async function hash(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// ------------------------------------------------------------------- API

export async function init() {
  if (MODE === 'cloud') {
    try {
      const { auth, a } = await firebase();
      await new Promise((resolve) => {
        a.onAuthStateChanged(auth, async (u) => {
          if (u) await adopt(cloudProfile(u), cloudStore(u.uid));
          else {
            current = null;
            store.setCloud(null);
            store.setProfile(null);
            emit();
          }
          ready = true;
          resolve();
        });
      });
      return;
    } catch (err) {
      console.warn('Firebase unavailable, falling back to device accounts:', err.message);
    }
  }
  // device mode: restore the last session
  const uid = localStorage.getItem(SESSION_KEY);
  const accounts = readAccounts();
  const found = Object.values(accounts).find((a) => a.uid === uid);
  if (found) await adopt({ uid: found.uid, name: found.name, email: found.email, photo: '', provider: 'device' });
  ready = true;
  emit();
}

export async function signUpEmail(name, email, password) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean.includes('@')) throw new Error('That does not look like an email address.');
  if ((password || '').length < 6) throw new Error('Use at least 6 characters for the password.');

  if (MODE === 'cloud') {
    const { auth, a } = await firebase();
    const cred = await a.createUserWithEmailAndPassword(auth, clean, password);
    if (name) await a.updateProfile(cred.user, { displayName: name });
    await adopt(cloudProfile({ ...cred.user, displayName: name || cred.user.displayName }), cloudStore(cred.user.uid));
    return current;
  }

  const accounts = readAccounts();
  if (accounts[clean]) throw new Error('An account with that email already exists on this device.');
  const salt = randomId();
  const account = { uid: randomId(), name: name || clean.split('@')[0], email: clean, salt, hash: await hash(password, salt) };
  accounts[clean] = account;
  writeAccounts(accounts);
  localStorage.setItem(SESSION_KEY, account.uid);
  await adopt({ uid: account.uid, name: account.name, email: clean, photo: '', provider: 'device' });
  return current;
}

export async function signInEmail(email, password) {
  const clean = String(email || '').trim().toLowerCase();

  if (MODE === 'cloud') {
    const { auth, a } = await firebase();
    const cred = await a.signInWithEmailAndPassword(auth, clean, password);
    await adopt(cloudProfile(cred.user), cloudStore(cred.user.uid));
    return current;
  }

  const accounts = readAccounts();
  const account = accounts[clean];
  if (!account) throw new Error('No account with that email on this device. Sign up first.');
  if ((await hash(password, account.salt)) !== account.hash) throw new Error('Wrong password. Try again.');
  localStorage.setItem(SESSION_KEY, account.uid);
  await adopt({ uid: account.uid, name: account.name, email: clean, photo: '', provider: 'device' });
  return current;
}

export async function signInGoogle() {
  if (MODE !== 'cloud') {
    throw new Error('Google sign-in switches on as soon as the Firebase config is added (see src/firebase-config.js).');
  }
  const { auth, a } = await firebase();
  const provider = new a.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await a.signInWithPopup(auth, provider);
    await adopt(cloudProfile(cred.user), cloudStore(cred.user.uid));
  } catch (err) {
    // Popups are blocked on some school networks and in-app browsers.
    if (String(err.code).includes('popup')) {
      await a.signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
  return current;
}

export async function signOut() {
  if (MODE === 'cloud') {
    try {
      const { auth, a } = await firebase();
      await a.signOut(auth);
    } catch {
      /* fall through — we still clear the local session below */
    }
  }
  localStorage.removeItem(SESSION_KEY);
  current = null;
  store.setCloud(null);
  store.setProfile(null);
  emit();
}

export function friendlyAuthError(err) {
  const code = String(err?.code || '');
  const map = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-password': 'Type your password too.',
    'auth/weak-password': 'Use a longer password — at least 6 characters.',
    'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/invalid-credential': 'Email or password is not right.',
    'auth/wrong-password': 'That password is not right.',
    'auth/user-not-found': 'No account with that email yet. Sign up first.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'auth/unauthorized-domain': 'This domain is not in the Firebase authorized list yet.',
    'auth/network-request-failed': 'No connection to the sign-in service. Check the network.',
  };
  return map[code] || err?.message || 'Something went wrong. Try again.';
}
