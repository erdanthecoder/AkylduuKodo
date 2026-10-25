// path.js — the course, with its shape showing.
//
// Three things, in this order, and nothing else:
//
//   1. how far through the whole course she is
//   2. the one lesson that is next, with the only button on the page
//   3. the course itself, in five named parts, each with its own progress
//
// A flat list of sixteen rows is a wall. Five parts you can see the point of
// is a course you can find yourself in.

import { h, svg } from '../ui.js';
import * as store from '../state.js';
import { mascot } from '../mascot.js';
import { sticker, stickerIndex } from '../stickers.js';
import { numbered, unitsWith } from '../lessons/index.js';

/** Bumped whenever the lessons change, so a stale copy shows at a glance. */
export const BUILT = '25 October';

function tick(size = 18) {
  const s = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' });
  s.append(svg('path', { d: 'M5 13 l5 5 l9 -11', fill: 'none', stroke: 'currentColor',
    'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

/** A ring showing the whole course at a glance. */
function ring(done, total) {
  const size = 62;
  const r = 25;
  const circumference = 2 * Math.PI * r;
  const s = svg('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size,
    class: 'ring', role: 'img', 'aria-label': `${done} of ${total} lessons done` });
  s.append(svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', stroke: 'var(--line)', 'stroke-width': 7 }));
  if (done) {
    s.append(svg('circle', {
      cx: size / 2, cy: size / 2, r, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 7,
      'stroke-linecap': 'round', 'stroke-dasharray': `${(done / total) * circumference} ${circumference}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }));
  }
  const t = svg('text', { x: size / 2, y: size / 2 + 6, 'text-anchor': 'middle', class: 'ring-text' });
  t.textContent = String(done);
  s.append(t);
  return s;
}

export function PathView({ onStart, onAlbum }) {
  const s = store.get();
  const lessons = numbered();
  const units = unitsWith(store.isDone);
  const doneCount = lessons.filter((l) => store.isDone(l.id)).length;
  const next = lessons.find((l) => !store.isDone(l.id));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Hello' : 'Good evening';

  return h('div', { class: 'wrap' },

    // 1. where she is overall
    h('header', { class: 'top-row' },
      mascot(next ? 'hello' : 'cheer', 56),
      h('div', { class: 'top-text' },
        h('p', { class: 'hello' }, `${greeting}, ${s.name}.`),
        h('p', { class: 'muted small' }, `${doneCount} of ${lessons.length} lessons finished`),
      ),
      ring(doneCount, lessons.length),
    ),

    // 2. the one thing to do
    next
      ? h('section', { class: 'card next-card' },
          h('span', { class: `pill pill-${next.unit?.colour || 'sky'}` }, next.unit?.name || 'Lesson'),
          h('h1', {}, next.title),
          h('p', { class: 'goal' }, next.goal),
          h('button', { class: 'btn btn-go btn-big', onclick: () => onStart(next.id) }, 'Start lesson'),
          h('p', { class: 'muted small' }, `Lesson ${next.n} · about five minutes`),
        )
      : h('section', { class: 'card next-card' },
          h('h1', {}, 'Every lesson finished'),
          h('p', { class: 'goal' }, 'Go over any of them again whenever you like.'),
        ),

    // 3. the course, in parts
    h('h2', { class: 'section' }, 'The whole course'),
    ...units.map((unit) => {
      const complete = unit.done === unit.total;
      return h('section', { class: `unit unit-${unit.colour}` + (complete ? ' is-complete' : '') },
        h('div', { class: 'unit-head' },
          h('div', { class: 'unit-name' },
            h('h3', {}, unit.name),
            h('p', { class: 'muted small' }, unit.about),
          ),
          h('span', { class: 'unit-count' }, `${unit.done}/${unit.total}`),
        ),
        h('div', { class: 'unit-bar' },
          (() => {
            const fill = h('span');
            fill.style.width = `${(unit.done / unit.total) * 100}%`;
            return fill;
          })(),
        ),
        h('ul', { class: 'unit-lessons' },
          ...unit.lessons.map((l) => {
            const done = store.isDone(l.id);
            const isNext = next && l.id === next.id;
            const locked = !done && !isNext;
            return h('li', {},
              h('button', {
                class: 'row' + (done ? ' is-done' : isNext ? ' is-next' : ' is-later'),
                disabled: locked || null,
                onclick: () => onStart(l.id),
              },
                h('span', { class: 'row-mark' }, done ? tick() : String(l.n)),
                h('span', { class: 'row-title' }, l.title),
                isNext ? h('span', { class: 'row-tag' }, 'next') : null,
              ),
            );
          }),
        ),
      );
    }),

    h('button', { class: 'album-strip', onclick: onAlbum, 'aria-label': 'Your stickers' },
      h('div', { class: 'album-row' },
        ...(s.album.length ? s.album.slice(-6) : [stickerIndex(store.today(), 0)])
          .map((i) => sticker(i, 34, !s.album.length)),
      ),
      h('span', { class: 'album-count' },
        s.album.length
          ? `${s.album.length} sticker${s.album.length === 1 ? '' : 's'}`
          : 'Finish a lesson for your first sticker'),
    ),

    h('p', { class: 'build' }, `Lessons · ${BUILT}`),
  );
}
