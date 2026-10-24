// cloud.js — talking to Firestore.
//
// Malika never signs in with Google. Her device signs in anonymously and is
// tied to a family code, which is the only thing linking her to a dashboard.
// Whoever sets the work signs in with Google on the teacher side.
//
// Everything here degrades quietly: if the network is gone, the app runs on the
// device copy and sends the results up next time.

import { firebaseConfig, FIREBASE_SDK } from './firebase-config.js';

let app = null;

async function sdk() {
  if (app) return app;
  if (!firebaseConfig) throw new Error('offline');
  const [core, auth, store] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-auth.js`),
    import(`${FIREBASE_SDK}/firebase-firestore.js`),
  ]);
  const instance = core.initializeApp(firebaseConfig);
  app = { core, auth, store, instance, db: store.getFirestore(instance), a: auth.getAuth(instance) };
  return app;
}

/** Sign the device in without an account. Nothing personal is asked for. */
export async function signInQuietly() {
  const fb = await sdk();
  if (fb.a.currentUser) return fb.a.currentUser;
  const { user } = await fb.auth.signInAnonymously(fb.a);
  return user;
}

/** Today's assignment for a family, or null if nothing has been set. */
export async function todaysAssignment(family, day) {
  if (!family) return null;
  const fb = await sdk();
  await signInQuietly();
  const ref = fb.store.doc(fb.db, 'families', family, 'assignments', day);
  const snap = await fb.store.getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Send a finished task up so the dashboard can see it. */
export async function sendResult(family, result) {
  if (!family) return false;
  const fb = await sdk();
  await signInQuietly();
  const ref = fb.store.doc(fb.db, 'families', family, 'results', `${result.day}-${result.assignmentId || 'extra'}`);
  await fb.store.setDoc(ref, { ...result, at: fb.store.serverTimestamp() }, { merge: true });
  return true;
}

/** Push anything that has not reached the server yet. Safe to call often. */
export async function syncResults(family, results, onSent) {
  if (!family || !results?.length) return 0;
  let sent = 0;
  for (const result of results.filter((x) => !x.sentAt)) {
    try {
      await sendResult(family, result);
      onSent?.(result);
      sent += 1;
    } catch {
      break;          // no network: stop trying, keep the rest for next time
    }
  }
  return sent;
}

/** Does this family code exist? Used when she first links her tablet. */
export async function familyExists(family) {
  try {
    const fb = await sdk();
    await signInQuietly();
    const snap = await fb.store.getDoc(fb.store.doc(fb.db, 'families', family));
    return snap.exists();
  } catch {
    return false;
  }
}

export { sdk };
