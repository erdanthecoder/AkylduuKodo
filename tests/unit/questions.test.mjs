// Question types, marking and scoring.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankQuestion, retype, problem, split, join, check, validChoice, points, normaliseText, TYPES } from '../../src/game/questions.js';

const seeded = (s = 1) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

const full = [
  { id: 'a', type: 'mc', text: 'Largest planet?', time: 20, points: 'standard', options: ['Mars', 'Jupiter', 'Venus'], answer: 1 },
  { id: 'b', type: 'tf', text: 'The Sun is a star.', time: 10, points: 'double', answer: true },
  { id: 'c', type: 'multi', text: 'Mammals?', time: 20, points: 'standard', options: ['Whale', 'Shark', 'Bat'], answer: [2, 0] },
  { id: 'd', type: 'type', text: 'Gas plants take in?', time: 30, points: 'standard', answer: ['Carbon dioxide', 'CO2'] },
  { id: 'e', type: 'order', text: 'Small to big', time: 30, points: 'standard', options: ['Atom', 'Cell', 'Mouse', 'Whale'] },
  { id: 'f', type: 'number', text: 'Planets?', time: 20, points: 'standard', answer: 8, tolerance: 0, unit: '' },
  { id: 'g', type: 'poll', text: 'Favourite?', time: 20, points: 'none', options: ['A', 'B'] },
];

test('every type has a valid blank and a sample that passes', () => {
  for (const t of TYPES) assert.ok(blankQuestion(t.id).type === t.id);
  for (const q of full) assert.equal(problem(q), '', q.type);
});

test('problems are caught', () => {
  assert.match(problem({ ...full[0], text: ' ' }), /Write the question/);
  assert.match(problem({ ...full[0], options: ['A', ''] }), /at least 2/);
  assert.match(problem({ ...full[0], options: ['A', 'a', 'B'] }), /same/);
  assert.match(problem({ ...full[0], answer: 5 }), /Mark the right/);
  assert.match(problem({ ...full[2], answer: [] }), /at least one/);
  assert.match(problem({ ...full[3], answer: [' '] }), /Write the right answer/);
  assert.match(problem({ ...full[4], options: ['A', 'B'] }), /at least 3 items/);
  assert.match(problem({ ...full[5], answer: NaN }), /right number/);
  assert.match(problem({ ...full[0], time: 7 }), /time limit/);
});

test('split hides answers; join restores them exactly', () => {
  const { pub, key } = split(full, seeded(3));
  const text = JSON.stringify(pub);
  assert.ok(!text.includes('"answer"'));
  assert.ok(!text.includes('CO2'));
  // order is never published in the right order
  for (let s = 1; s < 40; s++) {
    const p = split([full[4]], seeded(s)).pub[0];
    assert.notDeepEqual(p.options, full[4].options);
  }
  const back = join(pub, key);
  assert.deepEqual(back[0].answer, 1);
  assert.deepEqual(back[2].answer, [0, 2]);
  assert.deepEqual(back[4].options, full[4].options);
  assert.deepEqual(back[3].answer, ['Carbon dioxide', 'CO2']);
  assert.equal(back[5].answer, 8);
});

test('marking each type', () => {
  const { pub, key } = split(full, seeded(7));
  const c = (i, choice) => check(pub[i], key[i], choice).correct;
  assert.ok(c(0, 1)); assert.ok(!c(0, 0));
  assert.ok(c(1, true)); assert.ok(!c(1, false)); assert.ok(!c(1, 'true'));
  assert.ok(c(2, [2, 0])); assert.ok(!c(2, [0])); assert.ok(!c(2, [0, 1, 2]));
  assert.ok(c(3, 'carbon-dioxide!')); assert.ok(c(3, ' co2 ')); assert.ok(!c(3, 'oxygen')); assert.ok(!c(3, ''));
  const order = pub[4].options;
  const right = ['Atom', 'Cell', 'Mouse', 'Whale'].map((t) => order.indexOf(t));
  assert.ok(c(4, right)); assert.ok(!c(4, [...right].reverse()));
  assert.ok(c(5, '8')); assert.ok(c(5, '8,0')); assert.ok(!c(5, '9')); assert.ok(!c(5, ''));
  assert.ok(check(pub[6], key[6], 0).poll);
  assert.equal(check(pub[4], key[4], null).display, 'Atom → Cell → Mouse → Whale');
});

test('number leeway', () => {
  const { pub, key } = split([{ ...full[5], answer: 3.14, tolerance: 0.01 }]);
  assert.ok(check(pub[0], key[0], '3.15').correct);
  assert.ok(!check(pub[0], key[0], '3.16').correct);
});

test('only well-formed choices are accepted', () => {
  const { pub } = split(full, seeded(2));
  assert.ok(validChoice(pub[0], 2)); assert.ok(!validChoice(pub[0], 3)); assert.ok(!validChoice(pub[0], '1'));
  assert.ok(validChoice(pub[1], false)); assert.ok(!validChoice(pub[1], 0));
  assert.ok(!validChoice(pub[2], [])); assert.ok(!validChoice(pub[2], [7]));
  assert.ok(!validChoice(pub[4], [0, 0, 1, 2])); assert.ok(validChoice(pub[4], [3, 2, 1, 0]));
  assert.ok(!validChoice(pub[3], 'x'.repeat(81)));
});

test('speed scoring: faster earns more, never below half', () => {
  const at = (ms) => points({ correct: true, elapsedMs: ms, limitS: 20 });
  assert.equal(at(0), 1000);
  assert.equal(at(10000), 750);
  assert.equal(at(20000), 500);
  assert.equal(at(99999), 500);
  assert.ok(at(1000) > at(2000));
  assert.equal(points({ correct: true, elapsedMs: 15000, limitS: 20, speed: false }), 1000);
  assert.equal(points({ correct: false, elapsedMs: 0, limitS: 20 }), 0);
  assert.equal(points({ correct: true, elapsedMs: 0, limitS: 20, kind: 'double' }), 2000);
  assert.equal(points({ correct: true, elapsedMs: 0, limitS: 20, kind: 'none' }), 0);
  assert.equal(points({ correct: true, elapsedMs: 0, limitS: 20, streak: 3 }), 1200);
  assert.equal(points({ correct: true, elapsedMs: 0, limitS: 20, streak: 99 }), 1500);
});

test('retype keeps what fits', () => {
  const q = retype(full[0], 'multi');
  assert.deepEqual(q.options, ['Mars', 'Jupiter', 'Venus']);
  assert.equal(q.text, full[0].text);
  assert.equal(retype(full[0], 'poll').points, 'none');
});

test('typed answers are forgiving', () => {
  assert.equal(normaliseText('  São   Paulo!! '), 'sao paulo');
  assert.equal(normaliseText('New-York'), 'new york');
});
