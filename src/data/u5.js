import { all, said, linesAre, uses, avoids, varIs, saidContains } from './checks.js';

export default {
  id: 'u5',
  level: 'intermediate',
  city: { name: 'Samarkand', country: 'Uzbekistan', lon: 66.97, lat: 39.65, line: 'Caravans, lists and cargo' },
  icon: 'layers',
  title: { en: 'Lists & Things', ky: 'Тизмелер жана нерселер' },
  blurb: 'Handle many values at once — then build your final project.',
  lessons: [
    {
      id: 'u5l1',
      icon: 'list',
      title: { en: 'Lists', ky: 'Тизмелер' },
      minutes: 11,
      xp: 55,
      blurb: 'One box, many values.',
      steps: [
        {
          type: 'teach',
          title: 'An array is a numbered shelf',
          text:
            'Instead of `friend1`, `friend2`, `friend3`, keep one list. Positions start at **0** — the same counting you met with `word[0]`.',
          code: 'let friends = ["Aisuluu", "Bek", "Nurai"];\n\nconsole.log(friends[0]);      // Aisuluu\nconsole.log(friends.length);  // 3\n\nfriends.push("Timur");        // add to the end\nconsole.log(friends);',
          tip: 'The last position is always `length - 1`. Asking for `friends[3]` in a 3-item list gives `undefined`.',
        },
        {
          type: 'predict',
          code: 'let nums = [10, 20, 30];\nconsole.log(nums[1] + nums.length);',
          options: ['23', '33', '40', '13'],
          answer: 0,
          why: '`nums[1]` is 20 (position 1 is the SECOND item) and length is 3 → 23.',
        },
        {
          type: 'code',
          prompt:
            'Make a list called `mountains` with `"Khan Tengri"`, `"Lenin Peak"` and `"Manas"`.\n\nPrint the first one, then how many there are.',
          starter: 'let mountains = [];\n\n',
          capture: ['mountains'],
          hint: 'mountains[0]  and  mountains.length',
          solution:
            'let mountains = ["Khan Tengri", "Lenin Peak", "Manas"];\n\nconsole.log(mountains[0]);\nconsole.log(mountains.length);',
          check: (ctx) =>
            all(
              varIs(ctx, 'mountains', ['Khan Tengri', 'Lenin Peak', 'Manas']),
              linesAre(ctx, ['Khan Tengri', '3']),
              uses(ctx, /\.length/, 'Use `.length` rather than typing 3.'),
            ),
        },
        {
          type: 'bug',
          prompt: 'This should print the last item, `Manas`, but it crashes-ish. Fix it.',
          starter: 'let list = ["Khan Tengri", "Lenin Peak", "Manas"];\nconsole.log(list[list.length]);',
          hint: 'Positions run 0, 1, 2 for a 3-item list. What is the position of the last one?',
          solution: 'let list = ["Khan Tengri", "Lenin Peak", "Manas"];\nconsole.log(list[list.length - 1]);',
          check: (ctx) => all(said(ctx, 'Manas'), uses(ctx, /length\s*-\s*1/, 'Use `list.length - 1` so it works for any size.')),
        },
      ],
    },
    {
      id: 'u5l2',
      icon: 'eye',
      title: { en: 'Walk the List', ky: 'Тизмени аралоо' },
      minutes: 13,
      xp: 60,
      blurb: 'Loops + lists = the real work of programming.',
      steps: [
        {
          type: 'teach',
          title: 'Visit every item',
          text:
            '`for (let item of list)` hands you each item in turn — cleaner than counting positions when you do not need the index.',
          code: 'let prices = [45, 120, 30];\nlet sum = 0;\n\nfor (let p of prices) {\n  sum += p;\n}\n\nconsole.log(sum); // 195',
          tip: 'Need the position too? Use the classic `for (let i = 0; i < list.length; i++)`.',
        },
        {
          type: 'code',
          prompt:
            'Given the list of `scores`, print the **average**, rounded with `Math.round`.\n\n(Answer should be 74.)',
          starter: 'let scores = [80, 55, 91, 70];\n\n',
          hint: 'Add them all in a loop, then divide by scores.length.',
          solution:
            'let scores = [80, 55, 91, 70];\nlet sum = 0;\n\nfor (let s of scores) {\n  sum += s;\n}\n\nconsole.log(Math.round(sum / scores.length));',
          check: (ctx) =>
            all(
              uses(ctx, /for\s*\(/, 'Use a loop — the list might grow tomorrow.'),
              avoids(ctx, /\b74\b/, 'Do not type the answer, compute it.'),
              said(ctx, '74'),
            ),
        },
        {
          type: 'code',
          prompt:
            'Print only the **long** names (more than 4 letters) from the list, one per line.',
          starter: 'let names = ["Bek", "Aisuluu", "Nur", "Kanykei"];\n\n',
          hint: 'Loop over the names, and inside the loop put an if that checks name.length > 4.',
          solution:
            'let names = ["Bek", "Aisuluu", "Nur", "Kanykei"];\n\nfor (let name of names) {\n  if (name.length > 4) {\n    console.log(name);\n  }\n}',
          check: (ctx) => linesAre(ctx, ['Aisuluu', 'Kanykei']),
        },
        {
          type: 'code',
          prompt:
            'Find the biggest number in `nums` with a loop (no `Math.max` on the whole list this time) and print it.',
          starter: 'let nums = [12, 99, 4, 56, 71];\nlet best = nums[0];\n\n',
          capture: ['best'],
          hint: 'Walk the list; whenever an item is bigger than `best`, put it in `best`.',
          solution:
            'let nums = [12, 99, 4, 56, 71];\nlet best = nums[0];\n\nfor (let n of nums) {\n  if (n > best) {\n    best = n;\n  }\n}\n\nconsole.log(best);',
          check: (ctx) =>
            all(
              uses(ctx, /for\s*\(/, 'Use a loop.'),
              avoids(ctx, /Math\.max/, 'Do it by hand this time — that is the exercise.'),
              varIs(ctx, 'best', 99),
              said(ctx, '99'),
            ),
        },
      ],
    },
    {
      id: 'u5l3',
      icon: 'layers',
      title: { en: 'Things With Labels', ky: 'Белгиси бар нерселер' },
      minutes: 12,
      xp: 60,
      blurb: 'Objects: describe one thing properly.',
      steps: [
        {
          type: 'teach',
          title: 'An object is a labelled bag',
          text:
            'A list is numbered. An object is **labelled** — perfect for describing one thing with several facts.',
          code: 'let yak = {\n  name: "Kodo",\n  age: 4,\n  hungry: true,\n};\n\nconsole.log(yak.name);     // Kodo\nyak.age = 5;               // birthday!\nconsole.log(yak);',
          tip: 'Lists of objects are how almost all real data looks: users, messages, products, scores.',
        },
        {
          type: 'predict',
          code: 'let cafe = { name: "Ala-Too", seats: 12 };\nconsole.log(cafe.seats + 1);\nconsole.log(cafe.menu);',
          options: ['13 then undefined', '13 then error', '12 then undefined', 'error'],
          answer: 0,
          why: 'Reading a label that does not exist is not a crash — you simply get `undefined`.',
        },
        {
          type: 'code',
          prompt:
            'Make an object `student` with `name`, `grade` (a number) and `city`.\n\nThen print one sentence like: `Aisuluu from Osh is in grade 7`.',
          starter: 'let student = {\n  \n};\n\n',
          capture: ['student'],
          hint: 'Use a template string: `${student.name} from ${student.city} is in grade ${student.grade}`',
          solution:
            'let student = {\n  name: "Aisuluu",\n  grade: 7,\n  city: "Osh",\n};\n\nconsole.log(`${student.name} from ${student.city} is in grade ${student.grade}`);',
          check: (ctx) => {
            const s = ctx.vars.student;
            return all(
              s && typeof s === 'object' ? true : 'Make an object called `student`.',
              typeof s?.name === 'string' && s.name ? true : 'Give it a `name`.',
              typeof s?.grade === 'number' ? true : 'Give it a `grade` as a number (no quotes).',
              typeof s?.city === 'string' && s.city ? true : 'Give it a `city`.',
              saidContains(ctx, `${s?.name}`, 'Print a sentence that includes the name.'),
              saidContains(ctx, `grade ${s?.grade}`, 'The sentence should end with `... is in grade N`.'),
              uses(ctx, /student\./, 'Read the values out of the object instead of retyping them.'),
            );
          },
        },
        {
          type: 'code',
          prompt:
            'A list of objects. Print each animal as `Kodo the yak is 4` — one line per animal.',
          starter:
            'let animals = [\n  { name: "Kodo", kind: "yak", age: 4 },\n  { name: "Ak", kind: "horse", age: 7 },\n];\n\n',
          hint: 'for (let a of animals) { console.log(`${a.name} the ${a.kind} is ${a.age}`); }',
          solution:
            'let animals = [\n  { name: "Kodo", kind: "yak", age: 4 },\n  { name: "Ak", kind: "horse", age: 7 },\n];\n\nfor (let a of animals) {\n  console.log(`${a.name} the ${a.kind} is ${a.age}`);\n}',
          check: (ctx) => all(uses(ctx, /for\s*\(/), linesAre(ctx, ['Kodo the yak is 4', 'Ak the horse is 7'])),
        },
      ],
    },
    {
      id: 'u5l4',
      icon: 'trophy',
      title: { en: 'Final Project: Chaihana', ky: 'Акыркы долбоор: Чайкана' },
      minutes: 18,
      xp: 100,
      blurb: 'Everything you learned, in one small program.',
      steps: [
        {
          type: 'teach',
          title: 'You are about to write a real program',
          text:
            'A menu, a filter, a total and a receipt — variables, conditions, loops, functions, lists and objects, all pulling together.\n\n' +
            'Take your time. Run often. Read the error messages; they are trying to help.',
          code: 'let menu = [\n  { name: "samsa", price: 45, veg: false },\n  { name: "lagman", price: 180, veg: false },\n  { name: "salad", price: 90, veg: true },\n];',
        },
        {
          type: 'code',
          prompt:
            'Step 1 — the menu board. Print every dish as `samsa — 45 som`, one per line.',
          starter:
            'let menu = [\n  { name: "samsa", price: 45, veg: false },\n  { name: "lagman", price: 180, veg: false },\n  { name: "salad", price: 90, veg: true },\n];\n\n',
          hint: 'Loop the menu and build a template string with an em dash —.',
          solution:
            'let menu = [\n  { name: "samsa", price: 45, veg: false },\n  { name: "lagman", price: 180, veg: false },\n  { name: "salad", price: 90, veg: true },\n];\n\nfor (let dish of menu) {\n  console.log(`${dish.name} — ${dish.price} som`);\n}',
          check: (ctx) => linesAre(ctx, ['samsa — 45 som', 'lagman — 180 som', 'salad — 90 som']),
        },
        {
          type: 'code',
          prompt:
            'Step 2 — a vegetarian friend arrives. Write a function`vegOnly(list)`that **returns** a new list of only the veg dishes, then print their names.',
          starter:
            'let menu = [\n  { name: "samsa", price: 45, veg: false },\n  { name: "lagman", price: 180, veg: false },\n  { name: "salad", price: 90, veg: true },\n  { name: "plov", price: 200, veg: false },\n  { name: "borsok", price: 30, veg: true },\n];\n\nfunction vegOnly(list) {\n  \n}\n\n',
          hint: 'Make an empty result list, loop, and `result.push(dish)` when `dish.veg` is true. Return the result.',
          solution:
            'let menu = [\n  { name: "samsa", price: 45, veg: false },\n  { name: "lagman", price: 180, veg: false },\n  { name: "salad", price: 90, veg: true },\n  { name: "plov", price: 200, veg: false },\n  { name: "borsok", price: 30, veg: true },\n];\n\nfunction vegOnly(list) {\n  let result = [];\n  for (let dish of list) {\n    if (dish.veg) {\n      result.push(dish);\n    }\n  }\n  return result;\n}\n\nfor (let dish of vegOnly(menu)) {\n  console.log(dish.name);\n}',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+vegOnly/, 'Write a function named `vegOnly`.'),
              uses(ctx, /return/, '`vegOnly` should return the new list.'),
              linesAre(ctx, ['salad', 'borsok']),
            ),
        },
        {
          type: 'code',
          prompt:
            'Step 3 — the bill. Write`billTotal(order)`that returns the sum of the prices, then print:\n\n`Total: 315 som`\n\nIf the total is **300 or more**, print a second line:`Free chai included`.',
          starter:
            'let order = [\n  { name: "samsa", price: 45 },\n  { name: "lagman", price: 180 },\n  { name: "salad", price: 90 },\n];\n\nfunction billTotal(list) {\n  \n}\n\n',
          hint: 'Accumulator inside the function; then an if outside it.',
          solution:
            'let order = [\n{ name:"samsa", price: 45 },\n{ name:"lagman", price: 180 },\n{ name:"salad", price: 90 },\n];\n\nfunction billTotal(list) {\nlet sum = 0;\nfor (let item of list) {\nsum += item.price;\n}\nreturn sum;\n}\n\nlet total = billTotal(order);\nconsole.log(`Total: ${total} som`);\n\nif (total >= 300) {\nconsole.log("Free chai included");\n}',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+billTotal/, 'Write a function named `billTotal`.'),
              avoids(ctx, /\b315\b/, 'Let the loop add it up — do not type 315.'),
              said(ctx, 'Total: 315 som'),
              ctx.logs.length === 2 ? true : 'The order costs 315, so the free-chai line should appear too.',
              /chai/i.test(ctx.logs[1] || '')? true :'Second line:`Free chai included`.',
            ),
        },
        {
          type: 'code',
          prompt:
            'Step 4 — your own ending. Free build!\n\nAdd anything you like: a discount function, the cheapest dish, a loyalty counter, a dish your grandmother makes. The only rule: print at least **three** lines and use a function you wrote.',
          starter:
            '// Your chaihana, your rules.\n// Ideas: cheapest(), discount(total), or a menu in your own language.\n\nfunction myTool() {\n  return "Kel, chai ich!";\n}\n\nconsole.log(myTool());\n',
          hint: 'There is no wrong answer here — just make it run and print three lines.',
          solution:
            'function cheapest(list) {\n  let best = list[0];\n  for (let d of list) {\n    if (d.price < best.price) best = d;\n  }\n  return best;\n}\n\nlet menu = [\n  { name: "samsa", price: 45 },\n  { name: "borsok", price: 30 },\n];\n\nconsole.log("Welcome to my chaihana");\nconsole.log(`Cheapest: ${cheapest(menu).name}`);\nconsole.log("Kel, chai ich!");',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+\w+/, 'Write at least one function of your own.'),
              ctx.logs.length >= 3 ? true : `Print at least 3 lines — you printed ${ctx.logs.length}.`,
            ),
        },
        {
          type: 'unplugged',
          title: 'Final quest: teach someone',
          text:
            'Show your chaihana program to a friend, a parent or a sibling. Explain what a loop is using your menu as the example.\n\n' +
            'If you can teach it, you own it. Then come back and start a project of your own in the Playground.',
        },
      ],
    },
  ],
};
