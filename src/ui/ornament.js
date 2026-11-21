// ornament.js — Quickzy's signature motif: the "kochkor muyuz" (ram's horn)
// of Kyrgyz shyrdak felt carpets, drawn in the four answer colours.
// Used as a background pattern, a divider and a corner mark.

import { svg } from './dom.js';

/** One ram's-horn knot, centred at 0,0, about 40 units across. */
const HORN = 'M0 -6 C-6 -6 -10 -2 -10 4 C-10 10 -4 14 2 12 C6 10 6 4 2 3 C-1 2 -3 5 -1 7'
  + ' M0 -6 C6 -6 10 -2 10 4 C10 10 4 14 -2 12 C-6 10 -6 4 -2 3 C1 2 3 5 1 7'
  + ' M0 -6 L0 -16 M-5 -12 L0 -16 L5 -12';

/** A data URL tile for CSS backgrounds: a quiet grid of horns. */
export function ornamentTile(colour = 'rgba(255,255,255,0.07)', size = 120) {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">`
    + `<g fill="none" stroke="${colour}" stroke-width="3" stroke-linecap="round">`
    + `<g transform="translate(30 32)"><path d="${HORN}"/></g>`
    + `<g transform="translate(90 92) rotate(180)"><path d="${HORN}"/></g>`
    + `<path d="M60 0 L66 6 L60 12 L54 6 Z M0 60 L6 66 L0 72 L-6 66 Z M120 60 L126 66 L120 72 L114 66 Z M60 108 L66 114 L60 120 L54 114 Z"/>`
    + `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(body)}")`;
}

/** A divider band: horns in the four answer colours, side by side. */
export function ornamentBand({ count = 9, height = 34 } = {}) {
  const w = count * 48;
  const s = svg('svg', { viewBox: `0 0 ${w} 40`, class: 'orn-band', preserveAspectRatio: 'xMidYMid meet', height: String(height), 'aria-hidden': 'true' });
  const cols = ['#ff4772', '#2f9bff', '#ffcd1f', '#12c9a6'];
  for (let i = 0; i < count; i++) {
    const g = svg('g', { transform: `translate(${24 + i * 48} ${i % 2 ? 22 : 20}) ${i % 2 ? 'rotate(180)' : ''}` });
    g.append(svg('path', { d: HORN, fill: 'none', stroke: cols[i % 4], 'stroke-width': 3.2, 'stroke-linecap': 'round', class: 'orn-horn', style: `animation-delay:${i * 0.12}s` }));
    s.append(g);
  }
  return s;
}

/** A single big horn, for corners and empty states. */
export function ornamentMark(colour = '#6b4cff', size = 64) {
  const s = svg('svg', { viewBox: '-20 -20 40 40', width: String(size), height: String(size), class: 'orn-mark', 'aria-hidden': 'true' });
  s.append(svg('path', { d: HORN, fill: 'none', stroke: colour, 'stroke-width': 3, 'stroke-linecap': 'round' }));
  return s;
}
