// plan.js — Free and Pro.
//
// Pro is $13.49 a year. Who is Pro lives in members/{uid} {plan, until},
// which only the site owner can write (later: the payment system). The owner
// is always Pro.

import { net } from '../net/index.js';
import { me, signedIn, setProFlag } from './session.js';
import { OWNER_UID, BADGES } from '../config.js';

export const PRICE = '$13.49';

/** The free test: every account is Pro until this moment (UTC, 20 Feb 2027).
 *  The security rules hold the same date. After it, only the owner (and any
 *  paying members) stay Pro. */
export const TRIAL_ENDS = Date.UTC(2027, 1, 20);
export const trialOn = (now = Date.now()) => now < TRIAL_ENDS && !testsWithoutTrial();
// the browser tests check the free plan too: on localhost only, they can switch the test off
function testsWithoutTrial() {
  try {
    return ['localhost', '127.0.0.1'].includes(location.hostname) && localStorage.getItem('quickzy.test.noTrial') === '1';
  } catch { return false; }
}

export const PLANS = {
  free: {
    quizzes: 10, players: 40, modes: ['classic', 'robotrun', 'obby'],
    minutes: [3, 5, 7, 10], reviewDays: 3,
  },
  pro: {
    quizzes: 300, players: 100, modes: ['classic', 'lasertag', 'robotrun', 'spacecraft', 'obby', 'defense'],
    minutes: [3, 5, 7, 10, 15, 20, 30], reviewDays: 0,
  },
};

export const PRO_PERKS = [
  ['check', 'Gold PRO badge', 'Next to your name on every quiz, channel and game.'],
  ['globe', 'Publish instantly', 'Your quizzes go live right away. Free quizzes wait 3–5 days for a check.'],
  ['users', 'Up to 100 players', 'Free games hold 40.'],
  ['play', 'Every game mode', 'Laser Tag, Spacecraft and Tower Defense too, and games up to 30 minutes.'],
  ['list', '300 quizzes', 'Free accounts can make 10.'],
  ['star', 'Custom blooks and flags', 'All three custom blook slots and every part unlocked, plus the country flag blooks.'],
  ['play', 'Video quizzes', 'A YouTube clip plays, stops, and then the question is asked.'],
  ['edit', 'Make quizzes together', 'Invite anyone, even free accounts, to edit a quiz with you.'],
  ['mail', 'A thank-you letter', 'A personal letter from Quickzy, just for members.'],
];
export const PRO_SOON = [];

const cache = new Map();
const known = new Map();      // answers already in, for code that cannot wait

/** Pro, for the signed-in account, if we already know (false until then). */
export const proNow = () => Boolean(signedIn() && known.get(me().uid));

/** Is this account Pro right now? */
export function isPro(uid) {
  if (!uid) return Promise.resolve(false);
  if (uid === OWNER_UID || BADGES[uid] === 'official') { known.set(uid, true); return Promise.resolve(true); }
  if (trialOn()) { known.set(uid, true); if (me() && me().uid === uid) setProFlag(true); return Promise.resolve(true); }
  if (!cache.has(uid)) {
    cache.set(uid, net.store.get('members', uid)
      .then((m) => Boolean(m && m.plan === 'pro' && (m.until || 0) > Date.now()))
      .catch(() => false)
      .then((v) => { known.set(uid, v); if (me() && me().uid === uid) setProFlag(v); return v; }));
  }
  return cache.get(uid);
}
export const forget = (uid) => { cache.delete(uid); known.delete(uid); };

export async function membership(uid) {
  if (!uid) return null;
  return net.store.get('members', uid).catch(() => null);
}

/** The plan of whoever is signed in. */
export async function myPlan() {
  const pro = signedIn() && await isPro(me().uid);
  return { pro, ...(pro ? PLANS.pro : PLANS.free) };
}

/** The owner turns Pro on (for a year) or off. */
export async function setPro(uid, on) {
  if (on) await net.store.set('members', uid, { plan: 'pro', since: Date.now(), until: Date.now() + 365 * 86400000 });
  else await net.store.del('members', uid);
  cache.delete(uid);
}
