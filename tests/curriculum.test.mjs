// Runs every lesson's reference solution through its own checker.
// If a lesson is impossible (or accidentally trivial), this fails loudly.

import { UNITS, ALL_LESSONS } from '../src/data/index.js';
import { DRILLS, MAZES } from '../src/data/drills.js';
import { runCode } from '../src/runner.js';
import { runRobot } from '../src/robot.js';
import { safeCheck } from '../src/data/checks.js';

let pass = 0;
const failures = [];
const warnings = [];

function ok(cond, label) {
  if (cond === true) pass++;
  else failures.push(`${label}: ${cond === false ? 'failed' : cond}`);
}

const CODE_TYPES = new Set(['code', 'bug']);
const LEVEL_IDS = new Set(['beginner', 'intermediate', 'expert']);
const ids = new Set();

for (const unit of UNITS) {
  ok(typeof unit.id === 'string' && !ids.has(unit.id) || 'duplicate unit id', `unit ${unit.id} id`);
  ids.add(unit.id);
  ok(unit.lessons.length > 0 || 'no lessons', `unit ${unit.id} has lessons`);
  ok(LEVEL_IDS.has(unit.level) || `bad level: ${unit.level}`, `unit ${unit.id} level`);
}

for (const lesson of ALL_LESSONS) {
  const where = `${lesson.id}`;
  ok(!ids.has(lesson.id) || 'duplicate lesson id', `${where} unique id`);
  ids.add(lesson.id);
  ok(lesson.steps.length >= 3 || `only ${lesson.steps.length} steps`, `${where} enough steps`);
  ok(typeof lesson.xp === 'number' && lesson.xp > 0 || 'bad xp', `${where} xp`);

  lesson.steps.forEach((step, i) => {
    const at = `${where} step ${i + 1} (${step.type})`;

    if (CODE_TYPES.has(step.type)) {
      ok(typeof step.solution === 'string' && step.solution.length > 0 || 'no solution', `${at} has solution`);
      ok(typeof step.check === 'function' || 'no check', `${at} has check`);
      if (typeof step.check === 'function' && step.solution) {
        const res = runCode(step.solution, { capture: step.capture || [] });
        ok(res.error === null || `solution threw: ${res.error}`, `${at} solution runs`);
        if (!res.error) {
          const verdict = safeCheck(step, { ...res, code: step.solution });
          ok(verdict === true ? true : `check rejected the official solution: ${verdict}`, `${at} solution passes check`);
        }
        // The starter code must NOT already pass, or the step is a freebie.
        if (typeof step.starter === 'string' && step.starter.trim() && step.id !== 'free') {
          const s = runCode(step.starter, { capture: step.capture || [] });
          const verdict = s.error ? 'errored' : safeCheck(step, { ...s, code: step.starter });
          if (verdict === true) warnings.push(`${at}: starter code already passes the check`);
        }
      }
    }

    if (step.type === 'web') {
      ok(typeof step.solution === 'string' && step.solution.includes('<') || 'no HTML solution', `${at} solution`);
      ok(typeof step.check === 'function' || 'no check', `${at} has check`);
      if (typeof step.check === 'function') {
        const verdict = safeCheck(step, { html: step.solution, code: step.solution, logs: [], vars: {} });
        ok(verdict === true ? true : `check rejected the official solution: ${verdict}`, `${at} solution passes check`);
        if (typeof step.starter === 'string') {
          const start = safeCheck(step, { html: step.starter, code: step.starter, logs: [], vars: {} });
          if (start === true) warnings.push(`${at}: starter HTML already passes the check`);
        }
      }
    }

    if (step.type === 'robot') {
      const res = runRobot(step.solution, step.spec);
      ok(res.solved || `maze unsolved: ${res.reason}`, `${at} maze solvable`);
      if (step.check) {
        const v = safeCheck(step, { logs: res.logs, code: step.solution, vars: {}, value: undefined });
        ok(v === true ? true : `extra check rejected solution: ${v}`, `${at} extra check`);
      }
    }

    if (step.type === 'quiz' || step.type === 'predict') {
      ok(Array.isArray(step.options) && step.options.length >= 2 || 'bad options', `${at} options`);
      ok(step.answer >= 0 && step.answer < step.options.length || 'answer out of range', `${at} answer index`);
      ok(typeof step.why === 'string' && step.why.length > 10 || 'missing explanation', `${at} explanation`);
      if (step.type === 'predict') {
        const res = runCode(step.code);
        const printed = res.logs.join(' ');
        const expected = String(step.options[step.answer]);
        if (!res.error && printed !== expected && !printed.includes(expected)) {
          warnings.push(`${at}: real output "${printed}" vs marked answer "${expected}" (prose answer? check by hand)`);
        }
      }
    }

    if (step.type === 'order') {
      ok(Array.isArray(step.lines) && step.lines.length >= 3 || 'needs 3+ lines', `${at} lines`);
    }
    if (step.type === 'type') {
      ok(typeof step.target === 'string' && step.target.length > 5 || 'bad target', `${at} target`);
    }
    if (step.image) {
      ok(typeof step.image.src === 'string' && step.image.src.length > 0 || 'image needs a src', `${at} image src`);
      ok(typeof step.image.alt === 'string' && step.image.alt.length > 0 || 'image needs alt text', `${at} image alt`);
    }

    if (step.type === 'teach') {
      ok(typeof step.text === 'string' && step.text.length > 30 || 'text too short', `${at} text`);
    }
    if (step.palette) {
      step.palette.forEach((b) => {
        const holes = (b.tpl.match(/\{\d\}/g) || []).length;
        ok(holes === (b.slots || []).length || `${holes} holes vs ${(b.slots || []).length} slots`, `${at} block ${b.id}`);
      });
    }
  });
}

// Practice-drill sanity
for (const game of DRILLS) {
  ok(game.pool.length >= 5 || 'pool too small', `drill ${game.id} pool`);
  if (game.kind === 'quiz') {
    game.pool.forEach((q, i) => {
      ok(q.answer >= 0 && q.answer < q.options.length || 'answer out of range', `drill ${game.id} q${i + 1}`);
    });
  }
}
// Every practice maze must be solvable by *some* route: check reachability by BFS.
MAZES.forEach((m, i) => {
  const blocked = new Set((m.walls || []).map(([x, y]) => `${x},${y}`));
  const seen = new Set([`${m.start.x},${m.start.y}`]);
  const queue = [[m.start.x, m.start.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  const targets = [...(m.gems || []).map(([x, y]) => `${x},${y}`), `${m.goal.x},${m.goal.y}`];
  const unreachable = targets.filter((t) => !seen.has(t));
  ok(unreachable.length === 0 || `unreachable: ${unreachable.join(' ')}`, `practice maze ${i + 1} reachable`);
});

console.log(`\n${pass} checks passed`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log('   - ' + w));
}
if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
console.log(`\n${ALL_LESSONS.length} lessons, ${ALL_LESSONS.reduce((n, l) => n + l.steps.length, 0)} steps — all good.\n`);
