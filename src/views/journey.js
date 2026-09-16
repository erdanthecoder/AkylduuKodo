// journey.js — the map of units and lessons.

import { h } from '../ui.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';
import { UNITS, isUnlocked } from '../data/index.js';

const STEP_ICON = {
  teach: '📖',
  quiz: '❓',
  predict: '🔮',
  order: '🧵',
  type: '⌨️',
  code: '💻',
  bug: '🐛',
  robot: '🐃',
  unplugged: '🌍',
};

export function JourneyView(go) {
  const s = store.get();

  return h(
    'div',
    { class: 'view journey' },
    h('h1', { class: 'view-title' }, '🗺️ ' + ui('nav_journey')),
    ...UNITS.map((unit, ui_i) => {
      const done = unit.lessons.filter((l) => s.done[l.id]).length;
      return h(
        'section',
        { class: `card unit unit-${ui_i + 1}` },
        h('div', { class: 'unit-head' },
          h('span', { class: 'unit-emoji' }, unit.emoji),
          h('div', {},
            h('h2', {}, t(unit.title)),
            h('p', { class: 'muted' }, t(unit.blurb)),
          ),
          h('span', { class: 'unit-count' }, `${done}/${unit.lessons.length}`),
        ),
        h('div', { class: 'lesson-grid' },
          ...unit.lessons.map((lesson) => {
            const record = s.done[lesson.id];
            const open = isUnlocked(lesson.id, s.done);
            const card = h(
              'button',
              {
                class: `lesson-card ${record ? 'lesson-done' : ''} ${open ? '' : 'lesson-locked'}`,
                disabled: !open,
                title: open ? '' : ui('locked'),
                onclick: () => open && go(`#/lesson/${lesson.id}`),
              },
              h('div', { class: 'lesson-card-top' },
                h('span', { class: 'lesson-card-emoji' }, open ? lesson.emoji : '🔒'),
                record ? h('span', { class: 'stars small' }, '⭐'.repeat(record.stars)) : null,
              ),
              h('strong', {}, t(lesson.title)),
              h('small', { class: 'muted' }, t(lesson.blurb)),
              h('div', { class: 'lesson-card-foot' },
                h('span', { class: 'chip' }, `⏱️ ${lesson.minutes}m`),
                h('span', { class: 'chip' }, `⚡ ${lesson.xp}`),
                h('span', { class: 'kinds' }, [...new Set(lesson.steps.map((st) => STEP_ICON[st.type] || '•'))].join('')),
              ),
              h('span', { class: 'lesson-cta' }, record ? ui('replay') : ui('start')),
            );
            return card;
          }),
        ),
      );
    }),
  );
}
