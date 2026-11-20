// quizzes.js — making, saving, publishing and finding quizzes.
//
// quizzes/{id}             the public half: title, questions without answers,
//                          author details, whether it is published, play count
// quizzes/{id}/private/key the answers. Readable by the author, and by signed-in
//                          accounts when the quiz is published, so they can host
//                          it. Never by guests, which is what every player is.
//
// Drafts are readable only by their author: the security rules refuse anyone
// else, and every query here asks only for what the rules allow.

import { net } from '../net/index.js';
import { LIMITS, BADGES } from '../config.js';
import { myProfile, me } from './session.js';
import { split, join, problem } from '../game/questions.js';
import { isClean } from './names.js';

import { isPro, myPlan, PLANS } from './plan.js';

const COL = 'quizzes';
const keyCol = (id) => `${COL}/${id}/private`;

/** Words for search: lowercase, accents removed, short and filler words dropped. */
const STOP = new Set(['the', 'and', 'for', 'with', 'quiz', 'of', 'a', 'an', 'to', 'in', 'on', 'is', 'are', 'what', 'how']);
export function words(text) {
  return [...new Set(String(text || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2 && !STOP.has(w)))].slice(0, 80);
}

/** Everything wrong with a quiz before it can be published; [] when ready. */
export function publishProblems(quiz) {
  const out = [];
  if (!quiz.title.trim()) out.push('Give the quiz a title.');
  if (!isClean(quiz.title) || !isClean(quiz.description || '')) out.push('The title or description has a word that is not allowed.');
  if (quiz.questions.length < LIMITS.publishMinQuestions) out.push(`A published quiz needs at least ${LIMITS.publishMinQuestions} questions.`);
  quiz.questions.forEach((q, i) => {
    const p = problem(q);
    if (p) out.push(`Question ${i + 1}: ${p}`);
    // the automatic check: every question and answer must follow the rules
    const words = [q.text, ...(q.options || []), ...(Array.isArray(q.answer) ? q.answer.filter((a) => typeof a === 'string') : [])].join(' ');
    if (!isClean(words)) out.push(`Question ${i + 1} has a word that is not allowed.`);
  });
  return out;
}

/** Free accounts: a published quiz goes live 3 to 5 days later. */
const reviewDelay = () => Math.round((3 + Math.random() * 2) * 86400000);

/** Problems that stop a quiz being hosted at all (drafts can be hosted by their author). */
export function hostProblems(quiz) {
  const out = [];
  if (!quiz.questions.length) out.push('Add at least one question.');
  quiz.questions.forEach((q, i) => { const p = problem(q); if (p) out.push(`Question ${i + 1}: ${p}`); });
  return out;
}

export const COVERS = 6;

/**
 * Save the editor's quiz. `quiz` is in full form (answers inline).
 * Returns the id. Publishing is a separate flag so a draft is never public.
 */
