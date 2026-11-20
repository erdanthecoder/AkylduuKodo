import test from 'node:test';
import assert from 'node:assert/strict';

const { rollChest, createHost: treasureHost } = await import('../../src/game/modes/treasure.js');
const { rollFish, FISH } = await import('../../src/game/modes/fishing.js');
const { createHost: candyHost, costOf } = await import('../../src/game/modes/candy.js');

const setup = (make) => {
  const players = new Map(); const dirty = new Set();
  const live = { now: () => 0, set: async () => {} };
  const host = make({ live, P: (x) => x, players, dirty });
  const add = (uid, score = 0) => { const p = { uid, name: uid, score, correct: 0, extra: {} }; players.set(uid, p); host.join(p); return p; };
  return { host, add };
};

test('treasure: chests only after a right answer, steals move gold', () => {
  const { host, add } = setup(treasureHost);
  const a = add('a', 0); const b = add('b', 200);
  host.act(a, { k: 'c', a: 0 });
  assert.equal(a.score, 0);
  assert.equal(host.grant(a, false), 0);
  assert.equal(host.grant(a, true), 1);
  a.extra.steal = 'steal';
  host.act(a, { k: 't', h: 'b' });
  assert.ok(a.score > 0 && b.score < 200 && a.score + b.score === 200);
});

test('treasure: chest outcomes are sane', () => {
  for (let i = 0; i < 500; i++) {
    const c = rollChest(100, 3);
    assert.ok(['gold', 'x2', 'x3', 'steal', 'swap', 'lose', 'none'].includes(c.k));
    if (c.k === 'lose') assert.ok(c.amt <= 0);
  }
});

test('fishing: a miss gets away, perfect timing finds fish in range', () => {
  assert.equal(rollFish(0), null);
  for (let i = 0; i < 300; i++) {
    const f = rollFish(1);
    assert.ok(f.lb >= FISH[f.i][2] * 0.6 && f.lb <= FISH[f.i][3]);
  }
});

test('candy: machines cost cash and make candy', () => {
  const { host, add } = setup(candyHost);
  const p = add('p');
  host.act(p, { k: 'b', a: 0 });
  assert.equal(p.extra.rate, 0);
  host.grant(p, true);
  host.act(p, { k: 'b', a: 0 });
  assert.equal(p.extra.rate, 1);
  assert.ok(costOf(0, 1) > costOf(0, 0));
  host.tick(1000); host.tick(2000);
  assert.ok(p.score >= 1);
});
