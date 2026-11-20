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
      net.store.get('site', 'event').catch(() => null),
    ]).then(([a, f, ev]) => ({
      event: ev && ev.kind && ev.ends > Date.now() ? ev : null,
      announce: (a && a.text) || '', announceAt: (a && a.at) || 0,
      featured: (f && Array.isArray(f.ids)) ? f.ids : [],
      wear: cleanWear(f && f.wear),
    }));
  }
  return siteCache;
}

export async function setAnnouncement(text) {
  const t = String(text || '').trim().slice(0, 200);
  await net.store.set('site', 'announce', { text: t, at: Date.now() });
  siteCache = null;
}

export async function setFeatured(ids) {
  const { wear } = await site(true);
  await net.store.set('site', 'featured', { ids: [...new Set(ids)].slice(0, 12), wear });
  siteCache = null;
}

/* Special events: the owner turns one on for a while. */
export const EVENTS = {
  coins: { name: 'Double Coins', blurb: 'Every game gives double coins', colour: 'linear-gradient(90deg, #ffcd1f, #ff8a2a)' },
  xp: { name: 'Double XP', blurb: 'Every game gives double XP', colour: 'linear-gradient(90deg, #12c9a6, #2f9bff)' },
  lucky: { name: 'Lucky Boxes', blurb: 'Boxes roll an extra time for something rarer', colour: 'linear-gradient(90deg, #a560ff, #ff4772)' },
  party: { name: 'Mega Party', blurb: 'Double coins, double XP and lucky boxes', colour: 'linear-gradient(90deg, #ff4772, #ffcd1f, #12c9a6, #2f9bff, #a560ff)' },
};
export async function currentEvent() { return (await site()).event; }
export async function startEvent(kind, hours, title = '') {
  if (!EVENTS[kind]) throw new Error('Pick an event.');
  const h = Math.max(1, Math.min(24 * 14, Number(hours) || 1));
  await net.store.set('site', 'event', { kind, title: String(title || EVENTS[kind].name).slice(0, 60), ends: Date.now() + h * 3600 * 1000, at: Date.now() });
  siteCache = null;
}
export async function stopEvent() {
  await net.store.set('site', 'event', { kind: '', ends: 0 });
  siteCache = null;
}
export const eventBoosts = (ev) => ({
  coins: Boolean(ev && (ev.kind === 'coins' || ev.kind === 'party')),
  xp: Boolean(ev && (ev.kind === 'xp' || ev.kind === 'party')),
  lucky: Boolean(ev && (ev.kind === 'lucky' || ev.kind === 'party')),
});

/* The badges the owner wears next to their name, in this order. They live on
   the "featured" site document because only the owner may write it. */
export const OWNER_BADGES = ['owner', 'kg', 'official', 'verified'];
function cleanWear(w) {
  const list = Array.isArray(w) ? OWNER_BADGES.filter((k) => w.includes(k)) : [];
  return list.length ? list : ['owner'];
}
export async function ownerWear() { return (await site()).wear; }
export async function setOwnerWear(wear) {
  const { featured } = await site(true);
  const list = cleanWear(wear);
  await net.store.set('site', 'featured', { ids: featured, wear: list });
  siteCache = null;
  return list;
}

/* ---------------------------------------------------------------- people */

export async function allUsers() {
  const rows = await net.store.query('users', { limit: 300 });
  return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// always read the latest copy first, so a gift never undoes a recent change
const fresh = async (user) => ({ ...user, ...((await net.store.get('users', user.id)) || {}) });

export async function giveCoins(user, n) {
  const u = await fresh(user);
  await net.store.update('users', user.id, { coins: (u.coins || 0) + n });
  return (u.coins || 0) + n;
}

export async function giveBlook(user, blookId) {
  const owned = { ...((await fresh(user)).owned || {}) };
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
