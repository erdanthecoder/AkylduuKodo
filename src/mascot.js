// mascot.js — Ilbirs, a snow leopard cub, drawn properly.
//
// He is not a reward and he never scolds. He is there so the screen has a face
// on it, and so "have another go" comes from someone rather than from a box.

import { svg } from './ui.js';

const FUR = '#f6f1e9';
const FUR_DARK = '#ddd4c7';
const INK = '#2a2f3a';
const NOSE = '#f0849b';
const EAR = '#f6b6c4';

/** moods: hello · thinking · yes · oops · cheer */
export function mascot(mood = 'hello', size = 96) {
  const s = svg('svg', { viewBox: '0 0 120 120', width: size, height: size,
    class: `mascot is-${mood}`, role: 'img', 'aria-label': 'Ilbirs the snow leopard' });

  // ears, set back so the head reads round
  [-1, 1].forEach((dir) => {
    s.append(svg('path', {
      d: `M${60 + dir * 24} 40 L${60 + dir * 33} 15 L${60 + dir * 8} 27 Z`,
      fill: FUR, stroke: INK, 'stroke-width': 3.5, 'stroke-linejoin': 'round',
    }));
    s.append(svg('path', {
      d: `M${60 + dir * 23} 36 L${60 + dir * 29} 21 L${60 + dir * 13} 29 Z`,
      fill: EAR,
    }));
  });

  // head, with a soft cheek shadow so it is not a flat disc
  s.append(svg('ellipse', { cx: 60, cy: 64, rx: 37, ry: 33, fill: FUR, stroke: INK, 'stroke-width': 3.5 }));
  s.append(svg('ellipse', { cx: 60, cy: 72, rx: 30, ry: 22, fill: FUR_DARK, opacity: 0.3 }));
  s.append(svg('ellipse', { cx: 60, cy: 66, rx: 25, ry: 19, fill: FUR }));

  // rosettes: what makes him a snow leopard and not a cat
  [[33, 48, 4], [87, 48, 4], [28, 68, 3.4], [92, 68, 3.4], [40, 86, 3], [80, 86, 3]].forEach(([x, y, r]) => {
    s.append(svg('circle', { cx: x, cy: y, r, fill: 'none', stroke: INK, 'stroke-width': 1.8, opacity: 0.4 }));
    s.append(svg('circle', { cx: x, cy: y, r: r * 0.35, fill: INK, opacity: 0.25 }));
  });

  const eye = (cx) => {
    if (mood === 'yes' || mood === 'cheer') {
      return svg('path', { d: `M${cx - 8} 61 q8 -9 16 0`, fill: 'none', stroke: INK,
        'stroke-width': 4, 'stroke-linecap': 'round' });
    }
    const group = svg('g', {});
    group.append(svg('ellipse', { cx, cy: 61, rx: 6.5, ry: 7.2, fill: INK }));
    group.append(svg('circle', { cx: cx + 2.4, cy: 58.4, r: 2.4, fill: '#fff' }));
    group.append(svg('circle', { cx: cx - 2, cy: 63.5, r: 1.2, fill: '#fff', opacity: 0.7 }));
    return group;
  };
  s.append(eye(46));
  s.append(eye(74));

  if (mood === 'thinking' || mood === 'oops') {
    const lift = mood === 'oops' ? -6 : 1;
    s.append(svg('path', { d: `M36 49 q10 ${lift} 19 1`, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    s.append(svg('path', { d: `M84 49 q-10 ${lift} -19 1`, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }));
  }

  // muzzle, nose, mouth
  s.append(svg('ellipse', { cx: 60, cy: 80, rx: 16, ry: 11, fill: FUR }));
  s.append(svg('path', { d: 'M53 74 L67 74 L60 81 Z', fill: NOSE, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
  s.append(svg('path', { d: 'M60 81 v4', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
  const mouth = mood === 'oops' ? 'M50 90 q10 -6 20 0'
    : mood === 'thinking' ? 'M53 87 h14'
    : 'M48 84 q12 11 24 0';
  s.append(svg('path', { d: mouth, fill: mood === 'cheer' ? NOSE : 'none', stroke: INK,
    'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

  // whiskers
  [-1, 1].forEach((dir) => {
    [[76, -5], [80, 1]].forEach(([y, dy]) => {
      s.append(svg('path', {
        d: `M${60 + dir * 17} ${y} L${60 + dir * 36} ${y + dy}`,
        stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.55,
      }));
    });
  });

  return s;
}

/** What he says. Kept short, because a wall of words is not encouragement. */
export const SAYS = {
  hello: ['Ready when you are.', 'Let us have a go.', 'I will sit with you.'],
  yes: ['Yes!', 'That is it.', 'Good one.', 'Clever.'],
  oops: ['Nearly. Try again.', 'Have another go.', 'Not that one — try again.'],
  thinking: ['Look at it again.', 'Here is how it works.'],
  cheer: ['All finished!', 'Well done today.', 'That is the lot.'],
};

export function saysSomething(mood, n = 0) {
  const list = SAYS[mood] || SAYS.hello;
  return list[n % list.length];
}