export async function saveQuiz(quiz, { publish } = {}) {
  const user = me();
  const profile = myProfile();
  if (!user || user.isAnonymous || !profile) throw new Error('Sign in to save quizzes.');
  if (await net.store.get('bans', user.uid).catch(() => null)) throw new Error('The owner has paused publishing on this account.');
  const title = quiz.title.trim().slice(0, LIMITS.quizTitleMax);
  const description = (quiz.description || '').trim().slice(0, LIMITS.quizDescMax);
  const questions = quiz.questions.slice(0, LIMITS.questionsMax);
  const { pub, key } = split(questions);
  const isPublic = publish === undefined ? Boolean(quiz.public) : Boolean(publish);
  const plan = await myPlan();
  if (!quiz.id) {
    const mine = await net.store.count(COL, { where: [['owner', '==', user.uid]] }).catch(() => 0);
    if (mine >= plan.quizzes) throw new Error(`Free accounts can make ${plan.quizzes} quizzes. Delete one, or go Pro for ${PLANS.pro.quizzes}.`);
  }
  // when it goes live: Pro at once; free quizzes after the 3-5 day check,
  // and a quiz that is already live stays live
  const before = quiz.id ? await net.store.get(COL, quiz.id).catch(() => null) : null;
  let liveAt = 0;
  if (isPublic && !plan.pro) liveAt = before && before.public ? (before.liveAt || 0) : Date.now() + reviewDelay();
  const doc = {
    // only written when it matters, so older quizzes keep their shape
    ...(liveAt || (before && before.liveAt) ? { liveAt } : {}),
    owner: user.uid,
    title: title || 'Untitled quiz',
    description,
    cover: Number.isInteger(quiz.cover) ? quiz.cover % COVERS : 0,
    questions: pub,
    questionCount: pub.length,
    // counts towards the verified badge; the rules check it matches
    big: isPublic && pub.length >= LIMITS.verifyMinQuestions,
    public: isPublic,
    // title words first, so they survive the cap; then the questions'
    keywords: words(`${title} ${description} ${pub.map((q) => q.text).join(' ')}`),
    authorName: profile.displayName,
    authorUsername: profile.username,
    authorBlook: profile.blook,
    updatedAt: net.store.serverTime(),
  };
  let id = quiz.id;
  if (id) {
    await net.store.batch([
      { op: 'set', col: COL, id, data: doc, merge: true },
      { op: 'set', col: keyCol(id), id: 'key', data: { owner: user.uid, answers: JSON.stringify(key) } },
    ]);
  } else {
    id = await net.store.add(COL, { ...doc, plays: 0, createdAt: net.store.serverTime() });
    await net.store.set(keyCol(id), 'key', { owner: user.uid, answers: JSON.stringify(key) });
  }
  verifiedCache.delete(user.uid);
  return id;
}

/** The public half only — what anyone allowed to see the quiz gets. */
export async function getQuiz(id) {
  try {
    return await net.store.get(COL, id);
  } catch (err) {
    if (String(err.code || err.message).includes('permission')) return null;
    throw err;
  }
}

/** The answers, as an array parallel to quiz.questions. null if not allowed. */
export async function getKey(id) {
  try {
    const doc = await net.store.get(keyCol(id), 'key');
    return doc ? JSON.parse(doc.answers) : null;
  } catch {
    return null;
  }
}

/** Public half + answers, joined back into the editor's full form. */
export async function loadForEditing(id) {
  const quiz = await getQuiz(id);
  if (!quiz) return null;
  const key = await getKey(id);
  return { ...quiz, questions: join(quiz.questions || [], key) };
}

export async function deleteQuiz(id) {
  await net.store.batch([
    { op: 'del', col: keyCol(id), id: 'key' },
    { op: 'del', col: COL, id },
  ]);
  const user = me();
  if (user) verifiedCache.delete(user.uid);
}

export async function duplicateQuiz(id) {
  const full = await loadForEditing(id);
  if (!full) throw new Error('That quiz could not be opened.');
  return saveQuiz({ ...full, id: null, title: `${full.title} (copy)`.slice(0, LIMITS.quizTitleMax), public: false });
}

