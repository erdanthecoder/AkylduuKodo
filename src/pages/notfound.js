// notfound.js — any address that is not a page.

import { h } from '../ui/dom.js';
import { blook } from '../ui/blooks.js';
import { pageTitle } from './parts.js';

export default async function NotFound() {
  pageTitle('Not found');
  const b = blook('ghost');
  b.style.width = '120px'; b.style.height = '120px';
  return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack', style: { marginTop: '8vh', justifyItems: 'center' } },
    b,
    h('h1', {}, 'Nothing here'),
    h('p', { class: 'muted' }, 'That page does not exist. If someone gave you a game PIN, type it on the join page.'),
    h('div', { class: 'row', style: { justifyContent: 'center' } },
      h('a', { class: 'btn btn-main', href: '/join' }, 'Join a game'),
      h('a', { class: 'btn', href: '/' }, 'Go home'))));
}
