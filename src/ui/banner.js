// banner.js — profile banners: illustrated scenes to pick from, your own
// picture (an https link), and the owner's animated founder banner.

import { h, svg } from './dom.js';
import { blook } from './blooks.js';
import { logo } from './icons.js';

const scene = (bg, shapes) => ({ bg, shapes });
export const BANNERS = {
  sky: { name: 'Sky high', ...scene('linear-gradient(160deg, #2a6fdb, #7cc2ff 60%, #ffe2b0)', 'clouds') },
  mountains: { name: 'Tian Shan', ...scene('linear-gradient(170deg, #ffb86b, #ff7a59 45%, #6b4cff)', 'mountains') },
  space: { name: 'Deep space', ...scene('radial-gradient(circle at 70% 30%, #3a2399, #0b1030 70%)', 'stars') },
  ocean: { name: 'Ocean', ...scene('linear-gradient(180deg, #59d6ff, #2f9bff 50%, #0b3a7a)', 'waves') },
  candy: { name: 'Candy land', ...scene('linear-gradient(135deg, #ff8fb1, #ffcd1f 50%, #a560ff)', 'candy') },
  jungle: { name: 'Jungle', ...scene('linear-gradient(160deg, #12c9a6, #2e7d32 70%)', 'leaves') },
  sunset: { name: 'Sunset', ...scene('linear-gradient(180deg, #ff4772, #ff8a2a 50%, #ffcd1f)', 'sun') },
  galaxy: { name: 'Galaxy', ...scene('linear-gradient(135deg, #17133f, #6b4cff 50%, #ff4772)', 'stars') },
};
export const BANNER_IDS = Object.keys(BANNERS);
export const validBanner = (b) => (typeof b === 'string' && (BANNER_IDS.includes(b) || /^https:\/\/[^\s"'<>]{8,290}$/.test(b))) ? b : '';

function shapes(kind) {
  const s = svg('svg', { viewBox: '0 0 1200 300', preserveAspectRatio: 'xMidYMid slice', class: 'bn-art', 'aria-hidden': 'true' });
  const add = (tag, a) => s.append(svg(tag, a));
  if (kind === 'clouds') for (let i = 0; i < 7; i++) { const x = i * 190 + 30; const y = 40 + (i % 3) * 60; add('ellipse', { cx: x, cy: y, rx: 90, ry: 26, fill: '#ffffffcc', class: 'bn-drift', style: `--d:${i}` }); add('ellipse', { cx: x + 40, cy: y - 16, rx: 50, ry: 22, fill: '#ffffffdd', class: 'bn-drift', style: `--d:${i}` }); }
  if (kind === 'mountains') {
    add('circle', { cx: 900, cy: 90, r: 50, fill: '#ffe45c' });
    add('path', { d: 'M0 300 L0 190 L150 80 L260 170 L420 50 L560 180 L700 90 L860 200 L1000 70 L1200 180 L1200 300 Z', fill: '#3a2399' });
    add('path', { d: 'M420 50 L460 90 L440 86 L420 104 L400 88 L384 92 Z M1000 70 L1040 110 L1020 104 L1000 122 L980 106 L964 112 Z M150 80 L180 106 L166 104 L150 118 L136 104 Z', fill: '#fff' });
    add('path', { d: 'M0 300 L0 240 L200 170 L380 250 L600 180 L820 250 L1000 200 L1200 240 L1200 300 Z', fill: '#17133f' });
  }
  if (kind === 'stars') for (let i = 0; i < 70; i++) add('circle', { cx: (i * 173) % 1200, cy: (i * 97) % 300, r: 1 + (i % 3), fill: '#fff', class: 'bn-twinkle', style: `--d:${i % 7}` });
  if (kind === 'waves') for (let i = 0; i < 4; i++) add('path', { d: `M0 ${170 + i * 35} Q150 ${150 + i * 35} 300 ${170 + i * 35} T600 ${170 + i * 35} T900 ${170 + i * 35} T1200 ${170 + i * 35} V300 H0 Z`, fill: `rgba(255,255,255,${0.12 + i * 0.05})`, class: 'bn-drift', style: `--d:${i}` });
  if (kind === 'candy') for (let i = 0; i < 16; i++) { const x = (i * 83) % 1200; const y = 40 + ((i * 61) % 220); add('circle', { cx: x, cy: y, r: 14 + (i % 4) * 6, fill: ['#fff', '#ff4772', '#12c9a6', '#ffcd1f'][i % 4], opacity: 0.7, class: 'bn-bob', style: `--d:${i % 5}` }); }
  if (kind === 'leaves') for (let i = 0; i < 14; i++) add('ellipse', { cx: (i * 97) % 1200, cy: 30 + ((i * 53) % 240), rx: 40, ry: 14, fill: i % 2 ? '#a8e063' : '#1b5e20', opacity: 0.6, transform: `rotate(${(i * 37) % 180} ${(i * 97) % 1200} ${30 + ((i * 53) % 240)})` });
  if (kind === 'sun') { add('circle', { cx: 600, cy: 260, r: 130, fill: '#fff3b0', opacity: 0.8 }); for (let i = 0; i < 4; i++) add('rect', { x: 0, y: 200 + i * 22, width: 1200, height: 8, fill: '#ff4772', opacity: 0.5 }); }
  return s;
}

/**
 * The banner for a profile. `owner` gets the animated founder banner,
 * whatever they picked.
 */
export function profileBanner(choice, { owner = false } = {}) {
  if (owner) return ownerBanner();
  const id = validBanner(choice);
  if (id && id.startsWith('https://')) {
    const img = h('img', { src: id, alt: '', referrerpolicy: 'no-referrer', loading: 'lazy' });
    img.addEventListener('error', () => { img.replaceWith(shapes('clouds')); });
    return h('div', { class: 'bn bn-photo', style: { background: BANNERS.sky.bg } }, img);
  }
  const b = BANNERS[id] || BANNERS.sky;
  return h('div', { class: 'bn', style: { background: b.bg } }, shapes(b.shapes));
}

/** The founder's banner: an animated scene with the logo and a blook parade. */
function ownerBanner() {
  const parade = ['kyrgyzstan', 'dragon', 'unicorn', 'robot', 'fox', 'astronaut', 'santa', 'buddy', 'yeti', 'alien', 'tiger', 'panda'];
  return h('div', { class: 'bn bn-owner' },
    shapes('mountains'),
    h('div', { class: 'bn-owner-glow' }),
    h('div', { class: 'bn-owner-logo' }, logo()),
    h('div', { class: 'bn-parade' }, ...parade.concat(parade).map((id, i) => h('span', { style: { '--i': i } }, blook(id, 54)))),
    h('div', { class: 'bn-sparkles' }, ...Array.from({ length: 18 }, (_, i) => h('i', { style: { '--i': i } }))));
}

/** A small preview of each banner, for the picker in Settings. */
export const bannerThumb = (id) => h('div', { class: 'bn bn-thumb', style: { background: BANNERS[id].bg } }, shapes(BANNERS[id].shapes));
