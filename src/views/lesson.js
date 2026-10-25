// lesson.js — a whole lesson, in the order teaching actually works.
//
//   1. Teach    — the idea, with a picture. A Next button and nothing else.
//   2. Show     — one worked example, uncovered a step at a time, so she
//                 watches it done before she is asked to do it.
//   3. Practise — her own questions, with the same help as before.
//
// The bar across the top shows those three parts, so she always knows how much
// is left and which part she is in.

import { h, svg, sound, cheer } from '../ui.js';
import { visual } from '../visuals.js';
import { check, response } from '../maths/check.js';
import { mascot, saysSomething } from '../mascot.js';
import { say as speak, hush, canSpeak } from '../speak.js';
import { buildTask } from '../maths/task.js';
import * as store from '../state.js';

export function LessonView(lesson, { onFinish, onQuit }) {
  const task = buildTask({
    skills: [{ id: lesson.practice.skill, level: lesson.practice.level || 1 }],
    minutes: Math.max(3, Math.round((lesson.practice.count || 5) / 1.8)),
    seed: `${lesson.id}-${store.today()}`,
  });
  const questions = task.questions.slice(0, lesson.practice.count || 5);

  const stage = h('div', { class: 'card lesson-card' });
  const crumbs = h('div', { class: 'crumbs' });
  // the lesson carries its unit's colour, so a lesson never feels detached
  // from the part of the course it belongs to
  const el = h('div', { class: `wrap page tint-${lesson.unit?.colour || 'sky'}` },
    h('div', { class: 'lesson-top' },
      h('button', { class: 'btn btn-quiet small', onclick: () => { hush(); onQuit(); } }, 'Back'),
      h('span', { class: 'lesson-name' }, `Lesson ${lesson.n} · ${lesson.title}`),
    ),
    crumbs,
    stage,
  );

  let part = 'teach';            // teach · show · practice
  let teachAt = 0;
  let showAt = 0;
  let qAt = 0;
  const answers = [];

  function paintCrumbs() {
    const steps = [
      { key: 'teach', label: 'Learn' },
      { key: 'show', label: 'Watch' },
      { key: 'practice', label: 'Try' },
    ];
    const order = ['teach', 'show', 'practice'];
    crumbs.replaceChildren(...steps.map((s) =>
      h('span', {
        class: 'crumb' + (s.key === part ? ' is-now'
          : order.indexOf(s.key) < order.indexOf(part) ? ' is-done' : ''),
      }, s.label),
    ));
  }

  const speaker = (text) => canSpeak()
    ? h('button', { class: 'speaker', title: 'Read it to me', 'aria-label': 'Read this out loud',
        onclick: () => speak(text) },
        (() => {
          const s = svg('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true' });
          s.append(svg('path', { d: 'M4 9v6h4l5 4V5L8 9H4z', fill: 'currentColor' }));
          s.append(svg('path', { d: 'M16 8.5a4.5 4.5 0 0 1 0 7', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }));
          return s;
        })())
    : null;

  /* ------------------------------------------------------------- 1. teach */

  function teach() {
    part = 'teach';
    paintCrumbs();
    const card = lesson.teach[teachAt];
    const last = teachAt === lesson.teach.length - 1;
    const picture = visual(card.visual);
    stage.replaceChildren(
      h('div', { class: 'row spread teach-head' },
        h('span', { class: 'q-skill' }, `${teachAt + 1} of ${lesson.teach.length}`),
        speaker(card.say),
      ),
      picture ? h('div', { class: 'teach-pic' }, picture) : null,
      h('p', { class: 'teach-say' }, card.say),
      h('button', { class: 'btn btn-go btn-big', onclick: () => {
        hush();
        if (last) { showAt = 0; return show(); }
        teachAt += 1;
        teach();
      } }, last ? 'Show me one' : 'Next'),
    );
    if (store.get().readAloud) speak(card.say);
  }

  /* -------------------------------------------------------------- 2. show */

  function show() {
    part = 'show';
    paintCrumbs();
    const steps = lesson.show.steps.slice(0, showAt + 1);
    const last = showAt === lesson.show.steps.length - 1;
    const current = lesson.show.steps[showAt];
    stage.replaceChildren(
      h('div', { class: 'row spread teach-head' },
        h('span', { class: 'q-skill' }, 'Watch how it is done'),
        speaker(`${lesson.show.prompt}. ${current.say}`),
      ),
      h('h2', { class: 'show-prompt' }, lesson.show.prompt),
      h('ol', { class: 'show-steps' },
        ...steps.map((st, i) =>
          h('li', { class: i === showAt ? 'is-now' : '' },
            h('span', {}, st.say),
            st.visual && i === showAt ? h('div', { class: 'teach-pic small' }, visual(st.visual)) : null,
          ),
        ),
      ),
      h('button', { class: 'btn btn-go btn-big', onclick: () => {
        hush();
        if (last) { qAt = 0; return practise(); }
        showAt += 1;
        show();
      } }, last ? 'Now I will try' : 'Then what?'),
    );
    if (store.get().readAloud) speak(current.say);
  }

  /* ---------------------------------------------------------- 3. practise */

  const friend = h('div', { class: 'friend' }, mascot('hello', 48));
  const friendSays = h('p', { class: 'friend-says' }, saysSomething('hello'));
  let moods = 0;
  function setMood(mood) {
    friend.replaceChildren(mascot(mood, 48));
    friendSays.textContent = saysSomething(mood, moods++);
  }

  let tries = 0;
  let locked = false;

  function practise() {
    part = 'practice';
    paintCrumbs();
    const q = questions[qAt];
    tries = 0;
    locked = false;
    const said = h('div', {});
    const spoken = [q.prompt, q.statement, q.kind === 'choice' ? q.choices.join(', ') : null].filter(Boolean).join('. ');

    const head = h('div', { class: 'row spread teach-head' },
      h('span', { class: 'q-skill' }, `Question ${qAt + 1} of ${questions.length}`),
      speaker(spoken),
    );
    const body = [head, h('h2', { class: 'q-prompt' }, q.prompt)];
    if (q.statement) body.push(h('div', { class: 'q-statement' }, q.statement));
    if (q.sequence) {
      body.push(h('div', { class: 'q-sequence' },
        ...q.sequence.map((n) => h('span', { class: n === null ? 'blank' : '' }, n === null ? '?' : String(n)))));
    }
    const pic = visual(q.visual);
    if (pic) body.push(h('div', { class: 'teach-pic' }, pic));

    if (q.kind === 'choice') {
      const buttons = q.choices.map((choice) =>
        h('button', { class: 'choice', onclick: () => { if (!locked) judge(q, choice, { buttons, chosen: choice, said }); } }, choice));
      stage.replaceChildren(...body,
        h('div', { class: `choices${q.choices.length === 2 ? ' two' : ''}` }, ...buttons),
        said, h('div', { class: 'friend-row' }, friend, friendSays));
      if (store.get().readAloud) speak(spoken);
      return;
    }

    const input = h('input', {
      inputmode: q.kind === 'fraction' || q.kind === 'text' ? 'text' : 'decimal',
      autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your answer',
    });
    const box = h('div', { class: 'answer' },
      q.prefix ? h('span', { class: 'fix' }, q.prefix) : null, input,
      q.suffix ? h('span', { class: 'fix' }, q.suffix) : null);
    const go = h('button', { class: 'btn btn-go btn-big', onclick: () => judge(q, input.value, { box, input, said, pad, go }) }, 'Check');
    const type = (ch) => { input.value += ch; box.className = 'answer'; };
    const pad = h('div', { class: 'pad' },
      ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => h('button', { onclick: () => type(n) }, n)),
      h('button', { class: 'wide', onclick: () => { input.value = input.value.slice(0, -1); } }, 'back'),
      h('button', { onclick: () => type('0') }, '0'),
      h('button', { class: 'wide', onclick: () => type(q.kind === 'fraction' ? '/' : q.kind === 'text' ? ':' : '.') },
        q.kind === 'fraction' ? '/' : q.kind === 'text' ? ':' : '.'));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') judge(q, input.value, { box, input, said, pad, go }); });

    stage.replaceChildren(...body, box, pad, go, said, h('div', { class: 'friend-row' }, friend, friendSays));
    input.focus({ preventScroll: true });
    if (store.get().readAloud) speak(spoken);
  }

  function judge(q, given, parts) {
    const { box, input, said, buttons, chosen, pad, go } = parts;
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
      setMood('yes');
      said.className = 'say say-yes';
      said.textContent = tries === 1 ? 'Yes, that is right.' : 'Right on the second go.';
      answers.push({ ...q, given, right: true, tries });
      setTimeout(nextQuestion, 800);
      return;
    }

    sound('wrong', store.get().sound);
    setMood('oops');
    if (box) { box.className = 'answer is-wrong'; setTimeout(() => input?.select(), 60); }
    if (buttons) {
      const hit = buttons.find((b) => b.textContent === chosen);
      if (hit) { hit.classList.add('is-wrong'); hit.disabled = true; }
    }

    if (tries === 1) {
      said.className = 'say say-try';
      said.textContent = response(q, given, true);
      return;
    }

    locked = true;
    setMood('thinking');
    said.className = 'say say-why';
    said.textContent = response(q, given, false);
    if (store.get().readAloud) speak(response(q, given, false));
    if (buttons) {
      buttons.forEach((b) => { b.disabled = true; });
      buttons.find((b) => b.textContent === q.answer)?.classList.add('is-right');
    }
    if (box && input) { input.value = q.answer; input.disabled = true; pad?.remove(); go?.remove(); }
    answers.push({ ...q, given, right: false, tries });
    const on = h('button', { class: 'btn btn-go btn-big', onclick: nextQuestion }, 'Next');
    stage.insertBefore(on, said.nextSibling);
    on.focus({ preventScroll: true });
  }

  function nextQuestion() {
    hush();
    qAt += 1;
    if (qAt >= questions.length) {
      const right = answers.filter((a) => a.right).length;
      cheer(28);
      sound('done', store.get().sound);
      return onFinish({ lesson, answers, right, asked: questions.length });
    }
    practise();
  }

  paintCrumbs();
  teach();
  return el;
}