export async function myQuizzes() {
  const user = me();
  if (!user) return [];
  const rows = await net.store.query(COL, { where: [['owner', '==', user.uid]], limit: 200 });
  return rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Live for everyone? (A free account's new quiz waits for its check.) */
export const isLive = (q) => !(q && q.liveAt > Date.now());

export async function quizzesBy(uid) {
  const rows = (await net.store.query(COL, { where: [['owner', '==', uid], ['public', '==', true]], limit: 100 }))
    .filter((q) => isLive(q) || (me() && me().uid === uid));
  return rows.sort((a, b) => (b.plays || 0) - (a.plays || 0));
}

/** Published quizzes, newest or most played. Small enough to sort here. */
async function publicRows(extraWhere = []) {
  return (await net.store.query(COL, { where: [['public', '==', true], ...extraWhere], limit: 120 })).filter(isLive);
}

export async function popularQuizzes(n = 12) {
  const rows = await publicRows();
  return rows.sort((a, b) => (b.plays || 0) - (a.plays || 0) || (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, n);
}

export async function newestQuizzes(n = 24) {
  const rows = await publicRows();
  return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, n);
}

/** Search published quizzes by the words of their title and description. */
export async function searchQuizzes(text) {
  const terms = words(text);
  if (!terms.length) return popularQuizzes(24);
  // exact matches on the longest word come from the database; recent public
  // quizzes are also checked for words that start with what was typed
  // ("photo" finds "photosynthesis")
  const longest = [...terms].sort((a, b) => b.length - a.length)[0];
  const [exact, recent] = await Promise.all([
    publicRows([['keywords', 'array-contains', longest]]),
    publicRows(),
  ]);
  const all = new Map([...recent, ...exact].map((r) => [r.id, r]));
  const hits = [...all.values()].filter((q) => terms.every((t) => (q.keywords || []).some((k) => k.startsWith(t))));
  return hits.sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 48);
}

/** After a rename, put the new name on every quiz this person wrote. */
export async function syncAuthor() {
  const profile = myProfile();
  if (!profile) return;
  const mine = await myQuizzes();
  for (let i = 0; i < mine.length; i += 400) {
    await net.store.batch(mine.slice(i, i + 400).map((q) => ({
      op: 'update', col: COL, id: q.id,
      data: { authorName: profile.displayName, authorUsername: profile.username, authorBlook: profile.blook, updatedAt: net.store.serverTime() },
    })));
  }
}

/** Count one more play. Anyone signed in may add exactly one. */
export async function countPlay(id) {
  try { await net.store.update(COL, id, { plays: net.store.increment(1) }); } catch { /* not important */ }
}

/* ------------------------------------------------------------ verified */

const verifiedCache = new Map();

const givenCache = new Map();

/** 'official', 'owner', 'verified' or null: the badge an author carries. */
export async function badgeOf(uid) {
  if (!uid) return null;
  if (BADGES[uid]) return BADGES[uid];
  // members wear the gold PRO check
  if (await isPro(uid)) return 'pro';
  // a blue check the owner gave by hand, or one earned by publishing
  if (!givenCache.has(uid)) givenCache.set(uid, net.store.get('badges', uid).then(Boolean).catch(() => false));
  const given = await givenCache.get(uid);
  if (given) return 'verified';
  return (await isVerified(uid)) ? 'verified' : null;
}

/** Has this author published enough full quizzes to carry the badge? */
export function isVerified(uid) {
  if (!uid) return Promise.resolve(false);
  if (BADGES[uid]) return Promise.resolve(true);
  if (!verifiedCache.has(uid)) {
    verifiedCache.set(uid, net.store.count(COL, { where: [['owner', '==', uid], ['public', '==', true], ['big', '==', true]] })
      .then((n) => n >= LIMITS.verifyMinQuizzes)
      .catch(() => false));
  }
  return verifiedCache.get(uid);
}

export async function verifiedProgress(uid) {
  const n = await net.store.count(COL, { where: [['owner', '==', uid], ['public', '==', true], ['big', '==', true]] }).catch(() => 0);
  return { have: n, need: LIMITS.verifyMinQuizzes, minQuestions: LIMITS.verifyMinQuestions };
}

/* ------------------------------------------------------------- reports */

/** A finished game's results, kept for the host. */
export async function saveReport(report) {
  const user = me();
  if (!user || user.isAnonymous) return null;
  return net.store.add('reports', { ...report, owner: user.uid, at: net.store.serverTime() });
}

export async function myReports() {
  const user = me();
  if (!user) return [];
  const rows = await net.store.query('reports', { where: [['owner', '==', user.uid]], limit: 100 });
  return rows.sort((a, b) => (b.at || 0) - (a.at || 0));
}

export const deleteReport = (id) => net.store.del('reports', id);
