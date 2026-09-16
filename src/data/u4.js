import { all, said, linesAre, uses, avoids } from './checks.js';

export default {
  id: 'u4',
  emoji: '⚒️',
  title: { en: 'Your Own Commands', ky: 'Өз буйруктарың' },
  blurb: 'Functions: wrap up an idea, give it a name, use it forever.',
  lessons: [
    {
      id: 'u4l1',
      emoji: '📜',
      title: { en: 'Name a Recipe', ky: 'Рецептке ат бер' },
      minutes: 11,
      xp: 55,
      blurb: 'Write it once, call it any time.',
      steps: [
        {
          type: 'teach',
          title: 'A function is a recipe with a name',
          text:
            'You already use functions: `console.log` is one someone wrote for you. Now you write your own.\n\n' +
            'Writing the recipe does **nothing** by itself. It only runs when you **call** it with `name()`.',
          code: 'function greet() {\n  console.log("Salam!");\n  console.log("Welcome to AkylduuKodo");\n}\n\ngreet();   // now it runs\ngreet();   // and again',
          tip: 'Rule of thumb: if you wrote nearly the same lines twice, that is a function waiting to be born.',
        },
        {
          type: 'predict',
          code: 'function hi() {\n  console.log("hi");\n}\nconsole.log("start");',
          options: ['start', 'hi then start', 'start then hi', 'Nothing'],
          answer: 0,
          why: 'The function was defined but never called, so its body never ran. Only "start" is printed.',
        },
        {
          type: 'code',
          prompt:
            'Write a function called `cheer` that prints `Kodo! Kodo! Kodo!`, then call it **three** times.',
          starter: 'function cheer() {\n  \n}\n\n',
          hint: 'Define once, then write cheer(); on three separate lines.',
          solution: 'function cheer() {\n  console.log("Kodo! Kodo! Kodo!");\n}\n\ncheer();\ncheer();\ncheer();',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+cheer\s*\(/, 'Name the function exactly `cheer`.'),
              linesAre(ctx, ['Kodo! Kodo! Kodo!', 'Kodo! Kodo! Kodo!', 'Kodo! Kodo! Kodo!']),
            ),
        },
        {
          type: 'order',
          prompt: 'Order this program so it actually prints something.',
          lines: ['function shout() {', '  console.log("OI!");', '}', 'shout();'],
          why: 'Define the recipe, then call it. (JavaScript is forgiving about this one, but humans reading your code are not.)',
        },
      ],
    },
    {
      id: 'u4l2',
      emoji: '🎁',
      title: { en: 'Inputs and Answers', ky: 'Кириш жана жооп' },
      minutes: 13,
      xp: 60,
      blurb: 'Parameters go in, a return value comes out.',
      steps: [
        {
          type: 'teach',
          title: 'Feed the function, and take the answer back',
          text:
            'Values in the brackets are **parameters** — the ingredients. `return` hands an answer back to whoever called the function.\n\n' +
            'A function that prints tells you something. A function that **returns** gives you something you can keep using.',
          code: 'function double(n) {\n  return n * 2;\n}\n\nconsole.log(double(5));        // 10\nlet big = double(double(3));   // 12\nconsole.log(big);',
          tip: '`return` also ends the function immediately — nothing after it runs.',
        },
        {
          type: 'quiz',
          q: 'What is the difference between `console.log(x)` and `return x` inside a function?',
          options: [
            'They are the same thing',
            'log shows it on screen; return hands the value back to the code that called it',
            'return is faster',
            'log only works with numbers',
          ],
          answer: 1,
          why: 'Printing is for humans. Returning is for the rest of your program — you can store it, add to it, pass it on.',
        },
        {
          type: 'predict',
          code: 'function addTax(price) {\n  return price + 10;\n}\naddTax(100);\nconsole.log("done");',
          options: ['110 then done', 'done', '110', 'Error'],
          answer: 1,
          why: 'The function returned 110 — but nobody caught it or printed it. The value quietly disappeared.',
        },
        {
          type: 'code',
          prompt:
            'Write `area(width, height)` that **returns** the area of a rectangle.\n\nThen print `area(6, 4)` and `area(10, 10)` — 24 and 100.',
          starter: 'function area(width, height) {\n  \n}\n\n',
          hint: 'return width * height;   then console.log(area(6, 4));',
          solution:
            'function area(width, height) {\n  return width * height;\n}\n\nconsole.log(area(6, 4));\nconsole.log(area(10, 10));',
          check: (ctx) =>
            all(
              uses(ctx, /return/, 'Use `return`, not console.log, inside the function.'),
              linesAre(ctx, ['24', '100']),
            ),
        },
        {
          type: 'bug',
          prompt: 'This function prints instead of returning, so the total comes out wrong. Fix it.',
          starter:
            'function price(n) {\n  console.log(n * 45);\n}\n\nlet total = price(2) + price(3);\nconsole.log("Total: " + total);',
          hint: 'Swap the console.log inside the function for a return.',
          solution:
            'function price(n) {\n  return n * 45;\n}\n\nlet total = price(2) + price(3);\nconsole.log("Total: " + total);',
          check: (ctx) => all(said(ctx, 'Total: 225'), avoids(ctx, /console\.log\(\s*n\s*\*/, 'The function should return, not print.')),
        },
        {
          type: 'code',
          prompt:
            'Write `isEven(n)` that returns `true` or `false`, then print the results for 4, 7 and 0.',
          starter: 'function isEven(n) {\n  \n}\n\n',
          hint: 'return n % 2 === 0;  — the comparison already IS a boolean, no if needed.',
          solution:
            'function isEven(n) {\n  return n % 2 === 0;\n}\n\nconsole.log(isEven(4));\nconsole.log(isEven(7));\nconsole.log(isEven(0));',
          check: (ctx) => all(uses(ctx, /function\s+isEven/), linesAre(ctx, ['true', 'false', 'true'])),
        },
      ],
    },
    {
      id: 'u4l3',
      emoji: '🧰',
      title: { en: 'Project: Tiny Toolbox', ky: 'Долбоор: Кичине куралдар' },
      minutes: 14,
      xp: 70,
      blurb: 'Small functions that work together.',
      steps: [
        {
          type: 'teach',
          title: 'Small tools, snapped together',
          text:
            'Good programmers do not write one giant function. They write small honest ones and let them call each other — easier to read, easier to fix, easier to reuse.',
          code: 'function celsius(f) {\n  return (f - 32) / 1.8;\n}\n\nfunction describe(f) {\n  return `${f}F is ${Math.round(celsius(f))}C`;\n}\n\nconsole.log(describe(100)); // 100F is 38C',
          tip: '`Math.round` rounds to the nearest whole number. `Math.max(a, b)` picks the bigger one.',
        },
        {
          type: 'code',
          prompt:
            'Tool 1 — `shout(text)` returns the text in CAPITALS with an exclamation mark.\n\n`shout("salam")` → `SALAM!`  … print that result.',
          starter: 'function shout(text) {\n  \n}\n\n',
          hint: 'return text.toUpperCase() + "!";',
          solution: 'function shout(text) {\n  return text.toUpperCase() + "!";\n}\n\nconsole.log(shout("salam"));',
          check: (ctx) => all(uses(ctx, /return/), said(ctx, 'SALAM!')),
        },
        {
          type: 'code',
          prompt:
            'Tool 2 — `biggest(a, b, c)` returns the largest of three numbers.\n\nPrint `biggest(4, 19, 7)`.',
          starter: 'function biggest(a, b, c) {\n  \n}\n\n',
          hint: 'Either use if/else, or Math.max(a, b, c). Both are fine.',
          solution: 'function biggest(a, b, c) {\n  return Math.max(a, b, c);\n}\n\nconsole.log(biggest(4, 19, 7));',
          check: (ctx) => all(uses(ctx, /function\s+biggest/), said(ctx, '19')),
        },
        {
          type: 'code',
          prompt:
            'Final build 🏁 — a **receipt printer** made of two functions.\n\n1. `total(price, count)` returns the price × count\n2. `receipt(item, price, count)` returns a line like `4 x samsa = 180 som` (it must call `total`)\n\nPrint `receipt("samsa", 45, 4)`.',
          starter: 'function total(price, count) {\n  \n}\n\nfunction receipt(item, price, count) {\n  \n}\n\n',
          hint: 'Inside receipt: return `${count} x ${item} = ${total(price, count)} som`;',
          solution:
            'function total(price, count) {\n  return price * count;\n}\n\nfunction receipt(item, price, count) {\n  return `${count} x ${item} = ${total(price, count)} som`;\n}\n\nconsole.log(receipt("samsa", 45, 4));',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+total/, 'Keep a function named `total`.'),
              uses(ctx, /function\s+receipt/, 'Keep a function named `receipt`.'),
              uses(ctx, /total\s*\(/g, '`receipt` should call `total` instead of multiplying again.'),
              said(ctx, '4 x samsa = 180 som'),
            ),
        },
      ],
    },
  ],
};
