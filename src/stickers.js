// stickers.js — what she collects.
//
// One sticker per finished task, and which one is decided by the day, not by
// chance: there is no pull to "try again for a better one", because that is a
// slot machine and she is seven. The album fills up in a fixed order, so the
// next one is always worth finishing for.

import { svg, h } from './ui.js';

const S = (parts, bg) => ({ parts, bg });

/** Sixteen of them, drawn rather than typed, so they are the same everywhere. */
export const STICKERS = [
  ['apple', '#e0457b', (s) => {
    s.append(svg('circle', { cx: 32, cy: 36, r: 20, fill: '#e0457b', stroke: '#2b2a33', 'stroke-width': 3 }));
    s.append(svg('path', { d: 'M32 17 q4 -8 11 -9', fill: 'none', stroke: '#58a55c', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }],
  ['star', '#f5b942', (s) => {
    s.append(svg('path', { d: 'M32 12 L38 27 L54 28 L41 38 L46 54 L32 44 L18 54 L23 38 L10 28 L26 27 Z',
      fill: '#f5b942', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  }],
  ['moon', '#8b5cf6', (s) => {
    s.append(svg('path', { d: 'M40 14 a22 22 0 1 0 8 34 a18 18 0 1 1 -8 -34 Z', fill: '#8b5cf6', stroke: '#2b2a33', 'stroke-width': 3 }));
  }],
  ['leaf', '#58a55c', (s) => {
    s.append(svg('path', { d: 'M14 48 q4 -34 36 -36 q2 32 -36 36 Z', fill: '#58a55c', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: 'M20 44 q14 -14 26 -26', fill: 'none', stroke: '#2b2a33', 'stroke-width': 2, opacity: 0.6 }));
  }],
  ['fish', '#2d8fd5', (s) => {
    s.append(svg('ellipse', { cx: 30, cy: 34, rx: 18, ry: 12, fill: '#2d8fd5', stroke: '#2b2a33', 'stroke-width': 3 }));
    s.append(svg('path', { d: 'M48 34 l12 -9 v18 Z', fill: '#2d8fd5', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('circle', { cx: 23, cy: 31, r: 2.6, fill: '#2b2a33' }));
  }],
  ['cloud', '#9ec9e8', (s) => {
    s.append(svg('path', { d: 'M18 42 a10 10 0 0 1 2 -19 a13 13 0 0 1 24 -2 a9 9 0 0 1 2 21 Z',
      fill: '#9ec9e8', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  }],
  ['mountain', '#7d8fa3', (s) => {
    s.append(svg('path', { d: 'M8 50 L26 20 L38 36 L46 26 L58 50 Z', fill: '#7d8fa3', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: 'M20 29 L26 20 L32 29 Z', fill: '#fff' }));
  }],
  ['flower', '#ef6461', (s) => {
    [0, 72, 144, 216, 288].forEach((a) => {
      const rad = (a * Math.PI) / 180;
      s.append(svg('ellipse', { cx: 32 + Math.cos(rad) * 13, cy: 34 + Math.sin(rad) * 13, rx: 8, ry: 8,
        fill: '#ef6461', stroke: '#2b2a33', 'stroke-width': 2.5 }));
    });
    s.append(svg('circle', { cx: 32, cy: 34, r: 7, fill: '#f5b942', stroke: '#2b2a33', 'stroke-width': 2.5 }));
  }],
  ['bird', '#22a06b', (s) => {
    s.append(svg('path', { d: 'M14 38 q10 -18 26 -14 q10 2 10 12 q0 12 -16 14 q-14 2 -20 -12 Z',
      fill: '#22a06b', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('circle', { cx: 40, cy: 30, r: 2.4, fill: '#2b2a33' }));
    s.append(svg('path', { d: 'M50 32 l9 3 l-9 3', fill: '#f5b942', stroke: '#2b2a33', 'stroke-width': 2 }));
  }],
  ['sun', '#f5b942', (s) => {
    s.append(svg('circle', { cx: 32, cy: 34, r: 14, fill: '#f5b942', stroke: '#2b2a33', 'stroke-width': 3 }));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      s.append(svg('line', { x1: 32 + Math.cos(a) * 19, y1: 34 + Math.sin(a) * 19,
        x2: 32 + Math.cos(a) * 26, y2: 34 + Math.sin(a) * 26, stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
  }],
  ['heart', '#e0457b', (s) => {
    s.append(svg('path', { d: 'M32 52 C 8 36 12 18 24 18 C 30 18 32 24 32 24 C 32 24 34 18 40 18 C 52 18 56 36 32 52 Z',
      fill: '#e0457b', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  }],
  ['boat', '#2d8fd5', (s) => {
    s.append(svg('path', { d: 'M12 40 h40 l-7 12 h-26 Z', fill: '#2d8fd5', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: 'M32 38 V14 l14 20 Z', fill: '#fff', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  }],
  ['kite', '#8b5cf6', (s) => {
    s.append(svg('path', { d: 'M32 10 L50 30 L32 52 L14 30 Z', fill: '#8b5cf6', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: 'M32 52 q6 6 0 10 q-6 4 0 8', fill: 'none', stroke: '#2b2a33', 'stroke-width': 2.4 }));
  }],
  ['pear', '#58a55c', (s) => {
    s.append(svg('path', { d: 'M32 20 q10 4 10 16 q0 16 -10 16 q-10 0 -10 -16 q0 -12 10 -16 Z',
      fill: '#9ac25c', stroke: '#2b2a33', 'stroke-width': 3 }));
    s.append(svg('path', { d: 'M32 20 v-8', stroke: '#58a55c', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }],
  ['snow', '#9ec9e8', (s) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      s.append(svg('line', { x1: 32, y1: 34, x2: 32 + Math.cos(a) * 20, y2: 34 + Math.sin(a) * 20,
        stroke: '#2d8fd5', 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
    }
    s.append(svg('circle', { cx: 32, cy: 34, r: 4, fill: '#fff', stroke: '#2d8fd5', 'stroke-width': 2.4 }));
  }],
  ['cup', '#ef6461', (s) => {
    s.append(svg('path', { d: 'M16 22 h28 v16 q0 10 -14 10 q-14 0 -14 -10 Z', fill: '#ef6461', stroke: '#2b2a33', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: 'M44 26 q10 0 10 7 q0 7 -10 7', fill: 'none', stroke: '#2b2a33', 'stroke-width': 3 }));
  }],
];

export const TOTAL = STICKERS.length;

/** Which sticker a finished task earns. Fixed by the day, never by luck. */
export function stickerIndex(day, n = 0) {
  let sum = n;
  for (const ch of String(day)) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return sum % TOTAL;
}

export function sticker(index, size = 54, locked = false) {
  const [name, colour, draw] = STICKERS[index % TOTAL];
  const s = svg('svg', { viewBox: '0 0 64 64', width: size, height: size,
    class: 'sticker-art' + (locked ? ' is-locked' : ''), role: 'img', 'aria-label': locked ? 'not yet' : name });
  if (locked) {
    s.append(svg('circle', { cx: 32, cy: 34, r: 20, fill: 'none', stroke: 'var(--line)', 'stroke-width': 3, 'stroke-dasharray': '5 5' }));
    return s;
  }
  draw(s);
  return s;
}

export function stickerName(index) {
  return STICKERS[index % TOTAL][0];
}
