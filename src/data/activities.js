// activities.js — the content the four activities are built from.
//
// Kept apart from the engines so a question can be fixed, or a hundred more
// added, without touching a line of the thing that draws it.

/* ------------------------------------------------------------- Laser Tag */
/* Expressions with small whole-number answers. The arena shows a charge and
   you tag the target that matches it, so several targets must be able to share
   a value — that is what makes the round readable at speed. */
export const TARGETS = [
  { expr: '2 + 3', value: 5 },
  { expr: '9 - 4', value: 5 },
  { expr: '10 / 2', value: 5 },
  { expr: '7 % 3', value: 1 },
  { expr: '8 % 7', value: 1 },
  { expr: '3 - 2', value: 1 },
  { expr: '2 * 3', value: 6 },
  { expr: '12 / 2', value: 6 },
  { expr: '13 % 7', value: 6 },
  { expr: '"yak".length', value: 3 },
  { expr: '9 / 3', value: 3 },
  { expr: '1 + 2', value: 3 },
  { expr: '[1,2,3,4].length', value: 4 },
  { expr: '2 ** 2', value: 4 },
  { expr: '20 % 8', value: 4 },
  { expr: '4 * 2', value: 8 },
  { expr: '2 ** 3', value: 8 },
  { expr: '17 % 9', value: 8 },
  { expr: '3 * 3', value: 9 },
  { expr: '18 / 2', value: 9 },
  { expr: '"Kodo".length + 5', value: 9 },
  { expr: '5 * 2', value: 10 },
  { expr: '7 + 3', value: 10 },
  { expr: '100 / 10', value: 10 },
  { expr: '14 % 7', value: 0 },
  { expr: '5 - 5', value: 0 },
  { expr: '0 * 99', value: 0 },
  { expr: '6 / 3', value: 2 },
  { expr: '11 % 3', value: 2 },
  { expr: '1 + 1', value: 2 },
  { expr: '3 + 4', value: 7 },
  { expr: '21 / 3', value: 7 },
  { expr: '15 % 8', value: 7 },
];

