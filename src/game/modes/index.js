// modes/index.js — the ways a quiz can be played.
//
// "classic" is host-paced, Kahoot-style: one question at a time on the big
// screen. The others are self-paced arcade games: everyone plays at once on
// their own device and answers questions to power up, while the big screen
// shows the race.

import { svg } from '../../ui/dom.js';

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
    id: 'obby', name: 'Obby', kind: 'arcade',
    tagline: 'Climb the tower. Every right answer buys more jumps.',
    bg: 'linear-gradient(140deg, #12c9a6, #2f9bff)',
    durations: [3, 5, 7, 10],
  },
];

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
  return s;
}
