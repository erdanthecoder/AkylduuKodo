// practice.js — the Activities section: four short, sharp things to do with
// what the lessons taught. The hub lists them; each engine lives in its own
// file under src/activities so this stays a page and not a pile.

import { h } from '../ui.js';
import { icon } from '../icons.js';
import { ui } from '../i18n.js';
import * as store from '../state.js';
import { ACTIVITIES } from '../data/activities.js';
import { laserActivity } from '../activities/laser.js';
import { bossActivity } from '../activities/boss.js';
import { tugActivity } from '../activities/tug.js';
import { kartActivity } from '../activities/kart.js';

const ENGINES = {
  laser: laserActivity,
  boss: bossActivity,
  tug: tugActivity,
  kart: kartActivity,
};

/** The one-line promise on a card: how long, or how much. */
function lengthNote(a) {
  if (a.seconds) return `${a.seconds} seconds`;
  if (a.rounds) return `${a.rounds} phases`;
  return 'One race';
}

export function PracticeView(go, activityId) {
  if (activityId) {
    const activity = ACTIVITIES.find((a) => a.id === activityId);
    const engine = activity && ENGINES[activity.kind];
    if (!engine) return h('div', { class: 'card' }, 'That activity is not here any more.');
    return engine(activity, go);
  }

  const s = store.get();
  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, ui('practice_title')),
    h('p', { class: 'muted' }, ui('practice_sub')),

    h('div', { class: 'act-grid' },
      ...ACTIVITIES.map((a) => {
        const best = s.bests[a.id] || 0;
        return h('button', { class: `card act-card act-${a.id}`, onclick: () => go(`#/practice/${a.id}`) },
          h('div', { class: 'act-mark' }, icon(a.icon, { size: 26 })),
          h('div', { class: 'act-body' },
            h('h3', {}, a.name),
            h('p', { class: 'muted' }, a.desc),
            h('p', { class: 'act-teaches' }, icon('bulb', { size: 14 }), a.teaches),
          ),
          h('div', { class: 'chips act-chips' },
            h('span', { class: 'chip' }, icon('clock', { size: 13 }), lengthNote(a)),
            best
              ? h('span', { class: 'chip is-best' }, icon('trophy', { size: 13 }), `${ui('best')}: ${best}`)
              : h('span', { class: 'chip' }, 'Not tried yet'),
          ),
          h('span', { class: 'lesson-cta' }, ui('begin') + ' →'),
        );
      }),
    ),

    // The Lab lives here rather than in the nav: the same idea, with nothing to
    // guess and no clock.
    h('section', { class: 'card lab-promo', onclick: () => go('#/lab') },
      h('div', { class: 'promo-mark' }, icon('flask', { size: 28 })),
      h('div', { class: 'next-body' },
        h('small', { class: 'muted' }, ui('nav_lab')),
        h('h3', {}, 'A blank page and a Run button'),
        h('p', { class: 'muted' }, 'No question, no timer. Write whatever you like and watch it run — your work is kept between visits.'),
      ),
      h('span', { class: 'btn btn-ghost' }, 'Open the Lab', icon('arrowRight', { size: 15 })),
    ),
  );
}