/* ----------------------------------------------------------- Boss Battle */
/* Three phases, three kinds of thinking. Each question is one strike. */
export const BOSS = {
  name: 'The Silent Error',
  subtitle: 'It never says what it wants. You have to read the code.',
  phases: [
    {
      name: 'Syntax',
      tagline: 'Find what is broken.',
      hp: 120,
      prompt: 'What is wrong here?',
      questions: [
        {
          code: 'let city = "Osh"\nconsole.log(City);',
          options: ['Missing semicolon on line 1', 'Capital C — the name is `city`', 'Quotes are wrong', 'console.log is misspelled'],
          answer: 1,
          why: 'JavaScript is case sensitive. `City` and `city` are two different names.',
        },
        {
          code: 'if (score = 10) {\n  console.log("ten");\n}',
          options: ['Should be ===', 'Missing else', 'Braces are wrong', 'score needs quotes'],
          answer: 0,
          why: 'One `=` assigns and is always truthy. Comparing needs `===`.',
        },
        {
          code: 'function add(a, b) {\n  a + b;\n}\nconsole.log(add(2, 3));',
          options: ['Missing return', 'Wrong number of arguments', 'Needs a semicolon', 'add is a reserved word'],
          answer: 0,
          why: 'Without `return` the function answers `undefined`.',
        },
        {
          code: 'const total = 0;\ntotal = total + 5;',
          options: ['total should be let', 'Missing brackets', '+ should be +=', 'const needs a type'],
          answer: 0,
          why: 'A `const` can never be reassigned. Use `let` when the value moves.',
        },
        {
          code: 'const list = [1, 2, 3];\nconsole.log(list[3]);',
          options: ['Arrays start at 1', 'Index 3 is past the end', 'Missing .length', 'Needs a loop'],
          answer: 1,
          why: 'Three items means indices 0, 1 and 2. Index 3 is `undefined`.',
        },
        {
          code: 'for (let i = 0; i < 5; i--) {\n  console.log(i);\n}',
          options: ['Should start at 1', 'i-- never reaches 5 — it runs forever', 'Missing braces', 'i is not defined'],
          answer: 1,
          why: 'Counting down from 0 never gets to 5, so the condition stays true.',
        },
      ],
    },
    {
      name: 'Logic',
      tagline: 'Say what it prints.',
      hp: 160,
      prompt: 'What does this print?',
      questions: [
        { code: 'console.log("2" + 3);', options: ['5', '"23"', '6', 'Error'], answer: 1, why: 'Text plus a number glues them together.' },
        { code: 'console.log(7 / 2);', options: ['3', '3.5', '4', '1'], answer: 1, why: 'JavaScript division always gives the real answer.' },
        { code: 'console.log(10 === "10");', options: ['true', 'false', 'Error', 'undefined'], answer: 1, why: '=== compares the type as well as the value.' },
        { code: 'let s = "";\nfor (let i = 0; i < 3; i++) s += "ok";\nconsole.log(s);', options: ['ok', 'okokok', 'ok ok ok', '3'], answer: 1, why: 'Three passes, three lots of "ok" joined on.' },
        { code: 'console.log(true && false);', options: ['true', 'false', 'undefined', 'Error'], answer: 1, why: '&& is only true when both sides are.' },
        { code: 'const o = { a: 1 };\nconsole.log(o.b);', options: ['null', '0', 'undefined', 'Error'], answer: 2, why: 'A key that was never set reads back as undefined.' },
        { code: 'console.log([1, 2].concat([3]).length);', options: ['2', '3', '4', '[1,2,3]'], answer: 1, why: 'concat joins the two, giving three items.' },
        { code: 'console.log(Math.round(2.5));', options: ['2', '3', '2.5', 'Error'], answer: 1, why: 'Exactly half rounds up.' },
      ],
    },
    {
      name: 'Memory',
      tagline: 'Track the value in your head.',
      hp: 200,
      prompt: 'What is the final value?',
      questions: [
        { code: 'let n = 2;\nn = n * 3;\nn = n - 1;\nconsole.log(n);', options: ['5', '6', '4', '7'], answer: 0, why: '2 × 3 = 6, then 6 − 1 = 5.' },
        { code: 'let t = 0;\nfor (let i = 1; i <= 4; i++) t += i;\nconsole.log(t);', options: ['4', '10', '6', '24'], answer: 1, why: '1 + 2 + 3 + 4 = 10.' },
        { code: 'const a = [1, 2];\na.push(3);\na.push(4);\nconsole.log(a.length);', options: ['2', '3', '4', '5'], answer: 2, why: 'Two to start, two pushed on.' },
        { code: 'let x = 10;\nfunction f(n) { n = n + 5; }\nf(x);\nconsole.log(x);', options: ['10', '15', '5', 'undefined'], answer: 0, why: 'The parameter is a copy, so x never moved.' },
        { code: 'let c = 0;\nfor (let i = 0; i < 6; i++) if (i % 2 === 0) c++;\nconsole.log(c);', options: ['2', '3', '4', '6'], answer: 1, why: '0, 2 and 4 are even — that is three.' },
        { code: 'let s = "ab";\ns = s + s;\ns = s + "!";\nconsole.log(s.length);', options: ['4', '5', '3', '6'], answer: 1, why: '"abab" is four, plus the "!" makes five.' },
        { code: 'const o = { n: 1 };\nconst p = o;\np.n = 9;\nconsole.log(o.n);', options: ['1', '9', 'undefined', 'Error'], answer: 1, why: 'Both names point at the same object.' },
      ],
    },
  ],
};

