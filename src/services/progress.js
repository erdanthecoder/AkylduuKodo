// progress.js — levels, coins, the blook collection and custom blooks.
//
// Playing a game earns XP and coins (accounts only: guests keep nothing).
// Coins open boxes; a box gives one blook, rarer ones less often. Levels
// unlock custom blook slots, three at most, and more parts to build them from.

import { myProfile, signedIn, patchProfile, reloadProfile, me as who } from './session.js';
import { OWNER_UID } from '../config.js';
import { STARTERS, CUSTOM_PARTS, drawFromBox, rarityOf, isCustom, isBlook, BLOOKS, REGULAR, LIMITED, EXCLUSIVE } from '../ui/blooks.js';

export const MAX_LEVEL = 30;
export const CUSTOM_SLOTS = [3, 6, 10];          // the levels that open slot 1, 2 and 3

/** Total XP needed to reach `level`. Level 2 at 100, 5 at 1000, 10 at 4500. */
export const xpFor = (level) => 50 * level * (level - 1);

export function levelOf(xp = 0) {
  let l = 1;
  while (l < MAX_LEVEL && xp >= xpFor(l + 1)) l++;
  return l;
}

/** {level, into, need, frac}: how far through the current level. */
export function levelInfo(xp = 0) {
  const level = levelOf(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, need: 0, frac: 1 };
  const into = xp - xpFor(level);
  const need = xpFor(level + 1) - xpFor(level);
  return { level, into, need, frac: into / need };
}

const fromSets = (...sets) => BLOOKS.filter((b) => sets.includes(b.set) && !b.limited && !b.exclusive).map((b) => b.id);

// limited editions can be opened until the end of this day (UTC)
export const WINTER_ENDS = Date.UTC(2027, 0, 15, 23, 59, 59);

export const BOXES = [
  { id: 'basic', name: 'Quickzy Box', price: 25, level: 1, luck: 1, pool: REGULAR, colour: 'linear-gradient(140deg, #6b4cff, #a560ff)' },
  { id: 'winter', name: 'Winter Pack', price: 25, level: 1, luck: 1, pool: LIMITED, limited: true, ends: WINTER_ENDS,
    colour: 'linear-gradient(160deg, #1d4fbf, #5fb4ff 60%, #e9f6ff)', blurb: 'Christmas limited edition' },
  { id: 'animal', name: 'Animal Pack', price: 30, level: 1, luck: 1, pool: fromSets('Pets', 'Farm', 'Wild'), colour: 'linear-gradient(140deg, #12c9a6, #19c37d)' },
  { id: 'snack', name: 'Snack Pack', price: 20, level: 1, luck: 1, pool: fromSets('Snacks'), colour: 'linear-gradient(140deg, #ff8a2a, #ff4772)' },
  { id: 'space', name: 'Space & Magic Pack', price: 40, level: 2, luck: 1, pool: fromSets('Space', 'Magic'), colour: 'linear-gradient(140deg, #17133f, #3a2ca0)' },
  { id: 'gold', name: 'Golden Box', price: 90, level: 8, luck: 4, pool: REGULAR, colour: 'linear-gradient(140deg, #ffcd1f, #ff8a2a)' },
];

/** Can this box be opened right now? (Limited ones close on their date.) */
export const boxOpen = (box, now = Date.now()) => !box.limited || now <= box.ends;

/** The level each option of a custom part unlocks at. The first two are free. */
export function partLevel(part, index) {
  if (index < 2) return 1;
  const step = { body: 2, eyes: 3, mouth: 3, top: 2, extra: 3 }[part] || 3;
  return Math.min(MAX_LEVEL, 3 + (index - 2) * step);
}

/** What each level brings, for the road map. */
export function unlocksAt(level) {
  const out = [];
  if (level === 1) out.push('The Quickzy Box and every common blook');
  const slot = CUSTOM_SLOTS.indexOf(level);
  if (slot >= 0) out.push(`Custom blook slot ${slot + 1} of 3`);
  for (const b of BOXES) if (b.level === level && level > 1 && !b.limited) out.push(`The ${b.name}`);
  const words = { body: 'colour', eyes: 'eyes', mouth: 'mouth', top: 'top', extra: 'extra' };
  const parts = Object.entries(CUSTOM_PARTS)
    .filter(([part, options]) => options.some((_, i) => i >= 2 && partLevel(part, i) === level))
    .map(([part]) => words[part]);
  if (parts.length) out.push(`New custom parts: ${parts.join(', ')}`);
  return out;
}

