// Levels, rewards, box odds and custom blooks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawFromBox, RARITIES, rarityOf, BLOOKS, isCustom, customId, customParts, STARTERS } from '../../src/ui/blooks.js';
import { levelOf, xpFor, levelInfo, rewardFor, CUSTOM_SLOTS, partLevel, unlocksAt } from '../../src/services/progress.js';

const seeded = (s = 7) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

test('every blook has a rarity, and the chances add up to one', () => {
  for (const b of BLOOKS) assert.ok(b.rarity, b.id);
  assert.ok(Math.abs(RARITIES.reduce((n, r) => n + r.chance, 0) - 1) < 1e-9);
  assert.deepEqual(STARTERS.map((id) => rarityOf(id).id), STARTERS.map(() => 'common'));
});

test('rarer blooks come out of boxes less often; legendary is rarest', () => {
  const rand = seeded(42);
  const counts = Object.fromEntries(RARITIES.map((r) => [r.id, 0]));
  const N = 100000;
  for (let i = 0; i < N; i++) counts[rarityOf(drawFromBox(rand)).id]++;
  const order = RARITIES.map((r) => counts[r.id]);
  for (let i = 1; i < order.length; i++) assert.ok(order[i] < order[i - 1], JSON.stringify(counts));
  assert.ok(Math.abs(counts.legendary / N - 0.01) < 0.003, `legendary ${counts.legendary}`);
});

test('levels', () => {
  assert.equal(levelOf(0), 1);
  assert.equal(levelOf(99), 1);
  assert.equal(levelOf(100), 2);
  assert.equal(levelOf(xpFor(10)), 10);
  assert.equal(levelOf(1e9), 30);
  assert.ok(levelInfo(150).frac > 0 && levelInfo(150).frac < 1);
});

test('exactly three custom slots, unlocked by level', () => {
  assert.equal(CUSTOM_SLOTS.length, 3);
  assert.ok(unlocksAt(3).some((t) => t.includes('slot 1')));
  assert.ok(unlocksAt(10).some((t) => t.includes('slot 3')));
  assert.equal(partLevel('eyes', 0), 1);
  assert.ok(partLevel('top', 8) > partLevel('top', 2));
});

test('custom blook ids round-trip and are validated', () => {
  const id = customId({ body: 3, eyes: 1, mouth: 2, top: 5, extra: 4 });
  assert.equal(id, 'c-31254');
  assert.ok(isCustom(id));
  assert.deepEqual(customParts(id), { body: 3, eyes: 1, mouth: 2, top: 5, extra: 4 });
  assert.ok(!isCustom('c-99999'));
  assert.ok(!isCustom('dragon'));
  assert.equal(rarityOf(id).id, 'legendary');
});

test('game rewards stay within the limits the rules allow', () => {
  const big = rewardFor({ s: 999999, c: 100, r: 1 }, 30);
  assert.ok(big.xp <= 400 && big.coins <= 80);
  const small = rewardFor({ s: 0, c: 0, r: 5 }, 5);
  assert.ok(small.xp >= 40 && small.coins >= 10);
  assert.ok(rewardFor({ s: 0, c: 0, r: 1 }, 5).coins > small.coins);
});
