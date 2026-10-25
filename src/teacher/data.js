// data.js — reading and writing a family's homework and results.

import { sdk } from './auth.js';

/** A code that is a secret worth having: long enough that guessing is hopeless. */
export function newFamilyCode() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';   // no l, o, 0, 1
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export async function findFamilyFor(email) {
  const x = await sdk();
  // a teacher's own families are found by the id kept on their device; the
  // rules do not allow browsing, which is what keeps other families private
  const saved = localStorage.getItem('malikastudy.teacher.family');
  if (!saved) return null;
  const snap = await x.store.getDoc(x.store.doc(x.db, 'families', saved));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!(data.teachers || []).includes(email)) return null;
  return { id: snap.id, ...data };
}

export async function createFamily({ email, learnerName }) {
  const x = await sdk();
  const id = newFamilyCode();
  await x.store.setDoc(x.store.doc(x.db, 'families', id), {
    teachers: [email],
    learnerName: learnerName || 'Malika',
    madeAt: x.store.serverTimestamp(),
  });
  localStorage.setItem('malikastudy.teacher.family', id);
  return { id, teachers: [email], learnerName };
}

export function rememberFamily(id) {
  localStorage.setItem('malikastudy.teacher.family', id);
}

export async function openFamily(id, email) {
  const x = await sdk();
  const snap = await x.store.getDoc(x.store.doc(x.db, 'families', id));
  if (!snap.exists()) throw new Error('That code does not match a family.');
  const data = snap.data();
  if (!(data.teachers || []).includes(email)) throw new Error('That family is not yours.');
  rememberFamily(id);
  return { id, ...data };
}

export async function setAssignment(family, day, assignment) {
  const x = await sdk();
  await x.store.setDoc(
    x.store.doc(x.db, 'families', family, 'assignments', day),
    { ...assignment, id: day, setAt: x.store.serverTimestamp() },
    { merge: true },
  );
}

export async function getAssignment(family, day) {
  const x = await sdk();
  const snap = await x.store.getDoc(x.store.doc(x.db, 'families', family, 'assignments', day));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function recentAssignments(family, howMany = 14) {
  const x = await sdk();
  const q = x.store.query(
    x.store.collection(x.db, 'families', family, 'assignments'),
    x.store.orderBy('__name__', 'desc'),
    x.store.limit(howMany),
  );
  const snap = await x.store.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function recentResults(family, howMany = 30) {
  const x = await sdk();
  const q = x.store.query(
    x.store.collection(x.db, 'families', family, 'results'),
    x.store.orderBy('__name__', 'desc'),
    x.store.limit(howMany),
  );
  const snap = await x.store.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Mark a result as seen, so it stops showing as new. */
export async function markSeen(family, id) {
  const x = await sdk();
  await x.store.setDoc(
    x.store.doc(x.db, 'families', family, 'results', id),
    { marked: true }, { merge: true },
  );
}

/**
 * How she is doing, skill by skill, from the results themselves — so the
 * dashboard never has to trust a number her tablet worked out.
 */
export function skillPicture(results) {
  const out = {};
  for (const result of results) {
    for (const answer of result.answers || []) {
      const row = out[answer.skill] || (out[answer.skill] = { asked: 0, firstTime: 0, wrong: 0, lastSeen: null });
      row.asked += 1;
      if (answer.right && answer.tries === 1) row.firstTime += 1;
      if (!answer.right) row.wrong += 1;
      if (!row.lastSeen || result.day > row.lastSeen) row.lastSeen = result.day;
    }
  }
  for (const row of Object.values(out)) row.accuracy = row.asked ? row.firstTime / row.asked : 0;
  return out;
}
