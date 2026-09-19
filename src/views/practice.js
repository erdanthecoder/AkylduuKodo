// practice.js — short drills. Same skills as the lessons, but with a clock.

import { h, codeBlock, confetti, sfx, shuffle, toast } from '../ui.js';
import { icon, rover } from '../icons.js';
import { ui } from '../i18n.js';
import * as store from '../state.js';
import { DRILLS } from '../data/drills.js';
import { createEditor, createScreen } from '../editor.js';
import { runRobot } from '../robot.js';
import { runCode } from '../runner.js';

/** What to promise on the card when there is no clock to show. */
const KIND_NOTE = {
  maze: '5 levels',
  match: '6 pairs',
  golf: '5 targets',
};

export function PracticeView(go, drillId) {
  if (drillId) {
    const drill = DRILLS.find((d) => d.id === drillId);
    if (!drill) return h('div', { class: 'card' }, 'Unknown drill.');
    if (drill.kind === 'maze') return mazeDrill(drill, go);
    if (drill.kind === 'type') return typingDrill(drill, go);
    if (drill.kind === 'match') return matchDrill(drill, go);
    if (drill.kind === 'golf') return golfDrill(drill, go);
    return quizDrill(drill, go);
  }

  const s = store.get();
  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, ui('practice_title')),
    h('p', { class: 'muted' }, ui('practice_sub')),

    // The Lab lives here rather than in the nav: it is the same idea as a
    // drill, only with nothing to guess and no clock.
    h('section', { class: 'card lab-promo', onclick: () => go('#/lab') },
      h('div', { class: 'promo-mark' }, icon('flask', { size: 28 })),
      h('div', { class: 'next-body' },
        h('small', { class: 'muted' }, ui('nav_lab')),
        h('h3', {}, 'A blank page and a Run button'),
        h('p', { class: 'muted' }, 'No question, no timer. Write whatever you like and watch it run — your work is kept between visits.'),
      ),
      h('span', { class: 'btn btn-ghost' }, 'Open the Lab', icon('arrowRight', { size: 15 })),
    ),

    h('h2', { class: 'section-title' }, 'Pick an activity'),
    h('div', { class: 'drill-grid' },
      ...DRILLS.map((g) =>
        h('button', { class: 'card drill-card', onclick: () => go(`#/practice/${g.id}`) },
          h('div', { class: 'drill-mark' }, icon(g.icon, { size: 26 })),
          h('h3', {}, g.name),
          h('p', { class: 'muted' }, g.desc),
          h('div', { class: 'chips' },
            h('span', { class: 'chip' }, icon('trophy', { size: 13 }), `${ui('best')}: ${s.bests[g.id] || 0}`),
            g.seconds
              ? h('span', { class: 'chip' }, icon('clock', { size: 13 }), `${g.seconds}s`)
              : h('span', { class: 'chip' }, KIND_NOTE[g.kind] || `${g.pool.length} levels`),
          ),
          h('span', { class: 'lesson-cta' }, ui('begin') + ' →'),
        ),
      ),
    ),
  );
}


/* ------------------------------------------------------- shared ending */

/** Every activity finishes in the same place: your score, your best, and a
 *  way straight back in. */
function finishCard(drill, score, go, { title, mark = 'trophy' } = {}) {
  const res = store.recordBest(drill.id, score);
  if (res.isBest) confetti(24);
  return h('div', { class: 'card celebrate' },
    h('div', { class: 'big-mark' }, icon(res.isBest ? 'trophy' : mark, { size: 44 })),
    h('h2', {}, res.isBest ? 'New personal best!' : title || 'Nice work!'),
    h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
    res.earned.length
      ? h('div', { class: 'badge-pop' }, ...res.earned.map((b) => h('div', { class: 'badge-chip' }, b.name)))
      : null,
    h('div', { class: 'row gap' },
      h('button', { class: 'btn btn-primary', onclick: () => go(`#/practice/${drill.id}`, true) }, ui('again')),
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
    ),
  );
}

