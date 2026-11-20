// loader.js — the loading screen: the logo zaps, three blooks hop in turn,
// a bar shimmers, and a tip changes every few seconds so a slow connection
// teaches something instead of just spinning.

import { h } from './dom.js';
import { logo, wordmark } from './icons.js';
import { blook, BLOOKS } from './blooks.js';

export const TIPS = [
  'Faster right answers score more: up to 1000 points, never less than 500.',
  'Three right answers in a row and you are on fire. Streaks add bonus points.',
  'Legendary blooks come out of 1 box in 100. Golden Boxes are luckier.',
  'Reach level 3 to build your first custom blook. You can have three.',
  'Scan the QR code on the big screen to join without typing the PIN.',
  'Every quiz in Discover has a Play solo button. No host needed.',
  'In Laser Tag, grab the glowing pickups for speed boots and rapid fire.',
  'In Robot Run, a shield bubble saves you from one crash.',
  'In Obby, crystals give extra jumps. Spring boots jump higher.',
  'Hosts can lock the lobby so nobody else joins mid-game.',
  'Publish three quizzes with five or more questions to earn a blue check.',
  'Type-the-answer questions forgive capitals, spaces and accents.',
  'There is a new Quiz of the day on the home page every day.',
  'Duplicate blooks give coins back. Rarer ones give more.',
];

/** A tip to start on, different each visit. */
const firstTip = () => Math.floor(Math.random() * TIPS.length);

/**
 * loader({ full }) — full is the whole-screen boot version; otherwise it fits
 * inside a page. Returns an element; its timer stops once it leaves the page.
 */
export function loader({ full = false, text = '' } = {}) {
  let i = firstTip();
  const tip = h('p', { class: 'loader-tip' }, TIPS[i]);
  const picks = [...BLOOKS].sort(() => Math.random() - 0.5).slice(0, 3);
  const hoppers = h('div', { class: 'loader-blooks', 'aria-hidden': 'true' },
    ...picks.map((b, k) => { const el = blook(b.id); el.style.animationDelay = `${k * 0.18}s`; return el; }));
  const root = h('div', { class: `loader${full ? ' is-full pattern' : ''}`, role: 'status', 'aria-live': 'polite' },
    full ? h('div', { class: 'loader-logo' }, logo(), wordmark()) : null,
    hoppers,
    h('div', { class: 'loader-bar' }, h('i')),
    text ? h('p', { class: 'loader-text' }, text) : null,
    h('div', { class: 'loader-tipbox' }, h('b', {}, 'Tip'), tip));
  const timer = setInterval(() => {
    if (!root.isConnected && root.dataset.seen) { clearInterval(timer); return; }
    if (root.isConnected) root.dataset.seen = '1';
    tip.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % TIPS.length;
      tip.textContent = TIPS[i];
      tip.classList.remove('is-out');
    }, 280);
  }, 3600);
  return root;
}
