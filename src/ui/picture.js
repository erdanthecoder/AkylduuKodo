// picture.js — show a question's picture: a Quickzy character or a web image.

import { h } from './dom.js';
import { blook, isBlook } from './blooks.js';
import { cleanPic } from '../game/questions.js';

/** An element for the picture, or null when there is none. */
export function picture(value, { cls = '' } = {}) {
  const v = cleanPic(value);
  if (!v) return null;
  if (v.startsWith('blook:')) {
    const id = v.slice(6);
    if (!isBlook(id)) return null;
    return h('div', { class: `q-pic q-pic-blook ${cls}` }, blook(id));
  }
  const img = h('img', { src: v, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer', decoding: 'async' });
  const box = h('div', { class: `q-pic ${cls}` }, img);
  img.addEventListener('error', () => box.remove());
  return box;
}
