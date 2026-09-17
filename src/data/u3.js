import { all, said, linesAre, uses, avoids, varIs } from './checks.js';

const robotBlocks = [
  { id: 'fwd', label: 'walk forward', tpl: 'forward();', slots: [] },
  { id: 'left', label: 'turn left', tpl: 'turnLeft();', slots: [] },
  { id: 'right', label: 'turn right', tpl: 'turnRight();', slots: [] },
  { id: 'take', label: 'pick the apple', tpl: 'collect();', slots: [] },
  { id: 'rep', label: 'repeat {0} times', tpl: 'for (let i = 0; i < {0}; i++) {\n  ', slots: [{ kind: 'num', value: '3' }] },
  { id: 'end', label: 'end of the repeat', tpl: '}', slots: [] },
];

export default {
  id: 'u3',
  level: 'intermediate',
  city: { name: 'Istanbul', country: 'Turkiye', lon: 28.98, lat: 41.01, line: 'Where two continents repeat' },
  icon: 'reset',
  title: { en: 'Loops & Patterns', ky: 'Циклдер жана үлгүлөр' },
  blurb: 'Stop repeating yourself. Let the computer do the boring part.',
  lessons: [
    {
      id: 'u3l1',
      icon: 'reset',
      title: { en: 'Do It Again', ky: 'Дагы бир жолу' },
      minutes: 11,
      xp: 50,
      blurb: 'The for loop, explained slowly.',
      steps: [
        {
          type: 'teach',
          title: 'Copy-paste is a smell',
          text:
            'Printing "Salam" five times by writing five lines works — until someone asks for a thousand. A **loop** repeats one piece of code as many times as you want.\n\n' +
            'A `for` loop has three parts in its brackets:\n\n1. **start** — `let i = 0`\n2. **keep going while** — `i < 5`\n3. **after each round** — `i++` (add one)',
          code: 'for (let i = 0; i < 5; i++) {\n  console.log("Salam " + i);\n}\n// Salam 0, Salam 1, Salam 2, Salam 3, Salam 4',
          tip: '`i` is just a variable name — short for "index". It counts the rounds for you.',
        },
        {
          type: 'predict',
          code: 'for (let i = 1; i <= 3; i++) {\n  console.log(i * 10);\n}',
          options: ['10 20 30', '0 10 20', '1 2 3', '10 20 30 40'],
          answer: 0,
          why: 'It starts at 1 and stops after 3 because `i <= 3` becomes false at 4. Each round prints i × 10.',
        },
        {
          type: 'code',
          prompt: 'Print the numbers `1` to `10`, one per line — with a loop, not ten console.log lines.',
          starter: 'for (let i = 1; i <= 10; i++) {\n  \n}',
          hint: 'console.log(i); inside the braces.',
          solution: 'for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}',
          check: (ctx) =>
            all(
              uses(ctx, /for\s*\(/, 'Use a `for` loop.'),
              linesAre(ctx, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
            ),
        },
        {
          type: 'bug',
          prompt: 'This loop prints nothing. Why? Fix it so it prints 3 lines.',
          starter: 'for (let i = 0; i > 3; i++) {\n  console.log("round " + i);\n}',
          hint: 'Is 0 greater than 3? The loop checks the condition before the very first round.',
          solution: 'for (let i = 0; i < 3; i++) {\n  console.log("round " + i);\n}',
          check: (ctx) => (ctx.logs.length === 3 ? true : `I expected 3 lines, got ${ctx.logs.length}.`),
        },
        {
          type: 'code',
          prompt:
            'Countdown! Print `5 4 3 2 1` on separate lines, then `Liftoff!`.\n\nA loop can count **down** too — start high and use `i--`.',
          starter: '',
          hint: 'for (let i = 5; i >= 1; i--) { ... }  then one console.log after the loop.',
          solution: 'for (let i = 5; i >= 1; i--) {\n  console.log(i);\n}\nconsole.log("Liftoff!");',
          check: (ctx) => all(uses(ctx, /for\s*\(/), linesAre(ctx, ['5', '4', '3', '2', '1', 'Liftoff!'])),
        },
        {
          type: 'unplugged',
          title: 'Offline quest: loop your chores',
          text:
            'Find something you repeat at home — watering 6 plants, folding 10 socks, doing 20 jumps.\n\n' +
            'Write it as a loop on paper: `for (let plant = 1; plant <= 6; plant++) { water(plant); }`. Then actually do it and count out loud. Loops feel different once your legs run one.',
        },
      ],
    },
    {
      id: 'u3l2',
      icon: 'list',
      title: { en: 'Counting & Collecting', ky: 'Санап, чогултуу' },
      minutes: 12,
      xp: 55,
      blurb: 'Build up an answer one round at a time.',
      steps: [
        {
          type: 'teach',
          title: 'The accumulator: a box that grows',
          text:
            'Make a box **before** the loop, add to it **inside** the loop, look at it **after** the loop. This one pattern solves a huge number of real problems: totals, counts, longest, best score.',
          code: 'let total = 0;\n\nfor (let i = 1; i <= 4; i++) {\n  total = total + i;   // same as: total += i\n}\n\nconsole.log(total); // 10  (1+2+3+4)',
          tip: 'If you make the box *inside* the loop, it is reborn empty every round — a classic bug.',
        },
        {
          type: 'predict',
          code: 'let word = "";\nfor (let i = 0; i < 3; i++) {\n  word += "ha";\n}\nconsole.log(word);',
          options: ['ha', 'hahaha', 'ha ha ha', '3'],
          answer: 1,
          why: '`+=` on a string glues instead of adding. Three rounds of "ha" gives "hahaha".',
        },
        {
          type: 'code',
          prompt:
            'Sum every number from `1` to `100` and print it. (The famous answer is 5050 — but let the loop find it.)',
          starter: 'let total = 0;\n\n',
          capture: ['total'],
          hint: 'Make total before the loop, add i inside, print after.',
          solution: 'let total = 0;\n\nfor (let i = 1; i <= 100; i++) {\n  total += i;\n}\n\nconsole.log(total);',
          check: (ctx) =>
            all(
              uses(ctx, /for\s*\(/,'Use a loop — no typing 5050'),
              avoids(ctx, /5050/, 'Do not type the answer. Let the loop compute it.'),
              varIs(ctx, 'total', 5050),
              said(ctx, '5050', 'Print the total when the loop is finished.'),
            ),
        },
        {
          type: 'code',
          prompt:
            'Multiplication table for 7. Print 10 lines that look exactly like:\n\n`7 x 1 = 7`\n`7 x 2 = 14`\n… up to `7 x 10 = 70`',
          starter: 'for (let i = 1; i <= 10; i++) {\n  \n}',
          hint: 'console.log(`7 x ${i} = ${7 * i}`);',
          solution: 'for (let i = 1; i <= 10; i++) {\n  console.log(`7 x ${i} = ${7 * i}`);\n}',
          check: (ctx) =>
            all(
              uses(ctx, /for\s*\(/),
              linesAre(
                ctx,
                Array.from({ length: 10 }, (_, k) => `7 x ${k + 1} = ${7 * (k + 1)}`),
              ),
            ),
        },
        {
          type: 'code',
          prompt:
            'Star pyramid — print 5 lines:\n\n```\n*\n**\n***\n****\n*****\n```\n\nTip:`"*".repeat(3)`gives`"***"`.',
          starter: '',
          hint: 'for (let i = 1; i <= 5; i++) { console.log("*".repeat(i)); }',
          solution: 'for (let i = 1; i <= 5; i++) {\n  console.log("*".repeat(i));\n}',
          check: (ctx) => all(uses(ctx, /for\s*\(/), linesAre(ctx, ['*', '**', '***', '****', '*****'])),
        },
      ],
    },
    {
      id: 'u3l3',
      icon: 'rover',
      title: { en: 'Kodo the Yak', ky: 'Кодо аттуу топоз' },
      minutes: 13,
      xp: 60,
      blurb: 'Drive a robot through a maze with loops.',
      steps: [
        {
          type: 'teach',
          title: 'Meet Kodo',
          text:
            'Kodo the yak lives on a grid and understands four commands:\n\n' +
            '`forward()` — one square ahead\n`turnLeft()` / `turnRight()` — spin in place\n`collect()` — pick up the apple under his feet\n\n' +
            'He also answers a question:`canMove()`is`true`when the square ahead is free.\n\nHis goal is always the yurt.',
          code: 'forward();\nforward();\nturnRight();\nforward();\ncollect();',
          tip: 'Bonk into a wall and the run stops. Kodo forgives you — press Run again.',
        },
        {
          type: 'robot',
          prompt: 'Warm-up: walk Kodo to the yurt. He is facing right (east).',
          spec: { w: 5, h: 1, start: { x: 0, y: 0, dir: 0 }, goal: { x: 4, y: 0 } },
          starter: 'forward();\n',
          hint: 'Four squares to cross, four forward() calls — or one small loop.',
          solution: 'for (let i = 0; i < 4; i++) {\n  forward();\n}',
        },
        {
          type: 'robot',
          prompt:
            'Now with apples. Collect **both** apples and finish on the yurt. You must`collect()`while standing on an apple.',
          palette: robotBlocks,
          spec: {
            w: 5,
            h: 1,
            start: { x: 0, y: 0, dir: 0 },
            gems: [[1, 0], [3, 0]],
            goal: { x: 4, y: 0 },
          },
          starter: '',
          hint: 'forward(); collect(); forward(); forward(); collect(); forward();',
          solution: 'forward();\ncollect();\nforward();\nforward();\ncollect();\nforward();',
        },
        {
          type: 'robot',
          prompt:
            'A corner. Walls block the way — go around them. Grab the apple on the route.',
          spec: {
            w: 4,
            h: 4,
            start: { x: 0, y: 3, dir: 3 },
            walls: [[1, 2], [1, 1], [2, 1], [2, 3]],
            gems: [[0, 0]],
            goal: { x: 3, y: 0 },
          },
          starter: '',
          hint: 'Go up three, collect, turn right, then walk east three.',
          solution:
            'for (let i = 0; i < 3; i++) {\n  forward();\n}\ncollect();\nturnRight();\nfor (let i = 0; i < 3; i++) {\n  forward();\n}',
        },
        {
          type: 'teach',
          title: '`while` — loop until something changes',
          text:
            'A `for` loop is for "do this N times". A `while` loop is for "keep going **until** something is true". Kodo does not have to count squares — he can just walk while the way is clear.',
          code: 'while (canMove()) {\n  forward();\n}\n// walks until a wall or the edge stops him',
          tip: 'Every`while`needs something inside that eventually makes the condition false — otherwise: infinite loop.',
        },
        {
          type: 'robot',
          prompt:
            'Long hallway — you do NOT know how long it is. Use`while (canMove())`to reach the end, then turn and finish at the yurt.',
          spec: {
            w: 7,
            h: 2,
            start: { x: 0, y: 0, dir: 0 },
            walls: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]],
            gems: [[6, 0]],
            goal: { x: 6, y: 1 },
          },
          starter: 'while (canMove()) {\n  forward();\n}\n',
          hint: 'After the hallway: collect the apple, turn right, one more forward.',
          solution:
            'while (canMove()) {\n  forward();\n}\ncollect();\nturnRight();\nforward();',
          check: (ctx) => uses(ctx, /while\s*\(/, 'This one is about `while` — use it instead of counting squares.'),
        },
      ],
    },
    {
      id: 'u3l4',
      icon: 'globe',
      title: { en: 'Project: Spiral Run', ky: 'Долбоор: Спираль' },
      minutes: 14,
      xp: 70,
      blurb: 'Loops inside loops, and a maze finale.',
      steps: [
        {
          type: 'teach',
          title: 'A loop inside a loop',
          text:
            'The inner loop finishes completely for **every single round** of the outer loop. 3 outer rounds × 3 inner rounds = 9 things happen.',
          code: 'for (let row = 1; row <= 3; row++) {\n  let line = "";\n  for (let col = 1; col <= 3; col++) {\n    line += row * col + " ";\n  }\n  console.log(line.trim());\n}\n// 1 2 3\n// 2 4 6\n// 3 6 9',
        },
        {
          type: 'predict',
          code: 'let n = 0;\nfor (let a = 0; a < 3; a++) {\n  for (let b = 0; b < 4; b++) {\n    n++;\n  }\n}\nconsole.log(n);',
          options: ['7', '12', '3', '4'],
          answer: 1,
          why: 'The inner loop runs 4 times for each of the 3 outer rounds: 3 × 4 = 12.',
        },
        {
          type: 'code',
          prompt:
            'FizzBuzz, the famous one. For numbers 1 to 15 print:\n\n- `Fizz`if divisible by 3\n- `Buzz`if divisible by 5\n- `FizzBuzz`if divisible by both\n- otherwise the number itself',
          starter: 'for (let i = 1; i <= 15; i++) {\n  \n}',
          hint: 'Check the BOTH case first — otherwise 15 only ever gets to be Fizz.',
          solution:
            'for (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0) {\n    console.log("FizzBuzz");\n  } else if (i % 3 === 0) {\n    console.log("Fizz");\n  } else if (i % 5 === 0) {\n    console.log("Buzz");\n  } else {\n    console.log(i);\n  }\n}',
          check: (ctx) =>
            linesAre(ctx, [
              '1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz',
            ]),
        },
        {
          type: 'robot',
          prompt:
            'Final maze. Zig-zag to the yurt and collect all three apples. Loops will save you a lot of typing.',
          spec: {
            w: 5,
            h: 5,
            start: { x: 0, y: 4, dir: 3 },
            walls: [[1, 3], [2, 3], [3, 3], [1, 1], [2, 1], [3, 1], [4, 2]],
            gems: [[0, 2], [4, 3], [4, 0]],
            goal: { x: 0, y: 0 },
          },
          starter: '',
          hint:
            'Plan on paper first — real programmers do. The apple at the bottom-right is a dead end: walk in, collect, walk back out.',
          solution:
            'function go(n) {\n  for (let i = 0; i < n; i++) forward();\n}\n\n' +
            'turnRight();\ngo(4);\n' +
            'turnLeft();\nforward();\ncollect();\n' +
            'turnLeft();\nturnLeft();\nforward();\n' +
            'turnRight();\ngo(4);\n' +
            'turnRight();\ngo(2);\ncollect();\ngo(2);\n' +
            'turnRight();\ngo(4);\ncollect();\n' +
            'turnLeft();\nturnLeft();\ngo(4);',
        },
      ],
    },
  ],
};
