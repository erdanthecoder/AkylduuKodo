// done.js — the end of a task.
//
// Praise what was actually done, then show every question with what she put,
// because the review is where the learning sticks. Anything she got wrong is
// shown with the explanation again, not hidden away.

import { h } from '../ui.js';
import * as store from '../state.js';

export function DoneView({ questions, answers, result, onHome, onAgain }) {
  const right = answers.filter((a) => a.right).length;
  const first = answers.filter((a) => a.right && a.tries === 1).length;
  const s = store.get();

  const headline = first === questions.length ? 'Every one, first time!'
    : right === questions.length ? 'All correct.'
    : right >= questions.length - 1 ? 'Nearly all of them.'
    : right >= questions.length / 2 ? 'Good work.'
    : 'Well tried.';

  return h('div', { class: 'wrap' },
    h('div', { class: 'card done' },
      h('p', { class: 'q-skill' }, 'Finished'),
      h('div', { class: 'score' }, `${right}/${questions.length}`),
      h('h1', {}, headline),
      first < questions.length
        ? h('p', { class: 'muted' }, `${first} first time, and you worked the rest out.`)
        : null,
      s.streak > 1 ? h('p', {}, h('strong', {}, `${s.streak} days in a row.`)) : null,
      h('div', { class: 'stickers' },
        ...Array.from({ length: Math.min(10, result.stickers || 0) }, (_, i) =>
          h('span', { class: 'sticker' + (i >= (result.stickers || 0) - 2 ? ' is-new' : '') }, '★'),
        ),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-go', onclick: onHome }, 'Done'),
        h('button', { class: 'btn btn-quiet', onclick: onAgain }, 'Try some more'),
      ),
    ),

    h('h2', { style: 'margin:26px 0 10px' }, 'Your answers'),
    h('div', { class: 'review' },
      ...answers.map((a) => {
        const kind = a.right && a.tries === 1 ? 'yes' : a.right ? 'fixed' : 'no';
        return h('div', {},
          h('div', { class: 'review-row' },
            h('span', { class: `mark mark-${kind}` }, kind === 'no' ? '!' : '✓'),
            h('div', {},
              h('div', {}, a.prompt),
              !a.right
                ? h('div', { class: 'small muted' }, `You put ${a.given}. The answer is ${a.answer}.`)
                : a.tries > 1 ? h('div', { class: 'small muted' }, 'Right on the second go.') : null,
            ),
          ),
          !a.right ? h('div', { class: 'say say-why small', style: 'margin:4px 0 10px' }, a.why) : null,
        );
      }),
    ),
  );
}
