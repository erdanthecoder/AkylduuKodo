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

test('video clips: YouTube links, times, limits', async () => {
  const q = await import('../../src/game/questions.js');
  for (const link of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'https://www.youtube.com/watch?t=3&v=dQw4w9WgXcQ'])
    assert.equal(q.youTubeId(link), 'dQw4w9WgXcQ', link);
  assert.equal(q.youTubeId('https://evil.example/watch?v=dQw4w9WgXcQ'), '');
  assert.equal(q.parseTime('1:05'), 65);
  assert.equal(q.parseTime('90'), 90);
  assert.deepEqual(q.cleanVideo({ id: 'dQw4w9WgXcQ', start: 10, end: 40 }), { id: 'dQw4w9WgXcQ', start: 10, end: 40 });
  assert.equal(q.cleanVideo({ id: 'dQw4w9WgXcQ', start: 40, end: 10 }), null);
  assert.equal(q.cleanVideo({ id: 'dQw4w9WgXcQ', start: 0, end: 900 }), null);
  const { pub, key } = q.split([{ id: 'a', type: 'tf', text: 'Watch', time: 10, points: 'standard', answer: true, video: { id: 'dQw4w9WgXcQ', start: 0, end: 20 } }]);
  assert.equal(pub[0].video.end, 20);
  assert.equal(q.join(pub, key)[0].video.id, 'dQw4w9WgXcQ');
});
