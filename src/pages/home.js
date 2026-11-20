// home.js — the front door: join a game, or make one.

import { h } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { scanForPin } from '../ui/qr.js';
import { navigate } from '../router.js';
import { MODES, modeArt } from '../game/modes/index.js';
import { signedIn } from '../services/session.js';
import { popularQuizzes } from '../services/quizzes.js';
import { quizCard } from './parts.js';

export function joinBox() {
  const pin = h('input', {
    class: 'input input-xl', inputmode: 'numeric', autocomplete: 'off', maxlength: 6,
    placeholder: 'Game PIN', 'aria-label': 'Game PIN',
  });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block' }, 'Enter');
  const submit = () => {
    const v = pin.value.replace(/\D/g, '');
    if (v.length !== 6) { pin.classList.add('is-bad'); pin.focus(); return; }
    navigate(`/join/${v}`);
  };
  pin.addEventListener('input', () => {
    pin.value = pin.value.replace(/\D/g, '').slice(0, 6);
    pin.classList.remove('is-bad');
  });
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  go.addEventListener('click', submit);
  return h('div', { class: 'join-box' },
    h('h2', {}, 'Join a game'),
    pin,
    go,
    h('button', { class: 'btn btn-block', onclick: async () => { const p = await scanForPin(); if (p) navigate(`/join/${p}`); } },
      icon('camera'), 'Scan a QR code'),
  );
}

export default async function Home() {
  const popular = h('div', { class: 'grid' });
  popularQuizzes(8).then((list) => {
    if (!list.length) {
      popular.replaceWith(h('div', { class: 'card flat empty' },
        h('h3', {}, 'No public quizzes yet'),
        h('p', {}, 'Be the first: make one and publish it.'),
        h('a', { class: 'btn btn-main', href: signedIn() ? '/create' : '/signup' }, 'Make a quiz')));
      return;
    }
    popular.append(...list.map(quizCard));
  }).catch(() => popular.replaceWith(h('p', { class: 'muted' }, 'Quizzes could not be loaded right now.')));

  const floaters = [['dog', 47, 10], ['robot', 3, 84], ['frog', 41, 80], ['cupcake', 93, 86], ['alien', 51, 46], ['penguin', 25, 88]]
    .map(([id, left, top], i) => {
      const b = blook(id);
      Object.assign(b.style, { left: `${left}%`, top: `${top}%`, animationDelay: `${i * 0.6}s` });
      return b;
    });

  return h('div', { class: 'page' },
    h('section', { class: 'hero pattern' },
      h('div', { class: 'hero-blooks' }, ...floaters),
      h('div', { style: { position: 'relative' } },
        h('span', { class: 'pill pill-dark' }, icon('bolt', { size: 14 }), 'Live quiz games'),
        h('h1', { style: { marginTop: '14px' } }, 'Make a quiz.', h('br'), h('em', {}, 'Play it like a game.')),
        h('p', {}, 'Host it live on the big screen. Everyone joins with a PIN or a QR code and plays on their own device.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-main btn-lg', href: signedIn() ? '/create' : '/signup' }, icon('plus'), 'Create a quiz'),
          h('a', { class: 'btn btn-dark btn-lg', href: '/discover' }, icon('compass'), 'Discover'),
        ),
      ),
      h('div', { style: { position: 'relative' } }, joinBox()),
    ),

    h('div', { class: 'section-head' }, h('h2', {}, 'Five ways to play')),
    h('div', { class: 'features' },
      ...MODES.map((m) => h('div', { class: 'mode-card', style: { background: m.bg } },
        modeArt(m.id),
        h('h3', {}, m.name),
        h('p', {}, m.tagline)))),

    h('div', { class: 'section-head' },
      h('h2', {}, 'Popular quizzes'),
      h('a', { href: '/discover', class: 'btn btn-sm' }, 'See all', icon('arrowRight', { size: 16 }))),
    popular,

    h('footer', { class: 'row spread muted small', style: { marginTop: '50px', paddingTop: '20px', borderTop: '2px solid var(--line)' } },
      h('span', {}, 'Quickzy'),
      h('span', { class: 'row' }, h('a', { href: '/terms' }, 'Terms'), h('a', { href: '/privacy' }, 'Privacy'))),
  );
}
