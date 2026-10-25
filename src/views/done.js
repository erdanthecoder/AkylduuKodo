// done.js — the end of a lesson.
//
// Says what she learned, not just what she scored, and points at the next
// lesson so there is never a moment of "what now?".

import { h } from '../ui.js';
import { mascot } from '../mascot.js';
import { sticker, stickerName } from '../stickers.js';
import { numbered } from '../lessons/index.js';
import * as store from '../state.js';

export function DoneView({ lesson, answers, right, asked, earned, onNext, onHome }) {
  const lessons = numbered();
  const next = lessons.find((l) => !store.isDone(l.id));
  const s = store.get();
  const wrong = answers.filter((a) => !a.right);

  return h('div', { class: 'wrap' },
    h('div', { class: 'card done' },
      mascot(right === asked ? 'cheer' : 'yes', 80),
      h('span', { class: 'next-label' }, `Lesson ${lesson.n} finished`),
      h('h1', {}, lesson.title),
      h('p', { class: 'goal' }, `You can now: ${lesson.goal.toLowerCase()}`),
      h('p', { class: 'score-line' }, `${right} out of ${asked} right.`),
      s.streak > 1 ? h('p', { class: 'streak-line' }, `${s.streak} days in a row.`) : null,
      (earned || []).length
        ? h('div', { class: 'earned' },
            h('div', { class: 'earned-row' }, ...earned.map((i) => h('span', { class: 'earned-one' }, sticker(i, 60)))),
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
  return h('div', { class: 'wrap' },
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
