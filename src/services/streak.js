// streak.js — the daily streak. Open Quickzy on a new day and the streak
// grows (miss a day and it starts again); every day brings a reward chest
// that gets bigger the longer the streak.

import * as session from './session.js';
import { h } from '../ui/dom.js';
import { modal } from '../ui/kit.js';
import { sfx } from '../game/sound.js';

const dayOf = (t = Date.now()) => new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const rewardFor = (streak) => Math.min(100, 10 + streak * 5);

/** Count today, once. Resolves with {streak, reward} on a new day, else null. */
export async function checkIn() {
  if (!session.signedIn()) return null;
  const p = await session.reloadProfile();
  if (!p) return null;
  const today = dayOf();
  if (p.lastDay === today) return null;
  const yesterday = dayOf(Date.now() - 86400000);
  const streak = p.lastDay === yesterday ? Math.min(9999, (Number(p.streak) || 0) + 1) : 1;
  const reward = rewardFor(streak);
  await session.patchProfile({ streak, lastDay: today, coins: (p.coins || 0) + reward });
  return { streak, reward, best: Math.max(streak, Number(p.streak) || 0) };
}

/** The daily chest: tap to open. */
export function showDaily({ streak, reward }) {
  sfx('reveal');
  return modal((close) => {
    const chest = h('button', { class: 'daily-chest', 'aria-label': 'Open the chest' }, h('span', { class: 'dc-lid' }), h('span', { class: 'dc-box' }));
    const after = h('div', { class: 'daily-after', hidden: true },
      h('div', { class: 'daily-coins' }, `+${reward}`),
      h('p', {}, 'coins'),
      h('button', { class: 'btn btn-main btn-block', onclick: () => close() }, streak >= 2 ? 'Keep the streak going!' : 'See you tomorrow!'));
    chest.addEventListener('click', () => {
      if (chest.classList.contains('is-open')) return;
      chest.classList.add('is-open');
      sfx('win');
      import('../ui/confetti.js').then((c) => c.celebrate(['#ffcd1f', '#ff8a2a', '#ffffff'])).catch(() => {});
      setTimeout(() => { after.hidden = false; }, 450);
    });
    const days = h('div', { class: 'daily-days' }, ...Array.from({ length: 7 }, (_, i) => {
      const n = i + 1;
      const on = n <= ((streak - 1) % 7) + 1;
      return h('span', { class: `daily-day${on ? ' is-on' : ''}${n === ((streak - 1) % 7) + 1 ? ' is-today' : ''}` }, h('small', {}, `Day ${n}`), on ? '🔥' : '·');
    }));
    return [h('div', { class: 'stack center daily', style: { gap: '12px', textAlign: 'center' } },
      h('span', { class: 'daily-flame' }, '🔥'),
      h('h2', {}, streak === 1 ? 'Day 1: your streak starts!' : `${streak}-day streak!`),
      h('p', { class: 'muted', style: { margin: 0 } }, 'Come back every day: the chest grows the longer your streak.'),
      days, chest, after)];
  });
}
