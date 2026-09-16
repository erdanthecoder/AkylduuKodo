import { all, said, linesAre, uses, avoids, saidSomething } from './checks.js';

const ifBlocks = [
  { id: 'ifgt', label: 'if {0} > {1} then', tpl: 'if ({0} > {1}) {\n  ', slots: [{ kind: 'raw', value: 'age' }, { kind: 'num', value: '10' }] },
  { id: 'say', label: 'say {0}', tpl: 'console.log({0});', slots: [{ kind: 'str', value: 'Big!' }] },
  { id: 'else', label: 'otherwise', tpl: '} else {\n  ', slots: [] },
  { id: 'end', label: 'end of the if', tpl: '}', slots: [] },
];

export default {
  id: 'u2',
  emoji: '🔀',
  title: { en: 'Making Choices', ky: 'Чечим кабыл алуу' },
  blurb: 'Teach your program to look at the situation and decide.',
  lessons: [
    {
      id: 'u2l1',
      emoji: '⚖️',
      title: { en: 'True or False', ky: 'Чын же жалган' },
      minutes: 9,
      xp: 45,
      blurb: 'The two values every decision is built from.',
      steps: [
        {
          type: 'teach',
          title: 'Questions have answers: true or false',
          text:
            'When you compare two things, JavaScript answers with a **boolean**: `true` or `false`. Nothing else.\n\n' +
            'Note the tricky one: `=` puts a value in a box, `===` *asks* "are these the same?"',
          code: 'console.log(10 > 3);      // true\nconsole.log(10 < 3);      // false\nconsole.log(5 === 5);     // true\nconsole.log(5 !== 5);     // false\nconsole.log("a" === "A"); // false — capitals matter!',
        },
        {
          type: 'quiz',
          q: 'Which one asks a question instead of storing a value?',
          options: ['score = 10', 'let score = 10', 'score === 10', 'score += 10'],
          answer: 2,
          why: 'One `=` assigns. Three `===` compares. Mixing them up is the most common beginner bug in the world.',
        },
        {
          type: 'predict',
          code: 'let temp = 30;\nconsole.log(temp >= 30);\nconsole.log(temp !== 30);',
          options: ['true then false', 'false then true', 'true then true', 'false then false'],
          answer: 0,
          why: '`>=` means "greater OR equal", so 30 >= 30 is true. And 30 is equal to 30, so "not equal" is false.',
        },
        {
          type: 'code',
          prompt:
            'Print the answers to these three questions, one per line:\n\n1. Is `7 * 3` bigger than `20`?\n2. Is the string `"yak"` the same as `"Yak"`?\n3. Is `100 % 10` equal to `0`?',
          starter: '',
          hint: 'console.log(7 * 3 > 20);',
          solution: 'console.log(7 * 3 > 20);\nconsole.log("yak" === "Yak");\nconsole.log(100 % 10 === 0);',
          check: (ctx) =>
            all(
              linesAre(ctx, ['true', 'false', 'true']),
              avoids(ctx, /console\.log\(\s*(true|false)\s*\)/, 'Let the comparison decide — do not type true/false by hand.'),
            ),
        },
        {
          type: 'unplugged',
          title: 'Offline quest: human boolean 🙋',
          text:
            'Stand up with a friend or family member. Take turns shouting a claim: "It is raining", "I am taller than you", "This chai is hot".\n\n' +
            'The other person may answer **only** `true` or `false` — no "kind of", no "maybe". That restriction is exactly what your program lives with.',
        },
      ],
    },
    {
      id: 'u2l2',
      emoji: '🚦',
      title: { en: 'If This, Then That', ky: 'Эгер... болсо' },
      minutes: 11,
      xp: 50,
      blurb: 'The fork in the road.',
      steps: [
        {
          type: 'teach',
          title: 'if / else is a fork in the road',
          text:
            'The code inside `{ }` runs **only** when the question is true. `else` is the other road.',
          code: 'let temp = 35;\n\nif (temp > 30) {\n  console.log("Hot! Drink water.");\n} else {\n  console.log("Nice weather.");\n}',
          tip: 'The condition goes in ( ), the action goes in { }. Indent the inside by two spaces so you can see the shape.',
        },
        {
          type: 'predict',
          code: 'let money = 40;\nif (money >= 50) {\n  console.log("Buy the book");\n} else {\n  console.log("Save more");\n}',
          options: ['Buy the book', 'Save more', 'Both lines', 'Nothing'],
          answer: 1,
          why: '40 is not >= 50, so the first road is skipped entirely and `else` runs. Only ONE road ever runs.',
        },
        {
          type: 'code',
          prompt:
            'Bus fare check. If `coins` is at least `15`, print `Get on the bus`. Otherwise print `Walk today`.\n\n(Try it with 20, then change `coins` to 9 and run again.)',
          palette: ifBlocks,
          starter: 'let coins = 20;\n\n',
          hint: 'if (coins >= 15) { ... } else { ... }',
          solution:
            'let coins = 20;\n\nif (coins >= 15) {\n  console.log("Get on the bus");\n} else {\n  console.log("Walk today");\n}',
          check: (ctx) =>
            all(
              uses(ctx, /if\s*\(/, 'This task needs a real `if`.'),
              uses(ctx, /else/, 'Add the `else` road too.'),
              said(ctx, 'Get on the bus', 'With 20 coins it should print `Get on the bus`.'),
            ),
        },
        {
          type: 'order',
          prompt: 'Reassemble this if/else. Watch where the braces go.',
          lines: [
            'let door = "locked";',
            'if (door === "open") {',
            '  console.log("Come in");',
            '} else {',
            '  console.log("Knock knock");',
            '}',
          ],
        },
        {
          type: 'bug',
          prompt:
            'This grader says "Passed" for **every** score, even 12. Find the bug and fix it.',
          starter: 'let score = 12;\n\nif (score = 60) {\n  console.log("Passed");\n} else {\n  console.log("Try again");\n}',
          hint: 'Look very closely at the condition. One `=` or three?',
          solution:
            'let score = 12;\n\nif (score >= 60) {\n  console.log("Passed");\n} else {\n  console.log("Try again");\n}',
          check: (ctx) =>
            all(
              said(ctx, 'Try again', 'With a score of 12 it should print `Try again`.'),
              avoids(ctx, /if\s*\(\s*score\s*=\s*\d/, 'Still assigning inside the if! Use a comparison.'),
            ),
        },
        {
          type: 'code',
          prompt:
            'Even or odd, for real this time. Given `n`, print `even` or `odd`.\n\n(Remember `%` from Unit 1.)',
          starter: 'let n = 7;\n\n',
          hint: 'if (n % 2 === 0) { ... }',
          solution: 'let n = 7;\n\nif (n % 2 === 0) {\n  console.log("even");\n} else {\n  console.log("odd");\n}',
          check: (ctx) =>
            all(
              uses(ctx, /%/, 'Use the remainder operator `%`.'),
              said(ctx, 'odd', '7 is odd — it should print `odd`.'),
            ),
        },
      ],
    },
    {
      id: 'u2l3',
      emoji: '🧠',
      title: { en: 'And, Or, Not', ky: 'Жана, же, эмес' },
      minutes: 11,
      xp: 50,
      blurb: 'Combine questions into smarter ones.',
      steps: [
        {
          type: 'teach',
          title: 'Three tiny words that run the world',
          text:
            '`&&` (and) — both must be true.\n`||` (or) — at least one must be true.\n`!` (not) — flips true and false.\n\n' +
            'And when there are more than two roads, chain with `else if`.',
          code: 'let age = 14;\nlet hasTicket = true;\n\nif (age >= 12 && hasTicket) {\n  console.log("Enjoy the film");\n} else if (!hasTicket) {\n  console.log("Buy a ticket first");\n} else {\n  console.log("Too young for this one");\n}',
        },
        {
          type: 'quiz',
          q: 'When is `sunny && warm` true?',
          options: ['When sunny is true', 'When warm is true', 'Only when both are true', 'When either one is true'],
          answer: 2,
          why: '`&&` is strict: both sides must be true. If you want "either one", that is `||`.',
        },
        {
          type: 'predict',
          code: 'let rain = false;\nlet umbrella = false;\nconsole.log(!rain || umbrella);',
          options: ['true', 'false', 'undefined', 'Error'],
          answer: 0,
          why: '`!rain` flips false into true. With `||`, one true side is enough — so the whole thing is true.',
        },
        {
          type: 'code',
          prompt:
            'Playground rule: you may ride if you are **taller than 120 cm AND older than 6**.\n\nPrint `Ride!` or `Not this time` for the given values.',
          starter: 'let height = 130;\nlet age = 8;\n\n',
          hint: 'if (height > 120 && age > 6) { ... }',
          solution:
            'let height = 130;\nlet age = 8;\n\nif (height > 120 && age > 6) {\n  console.log("Ride!");\n} else {\n  console.log("Not this time");\n}',
          check: (ctx) => all(uses(ctx, /&&/, 'Use `&&` to join both rules.'), said(ctx, 'Ride!')),
        },
        {
          type: 'code',
          prompt:
            'Grade machine 📝 with `else if`. For the score in `points`, print:\n\n- `A` for 90 and above\n- `B` for 75–89\n- `C` for 60–74\n- `Keep practising` below 60',
          starter: 'let points = 82;\n\n',
          hint: 'Check the biggest range first, then let `else if` handle what is left over.',
          solution:
            'let points = 82;\n\nif (points >= 90) {\n  console.log("A");\n} else if (points >= 75) {\n  console.log("B");\n} else if (points >= 60) {\n  console.log("C");\n} else {\n  console.log("Keep practising");\n}',
          check: (ctx) =>
            all(
              uses(ctx, /else\s+if/, 'Use `else if` to chain the ranges.'),
              said(ctx, 'B', '82 points should print `B`.'),
              ctx.logs.length === 1 ? true : 'Only one grade should be printed.',
            ),
        },
      ],
    },
    {
      id: 'u2l4',
      emoji: '🤖',
      title: { en: 'Project: Chai Bot', ky: 'Долбоор: Чай бот' },
      minutes: 12,
      xp: 65,
      blurb: 'A tiny assistant that answers like a real one.',
      steps: [
        {
          type: 'teach',
          title: 'Real programs are just decisions stacked up',
          text:
            'A chatbot, a weather app, a bank app — underneath, they all look at values and choose a branch. You already know how to do that.\n\n' +
            'Today you build a bot that decides what drink to serve.',
          code: 'let hour = 8;\nlet drink = hour < 11 ? "chai" : "water";\nconsole.log(drink); // "chai"',
          tip: 'That `? :` is a shortcut if/else called a **ternary**. Nice to read, but use full if/else while learning.',
        },
        {
          type: 'code',
          prompt:
            'Chai Bot, part 1. Based on `hour` (0–23), print:\n\n- `Morning chai ☕` before 11\n- `Afternoon chai 🍵` from 11 to 17\n- `Evening water 💧` after 17',
          starter: 'let hour = 14;\n\n',
          hint: 'Three branches: if (hour < 11) … else if (hour <= 17) … else …',
          solution:
            'let hour = 14;\n\nif (hour < 11) {\n  console.log("Morning chai ☕");\n} else if (hour <= 17) {\n  console.log("Afternoon chai 🍵");\n} else {\n  console.log("Evening water 💧");\n}',
          check: (ctx) =>
            all(
              uses(ctx, /else\s+if/, 'Use an `else if` for the middle range.'),
              ctx.logs.length === 1 ? true : 'Exactly one line should be printed.',
              /afternoon/i.test(ctx.logs[0] || '') ? true : 'At hour 14 the bot should serve afternoon chai.',
            ),
        },
        {
          type: 'bug',
          prompt:
            'Chai Bot has a logic bug: with `hour = 20` it still offers morning chai. Fix the conditions so every hour gets the right drink.',
          starter:
            'let hour = 20;\n\nif (hour > 0) {\n  console.log("Morning chai ☕");\n} else if (hour > 17) {\n  console.log("Evening water 💧");\n} else {\n  console.log("Afternoon chai 🍵");\n}',
          hint: 'The first condition is true for almost every hour, so nothing else ever gets a turn. Order your ranges from narrow to wide, or from big number to small.',
          solution:
            'let hour = 20;\n\nif (hour > 17) {\n  console.log("Evening water 💧");\n} else if (hour < 11) {\n  console.log("Morning chai ☕");\n} else {\n  console.log("Afternoon chai 🍵");\n}',
          check: (ctx) =>
            all(
              ctx.logs.length === 1 ? true : 'Exactly one line should be printed.',
              /evening|water/i.test(ctx.logs[0] || '') ? true : 'At hour 20 the bot should serve evening water.',
            ),
        },
        {
          type: 'code',
          prompt:
            'Chai Bot, final form 🏁. The bot also checks the cupboard.\n\nIf `teaLeft` is `false`, print `Sorry, no tea left` no matter the hour. Otherwise use the hour rules from before.\n\nTest values: `hour = 9`, `teaLeft = false` → `Sorry, no tea left`.',
          starter: 'let hour = 9;\nlet teaLeft = false;\n\n',
          hint: 'Check the cupboard first with `if (!teaLeft) { ... } else { ...the hour rules... }`',
          solution:
            'let hour = 9;\nlet teaLeft = false;\n\nif (!teaLeft) {\n  console.log("Sorry, no tea left");\n} else if (hour < 11) {\n  console.log("Morning chai ☕");\n} else if (hour <= 17) {\n  console.log("Afternoon chai 🍵");\n} else {\n  console.log("Evening water 💧");\n}',
          check: (ctx) =>
            all(
              saidSomething(ctx),
              ctx.logs.length === 1 ? true : 'Exactly one line should be printed.',
              /no tea left/i.test(ctx.logs[0] || '')
                ? true
                : 'With teaLeft = false the bot must say `Sorry, no tea left` — check that road first.',
              uses(ctx, /teaLeft/, 'Your code should actually look at `teaLeft`.'),
            ),
        },
      ],
    },
  ],
};
