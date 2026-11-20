// Nickname filter, PIN parsing, CSV export, search words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isClean, cleanName, randomName } from '../../src/services/names.js';
import { cell, toCSV } from '../../src/game/report.js';

test('rude nicknames are blocked, however they are disguised', () => {
  for (const n of ['shit', 'Sh1t', 'S H I T', 'shiiiit', 'fuck', 'f.u.c.k', 'b1tch', 'a$$hole', 'ass', 'nazi']) {
    assert.equal(isClean(n), false, n);
  }
});

test('ordinary names are fine', () => {
  for (const n of ['Ana', 'Ben', 'Class 5B', 'Cassandra', 'Scunthorpe', 'Grass', 'Dickens', 'Hello', 'Matsushita', 'Assam', 'Sussex']) {
    assert.equal(isClean(n), true, n);
  }
});

test('names are tidied and made up safely', () => {
  assert.equal(cleanName('  Ana   Lee  '), 'Ana Lee');
  const taken = new Set();
  for (let i = 0; i < 200; i++) {
    const n = randomName(taken);
    assert.ok(isClean(n) && n.length <= 16, n);
    taken.add(n.toLowerCase());
  }
});

test('CSV cells cannot run as spreadsheet formulas', () => {
  assert.equal(cell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(cell('+1'), "'+1");
  assert.equal(cell('-cmd'), "'-cmd");
  assert.equal(cell('@SUM'), "'@SUM");
  assert.equal(cell('Ana, Ben'), '"Ana, Ben"');
  const csv = toCSV({ players: [{ rank: 1, name: '=bad', score: 10, correct: 1, answered: 2 }] });
  assert.ok(csv.includes("'=bad"));
  assert.ok(csv.includes('50%'));
});
