// settings.js — everything the learner can change: who they are, how fast they
// go, how the app looks and moves, where their progress lives, and the big red
// button at the end.

import { h, toast } from '../ui.js';
import { icon } from '../icons.js';
import { ui, LANGS } from '../i18n.js';
import * as store from '../state.js';
import * as auth from '../auth.js';
import { THEMES, MOTION, TEXT_SIZES, CODE_SIZES, exportProgress, importProgress } from '../prefs.js';

const GOALS = [3, 5, 7, 10];

/** One row of mutually exclusive choices. */
function choice(options, current, onPick) {
  return h('div', { class: 'chips' },
    ...options.map((o) =>
      h('button', {
        class: `chip chip-btn ${current === o.id ? 'chip-on' : ''}`,
        onclick: () => onPick(o.id),
        title: o.note || '',
      }, o.label),
    ),
  );
}

function section(ic, title, note, ...body) {
  return h('section', { class: 'card setting-card' },
    h('div', { class: 'setting-head' },
      h('span', { class: 'setting-mark' }, icon(ic, { size: 18 })),
      h('div', {},
        h('h3', {}, title),
        note ? h('p', { class: 'muted small' }, note) : null,
      ),
    ),
    ...body,
  );
}

export function SettingsView(go, rerender) {
  const s = store.get();
  const u = auth.user();
  const set = (patch, message) => {
    store.set(patch);
    if (message) toast(message, 'ok');
    rerender();
  };

  const nameInput = h('input', {
    class: 'text-input',
    value: s.name,
    placeholder: 'Aisuluu',
    oninput: (e) => store.set({ name: e.target.value.slice(0, 24) }),
  });

  const custom = h('input', {
    class: 'text-input small-input',
    type: 'number',
    min: '1',
    max: '30',
    value: String(s.goalPerWeek),
    onchange: (e) => set({ goalPerWeek: Math.max(1, Math.min(30, Number(e.target.value) || 5)) }),
  });

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'hidden-file',
    onchange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const n = await importProgress(file);
        toast(`Progress restored — ${n} lessons found.`, 'ok');
        rerender();
      } catch (err) {
        toast(err.message || 'That file could not be read.', 'bad');
      }
      e.target.value = '';
    },
  });

  const done = Object.keys(s.done).length;

  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, ui('nav_settings')),
    h('p', { class: 'muted view-lede' }, 'Nothing here is locked. Change any of it, any time — it takes effect straight away.'),

    // ------------------------------------------------------------- about you
    section('user', ui('name_q'), 'Only used to greet you.', nameInput),

    section('target', ui('goal_q'), ui('goal_note'),
      choice(GOALS.map((n) => ({ id: n, label: `${n} / week` })), s.goalPerWeek,
        (n) => set({ goalPerWeek: n }, `Goal set: ${n} lessons per week`)),
      h('div', { class: 'row gap center setting-extra' },
        h('span', { class: 'muted small' }, 'or your own number:'), custom,
        h('span', { class: 'muted small' }, `about ${s.goalPerWeek * 4} a month`),
      ),
    ),

    section('globe', ui('lang'), 'Lesson text is English for now; the app chrome speaks Kyrgyz too.',
      choice(LANGS.map((l) => ({ id: l.id, label: l.label })), s.lang, (id) => set({ lang: id })),
    ),

    // -------------------------------------------------------------- the look
    section('eye', 'Appearance', 'Follow your device, or pick a side.',
      choice(THEMES, s.theme || 'auto', (id) => set({ theme: id })),
    ),

    section('sparkle', 'Movement', 'Calm mode holds the flights, the parallax and the confetti still. Useful on an old laptop, or when animation is distracting.',
      choice(MOTION, s.motion || 'full', (id) => set({ motion: id })),
    ),

    section('book', 'Reading size', 'Makes every word in the app bigger.',
      choice(TEXT_SIZES, s.textSize || 'normal', (id) => set({ textSize: id })),
    ),

    section('code', 'Code size', 'The editor and the output panel only.',
      choice(CODE_SIZES, s.codeSize || 'md', (id) => set({ codeSize: id })),
      h('pre', { class: 'code-sample setting-sample' }, 'let city = "Bishkek";\nconsole.log("Hello, " + city);'),
    ),

    section('puzzle', 'Blocks or typing', 'Which one a lesson opens with. You can still switch inside any step.',
      choice([
        { id: 'blocks', label: 'Start with blocks' },
        { id: 'code', label: 'Start with code' },
      ], s.mode, (id) => set({ mode: id })),
    ),

    section('sound', ui('sound'), 'Small clicks and chimes as you work.',
      h('label', { class: 'switch-row' },
        h('input', {
          type: 'checkbox',
          class: 'switch',
          checked: s.sound,
          onchange: (e) => {
            store.set({ sound: e.target.checked });
            rerender();
          },
        }),
        h('span', {}, s.sound ? 'On' : 'Off'),
      ),
    ),

    // ------------------------------------------------------------- your data
    section('cloud', 'Your progress',
      u ? `Signed in as ${u.email || u.name}. Everything saves to your account.`
        : 'Saved in this browser only. Sign in and it follows you to any device.',
      h('p', { class: 'muted small' }, `${done} lessons finished · ${s.xp} XP · ${store.streak()} day streak`),
      h('div', { class: 'row gap wrap setting-extra' },
        h('button', { class: 'btn btn-ghost', onclick: () => go('#/account') },
          icon('user', { size: 16 }), u ? 'Account' : 'Sign in'),
        h('button', { class: 'btn btn-ghost', onclick: () => { exportProgress(); toast('Downloaded.', 'ok'); } },
          icon('layers', { size: 16 }), 'Export a copy'),
        h('button', { class: 'btn btn-ghost', onclick: () => fileInput.click() },
          icon('reset', { size: 16 }), 'Restore from a file'),
        fileInput,
      ),
    ),

    h('section', { class: 'card danger setting-card' },
      h('div', { class: 'setting-head' },
        h('span', { class: 'setting-mark mark-danger' }, icon('flame', { size: 18 })),
        h('div', {},
          h('h3', {}, ui('reset_all')),
          h('p', { class: 'muted small' }, 'Erases every lesson, badge and setting on this device. There is no undo.'),
        ),
      ),
      h('button', {
        class: 'btn btn-danger btn-inline',
        onclick: () => {
          if (!confirm(ui('reset_confirm'))) return;
          store.reset();
          toast('Everything erased. Fresh start.', 'warn');
          go('#/home');
        },
      }, ui('reset_all')),
    ),

    h('p', { class: 'muted small center' }, 'AkylduuKodo · made for curious people'),
  );
}
