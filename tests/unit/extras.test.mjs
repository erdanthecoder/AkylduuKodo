import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPic, split, join } from '../../src/game/questions.js';

test('pictures: only Quickzy characters or https addresses survive', () => {
  assert.equal(cleanPic('blook:fox'), 'blook:fox');
  assert.equal(cleanPic('https://example.com/a.png'), 'https://example.com/a.png');
  assert.equal(cleanPic('http://example.com/a.png'), '');
  assert.equal(cleanPic('javascript:alert(1)'), '');
  assert.equal(cleanPic('https://x.com/a.png" onerror="x'), '');
  assert.equal(cleanPic('blook:<b>'), '');
  assert.equal(cleanPic(''), '');
});

test('pictures travel with the public half and come back', () => {
  const qs = [{ id: 'a', type: 'tf', text: 'Cats meow', time: 10, points: 'standard', answer: true, img: 'blook:cat' },
    { id: 'b', type: 'tf', text: 'No picture', time: 10, points: 'standard', answer: false, img: 'ftp://nope' }];
  const { pub, key } = split(qs);
  assert.equal(pub[0].img, 'blook:cat');
  assert.equal('img' in pub[1], false);
  const back = join(pub, key);
  assert.equal(back[0].img, 'blook:cat');
  assert.equal(back[1].img, undefined);
});

test('sky climb: six levels of fifteen, points per ledge, level gates and summit', async () => {
  const m = await import('../../src/game/modes/obby.js');
  assert.equal(m.WORLDS.length, 6);
  assert.equal(m.levelOfFloor(0), 0);
  assert.equal(m.levelOfFloor(14), 0);
  assert.equal(m.levelOfFloor(15), 1);
  assert.equal(m.levelOfFloor(89), 5);
  assert.equal(m.levelOfFloor(90), 5);
  assert.equal(m.pointsFor(1), 20);
  assert.equal(m.pointsFor(15), 170);
  assert.equal(m.pointsFor(90), 520);
  let total = 0;
  for (let k = 1; k <= 90; k++) total += m.pointsFor(k);
  assert.equal(total, 90 * 20 + 5 * 150 + 500);
});

test('sky climb: a wrong answer gives no energy', async () => {
  const m = await import('../../src/game/modes/obby.js');
  const host = m.createHost({ live: {}, P: () => '', players: new Map(), dirty: new Set() });
  assert.equal(host.grant({}, false), 0);
  assert.ok(host.grant({}, true) > 0);
});
