import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window ??= undefined;
const { createHost, BOOSTS, PER_BOOST, pointsFor } = await import('../../src/game/modes/skyrace.js');

function setup() {
  let t = 1000;
  const players = new Map();
  const dirty = new Set();
  const live = { now: () => t, set: async () => {} };
  const host = createHost({ live, P: (x) => x, players, dirty });
  const p = { uid: 'a', score: 0, correct: 0, extra: {} };
  players.set('a', p); host.join(p);
  return { host, p, players, step: (ms) => { t += ms; } };
}

test('boosts need right answers', () => {
  const { host, p, step } = setup();
  step(1000); host.data('prog', { a: { d: 10, b: 5 } });
  assert.equal(p.extra.b, 0);
  p.correct = PER_BOOST * 2;
  step(1000); host.data('prog', { a: { d: 20, b: 5 } });
  assert.equal(p.extra.b, 2);
});

test('distance is rate capped', () => {
  const { host, p, step } = setup();
  step(1000); host.data('prog', { a: { d: 999999, b: 0 } });
  assert.ok(p.extra.d < 100);
  assert.equal(p.score, pointsFor(p.extra.d, 0));
});

test('race ends when everyone used all boosts', () => {
  const { host, p, step } = setup();
  assert.equal(host.done(), false);
  p.correct = PER_BOOST * BOOSTS;
  step(1000); host.data('prog', { a: { d: 10, b: BOOSTS } });
  assert.equal(host.done(), true);
  assert.equal(host.grant(p, true), 1);
  assert.equal(host.grant(p, false), 0);
});
