// calc.js — adding and taking away, in the head and in columns.

import { int, pick, shuffle, NAMES, THINGS, plural, distractors } from '../kit.js';

/** Numbers that need a carry are the ones worth practising, so level 3 forces one. */
function columnPair(r, level, sub) {
  for (let tries = 0; tries < 60; tries++) {
    const a = int(r, level === 1 ? 110 : 120, 989);
    const low = level === 1 ? 11 : 110;
    const high = sub ? a - 10 : 999 - a;
    if (high < low) continue;          // no room left under 1000; pick another a
    const b = int(r, low, high);
    if (b < 10) continue;
    const carries = sub
      ? (a % 10) < (b % 10) || Math.floor(a / 10) % 10 < Math.floor(b / 10) % 10
      : (a % 10) + (b % 10) >= 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) >= 10;
    if (level === 1 && carries) continue;
    if (level === 3 && !carries) continue;
    return [a, b];
  }
  return sub ? [642, 318] : [347, 285];
}

export const addMental = (r, level) => {
  // the step is chosen first, so there is always room to land under 1000
  const step = level === 1 ? int(r, 2, 9) : pick(r, [int(r, 2, 9), int(r, 1, 8) * 10, int(r, 1, 8) * 100]);
  const n = int(r, 110, 999 - step);
  const answer = n + step;
  const place = step >= 100 ? 'hundreds' : step >= 10 ? 'tens' : 'ones';
  return {
    kind: 'number',
    prompt: `${n} + ${step} =`,
    answer: String(answer),
    hint: `Only the ${place} change.`,
    why: `Add the ${place}: ${n} + ${step} = ${answer}.`,
  };
};

export const subMental = (r, level) => {
  const step = level === 1 ? int(r, 2, 9) : pick(r, [int(r, 2, 9), int(r, 1, 8) * 10, int(r, 1, 8) * 100]);
  const answer = int(r, 101, 999 - step);
  const n = answer + step;
  const place = step >= 100 ? 'hundreds' : step >= 10 ? 'tens' : 'ones';
  return {
    kind: 'number',
    prompt: `${n} − ${step} =`,
    answer: String(answer),
    hint: `Only the ${place} change.`,
    why: `Take away the ${place}: ${n} − ${step} = ${answer}.`,
  };
};

export const addColumn = (r, level) => {
  const [a, b] = columnPair(r, level, false);
  return {
    kind: 'number',
    prompt: `${a} + ${b} =`,
    visual: { type: 'columns', a, b, op: '+' },
    answer: String(a + b),
    hint: 'Start with the ones column, on the right.',
    why: `Ones: ${a % 10} + ${b % 10}. Then the tens, then the hundreds. ${a} + ${b} = ${a + b}.`,
  };
};

export const subColumn = (r, level) => {
  const [a, b] = columnPair(r, level, true);
  return {
    kind: 'number',
    prompt: `${a} − ${b} =`,
    visual: { type: 'columns', a, b, op: '−' },
    answer: String(a - b),
    hint: 'Start with the ones. If the top is too small, borrow a ten.',
    why: `${a} − ${b} = ${a - b}. Check it: ${a - b} + ${b} = ${a}.`,
  };
};

export const missingNumber = (r, level) => {
  const b = int(r, 10, level === 1 ? 50 : 180);
  const a = int(r, level === 1 ? 20 : 120, 999 - b);
  if (r() < 0.5) {
    return {
      kind: 'number',
      prompt: `${a} + ? = ${a + b}`,
      answer: String(b),
      hint: 'Take away to find what is missing.',
      why: `Take the start off the end: ${a + b} − ${a} = ${b}.`,
    };
  }
  return {
    kind: 'number',
    prompt: `? − ${b} = ${a}`,
    answer: String(a + b),
    hint: 'Add it back on to find what you started with.',
    why: `Add them back together: ${a} + ${b} = ${a + b}.`,
  };
};

export const estimate = (r) => {
  const a = int(r, 110, 480);
  const b = int(r, 110, 490);
  const rounded = Math.round(a / 10) * 10 + Math.round(b / 10) * 10;
  const choices = shuffle(r, [rounded, ...distractors(r, rounded, { count: 3, spread: 90, min: 100 })]).map(String);
  return {
    kind: 'choice',
    prompt: `About how much is ${a} + ${b}? Round each one to the nearest 10 first.`,
    choices,
    answer: String(rounded),
    hint: `${a} is about ${Math.round(a / 10) * 10}.`,
    why: `${a} rounds to ${Math.round(a / 10) * 10} and ${b} rounds to ${Math.round(b / 10) * 10}. Together that is about ${rounded}.`,
  };
};

/** A word problem built from the same adding, so the sum has somewhere to live. */
export const addProblem = (r, level) => {
  const who = pick(r, NAMES);
  const thing = pick(r, THINGS);
  const a = int(r, level === 1 ? 12 : 120, level === 1 ? 60 : 540);
  const give = r() < 0.5;
  // you cannot give away more than you have, and a negative answer is not a
  // Year 3 idea at all
  const b = give
    ? int(r, level === 1 ? 3 : 20, a - 1)
    : int(r, level === 1 ? 8 : 110, level === 1 ? 40 : 330);
  return {
    kind: 'number',
    // no pronouns: the names are a mix, and a wrong one is a distraction
    prompt: give
      ? `${who} has ${plural(a, thing)}, and gives ${b} away. How many are left?`
      : `${who} has ${plural(a, thing)}, and finds ${b} more. How many now?`,
    answer: String(give ? a - b : a + b),
    hint: give ? 'Giving away means taking away.' : 'Finding more means adding.',
    why: give ? `${a} − ${b} = ${a - b}.` : `${a} + ${b} = ${a + b}.`,
  };
};
