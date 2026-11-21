// homework.js — assign a quiz as homework: students play it solo before
// the due date, and the teacher sees everyone's results.
//
//   homework/{id}            {owner, ownerName, quizId, quizTitle, title, dueAt, createdAt}
//   homework/{id}/results/{uid}  {name, score, right, total, at}

import { net } from '../net/index.js';
import { me, myProfile, signedIn } from './session.js';

const COL = 'homework';

export async function assign(quiz, { title, days }) {
  if (!signedIn()) throw new Error('Sign in to set homework.');
  const p = myProfile() || {};
  const dueAt = Date.now() + Math.max(1, Math.min(30, days)) * 86400000;
  return net.store.add(COL, {
    owner: me().uid, ownerName: String(p.displayName || 'Teacher').slice(0, 30),
    quizId: quiz.id, quizTitle: String(quiz.title || 'Quiz').slice(0, 80),
    title: String(title || quiz.title || 'Homework').trim().slice(0, 80) || 'Homework',
    dueAt, createdAt: net.store.serverTime(),
  });
}

export const getHomework = (id) => net.store.get(COL, id).then((d) => (d ? { id, ...d } : null));
export const mine = () => (signedIn() ? net.store.query(COL, { where: [['owner', '==', me().uid]], limit: 100 }).catch(() => []) : Promise.resolve([]));
export const results = (id) => net.store.query(`${COL}/${id}/results`, { limit: 500 }).catch(() => []);
export const myResult = (id) => (signedIn() ? net.store.get(`${COL}/${id}/results`, me().uid).catch(() => null) : Promise.resolve(null));
export const remove = (id) => net.store.del(COL, id);

/** Hand in a solo run. The first try is the one that counts. */
export async function submit(id, { score, right, total }) {
  if (!signedIn()) return false;
  if (await myResult(id)) return false;
  const p = myProfile() || {};
  await net.store.set(`${COL}/${id}/results`, me().uid, {
    name: String(p.displayName || 'Student').slice(0, 30),
    score: Math.max(0, Math.round(score)), right: Math.max(0, right | 0), total: Math.max(0, total | 0),
    at: net.store.serverTime(),
  });
  return true;
}

export const linkFor = (id) => `${location.origin}/hw/${id}`;
