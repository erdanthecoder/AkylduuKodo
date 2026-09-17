// robot.js — the tiny grid world "Kodo the yak" walks around in.
// Pure logic + a frame trace, so the UI can replay a run as an animation.

import { runCode } from './runner.js';

// Screen coordinates: y grows downwards.
export const DIRS = [
  { dx: 1, dy: 0 },  // 0 east
  { dx: 0, dy: 1 },  // 1 south
  { dx: -1, dy: 0 }, // 2 west
  { dx: 0, dy: -1 }, // 3 north
];

export function makeWorld(spec) {
  return {
    w: spec.w,
    h: spec.h,
    x: spec.start.x,
    y: spec.start.y,
    dir: spec.start.dir ?? 0,
    walls: new Set((spec.walls || []).map(([x, y]) => `${x},${y}`)),
    gems: new Set((spec.gems || []).map(([x, y]) => `${x},${y}`)),
    goal: spec.goal || null,
    steps: 0,
  };
}

function snapshot(w, note) {
  return {
    x: w.x,
    y: w.y,
    dir: w.dir,
    gems: [...w.gems],
    note: note || '',
  };
}

export function runRobot(code, spec, options = {}) {
  const world = makeWorld(spec);
  const frames = [snapshot(world, 'start')];
  const maxMoves = options.maxMoves || 400;
  let crash = null;

  const record = (note) => {
    if (frames.length <= maxMoves) frames.push(snapshot(world, note));
  };

  const api = {
    forward() {
      if (++world.steps > maxMoves) throw new Error('Kodo is dizzy — too many moves!');
      const d = DIRS[world.dir];
      const nx = world.x + d.dx;
      const ny = world.y + d.dy;
      if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h || world.walls.has(`${nx},${ny}`)) {
        crash = crash || 'Bonk! Kodo walked into a wall.';
        record('bonk');
        throw new Error(crash);
      }
      world.x = nx;
      world.y = ny;
      record('move');
    },
    turnLeft() {
      world.dir = (world.dir + 3) % 4;
      record('turn');
    },
    turnRight() {
      world.dir = (world.dir + 1) % 4;
      record('turn');
    },
    collect() {
      const key = `${world.x},${world.y}`;
      if (!world.gems.has(key)) {
        crash = crash || 'Nothing to collect here — no apple on this square.';
        throw new Error(crash);
      }
      world.gems.delete(key);
      record('collect');
    },
    canMove() {
      const d = DIRS[world.dir];
      const nx = world.x + d.dx;
      const ny = world.y + d.dy;
      return !(nx < 0 || ny < 0 || nx >= world.w || ny >= world.h || world.walls.has(`${nx},${ny}`));
    },
    onApple() {
      return world.gems.has(`${world.x},${world.y}`);
    },
    repeat(n, fn) {
      for (let i = 0; i < n; i++) fn(i);
    },
  };

  const res = runCode(code, { globals: api, maxSteps: 200000 });

  const atGoal = !world.goal || (world.x === world.goal.x && world.y === world.goal.y);
  const allGems = world.gems.size === 0;
  let reason = null;
  if (res.error) reason = res.error;
  else if (!allGems) reason = `Still ${world.gems.size} apple(s) left to collect`;
  else if (!atGoal) reason = 'Kodo did not reach the yurt';

  return {
    frames,
    logs: res.logs,
    world,
    moves: world.steps,
    solved: !reason,
    reason,
  };
}