function activityShell(drill, go, ...hudExtras) {
  const stage = h('div', { class: 'stage' });
  const el = h('div', { class: 'view drill-view' },
    h('h1', { class: 'view-title' }, icon(drill.icon, { size: 24 }), drill.name),
    h('div', { class: 'hud' },
      ...hudExtras,
      h('button', { class: 'btn btn-ghost hud-quit', onclick: () => go('#/practice') }, icon('close', { size: 17 })),
    ),
    stage,
  );
  return { el, stage };
}

/* --------------------------------------------------------- syntax sprint */

/** Type the line exactly. Every character counts, including the semicolon. */
function typingDrill(drill, go) {
  let left = drill.seconds;
  let correct = 0;
  let typed = 0;
  let lines = 0;
  let queue = shuffle(drill.pool);
  let qi = 0;

  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const timeEl = h('span', { class: 'hud-value' }, String(left));
  const accEl = h('span', { class: 'hud-value' }, '100%');
  const { el, stage } = activityShell(drill, go,
    h('span', { class: 'hud-item', title: 'Characters typed correctly' }, icon('bolt', { size: 17 }), scoreEl),
    h('span', { class: 'hud-item', title: 'Accuracy' }, icon('target', { size: 17 }), accEl),
    h('span', { class: 'hud-item' }, icon('clock', { size: 17 }), timeEl),
  );

  const timer = setInterval(() => {
    left -= 1;
    timeEl.textContent = String(left);
    if (left <= 5) timeEl.classList.add('hot');
    if (left <= 0) stop();
  }, 1000);

  function ask() {
    if (qi >= queue.length) {
      queue = shuffle(drill.pool);
      qi = 0;
    }
    const target = queue[qi++];
    const view = h('div', { class: 'type-target' });
    const input = h('input', { class: 'type-input', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Type the line' });

    const paint = () => {
      view.replaceChildren(
        ...[...target].map((ch, i) => {
          const got = input.value[i];
          const cls = got === undefined ? 'ch' : got === ch ? 'ch ok' : 'ch bad';
          return h('span', { class: cls + (i === input.value.length ? ' ch-cursor' : '') }, ch === ' ' ? '\u00a0' : ch);
        }),
      );
    };

    input.addEventListener('input', () => {
      paint();
      if (input.value === target) {
        // a whole line, clean: the characters bank and the next one comes up
        correct += target.length;
        typed += target.length;
        lines += 1;
        scoreEl.textContent = String(correct);
        accEl.textContent = `${Math.round((correct / Math.max(1, typed)) * 100)}%`;
        sfx('good', store.get().sound);
        ask();
      }
    });

    stage.replaceChildren(
      h('div', { class: 'card' },
        h('h3', {}, 'Type this line exactly'),
        h('p', { class: 'muted small' }, 'Every character counts — the brackets, the quotes and the semicolon.'),
        view,
        input,
      ),
    );
    paint();
    input.focus();
  }

  function stop() {
    clearInterval(timer);
    const accuracy = Math.round((correct / Math.max(1, typed)) * 100);
    stage.replaceChildren(
      finishCard(drill, correct, go, { title: `${lines} line${lines === 1 ? '' : 's'} at ${accuracy}% accuracy`, mark: 'keyboard' }),
    );
  }

  el.addEventListener('view-destroy', () => clearInterval(timer));
  ask();
  return el;
}

/* ---------------------------------------------------------------- pair up */

/** Six snippets, six outputs, face down. Fewer turns scores higher. */
function matchDrill(drill, go) {
  const PAIR_COUNT = 6;
  const chosen = shuffle(drill.pool).slice(0, PAIR_COUNT);
  const cards = shuffle(
    chosen.flatMap((pair, i) => [
      { pairId: i, face: pair.code, kind: 'code' },
      { pairId: i, face: pair.out, kind: 'out' },
    ]),
  );

  let moves = 0;
  let found = 0;
  let first = null;
  let busy = false;
  const started = Date.now();

  const movesEl = h('span', { class: 'hud-value' }, '0');
  const foundEl = h('span', { class: 'hud-value' }, `0/${PAIR_COUNT}`);
  const { el, stage } = activityShell(drill, go,
    h('span', { class: 'hud-item', title: 'Pairs found' }, icon('check', { size: 17 }), foundEl),
    h('span', { class: 'hud-item', title: 'Turns taken' }, icon('reset', { size: 17 }), movesEl),
  );

  const grid = h('div', { class: 'match-grid' });

  cards.forEach((card) => {
    const face = h('span', { class: 'match-face' }, card.face);
    const button = h('button', { class: `match-card match-${card.kind}` },
      h('span', { class: 'match-back' }, icon('code', { size: 18 })),
      face,
    );
    button.addEventListener('click', () => {
      if (busy || button.classList.contains('is-open') || button.classList.contains('is-done')) return;
      button.classList.add('is-open');

      if (!first) {
        first = { card, button };
        return;
      }
      moves += 1;
      movesEl.textContent = String(moves);

      if (first.card.pairId === card.pairId) {
        first.button.classList.add('is-done');
        button.classList.add('is-done');
        found += 1;
        foundEl.textContent = `${found}/${PAIR_COUNT}`;
        sfx('good', store.get().sound);
        first = null;
        if (found === PAIR_COUNT) setTimeout(stop, 500);
        return;
      }

      // wrong: show both for a beat, then turn them back
      busy = true;
      const a = first;
      first = null;
      sfx('bad', store.get().sound);
      setTimeout(() => {
        a.button.classList.remove('is-open');
        button.classList.remove('is-open');
        busy = false;
      }, 750);
    });
    grid.append(button);
  });

  function stop() {
    const seconds = Math.round((Date.now() - started) / 1000);
    // a perfect run is six turns; every extra turn and every second costs a little
    const score = Math.max(20, 400 - (moves - PAIR_COUNT) * 18 - seconds * 2);
    stage.replaceChildren(
      finishCard(drill, score, go, { title: `All six pairs in ${moves} turns`, mark: 'layers' }),
    );
  }

  stage.replaceChildren(
    h('div', { class: 'card' },
      h('h3', {}, 'Match each snippet to what it prints'),
      h('p', { class: 'muted small' }, 'Turn over two cards. Fewer turns and less time score higher.'),
      grid,
    ),
  );
  return el;
}

/* ------------------------------------------------------------- tight code */

/** Same output, fewer characters. The par is a length a careful answer hits. */
function golfDrill(drill, go) {
  let level = 0;
  let score = 0;
  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const { el, stage } = activityShell(drill, go,
    h('span', { class: 'hud-item' }, icon('bolt', { size: 17 }), scoreEl),
  );

  function playLevel() {
    if (level >= drill.pool.length) {
      stage.replaceChildren(finishCard(drill, score, go, { title: 'Every target hit', mark: 'scale' }));
      return;
    }
    const task = drill.pool[level];
    const status = h('div', { class: 'feedback' });
    const screen = createScreen({ title: 'What your code shows' });
    const counter = h('span', { class: 'golf-count' }, '0 characters');

    const editor = createEditor({
      value: '',
      minRows: 5,
      onChange: (code) => {
        const n = code.replace(/\s+/g, ' ').trim().length;
        counter.textContent = `${n} character${n === 1 ? '' : 's'} · par ${task.par}`;
        counter.classList.toggle('is-under', n > 0 && n <= task.par);
      },
      onRun: () => run(),
    });

    function run() {
      const code = editor.value;
      const chars = code.replace(/\s+/g, ' ').trim().length;
      const result = runCode(code);
      screen.write(result.logs, result.error);

      if (result.error) {
        status.className = 'feedback bad';
        status.textContent = result.error;
        sfx('bad', store.get().sound);
        return;
      }
      const got = result.logs.map((l) => String(l).trim()).filter(Boolean);
      if (got.join('\n') !== task.expect.join('\n')) {
        status.className = 'feedback bad';
        status.textContent = `Not the target yet. Wanted: ${task.expect.join(', ')}`;
        sfx('bad', store.get().sound);
        return;
      }

      // right answer: the points are in how tight it is
      const saved = Math.max(0, task.par - chars);
      const points = 60 + saved * 6;
      score += points;
      scoreEl.textContent = String(score);
      status.className = 'feedback ok';
      status.textContent = saved
        ? `${chars} characters — ${saved} under par. +${points}`
        : `${chars} characters. +${points} — see if you can go shorter next time.`;
      sfx('great', store.get().sound);
      confetti(14);
      level += 1;
      setTimeout(playLevel, 1400);
    }

    stage.replaceChildren(
      h('div', { class: 'card' },
        h('div', { class: 'row gap golf-head' },
          h('h3', {}, `Target ${level + 1} / ${drill.pool.length}`),
          counter,
        ),
        h('p', { class: 'golf-goal' }, task.goal),
        h('p', { class: 'muted small' }, `Expected output: ${task.expect.join(' · ')}`),
        editor.el,
        h('div', { class: 'row gap tools' },
          h('button', { class: 'btn btn-run', onclick: run }, icon('play', { size: 16 }), ui('run')),
          h('button', { class: 'btn btn-ghost', onclick: () => { level += 1; playLevel(); } }, 'Skip'),
        ),
        screen.el,
        status,
      ),
    );
  }

  playLevel();
  return el;
}

// ------------------------------------------------------------- timed drills


function quizDrill(drill, go) {
  let score = 0;
  let streak = 0;
  let left = drill.seconds;
  let queue = shuffle(drill.pool);
  let qi = 0;

  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const timeEl = h('span', { class: 'hud-value' }, String(left));
  const stage = h('div', { class: 'stage' });
  const hud = h('div', { class: 'hud' },
    h('span', { class: 'hud-item' }, icon('bolt', { size: 17 }), scoreEl),
    h('span', { class: 'hud-item' }, icon('clock', { size: 17 }), timeEl),
    h('button', { class: 'btn btn-ghost', onclick: () => stop(true) }, icon('close', { size: 17 })),
  );

  const el = h('div', { class: 'view drill-view' },
    h('h1', { class: 'view-title' }, icon(drill.icon, { size: 24 }), drill.name),
    hud,
    stage,
  );

  const timer = setInterval(() => {
    left -= 1;
    timeEl.textContent = String(left);
    if (left <= 5) timeEl.classList.add('hot');
    if (left <= 0) stop(false);
  }, 1000);

  function ask() {
    if (qi >= queue.length) {
      queue = shuffle(drill.pool);
      qi = 0;
    }
    const q = queue[qi++];
    const opts = h('div', { class: 'options' });
    stage.replaceChildren(
      h('div', { class: 'card' },
        h('h3', {}, drill.id === 'bughunt' ? 'What is wrong here?' : 'What does this print?'),
        codeBlock(q.code),
        opts,
      ),
    );
    q.options.forEach((label, i) => {
      opts.append(
        h('button', {
          class: 'option',
          onclick: (e) => {
            if (i === q.answer) {
              streak += 1;
              const points = 10 + Math.min(streak, 5) * 2;
              score += points;
              scoreEl.textContent = String(score);
              sfx('good', store.get().sound);
              toast(`+${points}${streak > 1 ? ` — ${streak} in a row` : ''}`, 'ok');
              ask();
            } else {
              streak = 0;
              score = Math.max(0, score - 5);
              scoreEl.textContent = String(score);
              e.target.classList.add('option-wrong');
              e.target.disabled = true;
              sfx('bad', store.get().sound);
              if (q.why) toast(q.why, 'warn');
            }
          },
        }, label),
      );
    });
  }

  function stop(quit) {
    clearInterval(timer);
    const res = store.recordBest(drill.id, score);
    if (!quit) confetti(24);
    stage.replaceChildren(
      h('div', { class: 'card celebrate' },
        h('div', { class: 'big-mark' }, icon(res.isBest ? 'trophy' : 'target', { size: 44 })),
        h('h2', {}, res.isBest ? 'New personal best!' : 'Nice work!'),
        h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
        res.earned.length ? h('div', { class: 'badge-pop' }, ...res.earned.map((b) => h('div', { class: 'badge-chip' }, `${b.emoji} ${b.name}`))) : null,
        h('div', { class: 'row gap' },
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/practice/${drill.id}`, true) }, ui('again')),
          h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
        ),
      ),
    );
  }

  el.addEventListener('view-destroy', () => clearInterval(timer));
  ask();
  return el;
}

// ------------------------------------------------------------------ the maze

function mazeDrill(drill, go) {
  let level = 0;
  let score = 0;
  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const stage = h('div', { class: 'stage' });
  let timer = null;

  const el = h('div', { class: 'view drill-view' },
    h('h1', { class: 'view-title' }, `${drill.emoji} ${drill.name}`),
    h('div', { class: 'hud' },
      h('span', { class: 'hud-item' }, icon('bolt', { size: 17 }), scoreEl),
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, icon('close', { size: 17 })),
    ),
    stage,
  );

  function paint(grid, frame, spec) {
    grid.style.gridTemplateColumns = `repeat(${spec.w}, 1fr)`;
    grid.replaceChildren();
    const gems = new Set(frame.gems);
    const walls = new Set((spec.walls || []).map(([x, y]) => `${x},${y}`));
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const key = `${x},${y}`;
        const cell = h('div', { class: 'cell' + (walls.has(key) ? ' cell-wall' : '') });
        if (spec.goal.x === x && spec.goal.y === y) cell.append(h('span', { class: 'cell-goal' }, icon('yurt', { size: 20 })));
        if (gems.has(key)) cell.append(h('span', { class: 'cell-gem' }, icon('apple', { size: 18 })));
        if (frame.x === x && frame.y === y) {
          const bot = h('span', { class: 'cell-bot' }, rover(26));
          bot.style.transform = `rotate(${[0, 90, 180, 270][frame.dir]}deg)`;
          cell.append(bot);
        }
        grid.append(cell);
      }
    }
  }

  function playLevel() {
    if (level >= drill.pool.length) return finish();
    const spec = drill.pool[level];
    const grid = h('div', { class: 'grid' });
    const status = h('div', { class: 'feedback' });
    const cons = createScreen({ title: 'Kodo world' });
    const editor = createEditor({ value: '', onRun: () => run(), minRows: 7 });

    paint(grid, { x: spec.start.x, y: spec.start.y, dir: spec.start.dir ?? 0, gems: (spec.gems || []).map(([x, y]) => `${x},${y}`) }, spec);

    function run() {
      clearInterval(timer);
      const res = runRobot(editor.value, spec);
      cons.write(res.logs, null);
      let i = 0;
      timer = setInterval(() => {
        paint(grid, res.frames[i], spec);
        if (++i >= res.frames.length) {
          clearInterval(timer);
          if (res.solved) {
            const lines = editor.value.split('\n').filter((l) => l.trim()).length;
            const points = Math.max(20, 120 - lines * 6);
            score += points;
            scoreEl.textContent = String(score);
            confetti(16);
            sfx('great', store.get().sound);
            status.className = 'feedback ok';
            status.textContent = `Solved in ${lines} lines (+${points})`;
            level += 1;
            setTimeout(playLevel, 1200);
          } else {
            status.className = 'feedback bad';
            status.textContent = res.reason;
            sfx('bad', store.get().sound);
          }
        }
      }, 200);
    }

    stage.replaceChildren(
      h('div', { class: 'card' },
        h('h3', {}, `Level ${level + 1} / ${drill.pool.length}`),
        h('p', { class: 'muted' }, 'Collect every apple and park the rover on its base. Fewer lines scores higher.'),
        h('div', { class: 'grid-wrap' }, grid, h('div', { class: 'grid-legend' }, 'forward() · turnLeft() · turnRight() · collect() · canMove()')),
        editor.el,
        h('div', { class: 'row gap tools' },
          h('button', { class: 'btn btn-run', onclick: run }, icon('play', { size: 16 }), ui('run')),
          h('button', { class: 'btn btn-ghost', onclick: () => { level += 1; playLevel(); } }, 'Skip'),
        ),
        cons.el,
        status,
      ),
    );
  }

  function finish() {
    clearInterval(timer);
    const res = store.recordBest(drill.id, score);
    confetti(30);
    stage.replaceChildren(
      h('div', { class: 'card celebrate' },
        h('div', { class: 'big-mark' }, rover(46)),
        h('h2', {}, 'All levels cleared!'),
        h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
        h('div', { class: 'row gap' },
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/practice/${drill.id}`, true) }, ui('again')),
          h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
        ),
      ),
    );
  }

  el.addEventListener('view-destroy', () => clearInterval(timer));
  playLevel();
  return el;
}
