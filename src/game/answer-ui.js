// answer-ui.js — the answer buttons a player taps, for every question type.
//
// Used by the classic game and by the overlay in every arcade game, so a
// question works and looks the same wherever it appears.

import { h, fill } from '../ui/dom.js';
import { icon, shape } from '../ui/icons.js';
import { sfx } from './sound.js';

/**
 * answerPad(question, { showText, onSubmit }) → element
 * onSubmit(choice) is called once, with a choice validChoice() accepts.
 */
export function answerPad(q, { showText = true, onSubmit, compact = false }) {
  let sent = false;
  const send = (choice) => {
    if (sent) return;
    sent = true;
    root.classList.add('is-sent');
    onSubmit(choice);
  };
  const root = h('div', { class: `pad pad-${q.type}${compact ? ' is-compact' : ''}` });

  const big = (i, label, onclick, extra = '') => h('button', {
    type: 'button', class: `pad-btn c${i % 6}${extra}`, onclick: (e) => { sfx('tap'); onclick(e); },
  }, shape(i, compact ? 30 : 44), showText && label !== null ? h('span', {}, label) : null);

  if (q.type === 'mc' || q.type === 'poll') {
    root.classList.add(`n${q.options.length}`);
    q.options.forEach((o, i) => root.append(big(i, o, () => send(i))));
    return root;
  }

  if (q.type === 'tf') {
    root.classList.add('n2');
    root.append(big(1, 'True', () => send(true)), big(0, 'False', () => send(false)));
    return root;
  }

  if (q.type === 'multi') {
    const picked = new Set();
    root.classList.add(`n${q.options.length}`);
    const submit = h('button', { class: 'btn btn-main btn-lg pad-submit', disabled: true }, 'Submit');
    const buttons = q.options.map((o, i) => {
      const b = big(i, o, () => {
        if (picked.has(i)) picked.delete(i); else picked.add(i);
        b.classList.toggle('is-picked', picked.has(i));
        b.setAttribute('aria-pressed', String(picked.has(i)));
        submit.disabled = !picked.size;
      }, ' is-toggle');
      b.setAttribute('aria-pressed', 'false');
      return b;
    });
    submit.addEventListener('click', () => send([...picked].sort((a, b) => a - b)));
    root.append(h('p', { class: 'pad-hint' }, 'Pick every right answer, then submit.'), ...buttons, submit);
    return root;
  }

  if (q.type === 'order') {
    // tap the items in the right order; tap again to undo
    const order = [];
    const list = h('div', { class: 'order-list' });
    const submit = h('button', { class: 'btn btn-main btn-lg pad-submit', disabled: true }, 'Submit');
    const draw = () => {
      fill(list, ...q.options.map((o, i) => {
        const pos = order.indexOf(i);
        return h('button', {
          type: 'button', class: `order-item c${i % 6}${pos >= 0 ? ' is-placed' : ''}`,
          onclick: () => {
            sfx('tap');
            if (pos >= 0) order.splice(pos); else order.push(i);
            submit.disabled = order.length !== q.options.length;
            draw();
          },
        }, h('span', { class: 'order-n' }, pos >= 0 ? String(pos + 1) : ''), h('span', {}, o));
      }));
    };
    draw();
    submit.addEventListener('click', () => send([...order]));
    root.append(h('p', { class: 'pad-hint' }, 'Tap the items in the right order. Tap a numbered one to undo from there.'), list, submit);
    return root;
  }

  if (q.type === 'type' || q.type === 'number') {
    const box = h('input', {
      class: 'input input-xl', maxlength: 60, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: q.type === 'number' ? 'Type a number' : 'Type your answer',
      inputmode: q.type === 'number' ? 'decimal' : 'text', enterkeyhint: 'send', 'aria-label': 'Your answer',
    });
    const submit = h('button', { class: 'btn btn-main btn-lg pad-submit', disabled: true }, icon('arrowRight'), 'Submit');
    box.addEventListener('input', () => { submit.disabled = !box.value.trim(); });
    const go = () => { if (box.value.trim()) send(box.value.trim().slice(0, 60)); };
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    submit.addEventListener('click', go);
    root.append(h('div', { class: 'type-row' }, box, q.unit ? h('span', { class: 'unit' }, q.unit) : null), submit);
    setTimeout(() => box.focus(), 60);
    return root;
  }

  return root;
}

/** The big "Correct / Not quite" card shown after an answer is marked. */
export function verdict({ ok, poll, pts, display, streak }) {
  if (poll) return h('div', { class: 'verdict is-poll' }, icon('chart', { size: 56 }), h('h2', {}, 'Vote counted'));
  return h('div', { class: `verdict ${ok ? 'is-ok' : 'is-bad'}` },
    h('div', { class: 'verdict-icon' }, icon(ok ? 'check' : 'close', { size: 60, stroke: 3.6 })),
    h('h2', {}, ok ? 'Correct' : 'Not quite'),
    ok ? h('div', { class: 'verdict-pts' }, `+${pts}`) : null,
    ok && streak > 1 ? h('div', { class: 'pill pill-zing' }, icon('bolt', { size: 14 }), `${streak} in a row`) : null,
    !ok && display ? h('p', {}, 'The answer was ', h('b', {}, display)) : null);
}
