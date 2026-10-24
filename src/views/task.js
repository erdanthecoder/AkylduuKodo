// task.js — the screen where the maths actually happens.
//
// One question at a time, filling the screen. A wrong answer is never a dead
// end: the first miss gets a nudge and another go, the second shows how it
// works and moves on. Nothing is ever marked wrong and left unexplained.

import { h, svg, sound, cheer } from '../ui.js';
import { visual } from '../visuals.js';
import { check, response } from '../maths/check.js';
import * as store from '../state.js';

export function TaskView(task, { onFinish, onQuit }) {
  const answers = [];
  let index = 0;
  let tries = 0;
  const started = Date.now();

  const pips = h('div', { class: 'pips' },
    ...task.questions.map(() => h('span', { class: 'pip' })),
  );
  const stage = h('div', { class: 'card q-card' });
  const el = h('div', { class: 'wrap' },
    h('div', { class: 'task-top' },
      h('button', { class: 'btn btn-quiet small', onclick: onQuit }, 'Stop'),
      pips,
    ),
    stage,
  );

  function paintPips() {
    [...pips.children].forEach((pip, i) => {
      pip.className = 'pip'
        + (i === index ? ' is-now' : '')
        + (answers[i]?.right && answers[i].tries === 1 ? ' is-right' : '')
        + (answers[i]?.right && answers[i].tries > 1 ? ' is-fixed' : '');
    });
  }

  /* ------------------------------------------------------- the question body */

  function questionBody(q) {
    const bits = [h('p', { class: 'q-skill' }, q.skillName)];
    bits.push(h('h2', { class: 'q-prompt' }, q.prompt));
    if (q.statement) bits.push(h('div', { class: 'q-statement' }, q.statement));
    if (q.sequence) {
      bits.push(h('div', { class: 'q-sequence' },
        ...q.sequence.map((n) => h('span', { class: n === null ? 'blank' : '' }, n === null ? '?' : String(n))),
      ));
    }
    if (q.column) {
      const [a, b, op] = q.column;
      bits.push(h('div', { class: 'q-column' },
        h('span', {}, String(a)),
        h('span', {}, `${op} ${b}`),
      ));
    }
    const picture = visual(q.visual);
    if (picture) bits.push(picture);
    return bits;
  }

  /* -------------------------------------------------------------- the asking */

  function ask() {
    const q = task.questions[index];
    tries = 0;
    locked = false;
    paintPips();
    const say = h('div', {});

    if (q.kind === 'choice') {
      const buttons = q.choices.map((choice) =>
        h('button', {
          class: 'choice',
          // only a finished question ignores clicks: a first wrong answer
          // disables itself, and she must still be able to try another
          onclick: () => {
            if (locked) return;
            judge(q, choice, { buttons, chosen: choice, say });
          },
        }, choice),
      );
      stage.replaceChildren(
        ...questionBody(q),
        h('div', { class: `choices${q.choices.length === 2 ? ' two' : ''}` }, ...buttons),
        say,
      );
      return;
    }

    // everything else is typed into the box, with a pad for fingers
    const input = h('input', {
      inputmode: q.kind === 'fraction' || q.kind === 'text' ? 'text' : 'decimal',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-label': 'Your answer',
    });
    const box = h('div', { class: 'answer' },
      q.prefix ? h('span', { class: 'fix' }, q.prefix) : null,
      input,
      q.suffix ? h('span', { class: 'fix' }, q.suffix) : null,
    );
    const go = h('button', { class: 'btn btn-go btn-big', onclick: () => judge(q, input.value, { box, input, say }) }, 'Check');

    const type = (ch) => {
      input.value += ch;
      box.className = 'answer';
    };
    const pad = h('div', { class: 'pad' },
      ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => h('button', { onclick: () => type(n) }, n)),
      h('button', { class: 'wide', onclick: () => { input.value = input.value.slice(0, -1); } }, 'back'),
      h('button', { onclick: () => type('0') }, '0'),
      h('button', { class: 'wide', onclick: () => type(q.kind === 'fraction' ? '/' : q.kind === 'text' ? ':' : '.') },
        q.kind === 'fraction' ? '/' : q.kind === 'text' ? ':' : '.'),
    );

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') judge(q, input.value, { box, input, say }); });
    stage.replaceChildren(...questionBody(q), box, pad, go, say);
    // once the question is over these are in the way, so judge() takes them out
    parts_ = { box, input, say, pad, go };
    input.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------- the marking */

  let parts_ = null;
  let locked = false;          // true once the question is over, either way

  function judge(q, given, parts) {
    const { box, input, say, buttons, chosen } = parts;
    if (locked || !String(given ?? '').trim()) return;
    tries += 1;
    const { right } = check(q, given);

    if (right) {
      locked = true;
      if (box) box.className = 'answer is-right';
      if (buttons) {
        buttons.forEach((b) => { b.disabled = true; });
        buttons.find((b) => b.textContent === chosen)?.classList.add('is-right');
      }
      sound('right', store.get().sound);
      say.className = 'say say-yes';
      say.textContent = tries === 1 ? pickWell() : 'Got it the second time — that counts.';
      answers[index] = { ...q, given, right: true, tries };
      paintPips();
      setTimeout(next, 850);
      return;
    }

    sound('wrong', store.get().sound);
    if (box) { box.className = 'answer is-wrong'; setTimeout(() => { if (input) input.select(); }, 60); }
    if (buttons) buttons.find((b) => b.textContent === chosen)?.classList.add('is-wrong');

    if (tries === 1) {
      say.className = 'say say-try';
      say.textContent = response(q, given, true);
      if (buttons) buttons.find((b) => b.textContent === chosen).disabled = true;
      return;
    }

    // second miss: show how it works, then move on. Dwelling helps nobody.
    locked = true;
    say.className = 'say say-why';
    say.textContent = response(q, given, false);
    if (buttons) {
      buttons.forEach((b) => { b.disabled = true; });
      buttons.find((b) => b.textContent === q.answer)?.classList.add('is-right');
    }
    if (box) {
      box.className = 'answer';
      if (input) { input.value = q.answer; input.disabled = true; }
      parts_?.pad?.remove();
      parts_?.go?.remove();
    }
    answers[index] = { ...q, given, right: false, tries };
    paintPips();
    const on = h('button', { class: 'btn btn-go btn-big', onclick: next }, 'Next');
    stage.append(on);
    on.focus({ preventScroll: true });
  }

  const WELL = ['Yes!', 'That is right.', 'Well done.', 'Spot on.', 'Lovely.', 'Clever.'];
  let said = -1;
  function pickWell() {
    said = (said + 1) % WELL.length;
    return WELL[said];
  }

  function next() {
    index += 1;
    if (index >= task.questions.length) return finish();
    ask();
  }

  function finish() {
    const seconds = Math.round((Date.now() - started) / 1000);
    cheer(30);
    sound('done', store.get().sound);
    onFinish({ questions: task.questions, answers, seconds });
  }

  ask();
  return el;
}
