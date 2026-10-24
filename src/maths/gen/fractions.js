// fractions.js — Year 3 meets tenths, unit and non-unit fractions, equivalence,
// and adding within one whole. The shaded-shape questions carry a `visual` so
// she sees the fraction rather than only reading it.

import { int, pick, shuffle, frac, gcd } from '../kit.js';

export const nameFraction = (r, level) => {
  const bottom = pick(r, level === 1 ? [2, 3, 4] : [3, 4, 5, 6, 8, 10]);
  const top = int(r, 1, bottom - 1);
  return {
    kind: 'fraction',
    prompt: 'What fraction is shaded?',
    visual: { type: 'bar', parts: bottom, filled: top },
    answer: frac(top, bottom),
    hint: 'Count all the parts first — that is the bottom number.',
    why: `There are ${bottom} equal parts and ${top} are shaded, so it is ${top}/${bottom}.`,
  };
};

export const tenths = (r, level) => {
  if (level === 1 || r() < 0.5) {
    const n = int(r, 1, 9);
    return {
      kind: 'fraction',
      prompt: `Split one whole into 10 equal parts and take ${n}. What fraction is that?`,
      visual: { type: 'bar', parts: 10, filled: n },
      answer: frac(n, 10),
      hint: 'Ten equal parts means tenths.',
      why: `${n} parts out of 10 is ${n}/10.`,
    };
  }
  const n = int(r, 1, 9);
  return {
    kind: 'fraction',
    prompt: `${n} ÷ 10 =`,
    answer: frac(n, 10),
    hint: 'Dividing by 10 makes tenths.',
    why: `${n} ÷ 10 = ${n}/10. Sharing ${n} wholes between 10 gives ${n} tenths each.`,
  };
};

export const fractionOf = (r, level) => {
  const bottom = pick(r, level === 1 ? [2, 4] : level === 2 ? [2, 3, 4, 5] : [3, 4, 5, 8, 10]);
  const each = int(r, 2, level === 1 ? 6 : 10);
  const total = bottom * each;
  const top = level === 3 ? int(r, 1, bottom - 1) : 1;
  const answer = each * top;
  return {
    kind: 'number',
    prompt: `What is ${frac(top, bottom)} of ${total}?`,
    answer: String(answer),
    hint: `Share ${total} into ${bottom} equal piles first.`,
    why: `${total} ÷ ${bottom} = ${each}, so one part is ${each}.${top > 1 ? ` You want ${top} parts: ${each} × ${top} = ${answer}.` : ''}`,
  };
};

export const equivalent = (r, level) => {
  const base = pick(r, level === 1 ? [[1, 2], [1, 4]] : [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5]]);
  const times = int(r, 2, level === 1 ? 2 : 4);
  const [t, b] = base;
  const rt = t * times;
  const rb = b * times;
  const right = frac(rt, rb);
  // a wrong choice must be genuinely wrong — not the same fraction written
  // another way — and the three of them must differ from each other
  const candidates = [
    [rt + 1, rb], [rt, rb + 1], [t + times, b + times], [rt, rb - 1],
    [rt - 1, rb], [t * (times + 1), rb], [rt, b * (times + 1)],
  ];
  const wrongs = [];
  for (const [ct, cb] of shuffle(r, candidates)) {
    if (wrongs.length >= 3) break;
    if (ct < 1 || cb < 2 || ct >= cb) continue;
    if (ct * rb === rt * cb) continue;              // equivalent, so not wrong
    const text = frac(ct, cb);
    if (text === right || wrongs.includes(text)) continue;
    wrongs.push(text);
  }
  return {
    kind: 'choice',
    prompt: `Which fraction is the same as ${frac(t, b)}?`,
    choices: shuffle(r, [right, ...wrongs]),
    answer: right,
    hint: 'Whatever you do to the top, do to the bottom.',
    why: `Multiply both numbers by ${times}: ${t} × ${times} = ${t * times} and ${b} × ${times} = ${b * times}. So ${frac(t, b)} = ${right}.`,
  };
};

export const compareFractions = (r) => {
  const bottom = pick(r, [3, 4, 5, 6, 8, 10]);
  let a = int(r, 1, bottom - 1);
  let b = int(r, 1, bottom - 1);
  if (a === b) b = a === 1 ? a + 1 : a - 1;
  const sign = a > b ? '>' : '<';
  return {
    kind: 'choice',
    prompt: 'Which sign goes in the middle?',
    statement: `${frac(a, bottom)}  ?  ${frac(b, bottom)}`,
    choices: ['<', '>'],
    answer: sign,
    hint: 'The pieces are the same size, so just count them.',
    why: `Both are ${bottom}ths, so the one with more pieces is bigger: ${frac(a, bottom)} ${sign} ${frac(b, bottom)}.`,
  };
};

export const addFractions = (r, level) => {
  const bottom = pick(r, level === 1 ? [4, 5, 6] : [5, 6, 8, 10]);
  const a = int(r, 1, bottom - 2);
  const b = int(r, 1, bottom - 1 - a);
  if (r() < 0.5) {
    return {
      kind: 'fraction',
      prompt: `${frac(a, bottom)} + ${frac(b, bottom)} =`,
      answer: frac(a + b, bottom),
      hint: 'The bottom number stays the same.',
      why: `Add the top numbers only: ${a} + ${b} = ${a + b}. The pieces are still ${bottom}ths, so it is ${frac(a + b, bottom)}.`,
    };
  }
  return {
    kind: 'fraction',
    prompt: `${frac(a + b, bottom)} − ${frac(b, bottom)} =`,
    answer: frac(a, bottom),
    hint: 'The bottom number stays the same.',
    why: `Take away the top numbers only: ${a + b} − ${b} = ${a}. So the answer is ${frac(a, bottom)}.`,
  };
};
