// path.js — the course, with its shape showing.
//
// A banner you land on, the one lesson that is next sitting over it, and then
// the course in five named parts. Three things, in that order, and nothing
// else competing with them.

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

/** The whole course as one ring, so progress is a thing you see, not read. */
function ring(done, total, size = 66) {
  const r = 26;
  const round = 2 * Math.PI * r;
  const s = svg('svg', { viewBox: '0 0 66 66', width: size, height: size,
    class: 'ring', role: 'img', 'aria-label': `${done} of ${total} lessons done` });
  s.append(svg('circle', { cx: 33, cy: 33, r, fill: 'none', stroke: 'rgba(255,255,255,0.25)', 'stroke-width': 7 }));
  if (done) {
    s.append(svg('circle', {
      cx: 33, cy: 33, r, fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round',
      'stroke-dasharray': `${(done / total) * round} ${round}`, transform: 'rotate(-90 33 33)',
    }));
  }
  const t = svg('text', { x: 33, y: 40, 'text-anchor': 'middle', class: 'ring-text' });
  t.textContent = `${done}`;
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

  return h('div', { class: 'page' },

    // the banner you land on
    h('header', { class: 'hero' },
      h('div', { class: 'hero-in' },
        h('div', { class: 'hero-cat' }, mascot(next ? 'hello' : 'cheer', 72)),
        // greeting and name on their own lines, so a narrow screen never
        // breaks the phrase in the middle
        h('div', { class: 'hero-text' },
          h('p', { class: 'hero-greet' }, `${greeting},`),
          h('p', { class: 'hero-hi' }, s.name),
          h('p', { class: 'hero-sub' },
            doneCount ? `${doneCount} of ${lessons.length} lessons finished` : 'Sixteen lessons. Start at the first one.'),
          s.streak > 1 ? h('span', { class: 'hero-streak' }, `${s.streak} days in a row`) : null,
        ),
        ring(doneCount, lessons.length),
      ),
    ),

    h('div', { class: 'wrap' },

      // the one thing to do, lifted over the banner
      next
        ? h('section', { class: `card next-card tint-${next.unit?.colour || 'sky'}` },
            h('span', { class: `pill pill-${next.unit?.colour || 'sky'}` }, next.unit?.name || 'Lesson'),
            h('h1', {}, next.title),
            h('p', { class: 'goal' }, next.goal),
            h('button', { class: 'btn btn-go btn-big', onclick: () => onStart(next.id) }, 'Start lesson'),
            h('p', { class: 'muted small' }, `Lesson ${next.n} · about five minutes`),
          )
        : h('section', { class: 'card next-card tint-mint' },
            h('h1', {}, 'Every lesson finished'),
            h('p', { class: 'goal' }, 'Go over any of them again whenever you like.'),
          ),

      h('h2', { class: 'section' }, 'The whole course'),

      ...units.map((unit) => {
        const complete = unit.done === unit.total;
        return h('section', { class: `unit tint-${unit.colour}` + (complete ? ' is-complete' : '') },
          h('div', { class: 'unit-head' },
            h('div', { class: 'unit-name' },
              h('h3', {}, unit.name, complete ? h('span', { class: 'unit-tick' }, tick(16)) : null),
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
    ),
  );
}
