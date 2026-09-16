// lesson.js — the lesson player: one step at a time, seven kinds of step.

import { h, md, codeBlock, toast, confetti, sfx, shuffle, clear } from '../ui.js';
import { createEditor, createConsole } from '../editor.js';
import { createBlocks } from '../blocks.js';
import { runCode } from '../runner.js';
import { runRobot, DIRS } from '../robot.js';
import { safeCheck } from '../data/checks.js';
import { lessonById, nextLesson } from '../data/index.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';

export function LessonView(lessonId, go) {
  const lesson = lessonById(lessonId);
  if (!lesson) return h('div', { class: 'card' }, 'Lesson not found.');

  let index = 0;
  let stars = 3;
  let solved = false;

  const dots = h('div', { class: 'step-dots' });
  const body = h('div', { class: 'step-body' });
  const nextBtn = h('button', { class: 'btn btn-primary', disabled: true, onclick: () => advance() }, ui('next') + ' →');
  const backBtn = h(
    'button',
    { class: 'btn btn-ghost', onclick: () => (index === 0 ? go('#/journey') : (index--, renderStep())) },
    '←',
  );

  const el = h(
    'div',
    { class: 'lesson' },
    h(
      'div',
      { class: 'lesson-head' },
      h('button', { class: 'btn btn-ghost btn-exit', onclick: () => go('#/journey') }, '✕'),
      h(
        'div',
        { class: 'lesson-title' },
        h('span', { class: 'lesson-emoji' }, lesson.emoji),
        h('span', {}, t(lesson.title)),
      ),
      dots,
    ),
    body,
    h('div', { class: 'lesson-foot' }, backBtn, h('span', { class: 'spacer' }), nextBtn),
  );

  function markSolved(silent = false) {
    if (solved) return;
    solved = true;
    nextBtn.disabled = false;
    nextBtn.classList.add('pulse');
    if (!silent) sfx('good', store.get().sound);
  }

  function advance() {
    if (index >= lesson.steps.length - 1) return finish();
    index++;
    renderStep();
  }

  function finish() {
    const result = store.completeLesson(lesson.id, lesson.xp, stars);
    confetti(40);
    sfx('great', store.get().sound);
    clear(body);
    const week = store.weekProgress();
    const nxt = nextLesson(lesson.id);
    body.append(
      h(
        'div',
        { class: 'card celebrate' },
        h('div', { class: 'big-emoji' }, '🎉'),
        h('h2', {}, ui('lesson_done')),
        h('div', { class: 'stars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
        h('p', { class: 'xp-line' }, `+${result.gained} ${ui('xp')}`),
        result.earned.length
          ? h(
              'div',
              { class: 'badge-pop' },
              ...result.earned.map((b) => h('div', { class: 'badge-chip' }, `${b.emoji} ${ui('new_badge')}: ${b.name}`)),
            )
          : null,
        h(
          'div',
          { class: 'week-mini' },
          h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${week.pct}%` })),
          h(
            'small',
            {},
            week.count >= week.goal
              ? ui('goal_reached')
              : `${week.count}/${week.goal} ${ui('lessons_done')} — ${week.goal - week.count} ${ui('keep_going')}`,
          ),
        ),
        h(
          'div',
          { class: 'row gap' },
          nxt
            ? h('button', { class: 'btn btn-primary', onclick: () => go(`#/lesson/${nxt.id}`) }, `${nxt.emoji} ${t(nxt.title)} →`)
            : null,
          h('button', { class: 'btn btn-ghost', onclick: () => go('#/journey') }, ui('back_to_journey')),
        ),
      ),
    );
    if (result.earned.length) sfx('badge', store.get().sound);
    dots.replaceChildren();
    el.querySelector('.lesson-foot').style.display = 'none';
  }

  function renderStep() {
    solved = false;
    nextBtn.disabled = true;
    nextBtn.classList.remove('pulse');
    const step = lesson.steps[index];
    nextBtn.textContent = index === lesson.steps.length - 1 ? '🏁 Finish' : ui('next') + ' →';

    dots.replaceChildren(
      ...lesson.steps.map((s, i) =>
        h('span', { class: 'dot ' + (i < index ? 'dot-done' : i === index ? 'dot-now' : ''), title: s.type }),
      ),
    );

    clear(body);
    body.append(renderStepBody(step, { markSolved, useHint: () => (stars = Math.max(1, stars - 1)), useSolution: () => (stars = 1) }));
    body.scrollIntoView?.({ block: 'nearest' });
  }

  renderStep();
  return el;
}

// ---------------------------------------------------------------- step types

function renderStepBody(step, api) {
  switch (step.type) {
    case 'teach':
      return teachStep(step, api);
    case 'quiz':
    case 'predict':
      return quizStep(step, api);
    case 'order':
      return orderStep(step, api);
    case 'type':
      return typeStep(step, api);
    case 'unplugged':
      return unpluggedStep(step, api);
    case 'robot':
      return robotStep(step, api);
    case 'code':
    case 'bug':
    default:
      return codeStep(step, api);
  }
}

function teachStep(step, api) {
  api.markSolved(true);
  return h(
    'div',
    { class: 'card teach' },
    h('h2', {}, t(step.title)),
    h('div', { class: 'prose', html: md(t(step.text)) }),
    step.code ? codeBlock(t(step.code)) : null,
    step.tip ? h('div', { class: 'tip', html: '💡 ' + md(t(step.tip)) }) : null,
  );
}

function quizStep(step, api) {
  const why = h('div', { class: 'why hidden', html: md(t(step.why)) });
  const opts = h('div', { class: 'options' });
  let answered = false;

  step.options.forEach((label, i) => {
    const btn = h(
      'button',
      {
        class: 'option',
        onclick: () => {
          if (answered) return;
          if (i === step.answer) {
            answered = true;
            btn.classList.add('option-right');
            why.classList.remove('hidden');
            api.markSolved();
          } else {
            btn.classList.add('option-wrong');
            btn.disabled = true;
            sfx('bad', store.get().sound);
            toast(ui('not_yet') + ' try another one 🤔', 'warn');
          }
        },
      },
      label,
    );
    opts.append(btn);
  });

  return h(
    'div',
    { class: 'card' },
    h('h2', {}, step.type === 'predict' ? '🔮 What does this print?' : t(step.q)),
    step.code ? codeBlock(t(step.code)) : null,
    step.type === 'predict' && step.q ? h('p', { class: 'prompt' }, t(step.q)) : null,
    opts,
    why,
  );
}

function orderStep(step, api) {
  const correct = step.lines;
  let current = shuffle(correct);
  if (current.join('\n') === correct.join('\n')) current = [...current.reverse()];

  const list = h('div', { class: 'order-list' });
  const feedback = h('div', { class: 'feedback' });
  let dragFrom = null;

  function draw() {
    list.replaceChildren();
    current.forEach((line, i) => {
      list.append(
        h(
          'div',
          {
            class: 'order-item',
            draggable: 'true',
            ondragstart: () => (dragFrom = i),
            ondragover: (e) => e.preventDefault(),
            ondrop: (e) => {
              e.preventDefault();
              if (dragFrom === null || dragFrom === i) return;
              const [m] = current.splice(dragFrom, 1);
              current.splice(i, 0, m);
              dragFrom = null;
              draw();
            },
          },
          h('span', { class: 'grip' }, '⋮⋮'),
          h('code', {}, line),
          h('span', { class: 'order-tools' },
            h('button', { class: 'mini-btn', onclick: () => swap(i, -1) }, '↑'),
            h('button', { class: 'mini-btn', onclick: () => swap(i, 1) }, '↓'),
          ),
        ),
      );
    });
  }

  function swap(i, d) {
    const j = i + d;
    if (j < 0 || j >= current.length) return;
    [current[i], current[j]] = [current[j], current[i]];
    draw();
  }

  draw();

  return h(
    'div',
    { class: 'card' },
    h('h2', {}, '🧵 ' + t(step.prompt || ui('drag_hint'))),
    h('p', { class: 'muted' }, ui('drag_hint')),
    list,
    h(
      'button',
      {
        class: 'btn btn-primary',
        onclick: () => {
          if (current.join('\n') === correct.join('\n')) {
            feedback.className = 'feedback ok';
            feedback.innerHTML = md('✅ ' + ui('correct') + (step.why ? '\n\n' + t(step.why) : ''));
            api.markSolved();
          } else {
            const firstBad = current.findIndex((l, i) => l !== correct[i]);
            feedback.className = 'feedback bad';
            feedback.textContent = `${ui('not_yet')} line ${firstBad + 1} is not right yet.`;
            sfx('bad', store.get().sound);
          }
        },
      },
      ui('check'),
    ),
    feedback,
  );
}

function typeStep(step, api) {
  const target = t(step.target);
  const mirror = h('div', { class: 'type-target' });
  const input = h('input', { class: 'type-input', spellcheck: 'false', autocomplete: 'off' });
  const feedback = h('div', { class: 'feedback' });

  function draw() {
    const value = input.value;
    mirror.replaceChildren(
      ...target.split('').map((ch, i) => {
        const state = i >= value.length ? '' : value[i] === ch ? 'ok' : 'bad';
        return h('span', { class: `ch ${state}` }, ch === ' ' ? ' ' : ch);
      }),
    );
    if (value === target) {
      feedback.className = 'feedback ok';
      feedback.textContent = '✅ ' + ui('correct');
      api.markSolved();
    } else {
      feedback.className = 'feedback';
      feedback.textContent = `${value.length}/${target.length}`;
    }
  }

  input.addEventListener('input', draw);
  draw();

  return h(
    'div',
    { class: 'card' },
    h('h2', {}, '⌨️ ' + t(step.prompt)),
    h('p', { class: 'muted' }, ui('typed_it')),
    mirror,
    input,
    feedback,
  );
}

function unpluggedStep(step, api) {
  return h(
    'div',
    { class: 'card unplugged' },
    h('h2', {}, t(step.title)),
    h('div', { class: 'prose', html: md(t(step.text)) }),
    h(
      'button',
      {
        class: 'btn btn-primary',
        onclick: (e) => {
          e.target.textContent = '✅ Nice one!';
          e.target.disabled = true;
          confetti(12);
          api.markSolved();
        },
      },
      'I did it ✅',
    ),
  );
}

/** Shared editor + blocks + console workbench used by code/bug/robot steps. */
function workbench(step, { onRun, extraPanel = null }) {
  const cons = createConsole();
  const editor = createEditor({ value: step.starter || '', onRun: () => onRun(editor.value, cons) });

  const panes = h('div', { class: 'panes' });
  let blocks = null;
  let mode = step.palette ? store.get().mode || 'code' : 'code';

  const tabs = step.palette
    ? h(
        'div',
        { class: 'tabs' },
        h('button', { class: 'tab', dataset: { mode: 'blocks' }, onclick: () => setMode('blocks') }, '🧩 ' + ui('blocks_tab')),
        h('button', { class: 'tab', dataset: { mode: 'code' }, onclick: () => setMode('code') }, '⌨️ ' + ui('code_tab')),
      )
    : null;

  function setMode(next) {
    mode = next;
    store.set({ mode: next });
    if (tabs) [...tabs.children].forEach((b) => b.classList.toggle('tab-on', b.dataset.mode === mode));
    panes.replaceChildren();
    if (mode === 'blocks') {
      blocks =
        blocks ||
        createBlocks({
          palette: step.palette,
          onChange: (code) => {
            editor.value = code;
            cons.preview(code || '// add blocks to build your program');
          },
        });
      panes.append(blocks.el);
      cons.preview(blocks.code || '// add blocks to build your program');
    } else {
      panes.append(editor.el);
    }
  }

  setMode(mode);

  const runBtn = h('button', { class: 'btn btn-run', onclick: () => onRun(editor.value, cons) }, '▶ ' + ui('run'));

  const tools = h(
    'div',
    { class: 'row gap tools' },
    runBtn,
    step.hint
      ? h(
          'button',
          {
            class: 'btn btn-ghost',
            onclick: (e) => {
              cons.note('💡 ' + t(step.hint));
              e.target.disabled = true;
              step.__hinted = true;
            },
          },
          '💡 ' + ui('hint'),
        )
      : null,
    step.solution
      ? h(
          'button',
          {
            class: 'btn btn-ghost',
            onclick: (e) => {
              if (!confirm('Peek at the solution? You will still get one ⭐ for finishing.')) return;
              setMode('code');
              editor.value = step.solution;
              e.target.disabled = true;
              step.__peeked = true;
            },
          },
          '🔑 ' + ui('solution'),
        )
      : null,
    h(
      'button',
      {
        class: 'btn btn-ghost',
        onclick: () => {
          editor.value = step.starter || '';
          blocks?.reset();
          cons.clear();
        },
      },
      '↺ ' + ui('reset_code'),
    ),
  );

  const el = h(
    'div',
    { class: 'workbench' },
    tabs,
    panes,
    tools,
    extraPanel,
    cons.el,
  );

  return { el, editor, cons, setMode };
}

function codeStep(step, api) {
  const feedback = h('div', { class: 'feedback' });

  const bench = workbench(step, {
    onRun: (code, cons) => {
      const res = runCode(code, { capture: step.capture || [] });
      cons.write(res.logs, res.error);
      if (step.__hinted) api.useHint();
      if (step.__peeked) api.useSolution();
      if (res.error) {
        feedback.className = 'feedback bad';
        feedback.textContent = 'Your program stopped with an error — read the red line below.';
        sfx('bad', store.get().sound);
        return;
      }
      const verdict = safeCheck(step, { ...res, code });
      if (verdict === true) {
        feedback.className = 'feedback ok';
        feedback.innerHTML = md('✅ **' + ui('correct') + '** Press Next to keep going.');
        confetti(14);
        api.markSolved();
      } else {
        feedback.className = 'feedback bad';
        feedback.innerHTML = md(`${ui('not_yet')} ${verdict}`);
        sfx('bad', store.get().sound);
      }
    },
  });

  return h(
    'div',
    { class: 'card' },
    h('h2', {}, (step.type === 'bug' ? '🐛 ' : '💻 ') + (step.type === 'bug' ? 'Fix the bug' : 'Your turn')),
    h('div', { class: 'prose', html: md(t(step.prompt)) }),
    bench.el,
    feedback,
    h('p', { class: 'muted small' }, ui('run_hint')),
  );
}

// ------------------------------------------------------------------- robot

function robotStep(step, api) {
  const grid = h('div', { class: 'grid' });
  const status = h('div', { class: 'feedback' });
  let timer = null;

  function paint(frame, spec) {
    grid.style.gridTemplateColumns = `repeat(${spec.w}, 1fr)`;
    grid.replaceChildren();
    const gems = new Set(frame.gems);
    const walls = new Set((spec.walls || []).map(([x, y]) => `${x},${y}`));
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const key = `${x},${y}`;
        const isGoal = spec.goal && spec.goal.x === x && spec.goal.y === y;
        const cell = h('div', { class: 'cell' + (walls.has(key) ? ' cell-wall' : '') });
        if (isGoal) cell.append(h('span', { class: 'cell-goal' }, '🏠'));
        if (gems.has(key)) cell.append(h('span', { class: 'cell-gem' }, '🍎'));
        if (frame.x === x && frame.y === y) {
          const yak = h('span', { class: 'cell-bot' }, '🐃');
          yak.style.transform = `rotate(${[0, 90, 180, 270][frame.dir]}deg)`;
          cell.append(yak);
        }
        grid.append(cell);
      }
    }
  }

  const startFrame = {
    x: step.spec.start.x,
    y: step.spec.start.y,
    dir: step.spec.start.dir ?? 0,
    gems: (step.spec.gems || []).map(([x, y]) => `${x},${y}`),
  };
  paint(startFrame, step.spec);

  const bench = workbench(step, {
    extraPanel: h('div', { class: 'grid-wrap' }, grid, h('div', { class: 'grid-legend' }, '🐃 Kodo · 🍎 apple · 🏠 yurt')),
    onRun: (code, cons) => {
      clearInterval(timer);
      const res = runRobot(code, step.spec);
      cons.write(res.logs, null);
      if (step.__hinted) api.useHint();
      if (step.__peeked) api.useSolution();

      let i = 0;
      timer = setInterval(() => {
        paint(res.frames[i], step.spec);
        if (++i >= res.frames.length) {
          clearInterval(timer);
          const extra = step.check ? safeCheck(step, { logs: res.logs, code, vars: {}, value: undefined }) : true;
          if (res.solved && extra === true) {
            status.className = 'feedback ok';
            status.textContent = `✅ ${ui('correct')} Kodo made it in ${res.moves} moves.`;
            confetti(14);
            api.markSolved();
          } else {
            status.className = 'feedback bad';
            status.textContent = `${ui('not_yet')} ${res.solved ? extra : res.reason}`;
            sfx('bad', store.get().sound);
          }
        }
      }, 240);
    },
  });

  return h(
    'div',
    { class: 'card' },
    h('h2', {}, '🐃 Drive Kodo'),
    h('div', { class: 'prose', html: md(t(step.prompt)) }),
    bench.el,
    status,
  );
}

export { DIRS };
