// number.js — place value: counting, reading, splitting, comparing, ordering.
//
// Every question carries `why`: the sentence Malika reads when she gets it
// wrong. It explains the step, never just the answer, because the answer alone
// teaches nothing.

import { int, pick, shuffle, words, distractors } from '../kit.js';

export const countSteps = (r, level) => {
  const step = pick(r, level === 1 ? [4, 8] : level === 2 ? [4, 8, 50] : [4, 8, 50, 100]);
  // five numbers of the sequence must all fit under 1000, which is as far as
  // Year 3 counts — so the biggest step gets the shortest run-up
  const most = Math.min(level === 1 ? 6 : 9, Math.floor(1000 / step) - 4);
  const start = step * int(r, 1, Math.max(1, most));
  const run = [start, start + step, start + step * 2, start + step * 3];
  const answer = start + step * 4;
  return {
    kind: 'number',
    prompt: `Carry on counting in ${step}s.`,
    sequence: [...run, null],
    visual: { type: 'numberline', from: start, step, count: 4 },
    answer: String(answer),
    hint: `Each jump adds ${step}.`,
    why: `You add ${step} every time. ${run[3]} + ${step} = ${answer}.`,
  };
};

export const readWrite = (r, level) => {
  const n = level === 1 ? int(r, 100, 999) : int(r, 101, 999);
  if (r() < 0.5) {
    return {
      kind: 'number',
      prompt: `Write this number in digits: ${words(n)}.`,
      answer: String(n),
      hint: 'Hundreds first, then tens, then ones.',
      why: `${words(n)} is ${n}.`,
    };
  }
  const right = words(n);
  const wrongs = shuffle(r, distractors(r, n, { count: 3, spread: 40, min: 100 })).map(words);
  return {
    kind: 'choice',
    prompt: `How do you write ${n} in words?`,
    choices: shuffle(r, [right, ...wrongs]),
    answer: right,
    hint: 'Say it out loud first.',
    why: `${n} is "${right}".`,
  };
};

export const partition = (r, level) => {
  const h = int(r, 1, 9);
  const t = int(r, level === 1 ? 1 : 0, 9);
  const o = int(r, level === 1 ? 1 : 0, 9);
  const n = h * 100 + t * 10 + o;
  const which = pick(r, ['hundreds', 'tens', 'ones']);
  const value = which === 'hundreds' ? h : which === 'tens' ? t : o;
  // "1 tens" reads wrong to a child who is being taught to say it properly
  const say = (count, many) => `${count} ${count === 1 ? many.replace(/s$/, '') : many}`;
  return {
    kind: 'number',
    prompt: `How many ${which} are in ${n}?`,
    answer: String(value),
    hint: 'Look at the place each digit sits in.',
    why: `${n} is ${say(h, 'hundreds')}, ${say(t, 'tens')} and ${say(o, 'ones')}. So there ${value === 1 ? 'is' : 'are'} ${say(value, which)}.`,
  };
};

export const compare = (r, level) => {
  const a = int(r, 100, 999);
  let b = level === 3
    // close together, so she has to look past the first digit
    ? Math.min(999, Math.max(100, a + int(r, 1, 9) * (r() < 0.5 ? -1 : 1)))
    : int(r, 100, 999);
  if (b === a) b = a + 1 > 999 ? a - 1 : a + 1;
  const sign = a > b ? '>' : '<';
  return {
    kind: 'choice',
    prompt: `Which sign goes in the middle?`,
    statement: `${a}  ?  ${b}`,
    choices: ['<', '>'],
    answer: sign,
    hint: 'The open end always faces the bigger number.',
    why: `${a} is ${a > b ? 'bigger' : 'smaller'} than ${b}, so ${a} ${sign} ${b}.`,
  };
};

export const order = (r, level) => {
  const how_many = level === 1 ? 3 : 4;
  const set = new Set();
  while (set.size < how_many) set.add(int(r, 100, 999));
  const list = [...set];
  const sorted = [...list].sort((x, y) => x - y);
  return {
    kind: 'order',
    prompt: 'Put these in order, smallest first.',
    items: shuffle(r, list).map(String),
    answer: sorted.join(','),
    hint: 'Compare the hundreds digit first.',
    why: `Smallest to biggest: ${sorted.join(', ')}.`,
  };
};

export const moreLess = (r, level) => {
  const n = int(r, 110, 889);
  const step = level === 1 ? 10 : pick(r, [10, 100]);
  const up = r() < 0.5;
  const answer = up ? n + step : n - step;
  return {
    kind: 'number',
    prompt: `What is ${step} ${up ? 'more' : 'less'} than ${n}?`,
    visual: level === 1 ? { type: 'numberline', from: up ? n : answer, step, count: 1 } : null,
    answer: String(answer),
    hint: step === 10 ? 'Only the tens digit moves.' : 'Only the hundreds digit moves.',
    why: `${n} ${up ? '+' : '−'} ${step} = ${answer}. The ${step === 10 ? 'tens' : 'hundreds'} digit goes ${up ? 'up' : 'down'} by one.`,
  };
};
