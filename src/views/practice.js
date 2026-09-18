// practice.js — short drills. Same skills as the lessons, but with a clock.

import { h, codeBlock, confetti, sfx, shuffle, toast } from '../ui.js';
import { icon, rover } from '../icons.js';
import { ui } from '../i18n.js';
import * as store from '../state.js';
import { DRILLS } from '../data/drills.js';
import { createEditor, createScreen } from '../editor.js';
import { runRobot } from '../robot.js';

export function PracticeView(go, drillId) {
  if (drillId) {
    const drill = DRILLS.find((d) => d.id === drillId);
    if (!drill) return h('div', { class: 'card' }, 'Unknown drill.');
    return drill.kind === 'maze' ? mazeDrill(drill, go) : quizDrill(drill, go);
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

    h('h2', { class: 'section-title' }, 'Drills'),
    h('div', { class: 'drill-grid' },
      ...DRILLS.map((g) =>
        h('button', { class: 'card drill-card', onclick: () => go(`#/practice/${g.id}`) },
          h('div', { class: 'drill-mark' }, icon(g.icon, { size: 26 })),
          h('h3', {}, g.name),
          h('p', { class: 'muted' }, g.desc),
          h('div', { class: 'chips' },
            h('span', { class: 'chip' }, icon('trophy', { size: 13 }), `${ui('best')}: ${s.arcade[g.id] || 0}`),
            g.seconds
              ? h('span', { class: 'chip' }, icon('clock', { size: 13 }), `${g.seconds}s`)
              : h('span', { class: 'chip' }, `${g.pool.length} levels`),
          ),
          h('span', { class: 'lesson-cta' }, ui('begin') + ' →'),
        ),
      ),
    ),
  );
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
    const res = store.recordArcade(drill.id, score);
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
    const res = store.recordArcade(drill.id, score);
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
