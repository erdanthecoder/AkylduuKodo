// moneytime.js — money in pounds and pence, clocks to the nearest minute,
// Roman numerals I–XII, and how long something takes.

import { int, pick, shuffle, money, pounds, clockWords, hhmm, ROMAN, NAMES } from '../kit.js';

const COINS = [1, 2, 5, 10, 20, 50, 100, 200];

/**
 * How the answer box should ask for an amount. Under £1 a seven-year-old thinks
 * in pence, so asking for "0.59" in a box with a £ on it is a trick question.
 */
function amount(pence) {
  if (pence < 100) {
    return { suffix: 'p', answer: String(pence), accept: [`${pence}p`, (pence / 100).toFixed(2)] };
  }
  return { prefix: '£', answer: pounds(pence), accept: [String(pence), money(pence)] };
}

export const moneyTotal = (r, level) => {
  const howMany = level === 1 ? 2 : level === 2 ? 3 : 4;
  const coins = Array.from({ length: howMany }, () => pick(r, level === 1 ? [10, 20, 50, 100] : COINS));
  const total = coins.reduce((a, b) => a + b, 0);
  return {
    kind: 'money',
    prompt: 'How much money is this altogether?',
    visual: { type: 'coins', coins },
    ...amount(total),
    hint: 'Add the big coins first.',
    why: `${coins.map(money).join(' + ')} = ${money(total)}.`,
  };
};

export const moneyChange = (r, level) => {
  const paid = level === 1 ? 100 : pick(r, [100, 200, 500, 1000]);
  const cost = int(r, level === 1 ? 10 : 20, paid - 5);
  const change = paid - cost;
  return {
    kind: 'money',
    prompt: `${pick(r, NAMES)} buys something for ${money(cost)} and pays with ${money(paid)}. How much change?`,
    ...amount(change),
    hint: `Count up from ${money(cost)} to ${money(paid)}.`,
    why: `${money(paid)} − ${money(cost)} = ${money(change)}.`,
  };
};

export const clockRead = (r, level) => {
  const h = int(r, 1, 12);
  const m = level === 1 ? pick(r, [0, 15, 30, 45])
    : level === 2 ? pick(r, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
    : int(r, 0, 59);
  return {
    kind: 'choice',
    prompt: 'What time does this clock say?',
    visual: { type: 'clock', h, m },
    choices: shuffle(r, [
      clockWords(h, m),
      clockWords(h, (m + 5) % 60),
      clockWords((h % 12) + 1, m),
      clockWords(h, (m + 30) % 60),
    ].filter((v, i, all) => all.indexOf(v) === i)),
    answer: clockWords(h, m),
    hint: 'The short hand is the hour. The long hand is the minutes.',
    why: `The hands show ${hhmm(h, m)}, which we say as "${clockWords(h, m)}".`,
  };
};

export const roman = (r, level) => {
  const n = int(r, 1, 12);
  if (level === 1 || r() < 0.5) {
    return {
      kind: 'number',
      prompt: `What number is ${ROMAN[n - 1]}?`,
      answer: String(n),
      hint: 'I is 1, V is 5, X is 10.',
      why: `${ROMAN[n - 1]} is ${n}. On a clock face it sits where ${n} would be.`,
    };
  }
  return {
    kind: 'choice',
    prompt: `How do you write ${n} in Roman numerals?`,
    choices: shuffle(r, [ROMAN[n - 1], ...shuffle(r, ROMAN.filter((x) => x !== ROMAN[n - 1])).slice(0, 3)]),
    answer: ROMAN[n - 1],
    hint: 'I is 1, V is 5, X is 10.',
    why: `${n} is written ${ROMAN[n - 1]}.`,
  };
};

export const duration = (r, level) => {
  const h = int(r, 1, 10);
  const m = level === 1 ? pick(r, [0, 30]) : pick(r, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const mins = level === 1 ? pick(r, [15, 30, 45, 60]) : pick(r, [20, 25, 40, 50, 70, 90]);
  const startTotal = h * 60 + m;
  const endTotal = startTotal + mins;
  const eh = Math.floor(endTotal / 60) % 12 || 12;
  const em = endTotal % 60;
  if (r() < 0.5) {
    return {
      kind: 'text',
      prompt: `A film starts at ${hhmm(h, m)} and lasts ${mins} minutes. What time does it finish?`,
      answer: hhmm(Math.floor(endTotal / 60), em),
      accept: [hhmm(eh, em), `${eh}:${String(em).padStart(2, '0')}`],
      hint: 'Count on the hours first, then the minutes.',
      why: `${hhmm(h, m)} plus ${mins} minutes is ${hhmm(Math.floor(endTotal / 60), em)}.`,
    };
  }
  return {
    kind: 'number',
    prompt: `It is ${hhmm(h, m)}. Tea is at ${hhmm(Math.floor(endTotal / 60), em)}. How many minutes until tea?`,
    suffix: 'min',
    answer: String(mins),
    hint: 'Count up to the next o\'clock first.',
    why: `From ${hhmm(h, m)} to ${hhmm(Math.floor(endTotal / 60), em)} is ${mins} minutes.`,
  };
};
