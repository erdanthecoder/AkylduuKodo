// modes/index.js — the ways a quiz can be played.
//
// "classic" is host-paced, Kahoot-style: one question at a time on the big
// screen. The others are self-paced arcade games: everyone plays at once on
// their own device and answers questions to power up, while the big screen
// shows the race.

import { svg } from '../../ui/dom.js';
import { RELEASE_1_2 } from '../../config.js';

export const MODES = [
  {
    id: 'classic', name: 'Classic', kind: 'paced',
    tagline: 'One question at a time, fastest answers score most.',
    bg: 'linear-gradient(140deg, #6b4cff, #4a2fd6)',
    durations: null,
  },
  {
    id: 'lasertag', name: 'Laser Tag', kind: 'arcade',
    tagline: 'Tag rivals in the arena. Answer questions to recharge.',
    bg: 'linear-gradient(140deg, #0e1a4d, #3a1aa8)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'robotrun', name: 'Robot Run', kind: 'arcade',
    tagline: 'Jump the crates, answer to recharge, outrun everyone.',
    bg: 'linear-gradient(140deg, #ff8a2a, #ff4772)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'spacecraft', name: 'Spacecraft', kind: 'arcade',
    tagline: 'Blast asteroids. Answer to refuel and upgrade.',
    bg: 'linear-gradient(140deg, #0b1030, #1d3b8f)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'obby', name: 'Sky Climb', kind: 'arcade',
    tagline: 'Climb six worlds to the summit. Fall and you drop. Don\'t look down!',
    bg: 'linear-gradient(160deg, #070b26, #3a2380 35%, #7a80b8 55%, #7fdcff 75%, #78cbff)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'defense', name: 'Tower Defense', kind: 'arcade',
    tagline: 'Build towers, stop the monsters, save the castle. Answers buy towers.',
    bg: 'linear-gradient(140deg, #2e7d32, #66bb6a 60%, #a8703c)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'skyrace', name: 'Sky Race', kind: 'arcade',
    tagline: 'Fly, answer, BOOST! Outrun the fighter jets before they shoot you down.',
    bg: 'linear-gradient(160deg, #2a6fdb, #7cc2ff 55%, #ffb45c)',
    durations: [3], fixedMinutes: 3, releaseAt: RELEASE_1_2, isNew: true,
  },
  {
    id: 'treasure', name: 'Treasure Hunt', kind: 'arcade', proOnly: true,
    tagline: 'Answer to open chests. Gold, double, triple… or steal from a rival!',
    bg: 'linear-gradient(140deg, #8a5a2b, #ffb21f)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'fishing', name: 'Fishing Frenzy', kind: 'arcade', proOnly: true,
    tagline: 'Answer for bait, cast, and reel in at the right moment. Catch the Kraken!',
    bg: 'linear-gradient(160deg, #ffb86b, #2fb8ff 45%, #0b3a7a)',
    durations: [3, 5, 7, 10],
  },
  {
    id: 'candy', name: 'Candy Factory', kind: 'arcade', proOnly: true,
    tagline: 'Answer for cash, buy machines, and make the most candy.',
    bg: 'linear-gradient(140deg, #ff4772, #a560ff)',
    durations: [3, 5, 7, 10],
  },
];

/** A mode that is announced but not out yet (the owner can try it early). */
export const comingSoon = (m, now = Date.now()) => {
  if (!m.releaseAt || now >= m.releaseAt) return false;
  // the browser tests try new modes before release day
  try { if (typeof navigator !== 'undefined' && navigator.webdriver && localStorage.getItem('quickzy.test.early') === '1') return false; } catch { /* ignore */ }
  return true;
};

export const MODE_BY_ID = new Map(MODES.map((m) => [m.id, m]));
export const modeOf = (id) => MODE_BY_ID.get(id) || MODES[0];

