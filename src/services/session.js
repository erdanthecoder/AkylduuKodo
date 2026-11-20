// session.js — who is here, and their profile.
//
// Three kinds of visitor:
//   • nobody — can browse Discover and join a game
//   • a guest — signed in anonymously the moment they join a game, so the
//     database can tell their answers from everyone else's; no email, no name
//     kept beyond the game
//   • an account — Google or email; gets a profile, a username and a library
//
// A profile lives at users/{uid}. Usernames are claimed at usernames/{name},
// so the database itself guarantees no two people hold the same one.

import { net } from '../net/index.js';
import { LIMITS } from '../config.js';
import { randomBlook, isBlook, STARTERS } from '../ui/blooks.js';
import { cleanName, isClean } from './names.js';

let user = null;
let profile = null;
const listeners = new Set();

export const me = () => user;
export const myProfile = () => profile;
export const signedIn = () => Boolean(user && !user.isAnonymous);

export function onSession(fn) {
  listeners.add(fn);
  fn({ user, profile });
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) {
    try { fn({ user, profile }); } catch (e) { console.error(e); }
  }
}

export async function start() {
  let first = true;
  await new Promise((resolve) => {
    net.auth.onChange(async (u) => {
      user = u;
      profile = null;
      if (u && !u.isAnonymous) {
        try { profile = await ensureProfile(u); } catch (e) { console.warn('profile load failed', e); }
      }
      emit();
      if (first) { first = false; resolve(); }
    });
  });
}

/** Resolves with the profile once it has loaded (null for guests and nobody). */
export function whenProfile() {
  if (!signedIn() || profile) return Promise.resolve(profile);
  // the profile is still loading; the next emit comes once loading finishes
  return new Promise((resolve) => {
    let first = true;
    const stop = onSession(({ profile: p }) => {
      if (first) { first = false; return; }
      queueMicrotask(() => stop());
      resolve(p);
    });
  });
}

export function validUsername(name) {
  const n = String(name || '').toLowerCase();
  if (n.length < LIMITS.usernameMin) return `At least ${LIMITS.usernameMin} characters.`;
  if (n.length > LIMITS.usernameMax) return `At most ${LIMITS.usernameMax} characters.`;
  if (!/^[a-z0-9_]+$/.test(n)) return 'Letters, numbers and _ only.';
  if (!isClean(n)) return 'Pick a different username.';
  return '';
}

async function freeUsername(seed) {
  const base = (cleanName(seed) || 'player').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 14) || 'player';
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 && base.length >= LIMITS.usernameMin ? base : `${base.slice(0, 13)}${Math.floor(1000 + Math.random() * 9000)}`;
    if (validUsername(candidate)) continue;
    const taken = await net.store.get('usernames', candidate);
    if (!taken) return candidate;
  }
  return `player${Date.now().toString(36)}`;
}

async function ensureProfile(u) {
  const existing = await net.store.get('users', u.uid);
  if (existing) return existing;
  const username = await freeUsername(u.displayName || (u.email || '').split('@')[0]);
  const data = {
    username,
    displayName: (cleanName(u.displayName || username) || username).slice(0, 30),
    blook: randomBlook(),
    xp: 0,
    coins: 50,
    owned: {},
    customs: [],
    createdAt: net.store.serverTime(),
  };
  // the username and the profile are written together or not at all
  await net.store.batch([
    { op: 'set', col: 'usernames', id: username, data: { uid: u.uid } },
    { op: 'set', col: 'users', id: u.uid, data },
  ]);
  return { id: u.uid, ...data, createdAt: Date.now() };
}

/** Commons are everyone's; the rest come from boxes or the custom builder. */
export function ownsBlook(id) {
  if (STARTERS.includes(id)) return true;
  const p = profile || {};
  return Boolean(p.owned && p.owned[id]) || (Array.isArray(p.customs) && p.customs.includes(id));
}

export async function updateProfile(patch) {
  if (!signedIn()) throw new Error('not signed in');
  const clean = {};
  if (patch.displayName !== undefined) {
    const n = String(patch.displayName).trim().slice(0, 30);
    if (!n) throw new Error('Pick a display name.');
    if (!isClean(n)) throw new Error('Pick a different display name.');
    clean.displayName = n;
  }
  if (patch.blook !== undefined && patch.blook !== (profile || {}).blook) {
    if (!isBlook(patch.blook) || !ownsBlook(patch.blook)) throw new Error('Collect that blook first.');
    clean.blook = patch.blook;
  }
  if (Object.keys(clean).length) await net.store.update('users', user.uid, clean);
  profile = { ...profile, ...clean };
  emit();
}

/** Write progress fields (xp, coins, owned, customs…) and tell everyone. */
export async function patchProfile(fields) {
  if (!signedIn()) throw new Error('not signed in');
  await net.store.update('users', user.uid, fields);
  profile = { ...profile, ...fields };
  emit();
}

export async function changeUsername(next) {
  const name = String(next || '').toLowerCase();
  const problem = validUsername(name);
  if (problem) throw new Error(problem);
  if (name === profile.username) return;
  const taken = await net.store.get('usernames', name);
  if (taken) throw new Error('That username is taken.');
  await net.store.batch([
    { op: 'set', col: 'usernames', id: name, data: { uid: user.uid } },
    { op: 'del', col: 'usernames', id: profile.username },
    { op: 'update', col: 'users', id: user.uid, data: { username: name } },
  ]);
  profile = { ...profile, username: name };
  emit();
}

export async function refresh() {
  user = await net.auth.reload();
  emit();
}

/** Local preferences: kept on this device, not in the account. */
const PREFS_KEY = 'quickzy.prefs';
const DEFAULT_PREFS = { sound: true, music: true, motion: true };

export function prefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return { ...DEFAULT_PREFS }; }
}

export function setPrefs(patch) {
  const next = { ...prefs(), ...patch };
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  document.documentElement.dataset.motion = next.motion ? 'full' : 'calm';
  return next;
}
