// icons.js — every icon in the app, drawn on one 24px grid with round caps,
// so they all read as one family. No icon font and no emoji.

import { svg } from './dom.js';

const P = {
  home: 'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  plus: 'M12 5v14M5 12h14',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM3.5 21a8.5 8.5 0 0 1 17 0',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 13.5l1.6 1.2-1.8 3.1-1.9-.6a7 7 0 0 1-1.7 1l-.4 2H11l-.4-2a7 7 0 0 1-1.7-1l-1.9.6-1.8-3.1 1.6-1.2a7 7 0 0 1 0-2l-1.6-1.2 1.8-3.1 1.9.6a7 7 0 0 1 1.7-1l.4-2h3.6l.4 2a7 7 0 0 1 1.7 1l1.9-.6 1.8 3.1-1.6 1.2a7 7 0 0 1 0 2Z',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM21 21l-5-5',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  close: 'M6 6l12 12M18 6 6 18',
  trash: 'M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  mail: 'M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5',
  key: 'M14.5 9.5a4 4 0 1 1-5.6 3.6L3 19v2h3v-2h2v-2h2l1.9-1.9A4 4 0 0 1 14.5 9.5ZM16 8h.01',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM7 7h.01M17 7h.01M7 17h.01',
  camera: 'M3.5 7.5h4l1.5-2.5h6l1.5 2.5h4V19h-17zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  users: 'M9 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4a3.6 3.6 0 0 1 0 7.2M18 13.5a6.3 6.3 0 0 1 3.5 6.5',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 11h6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5a3.5 3.5 0 0 0 3.8 4.2M16 6h3.5a3.5 3.5 0 0 1-3.8 4.2M12 13v4M8.5 20h7M10 17h4',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8L12 3.5Z',
  bolt: 'M13 3 5 13.5h6L10 21l9-11h-6.5L13 3Z',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11',
  mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5',
  flag: 'M5 21V4M5 4.5h12l-2.5 4 2.5 4H5',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z',
  eyeOff: 'M3 3l18 18M10.6 5.6A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.1 3.9M6.4 6.5A17 17 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9.6 9.6 0 0 0 4.1-.9M9.9 9.9a2.8 2.8 0 0 0 4 4',
  shuffle: 'M16 4h4v4M4 20l16-16M20 16v4h-4M15 15l5 5M4 4l5 5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  skip: 'M6 5l9 7-9 7V5ZM18 5v14',
  stop: 'M6 6h12v12H6z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  type: 'M5 7V5h14v2M12 5v14M9 19h6',
  toggle: 'M8 7h8a5 5 0 0 1 0 10H8A5 5 0 0 1 8 7ZM8 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  order: 'M8 6h12M8 12h12M8 18h12M3.5 5l1-1v4M3 11.5h2l-2 2.5h2M3 17h2v3H3M3 18.5h2',
  hash: 'M5 9h15M4 15h15M10 4 8 20M16 4l-2 16',
  chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  multi: 'M4 5h5v5H4zM4 14h5v5H4zM12 7h8M12 16h8M5 7.5l1.2 1.2L8.5 6.4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  alert: 'M12 3 2 20h20L12 3ZM12 10v4M12 17h.01',
  shield: 'M12 3l7.5 3v6c0 4.5-3.2 8-7.5 9-4.3-1-7.5-4.5-7.5-9V6L12 3Z',
  google: '',
};

/** icon('play', { size: 20 }) */
export function icon(name, { size = 20, stroke = 2.4, cls = '' } = {}) {
  if (name === 'google') return googleIcon(size);
  const d = P[name];
  const s = svg('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    class: `icon ${cls}`, 'aria-hidden': 'true',
  });
  if (d) s.append(svg('path', { d }));
  return s;
}

/** The Google "G", in its own colours, as Google's brand guidance asks. */
function googleIcon(size) {
  const s = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' });
  s.append(svg('path', { fill: '#4285F4', d: 'M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.7 3.2-8Z' }));
  s.append(svg('path', { fill: '#34A853', d: 'M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z' }));
  s.append(svg('path', { fill: '#FBBC05', d: 'M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z' }));
  s.append(svg('path', { fill: '#EA4335', d: 'M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z' }));
  return s;
}

/* ------------------------------------------------------------ the shapes */

/* The four answer shapes. Kahoot owns triangle, diamond, circle and square, so
   Quickzy's are its own: a bolt, a drop, a star and a hexagon — still four
   silhouettes nobody confuses, which is what a colour-blind player needs. */
const SHAPE = [
  'M28 4 L10 30 h13 l-4 22 L42 22 H29 Z',                             // bolt
  'M28 5 C28 5 11 24 11 35 a17 17 0 0 0 34 0 C45 24 28 5 28 5 Z',      // drop
  'M28 4 l7 15 16 2 -12 11 3 16 -14-8 -14 8 3-16 L5 21 l16-2 Z',       // star
  'M28 4 l21 12 v24 L28 52 7 40 V16 Z',                               // hex
  'M28 6 a22 22 0 1 0 0.01 0 Z',                                      // ring
  'M10 10 h36 v36 h-36 Z',                                            // square (6th)
];

