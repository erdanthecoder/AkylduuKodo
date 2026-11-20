// kit.js — toasts, modals, fields and the other pieces screens reuse.

import { h, fill } from './dom.js';
import { icon } from './icons.js';

/* ---------------------------------------------------------------- toasts */

export function toast(text, kind = '') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = h('div', { class: `toast${kind ? ` is-${kind}` : ''}`, role: 'status' }, text);
  box.append(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.25s, transform 0.25s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 260);
  }, kind === 'bad' ? 4200 : 2600);
}

/* ---------------------------------------------------------------- modals */

/**
 * modal(build) — build(close) returns the contents. Resolves with whatever
 * close() is called with; Escape and the backdrop close with undefined.
 */
export function modal(build, { wide = false, dismissible = true } = {}) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const back = h('div', { class: 'modal-back' });
    const box = h('div', { class: `modal${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true' });
    let done = false;
    const close = (value) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey);
      back.remove();
      if (prev && prev.focus) prev.focus();
      resolve(value);
    };
    const onKey = (e) => { if (e.key === 'Escape' && dismissible) close(undefined); };
    back.addEventListener('mousedown', (e) => { if (e.target === back && dismissible) close(undefined); });
    document.addEventListener('keydown', onKey);
    fill(box, build(close));
    back.append(box);
    document.body.append(back);
    const first = box.querySelector('input, textarea, button.btn-main, button');
    if (first) setTimeout(() => first.focus(), 30);
  });
}

export function confirm({ title, text, yes = 'Yes', no = 'Cancel', danger = false }) {
  return modal((close) => [
    h('h2', {}, title),
    text ? h('p', { class: 'muted' }, text) : null,
    h('div', { class: 'row end', style: { marginTop: '18px' } },
      h('button', { class: 'btn', onclick: () => close(false) }, no),
      h('button', { class: `btn ${danger ? 'btn-bad' : 'btn-main'}`, onclick: () => close(true) }, yes),
    ),
  ]).then(Boolean);
}

/* ---------------------------------------------------------------- fields */

export function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('small', { class: 'hint' }, hint) : null);
}

export function input(attrs = {}) {
  return h('input', { class: 'input', autocomplete: 'off', ...attrs });
}

/** A password box with a show/hide eye. */
export function passwordInput(attrs = {}) {
  const box = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', ...attrs });
  const eye = h('button', { type: 'button', class: 'btn btn-ghost btn-icon', 'aria-label': 'Show password',
    style: { position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', minHeight: '40px', width: '40px' } }, icon('eye'));
  eye.addEventListener('click', () => {
    const show = box.type === 'password';
    box.type = show ? 'text' : 'password';
    fill(eye, icon(show ? 'eyeOff' : 'eye'));
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  box.style.paddingRight = '48px';
  const wrap = h('div', { style: { position: 'relative' } }, box, eye);
  wrap.input = box;
  return wrap;
}

export function toggle(checked, onchange) {
  const box = h('input', { type: 'checkbox', checked: Boolean(checked) });
  box.addEventListener('change', () => onchange(box.checked));
  return h('label', { class: 'switch' }, box, h('i'));
}

/** Segmented choice. options: [[value, label], ...] */
export function segmented(options, value, onchange) {
  const root = h('div', { class: 'seg', role: 'radiogroup' });
  const draw = () => fill(root, ...options.map(([v, label]) =>
    h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(v === value), class: v === value ? 'is-on' : '',
      onclick: () => { value = v; draw(); onchange(v); },
    }, label)));
  draw();
  return root;
}

/** A button that shows a spinner and blocks repeat clicks while it works. */
export function busy(button, work) {
  return async (...args) => {
    if (button.disabled) return undefined;
    const before = [...button.childNodes];
    button.disabled = true;
    fill(button, h('span', { class: 'spinner', style: { width: '20px', height: '20px', borderWidth: '3px' } }));
    try {
      return await work(...args);
    } finally {
      button.disabled = false;
      fill(button, ...before);
    }
  };
}

export function loading(text) {
  return h('div', { class: 'loading' }, h('div', { class: 'stack', style: { justifyItems: 'center' } },
    h('div', { class: 'spinner' }), text ? h('p', { class: 'muted' }, text) : null));
}

export function empty(title, text, action) {
  return h('div', { class: 'empty' },
    h('h3', { style: { color: 'var(--ink)' } }, title),
    text ? h('p', {}, text) : null,
    action || null);
}

/** Copy to clipboard with a toast either way. */
export async function copy(text, what = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(what, 'ok');
  } catch {
    toast('Could not copy. Select it and copy by hand.', 'bad');
  }
}
