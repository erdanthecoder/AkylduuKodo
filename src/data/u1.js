import { all, said, saidAll, saidContains, linesAre, varIs, uses, avoids, saidSomething } from './checks.js';

const sayBlocks = [
  { id: 'say', label: 'say {0}', tpl: 'console.log({0});', slots: [{ kind: 'str', value: 'Salam!' }] },
  { id: 'saynum', label: 'say the number {0}', tpl: 'console.log({0});', slots: [{ kind: 'num', value: '7' }] },
  { id: 'let', label: 'make a box {0} = {1}', tpl: 'let {0} = {1};', slots: [{ kind: 'raw', value: 'name' }, { kind: 'str', value: 'Aisuluu' }] },
  { id: 'sayvar', label: 'say what is in {0}', tpl: 'console.log({0});', slots: [{ kind: 'raw', value: 'name' }] },
];

export default {
  id: 'u1',
  level: 'beginner',
  icon: 'sparkle',
  title: { en: 'First Words', ky: 'Алгачкы сөздөр' },
  blurb: 'Make the computer talk, then teach it to remember things.',
  lessons: [
    {
      id: 'u1l1',
      icon: 'sound',
      title: { en: 'Make It Talk', ky: 'Компьютерди сүйлөт' },
      minutes: 8,
      xp: 40,
      blurb: 'Your first line of real code.',
      steps: [
        {
          type: 'teach',
          title: 'A computer is a very fast, very literal friend',
          text:
            'It does exactly what you write — no more, no less. To make it say something out loud on the screen, you use `console.log`.\n\n' +
            'Read this out loud: "console dot log, open bracket, quote Salam quote, close bracket, semicolon."',
          code: 'console.log("Salam, world!");',
          tip: 'The quotes mean "this is text, not an instruction". The text inside quotes is called a **string**.',
        },
        {
          type: 'quiz',
          q: 'What will the computer print?',
          code: 'console.log("Kodo");',
          options: ['Kodo', '"Kodo"', 'console.log', 'Nothing'],
          answer: 0,
          why: 'The quotes tell JavaScript where the text starts and ends — they are not printed themselves.',
        },
        {
          type: 'code',
          prompt: 'Make the computer say **Salam, world!** — exactly those words.',
          palette: sayBlocks,
          starter: '// Write your first line below\n',
          hint: 'console.log("Salam, world!");',
          solution: 'console.log("Salam, world!");',
          check: (ctx) => said(ctx, 'Salam, world!'),
        },
        {
          type: 'type',
          prompt: 'Muscle memory time. Type this line exactly — every bracket and quote matters.',
          target: 'console.log("I can code");',
        },
        {
          type: 'bug',
          prompt: 'This code is broken. Fix it so it prints **Hello from Bishkek**.',
          starter: 'console.log("Hello from Bishkek);',
          hint: 'Count the quotes. A string needs one at the start AND one at the end.',
          solution: 'console.log("Hello from Bishkek");',
          check: (ctx) => said(ctx, 'Hello from Bishkek'),
        },
        {
          type: 'code',
          prompt:
            'Print **three** lines, in this order:\n\n1. `Good morning`\n2. `I am learning to code`\n3. `Bye!`',
          starter: 'console.log("Good morning");\n',
          hint: 'One console.log per line. They run from top to bottom.',
          solution: 'console.log("Good morning");\nconsole.log("I am learning to code");\nconsole.log("Bye!");',
          check: (ctx) => linesAre(ctx, ['Good morning', 'I am learning to code', 'Bye!']),
        },
        {
          type: 'unplugged',
          title: 'Offline quest: the sandwich algorithm',
          text:
            'Grab a person and a piece of paper. Write the steps for making a sandwich (or a cup of chai) — then have them follow your steps **exactly**, like a computer, without guessing.\n\n' +
            'They will get it hilariously wrong. That is the lesson: computers never guess. Rewrite the steps until it works.',
        },
      ],
    },
    {
      id: 'u1l2',
      icon: 'layers',
      title: { en: 'Boxes With Names', ky: 'Аты бар кутулар' },
      minutes: 10,
      xp: 45,
      blurb: 'Variables: how a program remembers.',
      steps: [
        {
          type: 'teach',
          title: 'A variable is a labelled box',
          text:
            'You put a value in, write a name on the outside, and later you ask for it by name.\n\n' +
            '`let` makes a box whose contents can change. `const` makes a box that is sealed forever.',
          code: 'let city = "Bishkek";\nconsole.log(city);\n\ncity = "Osh";      // change what is inside\nconsole.log(city);',
          tip: 'Notice: `console.log(city)` has no quotes. Quotes would print the word "city" instead of what is inside the box.',
        },
        {
          type: 'predict',
          code: 'let snack = "apple";\nsnack = "bread";\nconsole.log(snack);',
          options: ['apple', 'bread', 'apple bread', 'snack'],
          answer: 1,
          why: 'The second line replaces what is inside the box. Only the newest value survives.',
        },
        {
          type: 'code',
          prompt:
            'Make a box called `name` holding your name, and a box called `age` holding your age as a number. Then print both — name first.',
          palette: sayBlocks,
          starter: 'let name = "";\nlet age = 0;\n\n',
          capture: ['name', 'age'],
          hint: 'let name = "Aisuluu";  then  console.log(name);',
          solution: 'let name = "Aisuluu";\nlet age = 12;\nconsole.log(name);\nconsole.log(age);',
          check: (ctx) =>
            all(
              typeof ctx.vars.name === 'string' && ctx.vars.name.length > 0 ? true : 'Put some text inside `name`.',
              typeof ctx.vars.age === 'number' && ctx.vars.age > 0 ? true : 'Put a number (no quotes!) inside `age`.',
              ctx.logs.length >= 2 ? true : 'Print both boxes — that is two console.log lines.',
              ctx.logs[0] === ctx.vars.name ? true : 'Print the name first, then the age.',
            ),
        },
        {
          type: 'quiz',
          q: 'Which line will make JavaScript angry?',
          code: 'const pi = 3.14;\nlet score = 10;\nscore = 11;\npi = 3;',
          options: ['let score = 10;', 'score = 11;', 'pi = 3;', 'const pi = 3.14;'],
          answer: 2,
          why: 'A `const` box is sealed. Trying to change it throws "Assignment to constant variable".',
        },
        {
          type: 'order',
          prompt: 'Put these lines in an order that actually works.',
          lines: ['let animal = "yak";', 'animal = "horse";', 'console.log(animal);'],
          why: 'You must create a box before you can change it or look inside it. Order matters — always.',
        },
        {
          type: 'bug',
          prompt: 'This should print the drink, but it prints the word "drink". Fix it.',
          starter: 'let drink = "chai";\nconsole.log("drink");',
          hint: 'Quotes make text. No quotes means "look inside the box with this name".',
          solution: 'let drink = "chai";\nconsole.log(drink);',
          check: (ctx) => said(ctx, 'chai', 'It should print chai — the value inside the box.'),
        },
      ],
    },
    {
      id: 'u1l3',
      icon: 'wand',
      title: { en: 'Number Magic', ky: 'Сан сыйкыры' },
      minutes: 10,
      xp: 45,
      blurb: 'Math, and sticking words together.',
      steps: [
        {
          type: 'teach',
          title: 'JavaScript is a calculator that never gets tired',
          text:
            '`+` add, `-` subtract, `*` multiply, `/` divide, and `%` gives the **remainder** — the leftover after dividing.\n\n' +
            '`%` looks boring but it is secretly a superpower: it tells you if a number is even, or every 3rd item, or the last digit.',
          code: 'console.log(7 + 3);   // 10\nconsole.log(7 * 3);   // 21\nconsole.log(7 / 2);   // 3.5\nconsole.log(7 % 2);   // 1  (7 = 3*2 + 1 left over)',
        },
        {
          type: 'predict',
          code: 'let boxes = 4;\nlet perBox = 6;\nconsole.log(boxes * perBox);',
          options: ['46', '10', '24', 'boxes * perBox'],
          answer: 2,
          why: 'With numbers, `*` multiplies the values inside the boxes: 4 × 6 = 24.',
        },
        {
          type: 'teach',
          title: 'Backticks glue words and values together',
          text:
            'A string in backticks `` ` `` is a **template string**. Inside it, `${...}` drops a value straight into the text.\n\n' +
            'This is how almost every real program builds a sentence.',
          code: 'let name = "Kodo";\nlet apples = 3;\nconsole.log(`${name} has ${apples} apples.`);\nconsole.log(`Next year: ${apples + 1}.`);',
          tip: 'The backtick key is usually left of the `1` key, above Tab.',
        },
        {
          type: 'code',
          prompt:
            'A samsa costs **45 som**. You buy **4**.\n\nMake variables `price` and `count`, then print exactly:\n\n`4 samsa cost 180 som`',
          starter: 'let price = 45;\nlet count = 4;\n\n',
          hint: 'console.log(`${count} samsa cost ${price * count} som`);',
          solution: 'let price = 45;\nlet count = 4;\nconsole.log(`${count} samsa cost ${price * count} som`);',
          check: (ctx) =>
            all(
              said(ctx, '4 samsa cost 180 som'),
              avoids(ctx, /180/, 'Do not type 180 yourself — let the computer multiply `price * count`.'),
            ),
        },
        {
          type: 'quiz',
          q: 'What does `"5" + 3` give in JavaScript?',
          options: ['8', '"53"', 'An error', '"5 3"'],
          answer: 1,
          why:
            'Classic trap! `"5"` is text, so `+` glues instead of adding. This is why the `age` box in the last lesson had no quotes.',
        },
        {
          type: 'code',
          prompt:
            'Even or odd detector — without `if` (we learn that next unit).\n\nPrint the remainder of `17 % 2` and of `18 % 2`, in that order.',
          starter: '',
          hint: 'An even number always leaves 0. Odd always leaves 1.',
          solution: 'console.log(17 % 2);\nconsole.log(18 % 2);',
          check: (ctx) => linesAre(ctx, ['1', '0']),
        },
      ],
    },
    {
      id: 'u1l4',
      icon: 'medal',
      title: { en: 'Project: Name Badge', ky: 'Долбоор: Аты-жөн белгиси' },
      minutes: 12,
      xp: 60,
      blurb: 'Put it all together and build something you can show off.',
      steps: [
        {
          type: 'teach',
          title: 'Strings know tricks',
          text:
            'Every string carries little tools with it. You call them with a dot.',
          code: 'let who = "aisuluu";\nconsole.log(who.length);        // 7\nconsole.log(who.toUpperCase()); // AISULUU\nconsole.log(who[0]);            // a  (counting starts at 0!)',
          tip: 'Programmers count 0, 1, 2, 3… Position 0 is the first one. You will meet this again with lists.',
        },
        {
          type: 'predict',
          code: 'let word = "code";\nconsole.log(word.length + word[0]);',
          options: ['4c', 'code4', '5', 'c4'],
          answer: 0,
          why: '`word.length` is the number 4, `word[0]` is "c". Number + string glues them: "4c".',
        },
        {
          type: 'code',
          prompt:
            'Build a name badge. Using a variable `who` with your name, print exactly two lines:\n\n1. Your name in CAPITALS\n2. `Letters: N` where N is the length of your name',
          starter: 'let who = "Aisuluu";\n\n',
          hint: 'who.toUpperCase()  and  `Letters: ${who.length}`',
          solution: 'let who = "Aisuluu";\nconsole.log(who.toUpperCase());\nconsole.log(`Letters: ${who.length}`);',
          check: (ctx) =>
            all(
              saidSomething(ctx),
              ctx.logs.length === 2 ? true : 'Exactly two printed lines, please.',
              (ctx.logs[0] || '') === (ctx.logs[0] || '').toUpperCase() && (ctx.logs[0] || '').length > 1
                ? true
                : 'The first line should be your name in CAPITALS.',
              /^letters:\s*\d+$/i.test(ctx.logs[1]) ? true : 'The second line should look like `Letters: 7`.',
              uses(ctx, /\.length/, 'Use `.length` instead of counting the letters yourself.'),
            ),
        },
        {
          type: 'order',
          prompt: 'Rebuild the badge program. Drag the lines into working order.',
          lines: [
            'let who = "Kodo";',
            'let shout = who.toUpperCase();',
            'console.log(shout);',
            'console.log(`Letters: ${who.length}`);',
          ],
        },
        {
          type: 'code',
          prompt:
            'Final challenge — a **ticket printer**.\n\nGiven`event`,`seat`and`price`, print one line:\n\n`Kurmanjan Concert — seat 14 — 500 som`\n\n(Use the values already in the variables, and an em dash`—`between the parts.)',
          starter: 'let event = "Kurmanjan Concert";\nlet seat = 14;\nlet price = 500;\n\n',
          hint: 'One template string: `${event} — seat ${seat} — ${price} som`',
          solution:
            'let event = "Kurmanjan Concert";\nlet seat = 14;\nlet price = 500;\nconsole.log(`${event} — seat ${seat} — ${price} som`);',
          check: (ctx) =>
            all(
              said(ctx, 'Kurmanjan Concert — seat 14 — 500 som'),
              uses(ctx, /\$\{/, 'Use a template string with ${ } — it is the tool for this job.'),
            ),
        },
      ],
    },
  ],
};