/* ----------------------------------------------------------- Tug of War */
/* One claim, one code sample, one snap judgement. Half of them are false. */
export const TUG = [
  { code: 'console.log(3 + 4);', claim: 'prints 7', answer: true },
  { code: 'console.log("3" + 4);', claim: 'prints 7', answer: false, why: 'It prints "34" — text plus a number joins them.' },
  { code: 'console.log(9 % 2);', claim: 'prints 1', answer: true },
  { code: 'console.log(9 / 2);', claim: 'prints 4', answer: false, why: 'It prints 4.5.' },
  { code: 'const a = [1,2,3];\nconsole.log(a[0]);', claim: 'prints 1', answer: true },
  { code: 'const a = [1,2,3];\nconsole.log(a[3]);', claim: 'prints 3', answer: false, why: 'Index 3 is past the end — undefined.' },
  { code: 'console.log("yak".length);', claim: 'prints 3', answer: true },
  { code: 'console.log("yak".toUpperCase());', claim: 'prints yak', answer: false, why: 'It prints YAK.' },
  { code: 'let n = 5;\nn += 3;\nconsole.log(n);', claim: 'prints 8', answer: true },
  { code: 'let n = 5;\nn =+ 3;\nconsole.log(n);', claim: 'prints 8', answer: false, why: '`=+ 3` just assigns 3.' },
  { code: 'console.log(2 ** 3);', claim: 'prints 8', answer: true },
  { code: 'console.log(2 * 3 + 1);', claim: 'prints 8', answer: false, why: 'Multiplication first: 6 + 1 = 7.' },
  { code: 'console.log(true && true);', claim: 'prints true', answer: true },
  { code: 'console.log(true && false);', claim: 'prints true', answer: false, why: '&& needs both sides true.' },
  { code: 'console.log(10 > 3);', claim: 'prints true', answer: true },
  { code: 'console.log("10" === 10);', claim: 'prints true', answer: false, why: '=== compares the type too.' },
  { code: 'for (let i = 0; i < 3; i++) console.log(i);', claim: 'prints 0, 1, 2', answer: true },
  { code: 'for (let i = 1; i <= 3; i++) console.log(i);', claim: 'prints 0, 1, 2', answer: false, why: 'It prints 1, 2, 3.' },
  { code: 'const o = { a: 1 };\nconsole.log(o.a);', claim: 'prints 1', answer: true },
  { code: 'const o = { a: 1 };\nconsole.log(o.b);', claim: 'prints 1', answer: false, why: 'There is no b — undefined.' },
  { code: 'function f(n) { return n * 2; }\nconsole.log(f(4));', claim: 'prints 8', answer: true },
  { code: 'function f(n) { n * 2; }\nconsole.log(f(4));', claim: 'prints 8', answer: false, why: 'No return, so it prints undefined.' },
  { code: 'console.log([1,2].concat([3]).length);', claim: 'prints 3', answer: true },
  { code: 'console.log(Math.round(2.4));', claim: 'prints 3', answer: false, why: '2.4 rounds down to 2.' },
];

/* ---------------------------------------------------------- Kart Battle */
/* Real lines, short enough to type in one burst. Accuracy is the throttle. */
export const KART_LINES = [
  'let speed = 0;',
  'const kart = "yellow";',
  'speed += 10;',
  'console.log(speed);',
  'if (speed > 50) { boost(); }',
  'const laps = [1, 2, 3];',
  'for (const lap of laps) {',
  'function turn(angle) {',
  'return speed * 2;',
  'const fast = (n) => n * 3;',
  'laps.push(4);',
  'console.log(`lap ${lap}`);',
  'while (fuel > 0) { drive(); }',
  'const racer = { name: "Bek" };',
  'racer.points += 5;',
  'console.log(laps.length);',
  'let best = Math.min(a, b);',
  'if (x !== y) { swap(); }',
];

/* ------------------------------------------------------------- registry */
export const ACTIVITIES = [
  {
    id: 'laser',
    kind: 'laser',
    icon: 'target',
    name: 'Laser Tag',
    desc: 'Targets drift past with an expression on each. Tag the one that matches the charge.',
    teaches: 'Arithmetic and operators, at speed',
    seconds: 60,
  },
  {
    id: 'boss',
    kind: 'boss',
    icon: 'flame',
    name: 'Boss Battle',
    desc: 'Three phases, one very stubborn error. Every right answer lands a hit.',
    teaches: 'Bugs, output and tracking values',
    rounds: 3,
  },
  {
    id: 'tug',
    kind: 'tug',
    icon: 'scale',
    name: 'Tug of War',
    desc: 'True or false, as fast as you can read. The rope moves the moment you answer.',
    teaches: 'Snap judgement about what code does',
    seconds: 45,
  },
  {
    id: 'kart',
    kind: 'kart',
    icon: 'rover',
    name: 'Kart Battle',
    desc: 'Type each line to accelerate. Three rivals, one lap, no brakes.',
    teaches: 'Typing real syntax without looking',
    laps: 1,
  },
];
