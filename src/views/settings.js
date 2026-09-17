// settings.js — name, weekly goal, language, sound, and the big red button.

import { h, toast } from '../ui.js';
import { icon } from '../icons.js';
import { ui, LANGS } from '../i18n.js';
import * as store from '../state.js';

const GOALS = [3, 5, 7, 10];

export function SettingsView(go, rerender) {
  const s = store.get();

  const nameInput = h('input', {
    class: 'text-input',
    value: s.name,
    placeholder: 'Aisuluu',
    oninput: (e) => store.set({ name: e.target.value.slice(0, 24) }),
  });

  const goalRow = h('div', { class: 'chips' },
    ...GOALS.map((n) =>
      h('button', {
        class: `chip chip-btn ${s.goalPerWeek === n ? 'chip-on' : ''}`,
        onclick: () => {
          store.set({ goalPerWeek: n });
          toast(`Goal set: ${n} lessons per week`, 'ok');
          rerender();
        },
      }, `${n} / week`),
    ),
  );

  const custom = h('input', {
    class: 'text-input small-input',
    type: 'number',
    min: '1',
    max: '30',
    value: String(s.goalPerWeek),
    onchange: (e) => {
      const n = Math.max(1, Math.min(30, Number(e.target.value) || 5));
      store.set({ goalPerWeek: n });
      rerender();
    },
  });

  const perMonth = s.goalPerWeek * 4;

  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, ui('nav_settings')),

    h('section', { class: 'card' },
      h('h3', {}, ui('name_q')),
      nameInput,
    ),

    h('section', { class: 'card' },
      h('h3', {}, ui('goal_q')),
      h('p', { class: 'muted' }, ui('goal_note')),
      goalRow,
      h('div', { class: 'row gap center' }, h('span', { class: 'muted' }, 'or your own number:'), custom),
      h('p', { class: 'muted' }, `That is about ${perMonth} lessons a month.`),
    ),

    h('section', { class: 'card' },
      h('h3', {}, ui('lang')),
      h('div', { class: 'chips' },
        ...LANGS.map((l) =>
          h('button', {
            class: `chip chip-btn ${s.lang === l.id ? 'chip-on' : ''}`,
            onclick: () => {
              store.set({ lang: l.id });
              rerender();
            },
          }, l.label),
        ),
      ),
      h('p', { class: 'muted small' }, 'Lesson text is English for now; the app chrome speaks Kyrgyz too.'),
    ),

    h('section', { class: 'card' },
      h('h3', {}, ui('sound')),
      h('label', { class: 'switch-row' },
        h('input', {
          type: 'checkbox',
          checked: s.sound,
          onchange: (e) => store.set({ sound: e.target.checked }),
        }),
        h('span', {}, ui('sound')),
      ),
    ),

    h('section', { class: 'card danger' },
      h('h3', {}, ui('reset_all')),
      h('button', {
        class: 'btn btn-danger',
        onclick: () => {
          if (!confirm(ui('reset_confirm'))) return;
          store.reset();
          toast('Everything erased. Fresh start.', 'warn');
          go('#/home');
        },
      }, ui('reset_all')),
    ),

    h('p', { class: 'muted small center' }, 'AkylduuKodo · made for curious people · progress lives in this browser only'),
  );
}
