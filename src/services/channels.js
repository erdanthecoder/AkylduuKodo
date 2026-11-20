// channels.js — every quiz maker has a channel: their published quizzes and
// the people who follow them. Following puts their new quizzes in your feed.

import { net } from '../net/index.js';
import { me, signedIn } from './session.js';
import { quizzesBy } from './quizzes.js';

const fid = (from, to) => `${from}_${to}`;

export const followerCount = (uid) => net.store.count('follows', { where: [['to', '==', uid]] }).catch(() => 0);

export async function isFollowing(uid) {
  if (!signedIn()) return false;
  return Boolean(await net.store.get('follows', fid(me().uid, uid)).catch(() => null));
}

export async function follow(uid) {
  if (!signedIn()) throw new Error('Sign in to follow channels.');
  if (uid === me().uid) throw new Error('That is your own channel.');
  await net.store.set('follows', fid(me().uid, uid), { from: me().uid, to: uid, at: net.store.serverTime() });
}

export async function unfollow(uid) {
  await net.store.del('follows', fid(me().uid, uid));
}

/** The uids of the channels I follow. */
export async function following() {
  if (!signedIn()) return [];
  const rows = await net.store.query('follows', { where: [['from', '==', me().uid]], limit: 200 }).catch(() => []);
  return rows.map((r) => r.to);
}

/** Newest published quizzes from the channels I follow. */
export async function feed(limit = 12) {
  const uids = (await following()).slice(0, 30);
  const lists = await Promise.all(uids.map((u) => quizzesBy(u).catch(() => [])));
  return lists.flat().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).slice(0, limit);
}

/** Channels worth visiting: everyone with published quizzes, most played first. */
export async function topChannels(limit = 24) {
  const rows = await net.store.query('quizzes', { where: [['public', '==', true]], limit: 300 }).catch(() => []);
  const by = new Map();
  for (const q of rows) {
    const c = by.get(q.owner) || { uid: q.owner, name: q.authorName, username: q.authorUsername, blook: q.authorBlook, quizzes: 0, plays: 0, covers: [] };
    c.quizzes += 1;
    c.plays += q.plays || 0;
    if (c.covers.length < 3) c.covers.push(q);
    by.set(q.owner, c);
  }
  return [...by.values()].filter((c) => c.username).sort((a, b) => b.plays - a.plays || b.quizzes - a.quizzes).slice(0, limit);
}

/** Remove everything I follow (used when deleting an account). */
export async function unfollowAll() {
  const rows = await net.store.query('follows', { where: [['from', '==', me().uid]], limit: 500 }).catch(() => []);
  for (const r of rows) await net.store.del('follows', r.id).catch(() => {});
}