export function shape(i, size = 34) {
  const s = svg('svg', { viewBox: '0 0 56 56', width: size, height: size, class: 'shape', 'aria-hidden': 'true' });
  s.append(svg('path', { d: SHAPE[i % SHAPE.length], fill: 'currentColor', 'stroke-linejoin': 'round' }));
  return s;
}

export const SHAPE_NAMES = ['bolt', 'drop', 'star', 'hex', 'ring', 'square'];

/**
 * The logo mark: a chunky Q whose tail is a lightning bolt (quiz + quick),
 * the bolt breaking out past the tile's edge.
 */
let logoSeq = 0;
const round2 = (n) => Math.round(n * 100) / 100;
/** One quarter of the Q's ring (an annulus slice), as a path. */
function ringPart(cx, cy, r1, r2, a0, a1) {
  const p = (rad, a) => `${round2(cx + rad * Math.cos(a * Math.PI / 180))} ${round2(cy + rad * Math.sin(a * Math.PI / 180))}`;
  return `M${p(r2, a0)} A${r2} ${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)} Z`;
}

/** The Quickzy mark (1.2): a Q whose ring is the four answer colours and
 *  whose tail is a lightning bolt, on a night-violet tile. */
export function logoSVG(id = 'q') {
  const cx = 29; const cy = 28;
  const cols = ['#ff4772', '#2f9bff', '#ffcd1f', '#12c9a6'];
  const ring = [180, 270, 0, 90].map((a, i) => `<path d="${ringPart(cx, cy, 9, 19.5, a + 4, a + 86)}" fill="${cols[i]}"/>`).join('');
  return `<defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a24a8"/><stop offset="1" stop-color="#17133f"/></linearGradient>`
    + `<radialGradient id="${id}b" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#7c5cff" stop-opacity=".9"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></radialGradient></defs>`
    + `<rect x="2" y="5" width="60" height="57" rx="17" fill="#0e0b2b"/>`
    + `<rect x="2" y="2" width="60" height="57" rx="17" fill="url(#${id}a)"/>`
    + `<rect x="2" y="2" width="60" height="57" rx="17" fill="url(#${id}b)"/>`
    + ring
    + `<path d="M36 35 L52 33 L44.5 42.5 L57 42 L35 62 L41.5 47.5 L32.5 48 Z" fill="#fff" stroke="#17133f" stroke-width="2.6" stroke-linejoin="round"/>`
    + `<path d="M52 7.5 l1.7 4.3 4.3 1.7 -4.3 1.7 -1.7 4.3 -1.7 -4.3 -4.3 -1.7 4.3 -1.7 Z" fill="#ffe45c"/>`;
}

export function logo() {
  const n = ++logoSeq;
  const mark = svg('svg', { viewBox: '0 0 64 64', class: 'logo-mark', 'aria-hidden': 'true' });
  mark.innerHTML = logoSVG(`lg${n}`);
  return mark;
}

/** Mark and wordmark together: "Quick" plus a "zy" in the accent colour. */
export function wordmark() {
  const word = document.createElement('span');
  word.className = 'logo-word';
  word.innerHTML = 'Quick<em>zy</em>';
  return word;
}

export const BADGE_TITLE = { verified: 'Trusted quiz maker', official: 'Official Quickzy', owner: 'Quickzy owner', kg: 'Kyrgyzstan', pro: 'Quickzy Pro member' };

/** kind: 'verified' (blue), 'official' (black), 'owner' (green) or 'kg' (the Kyrgyz flag). */
export function verifiedBadge(title, kind = 'verified') {
  title = title || BADGE_TITLE[kind];
  const b = document.createElement('span');
  b.className = `verified is-${kind}`;
  b.title = title;
  b.setAttribute('aria-label', title);
  if (kind === 'kg') {
    // a little red disc with the yellow sun and the tunduk
    const rays = Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return `M${(12 + Math.cos(a) * 4).toFixed(2)} ${(12 + Math.sin(a) * 4).toFixed(2)}L${(12 + Math.cos(a) * 8).toFixed(2)} ${(12 + Math.sin(a) * 8).toFixed(2)}`;
    }).join('');
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${rays}" stroke="#ffef00" stroke-width="1.3"/><circle cx="12" cy="12" r="4.4" fill="#ffef00"/>`
      + '<circle cx="12" cy="12" r="2.8" fill="none" stroke="#e8112d" stroke-width=".8"/><path d="M9.6 11.2h4.8M9.6 12.8h4.8M11.2 9.6v4.8M12.8 9.6v4.8" stroke="#e8112d" stroke-width=".6"/></svg>';
    return b;
  }
  if (kind === 'official') {
    // the official account wears the Quickzy logo itself
    const mark = svg('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' });
    mark.innerHTML = logoSVG(`ob${++logoSeq}`);
    b.append(mark);
    return b;
  }
  b.append(icon('check', { size: 12, stroke: 3.6 }));
  return b;
}
