// blooks.js — the characters players pick.
//
// Every blook is the same square block with a darker base edge, so the set
// reads as one family and none of them look strange next to another. What
// makes each one itself is drawn on top of that block: ears, a face, a pattern,
// a hat. Flat colours, no outlines, big friendly eyes.
//
// One renderer draws them for the page (SVG) and for the games (a cached
// image the canvas can draw thousands of times a second).

import { svg } from './dom.js';

const W = '#ffffff';
const PUPIL = '#1d1a3a';
const PINK = '#ff8fae';

/* ------------------------------------------------------------ the parts */

function block(s, main, shade, { top = 24, rx = 20 } = {}) {
  // the shade colour is the whole block; the main colour sits on it slightly
  // shorter, leaving a thick bottom edge that makes it read as a solid thing
  s.append(svg('rect', { x: 14, y: top, width: 72, height: 90 - top, rx, fill: shade }));
  s.append(svg('rect', { x: 14, y: top, width: 72, height: 82 - top, rx, fill: main }));
  s.append(svg('rect', { x: 23, y: top + 7, width: 15, height: 6, rx: 3, fill: W, opacity: 0.32 }));
}

function eyes(s, { y = 52, gap = 12, r = 8.5, style = 'round', color = PUPIL } = {}) {
  for (const dx of [-gap, gap]) {
    const cx = 50 + dx;
    if (style === 'happy') {
      s.append(svg('path', { d: `M${cx - 6} ${y + 2} q6 -8 12 0`, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round' }));
      continue;
    }
    if (style === 'dot') {
      s.append(svg('circle', { cx, cy: y, r: 4.5, fill: color }));
      s.append(svg('circle', { cx: cx - 1.4, cy: y - 1.6, r: 1.4, fill: W }));
      continue;
    }
    if (style === 'screen') {
      s.append(svg('rect', { x: cx - 6, y: y - 5, width: 12, height: 10, rx: 3, fill: '#7dfcff' }));
      s.append(svg('rect', { x: cx - 3, y: y - 3, width: 4, height: 3, rx: 1, fill: W, opacity: 0.8 }));
      continue;
    }
    s.append(svg('circle', { cx, cy: y, r, fill: W }));
    s.append(svg('circle', { cx: cx + 1.2, cy: y + 1.2, r: r * 0.58, fill: color }));
    s.append(svg('circle', { cx: cx - 1, cy: y - 1.6, r: r * 0.22, fill: W }));
  }
}

function mouth(s, kind = 'smile', y = 66, color = PUPIL) {
  const stroke = { fill: 'none', stroke: color, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'smile') s.append(svg('path', { d: `M43 ${y} q7 6 14 0`, ...stroke }));
  if (kind === 'cat') s.append(svg('path', { d: `M42 ${y} q4 4 8 0 q4 4 8 0`, ...stroke }));
  if (kind === 'open') {
    s.append(svg('path', { d: `M42 ${y - 1} h16 q0 10 -8 10 q-8 0 -8 -10 Z`, fill: color }));
    s.append(svg('path', { d: `M45 ${y + 5} q5 4 10 0 v1 q-5 3 -10 0 Z`, fill: '#ff6f8f' }));
  }
  if (kind === 'flat') s.append(svg('path', { d: `M44 ${y + 1} h12`, ...stroke }));
  if (kind === 'grille') {
    s.append(svg('rect', { x: 40, y: y - 2, width: 20, height: 8, rx: 3, fill: '#3b3f5c' }));
    for (const x of [44, 48, 52, 56]) s.append(svg('path', { d: `M${x} ${y - 1} v6`, stroke: '#9aa2c8', 'stroke-width': 1.6 }));
  }
}

function cheeks(s, color = PINK, y = 62) {
  s.append(svg('ellipse', { cx: 27, cy: y, rx: 5.5, ry: 3.6, fill: color, opacity: 0.55 }));
  s.append(svg('ellipse', { cx: 73, cy: y, rx: 5.5, ry: 3.6, fill: color, opacity: 0.55 }));
}

function snout(s, color, nose = PUPIL, y = 64) {
  s.append(svg('ellipse', { cx: 50, cy: y, rx: 12, ry: 8.5, fill: color }));
  s.append(svg('ellipse', { cx: 50, cy: y - 3, rx: 4.6, ry: 3.2, fill: nose }));
}

function beak(s, color = '#ffb020', y = 61) {
  s.append(svg('path', { d: `M43 ${y} h14 l-7 9 Z`, fill: color, 'stroke-linejoin': 'round' }));
}

function ears(s, kind, main, inner) {
  if (kind === 'cat') {
    s.append(svg('path', { d: 'M17 34 L22 8 L42 26 Z', fill: main }));
    s.append(svg('path', { d: 'M83 34 L78 8 L58 26 Z', fill: main }));
    s.append(svg('path', { d: 'M23 28 L25 15 L35 25 Z', fill: inner }));
    s.append(svg('path', { d: 'M77 28 L75 15 L65 25 Z', fill: inner }));
  }
  if (kind === 'fox') {
    s.append(svg('path', { d: 'M15 36 L18 4 L44 26 Z', fill: main }));
    s.append(svg('path', { d: 'M85 36 L82 4 L56 26 Z', fill: main }));
    s.append(svg('path', { d: 'M21 28 L22 13 L35 25 Z', fill: inner }));
    s.append(svg('path', { d: 'M79 28 L78 13 L65 25 Z', fill: inner }));
  }
  if (kind === 'round') {
    s.append(svg('circle', { cx: 24, cy: 24, r: 11, fill: main }));
    s.append(svg('circle', { cx: 76, cy: 24, r: 11, fill: main }));
    s.append(svg('circle', { cx: 24, cy: 24, r: 5.5, fill: inner }));
    s.append(svg('circle', { cx: 76, cy: 24, r: 5.5, fill: inner }));
  }
  if (kind === 'big-round') {
    s.append(svg('circle', { cx: 21, cy: 25, r: 15, fill: main }));
    s.append(svg('circle', { cx: 79, cy: 25, r: 15, fill: main }));
    s.append(svg('circle', { cx: 21, cy: 25, r: 9, fill: inner }));
    s.append(svg('circle', { cx: 79, cy: 25, r: 9, fill: inner }));
  }
  if (kind === 'bunny') {
    // kept inside the frame: an ear that runs off the top is cut off flat
    s.append(svg('rect', { x: 25, y: 3, width: 15, height: 31, rx: 7.5, fill: main }));
    s.append(svg('rect', { x: 60, y: 3, width: 15, height: 31, rx: 7.5, fill: main }));
    s.append(svg('rect', { x: 29, y: 8, width: 7, height: 20, rx: 3.5, fill: inner }));
    s.append(svg('rect', { x: 64, y: 8, width: 7, height: 20, rx: 3.5, fill: inner }));
  }
  if (kind === 'pig') {
    s.append(svg('path', { d: 'M18 32 L22 14 L36 26 Z', fill: inner }));
    s.append(svg('path', { d: 'M82 32 L78 14 L64 26 Z', fill: inner }));
  }
}

function dogEars(s, color) {
  s.append(svg('rect', { x: 6, y: 28, width: 16, height: 34, rx: 8, fill: color, transform: 'rotate(12 14 45)' }));
  s.append(svg('rect', { x: 78, y: 28, width: 16, height: 34, rx: 8, fill: color, transform: 'rotate(-12 86 45)' }));
}

/* ------------------------------------------------------------ the blooks */

/* Each entry draws one blook onto an empty 100x100 SVG. */
const DRAW = {
  dog(s) {
    block(s, '#d9a066', '#b07a43');
    dogEars(s, '#8a5a2b');
    s.append(svg('ellipse', { cx: 62, cy: 50, rx: 12, ry: 11, fill: '#f2d2a9' }));
    eyes(s);
    snout(s, '#f2d2a9');
    mouth(s, 'smile', 71);
  },
  cat(s) {
    ears(s, 'cat', '#ffb34d', '#ff8fae');
    block(s, '#ffb34d', '#e08a1e');
    s.append(svg('path', { d: 'M48 26 h4 v10 h-4 Z M36 26 h4 v7 h-4 Z M60 26 h4 v7 h-4 Z', fill: '#e08a1e' }));
    eyes(s);
    s.append(svg('path', { d: 'M47 60 h6 l-3 3.5 Z', fill: '#ff6f8f' }));
    mouth(s, 'cat', 65);
    cheeks(s);
  },
  bunny(s) {
    ears(s, 'bunny', '#f1ecf7', '#ffc2d4');
    block(s, '#f1ecf7', '#c9c0da');
    eyes(s);
    s.append(svg('path', { d: 'M47 60 h6 l-3 3.5 Z', fill: '#ff6f8f' }));
    s.append(svg('rect', { x: 46.5, y: 66, width: 7, height: 6, rx: 1.5, fill: W }));
    mouth(s, 'cat', 64);
    cheeks(s);
  },
  bear(s) {
    ears(s, 'round', '#9a6a43', '#c99a6f');
    block(s, '#9a6a43', '#734a29');
    eyes(s, { style: 'dot' });
    snout(s, '#d8b48c');
    mouth(s, 'smile', 70);
  },
  panda(s) {
    ears(s, 'round', '#2c2a3a', '#2c2a3a');
    block(s, '#f4f3f8', '#cfcde0');
    s.append(svg('ellipse', { cx: 37, cy: 52, rx: 10, ry: 12, fill: '#2c2a3a', transform: 'rotate(-18 37 52)' }));
    s.append(svg('ellipse', { cx: 63, cy: 52, rx: 10, ry: 12, fill: '#2c2a3a', transform: 'rotate(18 63 52)' }));
    eyes(s, { r: 6.5, color: '#2c2a3a' });
    s.append(svg('ellipse', { cx: 50, cy: 63, rx: 4.6, ry: 3.2, fill: '#2c2a3a' }));
    mouth(s, 'cat', 67);
  },
  fox(s) {
    ears(s, 'fox', '#ff7a2f', '#2c2a3a');
    block(s, '#ff7a2f', '#d4561a');
    s.append(svg('path', { d: 'M14 60 Q30 58 50 74 Q70 58 86 60 V70 Q86 82 74 82 H26 Q14 82 14 70 Z', fill: W }));
    eyes(s, { y: 50 });
    s.append(svg('ellipse', { cx: 50, cy: 64, rx: 4.4, ry: 3.2, fill: PUPIL }));
  },
  pig(s) {
    ears(s, 'pig', '#ffb3c8', '#ff8fb0');
    block(s, '#ffb3c8', '#ec86a5');
    eyes(s, { y: 48, style: 'dot' });
    s.append(svg('ellipse', { cx: 50, cy: 63, rx: 12, ry: 8.5, fill: '#ff8fb0' }));
    s.append(svg('ellipse', { cx: 45.5, cy: 63, rx: 2.4, ry: 3.4, fill: '#c95b7d' }));
    s.append(svg('ellipse', { cx: 54.5, cy: 63, rx: 2.4, ry: 3.4, fill: '#c95b7d' }));
  },
  frog(s) {
    s.append(svg('circle', { cx: 32, cy: 26, r: 14, fill: '#4fcf6a' }));
    s.append(svg('circle', { cx: 68, cy: 26, r: 14, fill: '#4fcf6a' }));
    block(s, '#4fcf6a', '#2fa04a', { top: 28 });
    eyes(s, { y: 25, gap: 18, r: 9 });
    s.append(svg('path', { d: 'M30 60 q20 16 40 0', fill: 'none', stroke: '#1f6e33', 'stroke-width': 3.6, 'stroke-linecap': 'round' }));
    cheeks(s, '#ff8fae', 58);
  },
  penguin(s) {
    block(s, '#2c3354', '#1b2038');
    s.append(svg('path', { d: 'M24 36 Q50 26 76 36 Q82 60 70 80 H30 Q18 60 24 36 Z', fill: W }));
    eyes(s, { y: 50 });
    beak(s, '#ffae2b', 60);
    cheeks(s, PINK, 64);
  },
  owl(s) {
    s.append(svg('path', { d: 'M16 30 L20 10 L36 26 Z M84 30 L80 10 L64 26 Z', fill: '#8a5a3c' }));
    block(s, '#a8714a', '#7d4f2e');
    s.append(svg('circle', { cx: 37, cy: 48, r: 13, fill: '#f6e3c5' }));
    s.append(svg('circle', { cx: 63, cy: 48, r: 13, fill: '#f6e3c5' }));
    eyes(s, { y: 48, gap: 13, r: 9 });
    beak(s, '#ffae2b', 59);
    s.append(svg('path', { d: 'M34 72 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0', fill: 'none', stroke: '#7d4f2e', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  },
  mouse(s) {
    ears(s, 'big-round', '#b9b6cc', '#ffb7cb');
    block(s, '#b9b6cc', '#8f8ba8');
    eyes(s, { style: 'dot', y: 50 });
    s.append(svg('ellipse', { cx: 50, cy: 61, rx: 4, ry: 3, fill: '#ff6f8f' }));
    s.append(svg('path', { d: 'M30 62 h-14 M30 66 h-13 M70 62 h14 M70 66 h13', stroke: PUPIL, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.5 }));
    mouth(s, 'cat', 65);
  },
  tiger(s) {
    ears(s, 'round', '#ff9d2e', '#fff1dc');
    block(s, '#ff9d2e', '#d9751a');
    for (const [x, dir] of [[18, 1], [82, -1]]) {
      s.append(svg('path', { d: `M${x} 46 l${dir * 10} 3 l${-dir * 10} 3 Z M${x} 58 l${dir * 9} 3 l${-dir * 9} 3 Z`, fill: '#2c2a3a' }));
    }
    s.append(svg('path', { d: 'M44 24 l3 8 h6 l3 -8 Z', fill: '#2c2a3a' }));
    s.append(svg('ellipse', { cx: 50, cy: 66, rx: 14, ry: 9, fill: '#fff1dc' }));
    eyes(s, { y: 50 });
    s.append(svg('path', { d: 'M46 61 h8 l-4 4 Z', fill: '#2c2a3a' }));
    mouth(s, 'cat', 67);
  },
  koala(s) {
    ears(s, 'big-round', '#9fa4b8', '#e6e8f0');
    block(s, '#9fa4b8', '#767b92');
    eyes(s, { style: 'dot', y: 50 });
    s.append(svg('ellipse', { cx: 50, cy: 62, rx: 7.5, ry: 9.5, fill: '#3d3b52' }));
    cheeks(s);
  },
  chick(s) {
    s.append(svg('path', { d: 'M46 24 q-2 -12 6 -14 q-2 6 4 14 Z', fill: '#ffc21f' }));
    block(s, '#ffde3f', '#f0b400');
    eyes(s, { y: 50 });
    beak(s, '#ff8a1f', 59);
    cheeks(s, '#ff9f6b', 62);
  },
  cow(s) {
    s.append(svg('path', { d: 'M20 30 q-8 -14 -2 -20 q6 8 14 14 Z M80 30 q8 -14 2 -20 q-6 8 -14 14 Z', fill: '#f2e3c4' }));
    block(s, '#f7f5fb', '#d3cfe2');
    // spots on the edges of the block, clear of the face
    s.append(svg('path', { d: 'M14 54 q10 -4 13 6 q-2 10 -13 8 Z', fill: '#2c2a3a' }));
    s.append(svg('path', { d: 'M86 30 q-12 -2 -14 6 q2 8 14 6 Z', fill: '#2c2a3a' }));
    eyes(s, { y: 48, style: 'dot' });
    s.append(svg('rect', { x: 34, y: 58, width: 32, height: 18, rx: 9, fill: '#ffb3c8' }));
    s.append(svg('ellipse', { cx: 43, cy: 67, rx: 2.6, ry: 3.4, fill: '#c95b7d' }));
    s.append(svg('ellipse', { cx: 57, cy: 67, rx: 2.6, ry: 3.4, fill: '#c95b7d' }));
  },
  lion(s) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      s.append(svg('circle', { cx: 50 + Math.cos(a) * 36, cy: 55 + Math.sin(a) * 34, r: 13, fill: '#c9701e' }));
    }
    block(s, '#ffbe4a', '#e5952a');
    ears(s, 'round', '#ffbe4a', '#e5952a');
    eyes(s, { y: 50 });
    snout(s, '#ffe2a8', '#7a3f12', 64);
    mouth(s, 'smile', 71);
  },
  yeti(s) {
    block(s, '#eef3ff', '#c3cdea');
    s.append(svg('rect', { x: 26, y: 38, width: 48, height: 38, rx: 16, fill: '#8fb3ff' }));
    s.append(svg('path', { d: 'M24 26 q8 -8 14 0 q6 -8 12 0 q6 -8 12 0 q6 -8 14 0', fill: 'none', stroke: '#eef3ff', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    eyes(s, { y: 50 });
    mouth(s, 'open', 63);
  },

  /* food */
  toast(s) {
    s.append(svg('circle', { cx: 30, cy: 32, r: 16, fill: '#c98a4a' }));
    s.append(svg('circle', { cx: 70, cy: 32, r: 16, fill: '#c98a4a' }));
    block(s, '#c98a4a', '#a26a2f', { top: 30 });
    s.append(svg('circle', { cx: 30, cy: 34, r: 11, fill: '#f6d9a6' }));
    s.append(svg('circle', { cx: 70, cy: 34, r: 11, fill: '#f6d9a6' }));
    s.append(svg('rect', { x: 20, y: 34, width: 60, height: 42, rx: 10, fill: '#f6d9a6' }));
    eyes(s, { y: 52 });
    mouth(s, 'smile', 64);
    cheeks(s, '#ff9f6b', 60);
  },
  cupcake(s) {
    s.append(svg('rect', { x: 18, y: 54, width: 64, height: 36, rx: 10, fill: '#3fb6ff' }));
    for (const x of [26, 38, 50, 62, 74]) s.append(svg('rect', { x: x - 2, y: 56, width: 4, height: 30, rx: 2, fill: '#1e8fd6' }));
    s.append(svg('path', { d: 'M12 56 Q10 32 30 30 Q34 14 50 16 Q66 14 70 30 Q90 32 88 56 Z', fill: '#ff8fbd' }));
    s.append(svg('circle', { cx: 50, cy: 16, r: 7, fill: '#ff4772' }));
    for (const [x, y, c] of [[30, 40, '#ffe14d'], [64, 36, '#6ee7ff'], [44, 30, '#b6f06a'], [74, 46, '#ffe14d'], [24, 50, '#b6f06a']]) {
      s.append(svg('rect', { x, y, width: 6, height: 2.6, rx: 1.3, fill: c, transform: `rotate(${(x * 7) % 60 - 30} ${x} ${y})` }));
    }
    eyes(s, { y: 66, r: 7 });
    mouth(s, 'smile', 78);
  },
  avocado(s) {
    block(s, '#5f9c35', '#3f7420');
    s.append(svg('rect', { x: 22, y: 31, width: 56, height: 46, rx: 18, fill: '#d6f08a' }));
    s.append(svg('circle', { cx: 50, cy: 64, r: 11, fill: '#a76a3b' }));
    s.append(svg('circle', { cx: 46, cy: 60, r: 3, fill: W, opacity: 0.35 }));
    eyes(s, { y: 44, r: 7.5 });
    mouth(s, 'smile', 51);
  },
  watermelon(s) {
    block(s, '#3bbf55', '#228a38');
    s.append(svg('rect', { x: 20, y: 30, width: 60, height: 48, rx: 15, fill: '#ff5c7a' }));
    for (const [x, y] of [[30, 66], [42, 72], [58, 72], [70, 66]]) s.append(svg('ellipse', { cx: x, cy: y, rx: 2, ry: 3.2, fill: '#2c2a3a' }));
    eyes(s, { y: 48 });
    mouth(s, 'smile', 58);
  },
  cookie(s) {
    block(s, '#d99a52', '#b0742f');
    for (const [x, y, r] of [[28, 36, 4], [70, 34, 3.5], [24, 70, 3.5], [74, 66, 4.5], [50, 76, 3], [36, 30, 2.5]]) {
      s.append(svg('circle', { cx: x, cy: y, r, fill: '#5a3418' }));
    }
    eyes(s, { y: 52 });
    mouth(s, 'smile', 64);
    cheeks(s, '#ff9f6b', 60);
  },

  /* space and fantasy */
  robot(s) {
    s.append(svg('path', { d: 'M50 24 V10', stroke: '#9aa2c8', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    s.append(svg('circle', { cx: 50, cy: 9, r: 6, fill: '#ff4772' }));
    s.append(svg('rect', { x: 6, y: 46, width: 10, height: 18, rx: 4, fill: '#9aa2c8' }));
    s.append(svg('rect', { x: 84, y: 46, width: 10, height: 18, rx: 4, fill: '#9aa2c8' }));
    block(s, '#c3c9e6', '#8f97be');
    s.append(svg('rect', { x: 24, y: 36, width: 52, height: 40, rx: 12, fill: '#2b2f4a' }));
    eyes(s, { y: 50, style: 'screen', gap: 12 });
    mouth(s, 'grille', 66);
  },
  alien(s) {
    for (const x of [34, 66]) {
      s.append(svg('path', { d: `M${x} 26 L${x + (x < 50 ? -8 : 8)} 8`, stroke: '#7cf26a', 'stroke-width': 4, 'stroke-linecap': 'round' }));
      s.append(svg('circle', { cx: x + (x < 50 ? -8 : 8), cy: 7, r: 5.5, fill: '#e2ff6b' }));
    }
    block(s, '#7cf26a', '#45c43a');
    s.append(svg('ellipse', { cx: 50, cy: 50, rx: 15, ry: 13, fill: W }));
    s.append(svg('ellipse', { cx: 51.5, cy: 51.5, rx: 8, ry: 8, fill: PUPIL }));
    s.append(svg('circle', { cx: 47.5, cy: 47, r: 3, fill: W }));
    mouth(s, 'smile', 69);
  },
  astronaut(s) {
    block(s, '#f2f4fb', '#c3c8de');
    s.append(svg('rect', { x: 22, y: 32, width: 56, height: 40, rx: 16, fill: '#1f2b5c' }));
    s.append(svg('path', { d: 'M30 40 q6 -4 12 -2', stroke: '#9fc0ff', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }));
    eyes(s, { y: 52, gap: 11, r: 7 });
    mouth(s, 'smile', 63, '#ffffff');
    s.append(svg('rect', { x: 40, y: 78, width: 20, height: 6, rx: 3, fill: '#ff4772' }));
  },
  ghost(s) {
    s.append(svg('path', { d: 'M14 46 Q14 20 50 20 Q86 20 86 46 V88 l-9 -7 -9 7 -9 -7 -9 7 -9 -7 -9 7 -9 -7 -9 7 Z', fill: '#e9e6ff' }));
    s.append(svg('rect', { x: 23, y: 30, width: 15, height: 6, rx: 3, fill: W, opacity: 0.6 }));
    eyes(s, { y: 50, style: 'dot', color: '#4a3f8c' });
    s.append(svg('ellipse', { cx: 50, cy: 64, rx: 5, ry: 6.5, fill: '#4a3f8c' }));
    cheeks(s, '#c9b6ff', 60);
  },
  slime(s) {
    s.append(svg('path', { d: 'M14 50 Q14 20 50 18 Q86 20 86 50 V82 Q86 90 78 90 H22 Q14 90 14 82 Z', fill: '#2bd9b0' }));
    s.append(svg('path', { d: 'M14 74 Q14 82 22 82 H78 Q86 82 86 74 V82 Q86 90 78 90 H22 Q14 90 14 82 Z', fill: '#16a885' }));
    s.append(svg('path', { d: 'M26 82 v6 a3 3 0 0 0 6 0 v-6 Z M64 82 v9 a3 3 0 0 0 6 0 v-9 Z', fill: '#16a885' }));
    s.append(svg('ellipse', { cx: 34, cy: 34, rx: 9, ry: 5, fill: W, opacity: 0.4 }));
    eyes(s, { y: 52 });
    mouth(s, 'open', 63);
  },
  dragon(s) {
    s.append(svg('path', { d: 'M28 26 L24 8 L40 22 Z M72 26 L76 8 L60 22 Z', fill: '#ffd34d' }));
    s.append(svg('path', { d: 'M4 50 L16 38 L16 64 Z M96 50 L84 38 L84 64 Z', fill: '#2fa060' }));
    block(s, '#46c27a', '#2a9356');
    s.append(svg('rect', { x: 34, y: 60, width: 32, height: 22, rx: 8, fill: '#c9f08a' }));
    s.append(svg('path', { d: 'M34 68 h32 M34 75 h32', stroke: '#a3d65f', 'stroke-width': 2 }));
    eyes(s, { y: 46 });
    s.append(svg('path', { d: 'M44 56 q6 4 12 0', fill: 'none', stroke: PUPIL, 'stroke-width': 3, 'stroke-linecap': 'round' }));
  },
  unicorn(s) {
    s.append(svg('path', { d: 'M50 4 L44 28 H56 Z', fill: '#ffd34d' }));
    s.append(svg('path', { d: 'M46 14 l8 -2 M45 20 l10 -2', stroke: '#e5a800', 'stroke-width': 2 }));
    block(s, '#fbf6ff', '#d8cdf0');
    for (const [i, c] of ['#ff6fb5', '#ffb84d', '#6fd6ff', '#9b7bff'].entries()) {
      s.append(svg('rect', { x: 72 + (i % 2) * 4, y: 24 + i * 10, width: 12, height: 12, rx: 6, fill: c }));
    }
    eyes(s, { y: 52, style: 'happy' });
    mouth(s, 'smile', 64);
    cheeks(s);
  },
  /* winter: the limited Christmas pack */
  snowman(s) {
    block(s, '#f7fbff', '#cfdcf0');
    // top hat
    s.append(svg('rect', { x: 28, y: 18, width: 44, height: 7, rx: 3, fill: '#22223a' }));
    s.append(svg('rect', { x: 36, y: 2, width: 28, height: 18, rx: 4, fill: '#22223a' }));
    s.append(svg('rect', { x: 36, y: 13, width: 28, height: 5, fill: '#e2384d' }));
    s.append(svg('circle', { cx: 39, cy: 48, r: 4.5, fill: '#22223a' }));
    s.append(svg('circle', { cx: 61, cy: 48, r: 4.5, fill: '#22223a' }));
    s.append(svg('path', { d: 'M49 54 L66 58 L49 61 Z', fill: '#ff8a2a' }));
    for (const x of [41, 47, 53, 59]) s.append(svg('circle', { cx: x, cy: 67 + Math.abs(50 - x) * 0.18, r: 1.8, fill: '#22223a' }));
    // scarf
    s.append(svg('rect', { x: 14, y: 72, width: 72, height: 8, fill: '#e2384d' }));
    s.append(svg('rect', { x: 62, y: 72, width: 9, height: 18, rx: 2, fill: '#c1263a' }));
    s.append(svg('path', { d: 'M20 76 h44', stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '4 4', opacity: 0.7 }));
  },
  gingerbread(s) {
    s.append(svg('circle', { cx: 24, cy: 30, r: 9, fill: '#c97b3d' }));
    s.append(svg('circle', { cx: 76, cy: 30, r: 9, fill: '#c97b3d' }));
    block(s, '#c97b3d', '#a35b24');
    s.append(svg('path', { d: 'M18 33 q4 -5 8 0 q4 5 8 0 q4 -5 8 0 q4 5 8 0 q4 -5 8 0 q4 5 8 0 q4 -5 8 0 q4 5 8 0 q2 -2.5 4 0', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    eyes(s, { style: 'happy', y: 50 });
    mouth(s, 'smile', 60);
    cheeks(s, '#ff7a8a', 57);
    for (const [y, c] of [[69, '#e2384d'], [77, '#19c37d']]) s.append(svg('circle', { cx: 50, cy: y, r: 3.2, fill: c }));
  },
  reindeer(s) {
    const ant = { fill: 'none', stroke: '#7a4a24', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    s.append(svg('path', { d: 'M30 26 L22 8 M25 15 L14 12 M23 10 L28 3', ...ant }));
    s.append(svg('path', { d: 'M70 26 L78 8 M75 15 L86 12 M77 10 L72 3', ...ant }));
    ears(s, 'cat', '#a8693a', '#e8b98f');
    block(s, '#a8693a', '#7f4c25');
    s.append(svg('ellipse', { cx: 50, cy: 66, rx: 15, ry: 10, fill: '#e8c9a3' }));
    eyes(s, { y: 48 });
    s.append(svg('circle', { cx: 50, cy: 61, r: 6, fill: '#ff2b44' }));
    s.append(svg('circle', { cx: 48, cy: 59, r: 1.8, fill: '#fff', opacity: 0.8 }));
    mouth(s, 'smile', 71);
  },
  elf(s) {
    // pointed hat with a bell, pointy ears
    s.append(svg('path', { d: 'M8 46 L18 36 L20 56 Z M92 46 L82 36 L80 56 Z', fill: '#ffd2b0' }));
    block(s, '#ffd2b0', '#e8a982', { top: 30 });
    s.append(svg('path', { d: 'M14 36 Q30 2 74 6 Q60 14 86 36 Z', fill: '#19a35b' }));
    s.append(svg('rect', { x: 12, y: 30, width: 76, height: 9, rx: 4, fill: '#e2384d' }));
    s.append(svg('circle', { cx: 76, cy: 6, r: 5, fill: '#ffcd1f' }));
    eyes(s, { y: 54, r: 7.5 });
    mouth(s, 'smile', 68);
    cheeks(s, '#ff8fae', 64);
  },
  santa(s) {
    // red hat with white trim and bobble, white beard
    s.append(svg('path', { d: 'M18 30 Q34 2 70 8 Q84 12 84 30 Z', fill: '#e2384d' }));
    s.append(svg('circle', { cx: 84, cy: 14, r: 7, fill: '#fff' }));
    block(s, '#ffd2b0', '#e8a982', { top: 30 });
    s.append(svg('rect', { x: 12, y: 26, width: 76, height: 11, rx: 5.5, fill: '#fff' }));
    s.append(svg('path', { d: 'M14 54 Q14 92 50 92 Q86 92 86 54 Q78 62 66 60 Q58 66 50 64 Q42 66 34 60 Q22 62 14 54 Z', fill: '#fff' }));
    s.append(svg('path', { d: 'M36 60 Q50 54 64 60 Q50 66 36 60 Z', fill: '#f1f1f6' }));
    eyes(s, { y: 47, r: 6.5, style: 'happy' });
    s.append(svg('circle', { cx: 50, cy: 54, r: 4.5, fill: '#ff8f8f' }));
    mouth(s, 'smile', 70);
  },

  bot2(s) {
    // "Zap": the house mascot, a little spark in a box
    block(s, '#6b4cff', '#4a2fd6');
    eyes(s, { y: 50 });
    mouth(s, 'open', 63);
    s.append(svg('path', { d: 'M54 4 L40 26 h9 l-3 14 L62 18 H52 Z', fill: '#ffcd1f' }));
    cheeks(s, '#ff8fd0');
  },
};

/** The catalogue, grouped the way the picker shows them. */
export const BLOOKS = [
  { id: 'dog', name: 'Pup', set: 'Pets' },
  { id: 'cat', name: 'Kit', set: 'Pets' },
  { id: 'bunny', name: 'Hop', set: 'Pets' },
  { id: 'mouse', name: 'Squeak', set: 'Pets' },
  { id: 'chick', name: 'Peep', set: 'Pets' },
  { id: 'pig', name: 'Oink', set: 'Farm' },
  { id: 'cow', name: 'Moo', set: 'Farm' },
  { id: 'frog', name: 'Ribbit', set: 'Farm' },
  { id: 'bear', name: 'Bruno', set: 'Wild' },
  { id: 'panda', name: 'Bamboo', set: 'Wild' },
  { id: 'fox', name: 'Rusty', set: 'Wild' },
  { id: 'tiger', name: 'Stripes', set: 'Wild' },
  { id: 'lion', name: 'Mane', set: 'Wild' },
  { id: 'koala', name: 'Gum', set: 'Wild' },
  { id: 'owl', name: 'Hoot', set: 'Wild' },
  { id: 'penguin', name: 'Waddle', set: 'Wild' },
  { id: 'yeti', name: 'Frost', set: 'Wild' },
  { id: 'toast', name: 'Toasty', set: 'Snacks' },
  { id: 'cookie', name: 'Crumbs', set: 'Snacks' },
  { id: 'cupcake', name: 'Sprinkle', set: 'Snacks' },
  { id: 'avocado', name: 'Avo', set: 'Snacks' },
  { id: 'watermelon', name: 'Melon', set: 'Snacks' },
  { id: 'robot', name: 'Bolt', set: 'Space' },
  { id: 'alien', name: 'Zorp', set: 'Space' },
  { id: 'astronaut', name: 'Cosmo', set: 'Space' },
  { id: 'ghost', name: 'Boo', set: 'Magic' },
  { id: 'slime', name: 'Goo', set: 'Magic' },
  { id: 'dragon', name: 'Ember', set: 'Magic' },
  { id: 'unicorn', name: 'Glimmer', set: 'Magic' },
  { id: 'bot2', name: 'Zap', set: 'Magic' },
  { id: 'snowman', name: 'Snowy', set: 'Winter', limited: true },
  { id: 'gingerbread', name: 'Ginger', set: 'Winter', limited: true },
  { id: 'reindeer', name: 'Jingle', set: 'Winter', limited: true },
  { id: 'elf', name: 'Twinkle', set: 'Winter', limited: true },
  { id: 'santa', name: 'Santa', set: 'Winter', limited: true },
];

/* ---------------------------------------------------------------- rarity */

// Rarer blooks come out of boxes less often. Legendary are the best: the
// rarest, worth the most, and they shine.
export const RARITIES = [
  { id: 'common', name: 'Common', colour: '#9aa3c0', chance: 0.55, refund: 2 },
  { id: 'uncommon', name: 'Uncommon', colour: '#19c37d', chance: 0.27, refund: 5 },
  { id: 'rare', name: 'Rare', colour: '#2f9bff', chance: 0.12, refund: 15 },
  { id: 'epic', name: 'Epic', colour: '#a560ff', chance: 0.05, refund: 40 },
  { id: 'legendary', name: 'Legendary', colour: '#ffb800', chance: 0.01, refund: 150 },
];
export const RARITY_BY_ID = new Map(RARITIES.map((r) => [r.id, r]));

const RARITY_OF = {
  common: ['dog', 'cat', 'bunny', 'mouse', 'chick', 'pig', 'cow', 'frog', 'toast', 'cookie', 'avocado', 'watermelon'],
  uncommon: ['bear', 'panda', 'fox', 'koala', 'owl', 'penguin', 'cupcake', 'slime'],
  rare: ['tiger', 'lion', 'robot', 'ghost', 'alien'],
  epic: ['yeti', 'astronaut', 'bot2'],
  legendary: ['dragon', 'unicorn'],
};
// the winter pack has its own spread, from a common snowman to a legendary Santa
const WINTER_RARITY = { snowman: 'common', gingerbread: 'uncommon', reindeer: 'rare', elf: 'epic', santa: 'legendary' };
for (const [id, r] of Object.entries(WINTER_RARITY)) RARITY_OF[r].push(id);
for (const [r, ids] of Object.entries(RARITY_OF)) for (const id of ids) BLOOKS.find((b) => b.id === id).rarity = r;

/** Everyone owns the commons from the start. */
export const LIMITED = BLOOKS.filter((b) => b.limited).map((b) => b.id);
/** Everything that is not a limited edition. */
export const REGULAR = BLOOKS.filter((b) => !b.limited).map((b) => b.id);
export const STARTERS = RARITY_OF.common.filter((id) => !LIMITED.includes(id));

export function rarityOf(id) {
  if (isCustom(id)) return RARITY_BY_ID.get('legendary');
  return RARITY_BY_ID.get(BY_ID.get(id)?.rarity || 'common');
}

/**
 * One draw from a box: first a rarity by its chance, then a blook of that
 * rarity from the box's own pool. Rarities the pool lacks are left out and
 * the others keep their proportions.
 */
export function drawFromBox(rand = Math.random, pool = REGULAR) {
  const tiers = RARITIES.filter((r) => pool.some((id) => rarityOf(id).id === r.id));
  const total = tiers.reduce((n, r) => n + r.chance, 0);
  let roll = rand() * total;
  let tier = tiers[tiers.length - 1];
  for (const r of tiers) { if (roll < r.chance) { tier = r; break; } roll -= r.chance; }
  const options = pool.filter((id) => rarityOf(id).id === tier.id);
  return options[Math.floor(rand() * options.length) % options.length];
}

/* ---------------------------------------------------------------- custom */

// A custom blook is described by its id: "c-" and five digits, one per part.
// Short enough to travel inside a game like any other blook id.
export const CUSTOM_PARTS = {
  body: [['#6b4cff', '#4a2fd6'], ['#ff4772', '#c92651'], ['#2f9bff', '#1a6fcc'], ['#12c9a6', '#0a9479'],
    ['#ffcd1f', '#d9a400'], ['#ff8a2a', '#cf6510'], ['#a560ff', '#7a36d6'], ['#2e2675', '#17133f'],
    ['#f2f0ff', '#cfc9ee'], ['#ff8fd0', '#d65aa6']],
  eyes: ['round', 'happy', 'dot', 'screen', 'sleepy', 'star'],
  mouth: ['smile', 'open', 'cat', 'flat', 'grille', 'fangs'],
  top: ['none', 'cat', 'round', 'bunny', 'antenna', 'crown', 'horns', 'halo', 'cap'],
  extra: ['none', 'cheeks', 'freckles', 'spots', 'stripe', 'glasses'],
};
export const PART_NAMES = { body: 'Colour', eyes: 'Eyes', mouth: 'Mouth', top: 'On top', extra: 'Extra' };
const PART_KEYS = ['body', 'eyes', 'mouth', 'top', 'extra'];

export function isCustom(id) {
  if (!/^c-[0-9]{5}$/.test(String(id))) return false;
  return PART_KEYS.every((k, i) => Number(id[2 + i]) < CUSTOM_PARTS[k].length);
}

export const customId = (parts) => `c-${PART_KEYS.map((k) => Math.max(0, Math.min(CUSTOM_PARTS[k].length - 1, parts[k] || 0))).join('')}`;
export const customParts = (id) => Object.fromEntries(PART_KEYS.map((k, i) => [k, Number(String(id)[2 + i]) || 0]));

function drawCustom(s, id) {
  const p = customParts(id);
  const [main, shade] = CUSTOM_PARTS.body[p.body];
  const top = CUSTOM_PARTS.top[p.top];
  if (top === 'cat') ears(s, 'cat', main, PINK);
  if (top === 'round') ears(s, 'round', main, shade);
  if (top === 'bunny') ears(s, 'bunny', main, PINK);
  if (top === 'horns') {
    s.append(svg('path', { d: 'M22 30 Q14 12 26 6 Q24 18 34 26 Z', fill: '#fff4d6' }));
    s.append(svg('path', { d: 'M78 30 Q86 12 74 6 Q76 18 66 26 Z', fill: '#fff4d6' }));
  }
  if (top === 'antenna') {
    s.append(svg('path', { d: 'M50 24 V8', stroke: shade, 'stroke-width': 4, 'stroke-linecap': 'round' }));
    s.append(svg('circle', { cx: 50, cy: 7, r: 5, fill: '#ffcd1f' }));
  }
  if (top === 'halo') s.append(svg('ellipse', { cx: 50, cy: 11, rx: 20, ry: 5, fill: 'none', stroke: '#ffcd1f', 'stroke-width': 4 }));
  block(s, main, shade);
  if (top === 'crown') s.append(svg('path', { d: 'M32 26 L30 8 L41 17 L50 5 L59 17 L70 8 L68 26 Z', fill: '#ffcd1f', stroke: '#d9a400', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  if (top === 'cap') {
    s.append(svg('path', { d: 'M22 30 Q22 12 50 12 Q78 12 78 30 Z', fill: '#ff4772' }));
    s.append(svg('rect', { x: 50, y: 25, width: 34, height: 7, rx: 3.5, fill: '#c92651' }));
  }
  const extra = CUSTOM_PARTS.extra[p.extra];
  if (extra === 'spots') for (const [x, y, r] of [[28, 40, 5], [72, 74, 6], [70, 38, 3.5], [30, 74, 3.5]]) s.append(svg('circle', { cx: x, cy: y, r, fill: shade, opacity: 0.6 }));
  if (extra === 'stripe') s.append(svg('rect', { x: 14, y: 70, width: 72, height: 6, fill: shade, opacity: 0.7 }));
  const look = CUSTOM_PARTS.eyes[p.eyes];
  if (look === 'sleepy') {
    for (const cx of [38, 62]) s.append(svg('path', { d: `M${cx - 7} 52 q7 6 14 0`, fill: 'none', stroke: PUPIL, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  } else if (look === 'star') {
    for (const cx of [38, 62]) s.append(svg('path', { d: `M${cx} 44 l2.6 5.4 6 .8 -4.3 4.1 1 5.8 -5.3 -2.8 -5.3 2.8 1 -5.8 -4.3 -4.1 6 -.8 Z`, fill: '#ffcd1f', stroke: PUPIL, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
  } else eyes(s, { style: look });
  if (extra === 'glasses') {
    for (const cx of [38, 62]) s.append(svg('circle', { cx, cy: 52, r: 11, fill: 'none', stroke: PUPIL, 'stroke-width': 3 }));
    s.append(svg('path', { d: 'M49 52 h2', stroke: PUPIL, 'stroke-width': 3 }));
  }
  const m = CUSTOM_PARTS.mouth[p.mouth];
  if (m === 'fangs') {
    mouth(s, 'smile', 66);
    s.append(svg('path', { d: 'M45 68 l2 5 l2 -4 Z M55 68 l-2 5 l-2 -4 Z', fill: W }));
  } else mouth(s, m, 66);
  if (extra === 'cheeks') cheeks(s);
  if (extra === 'freckles') for (const [x, y] of [[26, 62], [30, 65], [24, 66], [74, 62], [70, 65], [76, 66]]) s.append(svg('circle', { cx: x, cy: y, r: 1.4, fill: PUPIL, opacity: 0.5 }));
}

export const BLOOK_IDS = BLOOKS.map((b) => b.id);
const BY_ID = new Map(BLOOKS.map((b) => [b.id, b]));

export function blookName(id, customs = null) {
  if (isCustom(id)) return (customs && customs[id]) || 'Custom';
  return BY_ID.get(id)?.name || 'Blook';
}

export function isBlook(id) {
  return BY_ID.has(id) || isCustom(id);
}

/** A random blook everyone owns, for guests and new accounts. */
export function randomBlook() {
  return STARTERS[Math.floor(Math.random() * STARTERS.length)];
}

/** An <svg> of one blook. */
export function blookSVG(id) {
  const s = svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': blookName(id) });
  if (isCustom(id)) drawCustom(s, id); else (DRAW[id] || DRAW.dog)(s);
  return s;
}

/** A blook wrapped in a sized box, for the page. */
export function blook(id, size) {
  const el = document.createElement('span');
  el.className = `blook${rarityOf(id).id === 'legendary' ? ' is-legendary' : ''}`;
  if (size) { el.style.width = `${size}px`; el.style.height = `${size}px`; }
  el.append(blookSVG(id));
  return el;
}

/* Games draw blooks onto a canvas many times a frame, so each one is turned
   into an image once and kept. */
const images = new Map();

export function blookImage(id) {
  if (images.has(id)) return images.get(id);
  const s = blookSVG(id);
  s.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  s.setAttribute('width', '200');
  s.setAttribute('height', '200');
  const img = new Image();
  img.decoding = 'async';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(s))}`;
  images.set(id, img);
  return img;
}

/** Warm the cache so the first frame of a game is not missing anyone. */
export function preloadBlooks(ids) {
  return Promise.all([...new Set(ids)].map((id) => {
    const img = blookImage(id);
    if (img.complete) return Promise.resolve();
    return new Promise((res) => { img.onload = res; img.onerror = res; });
  }));
}