/* ------------------------------------------------------------ the player */

export const me = () => {
  const p = myProfile() || {};
  return {
    xp: p.xp || 0,
    coins: p.coins ?? 0,
    owned: p.owned || {},
    customs: Array.isArray(p.customs) ? p.customs.filter(isCustom).slice(0, 3) : [],
  };
};

export function owns(id) {
  if (STARTERS.includes(id)) return true;
  if (EXCLUSIVE.includes(id) && who()?.uid === OWNER_UID) return true;
  const m = me();
  return Boolean(m.owned[id]) || m.customs.includes(id);
}

/** Every blook this person may use, best first. */
export function usableBlooks() {
  const m = me();
  const order = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  const flags = who()?.uid === OWNER_UID ? EXCLUSIVE : [];
  const mine = [...new Set([...m.customs, ...flags, ...Object.keys(m.owned).filter(isBlook), ...STARTERS])];
  return mine.sort((a, b) => order.indexOf(rarityOf(a).id) - order.indexOf(rarityOf(b).id));
}

export const customSlots = () => CUSTOM_SLOTS.filter((l) => levelOf(me().xp) >= l).length;

/** Spend coins on a box. Returns {id, duplicate, refund}. */
export async function openBox(boxId, rand = Math.random) {
  if (!signedIn()) throw new Error('Sign in to open boxes.');
  await reloadProfile();
  const box = BOXES.find((b) => b.id === boxId);
  const m = me();
  if (!box) throw new Error('That box does not exist.');
  if (!boxOpen(box)) throw new Error(`The ${box.name} was a limited edition and has closed.`);
  if (levelOf(m.xp) < box.level) throw new Error(`The ${box.name} opens at level ${box.level}.`);
  if (m.coins < box.price) throw new Error(`You need ${box.price} coins.`);
  // a luckier box draws several times and keeps the rarest
  let id = drawFromBox(rand, box.pool);
  const rank = (x) => ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(rarityOf(x).id);
  for (let i = 1; i < box.luck; i++) { const next = drawFromBox(rand, box.pool); if (rank(next) > rank(id)) id = next; }
  const duplicate = owns(id);
  const refund = duplicate ? rarityOf(id).refund : 0;
  const owned = { ...m.owned, [id]: (m.owned[id] || (STARTERS.includes(id) ? 1 : 0)) + 1 };
  await patchProfile({ coins: m.coins - box.price + refund, owned });
  return { id, duplicate, refund };
}

/** Save a custom blook into a slot (0, 1 or 2). */
export async function saveCustom(slot, id) {
  if (!isCustom(id)) throw new Error('That blook is not finished.');
  await reloadProfile();
  if (slot >= customSlots()) throw new Error(`Slot ${slot + 1} opens at level ${CUSTOM_SLOTS[slot]}.`);
  const lvl = levelOf(me().xp);
  const parts = Object.keys(CUSTOM_PARTS);
  parts.forEach((part, i) => {
    if (partLevel(part, Number(id[2 + i])) > lvl) throw new Error('One of those parts is not unlocked yet.');
  });
  const customs = [...me().customs];
  while (customs.length <= slot) customs.push(null);
  customs[slot] = id;
  await patchProfile({ customs: customs.filter(Boolean).slice(0, 3) });
}

/* --------------------------------------------------------- after a game */

/** XP and coins for one finished game; `row` is the player's final row. */
export function rewardFor(row, players) {
  const xp = Math.min(400, 40 + Math.floor((row.s || 0) / 25) + (row.c || 0) * 5);
  let coins = 10 + Math.min(30, (row.c || 0) * 2);
  if (players > 1 && row.r === 1) coins += 25;
  else if (players > 2 && row.r <= 3) coins += 10;
  return { xp, coins: Math.min(80, coins) };
}

/** Award a finished game once. Returns the reward and any level reached, or null. */
export async function claimGame(gameKey, row, players) {
  if (!signedIn() || !row) return null;
  await reloadProfile();
  const p = myProfile() || {};
  if (p.lastGame === gameKey) return null;
  const m = me();
  const { xp, coins } = rewardFor(row, players);
  const before = levelOf(m.xp);
  await patchProfile({ xp: m.xp + xp, coins: m.coins + coins, lastGame: gameKey });
  return { xp, coins, levelUp: levelOf(m.xp + xp) > before ? levelOf(m.xp + xp) : 0 };
}