/** A small picture for each mode, used on cards. */
export function modeArt(id) {
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'mode-art', 'aria-hidden': 'true' });
  const add = (tag, attrs) => s.append(svg(tag, attrs));
  if (id === 'classic') {
    add('rect', { x: 18, y: 20, width: 30, height: 30, rx: 8, fill: '#ff4772' });
    add('rect', { x: 54, y: 20, width: 30, height: 30, rx: 8, fill: '#2f9bff' });
    add('rect', { x: 18, y: 56, width: 30, height: 30, rx: 8, fill: '#ffcd1f' });
    add('rect', { x: 54, y: 56, width: 30, height: 30, rx: 8, fill: '#12c9a6' });
    add('path', { d: 'M33 26 l-7 11 h5 l-2 8 9 -12 h-5 Z', fill: '#fff' });
    add('path', { d: 'M69 27 c0 0 -7 8 -7 12 a7 7 0 0 0 14 0 c0 -4 -7 -12 -7 -12 Z', fill: '#fff' });
    add('path', { d: 'M33 62 l2.6 5.4 6 .8 -4.3 4.1 1 5.8 -5.3 -2.8 -5.3 2.8 1 -5.8 -4.3 -4.1 6 -.8 Z', fill: '#17133f' });
    add('path', { d: 'M69 62 l8 4.6 v9.2 l-8 4.6 -8 -4.6 v-9.2 Z', fill: '#fff' });
  }
  if (id === 'lasertag') {
    add('circle', { cx: 50, cy: 50, r: 30, fill: 'none', stroke: '#59f0ff', 'stroke-width': 5 });
    add('circle', { cx: 50, cy: 50, r: 6, fill: '#ff4772' });
    add('path', { d: 'M50 12 v18 M50 70 v18 M12 50 h18 M70 50 h18', stroke: '#59f0ff', 'stroke-width': 5, 'stroke-linecap': 'round' });
    add('path', { d: 'M8 88 L40 58', stroke: '#ff4772', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.85 });
  }
  if (id === 'robotrun') {
    add('rect', { x: 30, y: 24, width: 40, height: 34, rx: 10, fill: '#fff' });
    add('rect', { x: 38, y: 32, width: 24, height: 14, rx: 5, fill: '#17133f' });
    add('circle', { cx: 45, cy: 39, r: 3, fill: '#59f0ff' });
    add('circle', { cx: 55, cy: 39, r: 3, fill: '#59f0ff' });
    add('path', { d: 'M50 24 v-9', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' });
    add('circle', { cx: 50, cy: 13, r: 4, fill: '#ffcd1f' });
    add('circle', { cx: 40, cy: 70, r: 10, fill: '#17133f' });
    add('circle', { cx: 62, cy: 70, r: 10, fill: '#17133f' });
    add('path', { d: 'M6 40 h16 M10 52 h12 M4 64 h14', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  }
  if (id === 'spacecraft') {
    for (const [x, y, r] of [[14, 18, 2], [84, 26, 2.5], [20, 76, 1.8], [80, 82, 2], [62, 12, 1.6]]) add('circle', { cx: x, cy: y, r, fill: '#fff' });
    add('path', { d: 'M50 10 C64 22 66 46 62 64 H38 C34 46 36 22 50 10 Z', fill: '#e8ecff' });
    add('circle', { cx: 50, cy: 36, r: 8, fill: '#59f0ff' });
    add('path', { d: 'M38 52 L24 70 L38 66 Z M62 52 L76 70 L62 66 Z', fill: '#ff4772' });
    add('path', { d: 'M42 64 L50 88 L58 64 Z', fill: '#ffcd1f' });
  }
  if (id === 'obby') {
    add('rect', { x: 8, y: 78, width: 30, height: 10, rx: 4, fill: '#fff' });
    add('rect', { x: 40, y: 60, width: 26, height: 10, rx: 4, fill: '#ffcd1f' });
    add('rect', { x: 62, y: 40, width: 30, height: 10, rx: 4, fill: '#fff' });
    add('rect', { x: 30, y: 20, width: 24, height: 10, rx: 4, fill: '#ff4772' });
    add('rect', { x: 66, y: 22, width: 14, height: 18, rx: 4, fill: '#17133f' });
    add('path', { d: 'M20 76 q14 -30 30 -18', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '4 5' });
  }
  if (id === 'defense') {
    add('path', { d: 'M0 30 H34 V70 H66 V40 H100', fill: 'none', stroke: '#d9a466', 'stroke-width': 12, 'stroke-linejoin': 'round' });
    add('rect', { x: 14, y: 50, width: 16, height: 16, rx: 4, fill: '#4e4a75' });
    add('circle', { cx: 22, cy: 58, r: 5, fill: '#59f0ff' });
    add('rect', { x: 44, y: 22, width: 16, height: 16, rx: 4, fill: '#4e4a75' });
    add('circle', { cx: 52, cy: 30, r: 5, fill: '#ff8a2a' });
    add('rect', { x: 78, y: 18, width: 20, height: 18, rx: 3, fill: '#e8ecff' });
    add('rect', { x: 78, y: 13, width: 5, height: 6, fill: '#6b4cff' });
    add('rect', { x: 86, y: 13, width: 5, height: 6, fill: '#6b4cff' });
    add('rect', { x: 94, y: 13, width: 4, height: 6, fill: '#6b4cff' });
    add('circle', { cx: 36, cy: 72, r: 6, fill: '#ff4772' });
  }
  if (id === 'skyrace') {
    add('path', { d: 'M8 30 h26 M4 44 h20 M10 58 h18', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
    add('path', { d: 'M36 46 C36 40 52 38 72 38 C84 38 92 42 94 46 C92 50 84 54 72 54 C52 54 36 52 36 46 Z', fill: '#fff' });
    add('path', { d: 'M42 46 L34 28 L42 28 L52 44 Z', fill: '#e8112d' });
    add('path', { d: 'M60 48 L74 48 L64 66 L56 66 Z', fill: '#6b4cff' });
    add('path', { d: 'M36 44 L22 46 L36 48 Z', fill: '#ffcd1f' });
    add('path', { d: 'M4 78 L26 76 L30 78 L26 80 Z', fill: '#4a5068' });
    add('path', { d: 'M30 78 h14', stroke: '#ff4772', 'stroke-width': 3, 'stroke-linecap': 'round' });
  }
  if (id === 'treasure') {
    add('rect', { x: 20, y: 46, width: 60, height: 36, rx: 5, fill: '#8a5a2b' });
    add('path', { d: 'M20 50 Q50 18 80 50 Z', fill: '#a8703c' });
    add('rect', { x: 20, y: 46, width: 60, height: 7, fill: '#ffcd1f' });
    add('rect', { x: 45, y: 50, width: 10, height: 14, rx: 2, fill: '#ffcd1f' });
    for (const [x, y] of [[30, 30], [62, 24], [76, 36]]) add('circle', { cx: x, cy: y, r: 5, fill: '#ffe45c' });
  }
  if (id === 'fishing') {
    add('path', { d: 'M10 50 Q30 44 50 50 T90 50 V90 H10 Z', fill: '#2fb8ff' });
    add('path', { d: 'M22 10 L60 40', stroke: '#5a3a1a', 'stroke-width': 4, 'stroke-linecap': 'round' });
    add('path', { d: 'M60 40 V62', stroke: '#fff', 'stroke-width': 2 });
    add('ellipse', { cx: 56, cy: 74, rx: 16, ry: 8, fill: '#ffcd1f' });
    add('path', { d: 'M42 74 L32 66 V82 Z', fill: '#ffcd1f' });
    add('circle', { cx: 64, cy: 72, r: 2, fill: '#17133f' });
  }
  if (id === 'candy') {
    add('rect', { x: 10, y: 66, width: 80, height: 10, rx: 5, fill: '#17133f' });
    add('circle', { cx: 30, cy: 52, r: 12, fill: '#ffcd1f' });
    add('path', { d: 'M30 64 V90', stroke: '#fff', 'stroke-width': 4 });
    add('rect', { x: 50, y: 42, width: 30, height: 22, rx: 6, fill: '#12c9a6' });
    add('path', { d: 'M50 53 L42 46 V60 Z M80 53 L88 46 V60 Z', fill: '#12c9a6' });
    add('circle', { cx: 30, cy: 52, r: 6, fill: 'none', stroke: '#ff4772', 'stroke-width': 3 });
  }
  return s;
}
