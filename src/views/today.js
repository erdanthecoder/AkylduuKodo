// today.js — what Malika sees when she opens the site.
//
// One job: show her today's task and let her start it. If it is already done,
// say so plainly and offer a little extra rather than nagging.

import { h, svg } from '../ui.js';
import * as store from '../state.js';
import { SKILL_BY_ID } from '../maths/topics.js';
import { questionCount } from '../maths/task.js';

function sun() {
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'today-mark', 'aria-hidden': 'true' });
  s.append(svg('circle', { cx: 50, cy: 50, r: 24, fill: 'var(--sun)', stroke: 'var(--ink)', 'stroke-width': 4 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s.append(svg('line', {
      x1: 50 + Math.cos(a) * 32, y1: 50 + Math.sin(a) * 32,
      x2: 50 + Math.cos(a) * 44, y2: 50 + Math.sin(a) * 44,
      stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round',
    }));
  }
  return s;
}

function tick() {
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'today-mark', 'aria-hidden': 'true' });
  s.append(svg('circle', { cx: 50, cy: 50, r: 40, fill: 'var(--mint-soft)', stroke: 'var(--mint)', 'stroke-width': 5 }));
  s.append(svg('path', { d: 'M30 52 L44 66 L71 36', fill: 'none', stroke: 'var(--mint)', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

export function TodayView({ assignment, skills, minutes, onStart, onExtra }) {
  const s = store.get();
  const done = store.doneToday();
  const names = skills.map((x) => SKILL_BY_ID.get(x.id)?.name || x.id);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Hello' : 'Good evening';

  if (done) {
    return h('div', { class: 'wrap' },
      h('div', { class: 'card today-card' },
        tick(),
        h('h1', {}, 'All done for today'),
        h('p', { class: 'muted' }, 'You finished today\'s maths. Come back tomorrow.'),
        s.streak > 1 ? h('p', {}, h('strong', {}, `${s.streak} days in a row.`)) : null,
        h('button', { class: 'btn btn-big', onclick: onExtra }, 'One more, just for fun'),
      ),
    );
  }

  return h('div', { class: 'wrap' },
    h('p', { class: 'hello' }, `${greeting}, ${s.name}.`),
    h('p', { class: 'muted' }, assignment ? 'Here is what you have been set.' : 'Here is today\'s maths.'),
    h('div', { class: 'card today-card' },
      sun(),
      h('h1', {}, 'Today\'s task'),
      h('div', { class: 'chips' },
        h('span', { class: 'chip' }, `${minutes} minutes`),
        h('span', { class: 'chip' }, `${questionCount(minutes)} questions`),
      ),
      h('div', { class: 'chips' }, ...names.map((n) => h('span', { class: 'chip chip-topic' }, n))),
      assignment?.note
        ? h('div', { class: 'note' }, h('strong', {}, 'A note for you'), assignment.note)
        : null,
      h('button', { class: 'btn btn-go btn-big', onclick: onStart }, 'Start'),
    ),
  );
}
