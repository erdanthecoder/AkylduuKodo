// arcade.js — short games. Same skills as the lessons, but with a clock.

import { h, md, codeBlock, confetti, sfx, shuffle, toast } from '../ui.js';
import { ui } from '../i18n.js';
import * as store from '../state.js';
import { GAMES } from '../data/arcade.js';
import { createEditor, createConsole } from '../editor.js';
import { runRobot } from '../robot.js';

export function ArcadeView(go, gameId) {
  if (gameId) {
    const game = GAMES.find((g) => g.id === gameId);
    if (!game) return h('div', { class: 'card' }, 'Unknown game.');
    return game.kind === 'maze' ? mazeGame(game, go) : quizGame(game, go);
  }

  const s = store.get();
  return h(
    'div',
    { class: 'view' },
    h('h1', { class: 'view-title' }, '🕹️ ' + ui('arcade_title')),
    h('p', { class: 'muted' }, ui('arcade_sub')),
    h('div', { class: 'game-grid' },
      ...GAMES.map((g) =>
        h('button', { class: 'card game-card', onclick: () => go(`#/arcade/${g.id}`) },
          h('div', { class: 'game-emoji' }, g.emoji),
          h('h3', {}, g.name),
          h('p', { class: 'muted' }, g.desc),
          h('div', { class: 'chips' },
            h('span', { class: 'chip' }, `🏆 ${ui('best')}: ${s.arcade[g.id] || 0}`),
            g.seconds ? h('span', { class: 'chip' }, `⏱️ ${g.seconds}s`) : h('span', { class: 'chip' }, `${g.pool.length} mazes`),
          ),
          h('span', { class: 'lesson-cta' }, ui('play') + ' →'),
        ),
      ),
    ),
  );
}

// ------------------------------------------------------------- timed quizzes

function quizGame(game, go) {
  let score = 0;
  let streak = 0;
  let left = game.seconds;
  let queue = shuffle(game.pool);
  let qi = 0;

  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const timeEl = h('span', { class: 'hud-value' }, String(left));
  const stage = h('div', { class: 'stage' });
  const hud = h('div', { class: 'hud' },
    h('span', { class: 'hud-item' }, '⚡ ', scoreEl),
    h('span', { class: 'hud-item' }, '⏱️ ', timeEl),
    h('button', { class: 'btn btn-ghost', onclick: () => stop(true) }, '✕'),
  );

  const el = h('div', { class: 'view game-view' },
    h('h1', { class: 'view-title' }, `${game.emoji} ${game.name}`),
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
      queue = shuffle(game.pool);
      qi = 0;
    }
    const q = queue[qi++];
    const opts = h('div', { class: 'options' });
    stage.replaceChildren(
      h('div', { class: 'card' },
        h('h3', {}, game.id === 'bughunt' ? '🐛 What is wrong here?' : '🔮 What does this print?'),
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
              toast(`+${points}${streak > 1 ? ` · ${streak}x streak 🔥` : ''}`, 'ok');
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
    const res = store.recordArcade(game.id, score);
    if (!quit) confetti(24);
    stage.replaceChildren(
      h('div', { class: 'card celebrate' },
        h('div', { class: 'big-emoji' }, res.isBest ? '🏆' : '🎮'),
        h('h2', {}, res.isBest ? 'New personal best!' : 'Good run!'),
        h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
        res.earned.length ? h('div', { class: 'badge-pop' }, ...res.earned.map((b) => h('div', { class: 'badge-chip' }, `${b.emoji} ${b.name}`))) : null,
        h('div', { class: 'row gap' },
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/arcade/${game.id}`, true) }, ui('again')),
          h('button', { class: 'btn btn-ghost', onclick: () => go('#/arcade') }, ui('nav_arcade')),
        ),
      ),
    );
  }

  el.addEventListener('view-destroy', () => clearInterval(timer));
  ask();
  return el;
}

// ------------------------------------------------------------------ the maze

function mazeGame(game, go) {
  let level = 0;
  let score = 0;
  const scoreEl = h('span', { class: 'hud-value' }, '0');
  const stage = h('div', { class: 'stage' });
  let timer = null;

  const el = h('div', { class: 'view game-view' },
    h('h1', { class: 'view-title' }, `${game.emoji} ${game.name}`),
    h('div', { class: 'hud' },
      h('span', { class: 'hud-item' }, '⚡ ', scoreEl),
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/arcade') }, '✕'),
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
        if (spec.goal.x === x && spec.goal.y === y) cell.append(h('span', { class: 'cell-goal' }, '🏠'));
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

  function playLevel() {
    if (level >= game.pool.length) return finish();
    const spec = game.pool[level];
    const grid = h('div', { class: 'grid' });
    const status = h('div', { class: 'feedback' });
    const cons = createConsole();
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
            status.textContent = `✅ Solved in ${lines} lines (+${points})`;
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
        h('h3', {}, `Maze ${level + 1} / ${game.pool.length}`),
        h('p', { class: 'muted' }, 'Collect every 🍎 and park Kodo on the 🏠. Fewer lines = more points.'),
        h('div', { class: 'grid-wrap' }, grid, h('div', { class: 'grid-legend' }, 'forward() · turnLeft() · turnRight() · collect() · canMove()')),
        editor.el,
        h('div', { class: 'row gap tools' },
          h('button', { class: 'btn btn-run', onclick: run }, '▶ ' + ui('run')),
          h('button', { class: 'btn btn-ghost', onclick: () => { level += 1; playLevel(); } }, 'Skip ↷'),
        ),
        cons.el,
        status,
      ),
    );
  }

  function finish() {
    clearInterval(timer);
    const res = store.recordArcade(game.id, score);
    confetti(30);
    stage.replaceChildren(
      h('div', { class: 'card celebrate' },
        h('div', { class: 'big-emoji' }, '🐃'),
        h('h2', {}, 'All mazes cleared!'),
        h('p', { class: 'xp-line' }, `${ui('score')}: ${score} · ${ui('best')}: ${res.best}`),
        h('div', { class: 'row gap' },
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/arcade/${game.id}`, true) }, ui('again')),
          h('button', { class: 'btn btn-ghost', onclick: () => go('#/arcade') }, ui('nav_arcade')),
        ),
      ),
    );
  }

  el.addEventListener('view-destroy', () => clearInterval(timer));
  playLevel();
  return el;
}
