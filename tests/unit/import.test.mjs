// Reading quizzes pasted from AI chatbots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAIQuiz, extractJSON, aiPrompt } from '../../src/game/import.js';
import { problem } from '../../src/game/questions.js';

const good = {
  title: 'Volcanoes', description: 'Hot rocks.',
  questions: [
    { type: 'mc', question: 'What comes out of a volcano?', options: ['Lava', 'Snow', 'Sand', 'Milk'], answer: 0 },
    { type: 'tf', question: 'Mount Fuji is in Japan.', answer: true },
    { type: 'multi', question: 'Which are volcanoes?', options: ['Etna', 'Everest', 'Vesuvius', 'K2'], answers: [0, 2] },
    { type: 'type', question: 'Molten rock underground is called?', accept: ['magma'] },
    { type: 'order', question: 'Order by size', items: ['Pebble', 'Boulder', 'Mountain'] },
    { type: 'number', question: 'How many continents?', answer: 7 },
  ],
};

test('a clean reply becomes valid questions of every type', () => {
  const r = readAIQuiz(JSON.stringify(good));
  assert.equal(r.title, 'Volcanoes');
  assert.equal(r.questions.length, 6);
  assert.deepEqual(r.skipped, []);
  for (const q of r.questions) assert.equal(problem(q), '', q.type);
  assert.deepEqual(r.questions[2].answer, [0, 2]);
  assert.deepEqual(r.questions[4].options, ['Pebble', 'Boulder', 'Mountain']);
});

test('chatter, code fences, smart quotes and trailing commas are handled', () => {
  const messy = `Sure! Here is your quiz:\n\n\`\`\`json\n{\n  “title”: “Space”,\n  "questions": [\n    {"type": "mc", "question": "Largest planet?", "options": ["Mars","Jupiter","Venus","Earth"], "answer": 1,},\n  ],\n}\n\`\`\`\nHave fun!`;
  const r = readAIQuiz(messy);
  assert.equal(r.title, 'Space');
  assert.equal(r.questions[0].answer, 1);
});

test('answers given as letters, words or strings are understood', () => {
  const opts = ['Red', 'Blue', 'Green', 'Pink'];
  const q = (answer) => readAIQuiz(JSON.stringify({ questions: [{ type: 'mc', question: 'Sky colour?', options: opts, answer }] })).questions[0];
  assert.equal(q('B').answer, 1);
  assert.equal(q('b)').answer, 1);
  assert.equal(q('Blue').answer, 1);
  assert.equal(q('1').answer, 1);
  const tf = readAIQuiz(JSON.stringify({ questions: [{ type: 'True/False'.replace('/', '_'), question: 'Water is wet.', answer: 'True' }] }));
  assert.equal(tf.questions[0].answer, true);
});

test('broken questions are skipped and explained, never guessed', () => {
  const r = readAIQuiz(JSON.stringify({ questions: [
    { type: 'mc', question: 'A?', options: ['x', 'y'], answer: 5 },
    { type: 'mc', question: '', options: ['x', 'y'], answer: 0 },
    { type: 'number', question: 'How many?', answer: 'lots' },
    { type: 'dance', question: 'Dance?' },
    { type: 'tf', question: 'Fine one.', answer: false },
  ] }));
  assert.equal(r.questions.length, 1);
  assert.equal(r.skipped.length, 4);
  assert.match(r.skipped[0], /Question 1/);
});

test('nothing usable gives a clear error', () => {
  assert.throws(() => extractJSON('I cannot help with that.'), /No quiz found/);
  assert.throws(() => readAIQuiz('{"questions": []}'), /no questions/);
  assert.throws(() => extractJSON('{"questions": [ {"type": "mc"'), /No quiz found|not complete/);
});

test('the prompt names the topic and the count', () => {
  const p = aiPrompt({ topic: 'Dinosaurs', count: 12, level: 'teens' });
  assert.match(p, /Dinosaurs/);
  assert.match(p, /exactly 12 questions/);
  assert.match(p, /teenagers/);
});
