// done.js — the end of a lesson.
//
// Says what she can now do, not just what she scored, and points at the next
// lesson so there is never a moment of "what now?".

import { h, svg } from '../ui.js';
import { mascot } from '../mascot.js';
import { sticker, stickerName } from '../stickers.js';
import { numbered } from '../lessons/index.js';
import * as store from '../state.js';

function tick(size = 22) {
  const s = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' });
  s.append(svg('path', { d: 'M5 13 l5 5 l9 -11', fill: 'none', stroke: 'currentColor',
    'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

export function DoneView({ lesson, answers, right, asked, earned, onNext, onHome }) {
  const next = numbered().find((l) => !store.isDone(l.id));
  const s = store.get();
  const wrong = answers.filter((a) => !a.right);
  const perfect = right === asked;

  return h('div', { class: `wrap page tint-${lesson.unit?.colour || 'mint'}` },
    h('div', { class: 'card done' },
      mascot(perfect ? 'cheer' : 'yes', 86),
      h('span', { class: 'next-label' }, `Lesson ${lesson.n} finished`),
      h('h1', {}, lesson.title),

      // what she can now do matters more than the number. The goals are
      // already written as abilities, so a tick in front is all they need —
      // bolting "you can now" onto the front produces "you can now know".
      h('p', { class: 'learned' },
        h('span', { class: 'learned-tick' }, tick(18)),
        lesson.goal),

      h('p', { class: 'score-line' }, `${right} out of ${asked} right.`),
      s.streak > 1 ? h('p', { class: 'streak-line' }, `${s.streak} days in a row.`) : null,

      (earned || []).length
        ? h('div', { class: 'earned' },
            h('div', { class: 'earned-row' }, ...earned.map((i) => h('span', { class: 'earned-one' }, sticker(i, 62)))),
            h('p', { class: 'muted small' }, `A new sticker: ${earned.map(stickerName).join(' and ')}`),
          )
        : null,

      next
        ? h('button', { class: 'btn btn-go btn-big', onclick: () => onNext(next.id) },
            `Next: ${next.title}`)
        : h('p', {}, 'That was the last lesson. Well done.'),
      h('button', { class: 'btn btn-quiet', onclick: onHome }, 'Back to my lessons'),
    ),

    wrong.length
      ? h('div', { class: 'card review-card' },
          h('h2', {}, 'Worth another look'),
          ...wrong.map((a) => h('div', { class: 'review-one' },
            h('p', { class: 'review-q' }, a.prompt),
            h('p', { class: 'muted small' }, `You put ${a.given}. It is ${a.answer}.`),
            h('p', { class: 'say say-why small' }, a.why),
          )),
        )
      : null,
  );
}

export function AlbumView({ onBack }) {
  const { album } = store.get();
  const have = new Map();
  (album || []).forEach((i) => have.set(i, (have.get(i) || 0) + 1));
  return h('div', { class: 'wrap page' },
    h('div', { class: 'row spread' },
      h('h1', {}, 'Your stickers'),
      h('button', { class: 'btn btn-quiet', onclick: onBack }, 'Back'),
    ),
    h('p', { class: 'muted' }, `${have.size} of 16. One for every lesson you finish.`),
    h('div', { class: 'album-grid' },
      ...Array.from({ length: 16 }, (_, i) =>
        h('div', { class: 'album-cell' + (have.has(i) ? '' : ' is-locked') },
          sticker(i, 54, !have.has(i)),
          have.get(i) > 1 ? h('span', { class: 'album-many' }, `x${have.get(i)}`) : null,
        ),
      ),
    ),
  );
}
