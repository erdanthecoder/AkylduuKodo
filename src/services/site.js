// site.js — what the owner controls: the announcement banner, featured
// quizzes, hand-given blue checks, bans, and moderating quizzes and games.
//
// Every write here is refused by the security rules unless it comes from
// the owner's account; the checks in the app are only for a tidy screen.

import { net } from '../net/index.js';
import { OWNER_UID } from '../config.js';
import { me } from './session.js';

export const isOwner = () => Boolean(me() && me().uid === OWNER_UID);

/* ------------------------------------------------------------ site docs */

let siteCache = null;
export async function site(fresh = false) {
  if (!siteCache || fresh) {
    siteCache = Promise.all([
      net.store.get('site', 'announce').catch(() => null),
      net.store.get('site', 'featured').catch(() => null),
    ]).then(([a, f]) => ({ announce: (a && a.text) || '', announceAt: (a && a.at) || 0, featured: (f && Array.isArray(f.ids)) ? f.ids : [] }));
  }
  return siteCache;
}

export async function setAnnouncement(text) {
  const t = String(text || '').trim().slice(0, 200);
  await net.store.set('site', 'announce', { text: t, at: Date.now() });
  siteCache = null;
}

export async function setFeatured(ids) {
  await net.store.set('site', 'featured', { ids: [...new Set(ids)].slice(0, 12) });
  siteCache = null;
}

/* ---------------------------------------------------------------- people */

export async function allUsers() {
  const rows = await net.store.query('users', { limit: 300 });
  return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function giveCoins(user, n) {
  await net.store.update('users', user.id, { coins: (user.coins || 0) + n });
}

export async function giveBlook(user, blookId) {
  const owned = { ...(user.owned || {}) };
  owned[blookId] = (owned[blookId] || 0) + 1;
  await net.store.update('users', user.id, { owned });
}

const grantCache = new Map();
/** A blue check the owner gave by hand. */
export function hasGrantedBadge(uid) {
  if (!grantCache.has(uid)) grantCache.set(uid, net.store.get('badges', uid).then(Boolean).catch(() => false));
  return grantCache.get(uid);
}
export async function setGrantedBadge(uid, on) {
  if (on) await net.store.set('badges', uid, { kind: 'verified', at: Date.now() });
  else await net.store.del('badges', uid);
  grantCache.delete(uid);
}

export const isBanned = (uid) => net.store.get('bans', uid).then(Boolean).catch(() => false);
export async function setBanned(uid, on) {
  if (on) await net.store.set('bans', uid, { at: Date.now() });
  else await net.store.del('bans', uid);
}

/* --------------------------------------------------------------- quizzes */

export const unpublish = (id) => net.store.update('quizzes', id, { public: false, big: false });

/* ----------------------------------------------------------------- games */

export async function liveGames() {
  const idx = (await net.live.get('gameIndex').catch(() => null)) || {};
  return Object.entries(idx).map(([pin, v]) => ({ pin, host: v.host, at: v.at })).sort((a, b) => b.at - a.at);
}

export async function endGame(pin) {
  await net.live.remove(`games/${pin}`);
  await net.live.remove(`gameIndex/${pin}`);
}
