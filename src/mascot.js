// mascot.js — Ilbirs, a snow leopard cub, who sits with her while she works.
//
// He is not a reward and he never scolds. He is there so the screen has a face
// on it, and so "have another go" comes from someone rather than from a box.

import { svg } from './ui.js';

const FUR = '#f1ece2';
const DARK = '#2b2a33';
const NOSE = '#e0457b';

/** moods: hello · thinking · yes · oops · cheer */
export function mascot(mood = 'hello', size = 96) {
  const s = svg('svg', { viewBox: '0 0 100 100', width: size, height: size,
    class: `mascot is-${mood}`, role: 'img', 'aria-label': 'Ilbirs the snow leopard' });

  // ears
  s.append(svg('path', { d: 'M22 34 L16 12 L38 24 Z', fill: FUR, stroke: DARK, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  s.append(svg('path', { d: 'M78 34 L84 12 L62 24 Z', fill: FUR, stroke: DARK, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  s.append(svg('path', { d: 'M24 30 L21 19 L33 26 Z', fill: NOSE, opacity: 0.35 }));
  s.append(svg('path', { d: 'M76 30 L79 19 L67 26 Z', fill: NOSE, opacity: 0.35 }));

  // head
  s.append(svg('ellipse', { cx: 50, cy: 54, rx: 32, ry: 29, fill: FUR, stroke: DARK, 'stroke-width': 3.5 }));

  // the rosettes that make him a snow leopard and not a cat
  [[30, 40], [70, 40], [26, 58], [74, 58], [36, 72], [64, 72]].forEach(([x, y]) => {
    s.append(svg('circle', { cx: x, cy: y, r: 3.6, fill: 'none', stroke: DARK, 'stroke-width': 1.6, opacity: 0.45 }));
  });

  // eyes — the mood lives here
  if (mood === 'yes' || mood === 'cheer') {
    s.append(svg('path', { d: 'M33 50 q6 -7 12 0', fill: 'none', stroke: DARK, 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
    s.append(svg('path', { d: 'M55 50 q6 -7 12 0', fill: 'none', stroke: DARK, 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
  } else if (mood === 'oops') {
    s.append(svg('circle', { cx: 39, cy: 51, r: 4.6, fill: DARK }));
    s.append(svg('circle', { cx: 61, cy: 51, r: 4.6, fill: DARK }));
    s.append(svg('path', { d: 'M31 42 q8 -4 15 -1', fill: 'none', stroke: DARK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
    s.append(svg('path', { d: 'M69 42 q-8 -4 -15 -1', fill: 'none', stroke: DARK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
  } else {
    s.append(svg('circle', { cx: 39, cy: 51, r: 5.2, fill: DARK }));
    s.append(svg('circle', { cx: 61, cy: 51, r: 5.2, fill: DARK }));
    s.append(svg('circle', { cx: 40.8, cy: 49.2, r: 1.8, fill: '#fff' }));
    s.append(svg('circle', { cx: 62.8, cy: 49.2, r: 1.8, fill: '#fff' }));
    if (mood === 'thinking') {
      s.append(svg('path', { d: 'M30 41 q8 -3 15 1', fill: 'none', stroke: DARK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
    }
  }

  // nose and mouth
  s.append(svg('path', { d: 'M46 61 L54 61 L50 66 Z', fill: NOSE, stroke: DARK, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  const mouth = mood === 'oops'
    ? 'M42 74 q8 -5 16 0'
    : mood === 'thinking'
      ? 'M44 73 h12'
      : 'M40 70 q10 9 20 0';
  s.append(svg('path', { d: mouth, fill: 'none', stroke: DARK, 'stroke-width': 3, 'stroke-linecap': 'round' }));

  // whiskers
  [[-1, 64], [1, 64]].forEach(([dir, y]) => {
    s.append(svg('path', {
      d: `M${50 + dir * 16} ${y} L${50 + dir * 32} ${y - 4}`,
      stroke: DARK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6,
    }));
    s.append(svg('path', {
      d: `M${50 + dir * 16} ${y + 4} L${50 + dir * 32} ${y + 6}`,
      stroke: DARK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6,
    }));
  });

  return s;
}

/** What he says. Kept short, because a wall of words is not encouragement. */
export const SAYS = {
  hello: ['Ready when you are.', 'Let us have a go.', 'I will sit with you.'],
  yes: ['Yes!', 'That is it.', 'Good one.', 'Clever.'],
  oops: ['Nearly. Try again.', 'Have another go.', 'Not that one — try again.'],
  cheer: ['All finished!', 'Well done today.', 'That is the lot.'],
};

export function saysSomething(mood, n = 0) {
  const list = SAYS[mood] || SAYS.hello;
  return list[n % list.length];
}
