// auth.js — signing in to the dashboard.
//
// Google only, and deliberately so: the dashboard can change what a child is
// asked to do, so it should sit behind an account somebody already protects
// properly rather than a password invented for this site.

import { firebaseConfig, FIREBASE_SDK } from '../firebase-config.js';

/* Classroom needs its own permissions, and they are only asked for when the
   Classroom features are actually used — signing in to set homework should not
   demand access to a school account. */
export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

let fb = null;
let classroomToken = null;

export async function sdk() {
  if (fb) return fb;
  if (!firebaseConfig) throw new Error('no-firebase');
  const [core, auth, store] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const instance = core.initializeApp(firebaseConfig);
  fb = { core, auth, store, instance, db: store.getFirestore(instance), a: auth.getAuth(instance) };
  return fb;
}

export async function onUser(fn) {
  const x = await sdk();
  return x.auth.onAuthStateChanged(x.a, fn);
}

export async function signIn({ withClassroom = false } = {}) {
  const x = await sdk();
  const provider = new x.auth.GoogleAuthProvider();
  if (withClassroom) CLASSROOM_SCOPES.forEach((s) => provider.addScope(s));
  const result = await x.auth.signInWithPopup(x.a, provider);
  const credential = x.auth.GoogleAuthProvider.credentialFromResult(result);
  // the access token is what Classroom wants; it is short-lived and not stored
  if (withClassroom && credential?.accessToken) classroomToken = credential.accessToken;
  return result.user;
}

export async function signOut() {
  const x = await sdk();
  classroomToken = null;
  await x.auth.signOut(x.a);
}

export function hasClassroom() {
  return Boolean(classroomToken);
}

export function token() {
  return classroomToken;
}

export function user() {
  return fb?.a?.currentUser || null;
}
