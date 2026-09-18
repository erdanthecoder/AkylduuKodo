// shell.js — the frame every activity sits in.
//
// Four very different things happen inside the stage, but they all open the
// same way, keep score in the same place, and finish on the same card. That
// sameness is what makes them feel like one section rather than four toys.

import { h, confetti } from '../ui.js';
import { icon } from '../icons.js';
import { ui } from '../i18n.js';
import * as store from '../state.js';

/** One reading in the bar across the top: an icon and a live number. */
export function hudItem(name, value, title) {
  const el = h('span', { class: 'hud-value' }, String(value));
  const wrap = h('span', { class: 'hud-item', title: title || '' }, icon(name, { size: 17 }), el);
  return { wrap, set: (v) => { el.textContent = String(v); }, el };
}

/**
 * Title, HUD and an empty stage. Engines own the stage and nothing else, so
 * quitting, scoring and the heading never drift apart between activities.
 */
export function activityShell(activity, go, ...hudExtras) {
  const stage = h('div', { class: 'stage' });
  const el = h('div', { class: 'view drill-view' },
    h('div', { class: 'act-head' },
      h('h1', { class: 'view-title' }, icon(activity.icon, { size: 24 }), activity.name),
      h('div', { class: 'hud' },
        ...hudExtras,
        h('button', { class: 'btn btn-ghost hud-quit', title: 'Leave', onclick: () => go('#/practice') }, icon('close', { size: 17 })),
      ),
    ),
    stage,
  );
  return { el, stage };
}

/**
 * Score, personal best, anything newly earned, and a way straight back in.
 * `lines` are the small facts worth reading afterwards — how fast, how
 * accurate — which is what actually tells you whether you improved.
 */
export function finishCard(activity, score, go, { title, mark = 'trophy', lines = [] } = {}) {
  const res = store.recordBest(activity.id, score);
  if (res.isBest) confetti(24);
  return h('div', { class: 'card celebrate act-finish' },
    h('div', { class: 'big-mark' }, icon(res.isBest ? 'trophy' : mark, { size: 44 })),
    h('h2', {}, res.isBest ? 'New personal best' : title || 'Nice work'),
    res.isBest && title ? h('p', { class: 'muted' }, title) : null,
    h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
    lines.length
      ? h('div', { class: 'act-stats' }, ...lines.map((l) =>
          h('div', { class: 'act-stat' },
            h('strong', {}, String(l.value)),
            h('small', { class: 'muted' }, l.label),
          ),
        ))
      : null,
    res.earned.length
      ? h('div', { class: 'badge-pop' }, ...res.earned.map((b) => h('div', { class: 'badge-chip' }, b.name)))
      : null,
    h('div', { class: 'row gap' },
      h('button', { class: 'btn btn-primary', onclick: () => go(`#/practice/${activity.id}`, true) }, ui('again')),
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
    ),
  );
}

/** A full-width panel that explains the rules before the clock starts. */
export function briefing(activity, { rules, cta = 'Start', onStart }) {
  return h('div', { class: 'card act-brief' },
    h('div', { class: 'act-brief-mark' }, icon(activity.icon, { size: 30 })),
    h('h2', {}, activity.name),
    h('p', { class: 'muted' }, activity.desc),
    h('ul', { class: 'act-rules' }, ...rules.map((r) => h('li', {}, r))),
    h('button', { class: 'btn btn-primary btn-lg', onclick: onStart }, cta),
  );
}
