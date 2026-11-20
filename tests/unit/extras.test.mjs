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
