// tables.js — the 3, 4 and 8 times tables, dividing by them, and 2-digit
// multiplying. Year 3 is the year these have to become automatic.

import { int, pick, shuffle, NAMES, THINGS, plural, distractors } from '../kit.js';

const top = (level) => (level === 1 ? 6 : level === 2 ? 10 : 12);

function tableQuestion(r, table, level) {
  const n = int(r, 2, top(level));
  const answer = table * n;
  const flip = r() < 0.5;
  return {
    kind: 'number',
    prompt: `${flip ? n : table} × ${flip ? table : n} =`,
    // while it is still being learned, show it as rows of dots: countable now,
    // remembered later. By level 3 it should be recall, so the dots go away.
    visual: level < 3 && table * n <= 48 ? { type: 'array', rows: table, cols: n } : null,
    answer: String(answer),
    hint: `Count up in ${table}s, ${n} times.`,
    why: `${table} × ${n} = ${answer}. ${table} lots of ${n} is the same as ${n} lots of ${table}.`,
  };
}

export const table3 = (r, level) => tableQuestion(r, 3, level);
export const table4 = (r, level) => tableQuestion(r, 4, level);
export const table8 = (r, level) => tableQuestion(r, 8, level);

export const tableMixed = (r, level) => {
  const table = pick(r, level === 1 ? [2, 3, 4, 5, 10] : [3, 4, 8, 2, 5, 10]);
  return tableQuestion(r, table, level);
};

export const divide = (r, level) => {
  const table = pick(r, level === 1 ? [3, 4] : [3, 4, 8]);
  const n = int(r, 2, top(level));
  const total = table * n;
  return {
    kind: 'number',
    prompt: `${total} ÷ ${table} =`,
    visual: level < 3 && total <= 48 ? { type: 'array', rows: table, cols: n } : null,
    answer: String(n),
    hint: `How many ${table}s fit into ${total}?`,
    why: `${table} × ${n} = ${total}, so ${total} ÷ ${table} = ${n}. Dividing undoes multiplying.`,
  };
};

export const multiply2digit = (r, level) => {
  const by = pick(r, level === 1 ? [2, 3] : level === 2 ? [3, 4] : [3, 4, 8]);
  const tens = int(r, 1, level === 1 ? 2 : 3);
  const ones = int(r, 1, level === 1 ? 4 : 9);
  const n = tens * 10 + ones;
  const answer = n * by;
  return {
    kind: 'number',
    prompt: `${n} × ${by} =`,
    answer: String(answer),
    hint: `Split ${n} into ${tens * 10} and ${ones}.`,
    why: `${tens * 10} × ${by} = ${tens * 10 * by}, and ${ones} × ${by} = ${ones * by}. Add them: ${tens * 10 * by} + ${ones * by} = ${answer}.`,
  };
};

/** Scaling and correspondence — the word problems the programme of study asks for. */
export const timesProblem = (r, level) => {
  const who = pick(r, NAMES);
  const thing = pick(r, THINGS);
  const each = pick(r, [3, 4, 8]);
  const groups = int(r, 2, top(level));
  if (r() < 0.5) {
    return {
      kind: 'number',
      prompt: `${who} has ${groups} bags. Each bag holds ${plural(each, thing)}. How many ${thing.many} altogether?`,
      answer: String(each * groups),
      hint: `${groups} lots of ${each}.`,
      why: `${groups} × ${each} = ${each * groups}.`,
    };
  }
  const total = each * groups;
  return {
    kind: 'number',
    prompt: `${plural(total, thing)} are shared between ${groups} friends, the same each. How many does each friend get?`,
    answer: String(each),
    hint: `Share ${total} into ${groups} equal piles.`,
    why: `${total} ÷ ${groups} = ${each}, because ${groups} × ${each} = ${total}.`,
  };
};
