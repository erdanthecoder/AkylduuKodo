// drills.js — short practice exercises built from the same step ingredients
// as the lessons, with a timer for focus.

export const OUTPUT_SPRINT = [
  { code: 'console.log(2 + 3 * 2);', options: ['10', '8', '12', '7'], answer: 1 },
  { code: 'console.log("2" + 3);', options: ['5', '23', '6', 'Error'], answer: 1 },
  { code: 'let a = 4;\na += 2;\nconsole.log(a);', options: ['4', '2', '6', '42'], answer: 2 },
  { code: 'console.log(9 % 4);', options: ['2', '1', '2.25', '0'], answer: 1 },
  { code: 'console.log("yak".length);', options: ['2', '3', '4', 'undefined'], answer: 1 },
  { code: 'for (let i = 0; i < 3; i++) console.log(i);', options: ['0 1 2', '1 2 3', '0 1 2 3', '3'], answer: 0 },
  { code: 'console.log([1, 2, 3][1]);', options: ['1', '2', '3', 'undefined'], answer: 1 },
  { code: 'console.log(10 === "10");', options: ['true', 'false', 'Error', 'undefined'], answer: 1 },
  { code: 'let s = "";\nfor (let i = 0; i < 2; i++) s += "ok";\nconsole.log(s);', options: ['ok', 'okok', 'ok ok', '2'], answer: 1 },
  { code: 'function f(n) { return n * n; }\nconsole.log(f(5));', options: ['10', '25', '55', 'undefined'], answer: 1 },
  { code: 'console.log(Math.round(2.5));', options: ['2', '3', '2.5', 'Error'], answer: 1 },
  { code: 'let o = { a: 1 };\nconsole.log(o.b);', options: ['null', '0', 'undefined', 'Error'], answer: 2 },
  { code: 'console.log(true && false);', options: ['true', 'false', 'undefined', 'Error'], answer: 1 },
  { code: 'console.log("Kodo"[0]);', options: ['K', 'o', '0', 'Kodo'], answer: 0 },
  { code: 'let n = [1, 2];\nn.push(3);\nconsole.log(n.length);', options: ['2', '3', '4', '[1, 2, 3]'], answer: 1 },
  { code: 'console.log(7 / 2);', options: ['3', '3.5', '4', '1'], answer: 1 },
  { code: 'let x = 5;\nif (x > 5) console.log("big");\nelse console.log("small");', options: ['big', 'small', 'both', 'nothing'], answer: 1 },
  { code: 'console.log("ab".toUpperCase());', options: ['ab', 'AB', 'Ab', 'error'], answer: 1 },
];

export const BUG_HUNT = [
  {
    code: 'let name = "Bek"\nconsole.log(Name);',
    options: ['Missing semicolon', 'Capital N — the box is called `name`', 'Quotes are wrong', 'console.log is misspelled'],
    answer: 1,
    why: 'JavaScript is case sensitive: `Name` and `name` are two different names.',
  },
  {
    code: 'if (score = 10) {\n  console.log("ten");\n}',
    options: ['Should be ===', 'Missing else', 'Braces are wrong', 'score needs quotes'],
    answer: 0,
    why: 'One `=` assigns. Comparing needs `===`.',
  },
  {
    code: 'for (let i = 0; i < 5; i--) {\n  console.log(i);\n}',
    options: ['Should start at 1', 'i-- never reaches 5 — infinite loop', 'Missing braces', 'console.log is wrong'],
    answer: 1,
    why: 'Counting down while waiting for i to grow past 5 never ends.',
  },
  {
    code: 'function add(a, b) {\n  a + b;\n}\nconsole.log(add(2, 3));',
    options: ['Missing return', 'Wrong parameter names', 'Should use let', 'Missing semicolon'],
    answer: 0,
    why: 'Without `return`, the function hands back `undefined`.',
  },
  {
    code: 'let list = ["a", "b"];\nconsole.log(list[2]);',
    options: ['Arrays start at 1', 'Position 2 does not exist — last is 1', 'Missing .length', 'Quotes are wrong'],
    answer: 1,
    why: 'A 2-item list has positions 0 and 1. Position 2 is `undefined`.',
  },
  {
    code: 'console.log("Salam)',
    options: ['Missing closing quote and bracket', 'Wrong function name', 'Needs a variable', 'Nothing is wrong'],
    answer: 0,
    why: 'Every opening quote and bracket needs its partner.',
  },
  {
    code: 'const total = 5;\ntotal = 6;',
    options: ['const cannot be reassigned', 'Missing semicolon', 'Should be total == 6', 'Numbers need quotes'],
    answer: 0,
    why: 'Use `let` when the value must change.',
  },
  {
    code: 'let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  let sum = sum + i;\n}\nconsole.log(sum);',
    options: ['`let` inside the loop makes a new box each round', 'i should start at 0', 'Missing return', 'sum needs quotes'],
    answer: 0,
    why: 'The accumulator must live OUTSIDE the loop, and be assigned with `sum += i`.',
  },
  {
    code: 'let user = { name: "Ai" };\nconsole.log(user[name]);',
    options: ['Should be user.name', 'Objects need arrays', 'Missing quotes around Ai', 'Nothing is wrong'],
    answer: 0,
    why: 'Use a dot for labels: `user.name` (or `user["name"]` with quotes).',
  },
  {
    code: 'while (apples > 0) {\n  console.log("eat");\n}',
    options: ['while is not real JavaScript', 'Nothing decreases apples — infinite loop', 'Needs a semicolon', 'Should use for'],
    answer: 1,
    why: 'Something inside the loop must move it toward the stop condition.',
  },
];

export const MAZES = [
  { w: 4, h: 1, start: { x: 0, y: 0, dir: 0 }, goal: { x: 3, y: 0 }, gems: [[2, 0]] },
  { w: 4, h: 4, start: { x: 0, y: 3, dir: 3 }, walls: [[1, 2], [1, 1]], gems: [[0, 0]], goal: { x: 3, y: 0 } },
  { w: 5, h: 3, start: { x: 0, y: 2, dir: 0 }, walls: [[2, 2], [2, 1]], gems: [[1, 2], [4, 0]], goal: { x: 4, y: 2 } },
  { w: 5, h: 5, start: { x: 2, y: 2, dir: 3 }, walls: [[1, 1], [3, 1], [1, 3], [3, 3]], gems: [[2, 0], [0, 2], [4, 2]], goal: { x: 2, y: 4 } },
  { w: 6, h: 4, start: { x: 0, y: 0, dir: 1 }, walls: [[1, 1], [2, 1], [3, 1], [4, 1], [1, 3], [2, 3], [3, 3]], gems: [[0, 3], [5, 3], [5, 0]], goal: { x: 4, y: 3 } },
];

export const DRILLS = [
  {
    id: 'sprint',
    emoji: '⚡',
    name: 'Output Sprint',
    desc: 'Read code and predict its output. 60 seconds, as many as you can.',
    kind: 'quiz',
    pool: OUTPUT_SPRINT,
    seconds: 60,
  },
  {
    id: 'bughunt',
    emoji: '🐛',
    name: 'Bug Hunt Blitz',
    desc: 'Find the mistake before the timer runs out.',
    kind: 'quiz',
    pool: BUG_HUNT,
    seconds: 75,
  },
  {
    id: 'maze',
    emoji: '🐃',
    name: 'Maze Logic',
    desc: 'Five routing problems. Shorter, smarter code scores higher.',
    kind: 'maze',
    pool: MAZES,
  },
];
