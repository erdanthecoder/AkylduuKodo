// path.js — the first thing she sees, and the answer to "where do I start?".
//
// One lesson is next. It is the biggest thing on the screen and it has the
// only button. Everything below it is the road: what she has done, and what
// is coming. Nothing else competes.

import { h, svg } from '../ui.js';
import * as store from '../state.js';
import { mascot } from '../mascot.js';
import { sticker, stickerIndex } from '../stickers.js';
import { numbered } from '../lessons/index.js';

function tick(size = 20) {
  const s = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' });
  s.append(svg('path', { d: 'M5 13 l5 5 l9 -11', fill: 'none', stroke: 'currentColor',
    'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

export function PathView({ onStart, onReplay, onAlbum }) {
  const s = store.get();
  const lessons = numbered();
  const next = lessons.find((l) => !store.isDone(l.id)) || lessons[lessons.length - 1];
  const allDone = lessons.every((l) => store.isDone(l.id));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Hello' : 'Good evening';

  return h('div', { class: 'wrap' },
    h('div', { class: 'hello-row' },
      mascot(allDone ? 'cheer' : 'hello', 64),
      h('div', {},
        h('p', { class: 'hello' }, `${greeting}, ${s.name}.`),
        h('p', { class: 'muted' }, allDone
          ? 'You have finished every lesson. Go over any of them again.'
          : store.isDone(next.id) ? 'Pick up where you left off.'
          : `${lessons.filter((l) => store.isDone(l.id)).length} of ${lessons.length} lessons done.`),
      ),
    ),

    // the one thing to do
    h('div', { class: 'card next-card' },
      h('span', { class: 'next-label' }, `Lesson ${next.n}`),
      h('h1', {}, next.title),
      h('p', { class: 'goal' }, next.goal),
      h('button', { class: 'btn btn-go btn-big', onclick: () => onStart(next.id) },
        store.isDone(next.id) ? 'Do it again' : 'Start'),
      h('p', { class: 'muted small' }, 'About five minutes.'),
    ),

    // the road
    h('h2', { class: 'section' }, 'Your lessons'),
    h('ol', { class: 'path' },
      ...lessons.map((l) => {
        const done = store.isDone(l.id);
        const isNext = l.id === next.id && !done;
        const locked = !done && !isNext;
        return h('li', { class: 'step' + (done ? ' is-done' : isNext ? ' is-next' : ' is-later') },
          h('button', {
            class: 'step-btn', disabled: locked || null,
            onclick: () => (done ? onReplay(l.id) : onStart(l.id)),
          },
            h('span', { class: 'step-mark' }, done ? tick(18) : String(l.n)),
            h('span', { class: 'step-title' }, l.title),
            isNext ? h('span', { class: 'step-tag' }, 'next') : null,
          ),
        );
      }),
    ),

    h('button', { class: 'album-strip', onclick: onAlbum, 'aria-label': 'Your stickers' },
      h('div', { class: 'album-row' },
        ...(s.album.length ? s.album.slice(-6) : [stickerIndex(store.today(), 0)]).map((i) => sticker(i, 36, !s.album.length)),
      ),
      h('span', { class: 'album-count' },
        s.album.length ? `${s.album.length} sticker${s.album.length === 1 ? '' : 's'}` : 'Finish a lesson for your first sticker'),
    ),
  );
}
