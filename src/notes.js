// notes.js — the notebook.
//
// Anywhere in the app a learner can open a pad and write: on a lesson, on a
// page of the C++ book, or on its own. Notes are part of the save file, so they
// ride along to the cloud with everything else.

import { h } from './ui.js';
import { icon } from './icons.js';
import * as store from './state.js';

const SAVE_DELAY = 500;

export function noteKey(kind, id) {
  return `${kind}:${id}`;
}

export function getNote(key) {
  return store.get().notes?.[key] || null;
}

export function noteText(key) {
  return getNote(key)?.text || '';
}

export function setNote(key, text, meta = {}) {
  const notes = { ...(store.get().notes || {}) };
  const clean = text.trim();
  if (!clean) delete notes[key];
  else notes[key] = { ...meta, text, at: new Date().toISOString() };
  store.set({ notes });
}

/** Every note, newest first, with the label it was written against. */
export function allNotes() {
  const notes = store.get().notes || {};
  return Object.entries(notes)
    .map(([key, note]) => ({ key, ...note }))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function noteCount() {
  return Object.keys(store.get().notes || {}).length;
}

/**
 * A pad that saves itself. Give it a key and a title; it looks after the rest.
 *
 * @param {object} opts
 *  - key: where to store it, from noteKey()
 *  - title/label: what this note is about, shown on the Notes page
 *  - href: where to go back to, from the Notes page
 *  - open: start expanded
 */
export function notePad({ key, title = 'Note', label = '', href = '', placeholder = '', open = false, compact = false } = {}) {
  const existing = noteText(key);
  const status = h('span', { class: 'pad-status' }, existing ? 'Saved' : '');
  const area = h('textarea', {
    class: 'pad-area',
    rows: compact ? 4 : 6,
    placeholder: placeholder || 'What do you want to remember?',
    spellcheck: 'false',
  });
  area.value = existing;

  let timer = 0;
  const flush = () => {
    clearTimeout(timer);
    setNote(key, area.value, { title, label, href });
    status.textContent = area.value.trim() ? 'Saved' : '';
    status.classList.add('is-flash');
    setTimeout(() => status.classList.remove('is-flash'), 700);
  };
  area.addEventListener('input', () => {
    status.textContent = 'Writing…';
    clearTimeout(timer);
    timer = setTimeout(flush, SAVE_DELAY);
  });
  area.addEventListener('blur', flush);

  const body = h('div', { class: 'pad-body' },
    area,
    h('div', { class: 'pad-foot' },
      h('span', { class: 'muted small' }, 'Saved as you type, kept with your progress.'),
      status,
    ),
  );

  const pad = h('section', { class: 'pad' + (open || existing ? ' is-open' : '') },
    h('button', {
      class: 'pad-toggle',
      onclick: (e) => {
        const el = e.currentTarget.parentElement;
        el.classList.toggle('is-open');
        if (el.classList.contains('is-open')) area.focus();
      },
    },
      h('span', { class: 'pad-mark' }, icon('pencil', { size: 16 })),
      h('span', { class: 'pad-title' }, title),
      existing ? h('span', { class: 'pad-dot' }) : null,
      h('span', { class: 'pad-chevron' }, icon('chevronRight', { size: 16 })),
    ),
    body,
  );
  return pad;
}
