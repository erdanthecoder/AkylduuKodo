import { all, said, linesAre, uses, avoids, varIs, saidContains } from './checks.js';

export default {
  id: 'u7',
  level: 'expert',
  city: { name: 'Bishkek', country: 'Kyrgyzstan', lon: 74.6, lat: 42.87, line: 'Home. Think like a programmer' },
  icon: 'puzzle',
  title: { en: 'Think Like a Programmer', ky: 'Программист катары ойлон' },
  blurb: 'Search, sort, count and decide — the moves behind every app you use.',
  lessons: [
    {
      id: 'u7l1',
      icon: 'eye',
      title: { en: 'Searching', ky: 'Издөө' },
      minutes: 13,
      xp: 65,
      blurb: 'Find the needle, and know when there is no needle.',
      steps: [
        {
          type: 'teach',
          title: 'Looking for something means looping until you find it',
          text:
            'A search walks the list, checks each item and stops as soon as it matches. `break` leaves the loop immediately — no point checking the rest.\n\n' +
            'Just as important: deciding what to do when nothing matches.',
          code:
            'let names = ["Bek", "Aisuluu", "Nurai"];\nlet found = "nobody";\n\nfor (let n of names) {\n  if (n === "Aisuluu") {\n    found = n;\n    break;\n  }\n}\n\nconsole.log(found);',
          tip: 'Arrays also have `indexOf` and `includes` built in. Writing the loop yourself first is how you understand what they do.',
        },
        {
          type: 'predict',
          code:
            'let nums = [4, 8, 15, 16];\nlet steps = 0;\nfor (let n of nums) {\n  steps += 1;\n  if (n === 15) break;\n}\nconsole.log(steps);',
          options: ['1', '3', '4', '15'],
          answer: 1,
          why: 'It checks 4, then 8, then 15 and breaks — three rounds. Without `break` it would keep going to 4.',
        },
        {
          type: 'code',
          prompt:
            'Write `find(list, wanted)` that returns the **position** of `wanted`, or `-1` when it is not there.\n\nPrint `find(cities, "Osh")` and then `find(cities, "Paris")`.',
          starter:
            'let cities = ["Bishkek", "Osh", "Naryn"];\n\nfunction find(list, wanted) {\n  \n}\n\n',
          hint: 'Use a counting loop so you have the index: for (let i = 0; i < list.length; i++). Return i on a match, and -1 after the loop.',
          solution:
            'let cities = ["Bishkek", "Osh", "Naryn"];\n\nfunction find(list, wanted) {\n  for (let i = 0; i < list.length; i++) {\n    if (list[i] === wanted) {\n      return i;\n    }\n  }\n  return -1;\n}\n\nconsole.log(find(cities, "Osh"));\nconsole.log(find(cities, "Paris"));',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+find/),
              avoids(ctx, /indexOf/, 'Write the loop yourself this time.'),
              linesAre(ctx, ['1', '-1']),
            ),
        },
        {
          type: 'bug',
          prompt:
            'This search says "not found" even when the item is there. Fix it.',
          starter:
            'let list = [3, 7, 9];\n\nfunction has(list, wanted) {\n  for (let n of list) {\n    if (n === wanted) {\n      return true;\n    } else {\n      return false;\n    }\n  }\n}\n\nconsole.log(has(list, 9));',
          hint: 'The `else return false` fires on the very first item, so the loop never gets past position 0. Only return false after the whole loop has finished.',
          solution:
            'let list = [3, 7, 9];\n\nfunction has(list, wanted) {\n  for (let n of list) {\n    if (n === wanted) {\n      return true;\n    }\n  }\n  return false;\n}\n\nconsole.log(has(list, 9));',
          check: (ctx) => said(ctx, 'true', 'With 9 in the list it should print true.'),
        },
        {
          type: 'code',
          prompt:
            'Find the first word longer than 5 letters and print it. If there is none, print `none`.',
          starter: 'let words = ["sun", "rain", "mountain", "river"];\n',
          hint: 'Keep a variable holding "none", overwrite it on the first long word, then break.',
          solution:
            'let words = ["sun", "rain", "mountain", "river"];\nlet result = "none";\n\nfor (let w of words) {\n  if (w.length > 5) {\n    result = w;\n    break;\n  }\n}\n\nconsole.log(result);',
          check: (ctx) => all(said(ctx, 'mountain'), uses(ctx, /for\s*\(/)),
        },
      ],
    },
    {
      id: 'u7l2',
      icon: 'list',
      title: { en: 'Sorting and Ranking', ky: 'Иреттөө' },
      minutes: 14,
      xp: 70,
      blurb: 'Put things in order, then find the top of the pile.',
      steps: [
        {
          type: 'teach',
          title: 'sort needs to be told how to compare',
          text:
            'For numbers you pass a small comparing function. `(a, b) => a - b` means "smaller first"; flip it to `b - a` for biggest first.\n\n' +
            'Careful: `sort` changes the original array rather than making a copy. Use `[...list]` to sort a copy when the original matters.',
          code:
            'let scores = [42, 7, 91, 30];\nlet up = [...scores].sort((a, b) => a - b);\nlet down = [...scores].sort((a, b) => b - a);\nconsole.log(up);\nconsole.log(down);\nconsole.log(down[0]);',
          tip: 'Sorting text is simpler: `names.sort()` puts strings in alphabetical order on its own.',
        },
        {
          type: 'quiz',
          q: 'Why does `[10, 9, 100].sort()` give `[10, 100, 9]`?',
          options: [
            'sort is broken',
            'Without a compare function it sorts them as text, and "100" comes before "9"',
            'The numbers are too big',
            'It sorted them backwards',
          ],
          answer: 1,
          why: 'Plain `sort()` compares text. For numbers always pass `(a, b) => a - b`.',
        },
        {
          type: 'code',
          prompt: 'Print the three highest scores, biggest first, one per line.',
          starter: 'let scores = [42, 7, 91, 30, 68];\n',
          hint: 'Sort a copy with (a, b) => b - a, then slice(0, 3), then loop.',
          solution:
            'let scores = [42, 7, 91, 30, 68];\nlet top = [...scores].sort((a, b) => b - a).slice(0, 3);\n\nfor (let s of top) {\n  console.log(s);\n}',
          check: (ctx) => all(uses(ctx, /sort/, 'Use `sort`.'), linesAre(ctx, ['91', '68', '42'])),
        },
        {
          type: 'code',
          prompt:
            'A leaderboard. Sort the players by score, highest first, and print each as `1. Aisuluu — 91`.',
          starter:
            'let players = [\n  { name: "Bek", score: 42 },\n  { name: "Aisuluu", score: 91 },\n  { name: "Nurai", score: 68 },\n];\n\n',
          hint: 'Sort with (a, b) => b.score - a.score, then loop with an index so you can print the rank.',
          solution:
            'let players = [\n  { name: "Bek", score: 42 },\n  { name: "Aisuluu", score: 91 },\n  { name: "Nurai", score: 68 },\n];\n\nlet ranked = [...players].sort((a, b) => b.score - a.score);\n\nfor (let i = 0; i < ranked.length; i++) {\n  console.log(`${i + 1}. ${ranked[i].name} — ${ranked[i].score}`);\n}',
          check: (ctx) =>
            linesAre(ctx, ['1. Aisuluu — 91', '2. Nurai — 68', '3. Bek — 42']),
        },
        {
          type: 'order',
          prompt: 'Put the ranking program back together.',
          lines: [
            'let scores = [5, 9, 2];',
            'let sorted = [...scores].sort((a, b) => b - a);',
            'let best = sorted[0];',
            'console.log(`winner: ${best}`);',
          ],
        },
      ],
    },
    {
      id: 'u7l3',
      icon: 'target',
      title: { en: 'Counting Things', ky: 'Санап чыгуу' },
      minutes: 13,
      xp: 70,
      blurb: 'Tally, group and summarise — the heart of every dashboard.',
      steps: [
        {
          type: 'teach',
          title: 'An object makes a perfect tally sheet',
          text:
            'Use the thing you are counting as the label, and the count as the value. `tally[key] = (tally[key] || 0) + 1` reads as "whatever was there, or zero, plus one".\n\n' +
            '`Object.keys(obj)` hands you every label so you can loop over the results.',
          code:
            'let votes = ["chai", "coffee", "chai"];\nlet tally = {};\n\nfor (let v of votes) {\n  tally[v] = (tally[v] || 0) + 1;\n}\n\nconsole.log(tally);\nconsole.log(Object.keys(tally));\nconsole.log(tally.chai);',
        },
        {
          type: 'predict',
          code:
            'let t = {};\nfor (let ch of "banana") {\n  t[ch] = (t[ch] || 0) + 1;\n}\nconsole.log(t.a, t.n, t.b);',
          options: ['3 2 1', '2 3 1', '1 2 3', '3 3 1'],
          answer: 0,
          why: '"banana" holds three a\'s, two n\'s and one b.',
        },
        {
          type: 'code',
          prompt:
            'Count the votes and print each option as `chai: 3`, one per line, in the order the labels first appear.',
          starter: 'let votes = ["chai", "coffee", "chai", "milk", "chai", "coffee"];\n',
          hint: 'Build the tally object first, then loop over Object.keys(tally).',
          solution:
            'let votes = ["chai", "coffee", "chai", "milk", "chai", "coffee"];\nlet tally = {};\n\nfor (let v of votes) {\n  tally[v] = (tally[v] || 0) + 1;\n}\n\nfor (let key of Object.keys(tally)) {\n  console.log(`${key}: ${tally[key]}`);\n}',
          check: (ctx) => linesAre(ctx, ['chai: 3', 'coffee: 2', 'milk: 1']),
        },
        {
          type: 'code',
          prompt:
            'Find the winner. Using the same votes, print just the option with the most votes.',
          starter: 'let votes = ["chai", "coffee", "chai", "milk", "chai", "coffee"];\n',
          hint: 'Tally first. Then loop the keys keeping the one with the biggest count so far.',
          solution:
            'let votes = ["chai", "coffee", "chai", "milk", "chai", "coffee"];\nlet tally = {};\n\nfor (let v of votes) {\n  tally[v] = (tally[v] || 0) + 1;\n}\n\nlet winner = Object.keys(tally)[0];\nfor (let key of Object.keys(tally)) {\n  if (tally[key] > tally[winner]) {\n    winner = key;\n  }\n}\n\nconsole.log(winner);',
          check: (ctx) => all(said(ctx, 'chai'), ctx.logs.length === 1 ? true : 'Print only the winner.'),
        },
        {
          type: 'code',
          prompt:
            'Letter counter. Print how many times the letter `a` appears in the word, using a loop.',
          starter: 'let word = "alma bakcha ayil";\n',
          hint: 'Loop the characters, add 1 whenever the character equals "a".',
          solution:
            'let word = "alma bakcha ayil";\nlet count = 0;\n\nfor (let ch of word) {\n  if (ch === "a") {\n    count += 1;\n  }\n}\n\nconsole.log(count);',
          check: (ctx) => all(uses(ctx, /for\s*\(/), said(ctx, '5')),
        },
      ],
    },
    {
      id: 'u7l4',
      icon: 'trophy',
      title: { en: 'Project: Quiz Machine', ky: 'Долбоор: Тест машинасы' },
      minutes: 18,
      xp: 100,
      blurb: 'Build the thing that has been testing you all along.',
      steps: [
        {
          type: 'teach',
          title: 'You have every piece already',
          text:
            'A quiz is a list of objects, a loop, a comparison and a tally. That is the whole machine — the same shape as the app you are reading this in.\n\n' +
            'Build it in three moves: show the questions, mark the answers, then report the score.',
          code:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n];\n\nconsole.log(quiz.length);\nconsole.log(quiz[1].q);',
        },
        {
          type: 'code',
          prompt:
            'Step 1 — print each question numbered, like `1. 2 + 2`.',
          starter:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\n\n',
          hint: 'A counting loop gives you both the index and the item.',
          solution:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\n\nfor (let i = 0; i < quiz.length; i++) {\n  console.log(`${i + 1}. ${quiz[i].q}`);\n}',
          check: (ctx) => linesAre(ctx, ['1. 2 + 2', '2. capital of Kyrgyzstan', '3. letters in code']),
        },
        {
          type: 'code',
          prompt:
            'Step 2 — mark it. Given `given` (what the learner answered), write `mark(quiz, given)` that returns how many are right.\n\nPrint the result: it should be 2.',
          starter:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\nlet given = ["4", "Osh", "4"];\n\nfunction mark(quiz, given) {\n  \n}\n\n',
          hint: 'Loop with an index and compare `quiz[i].answer` with `given[i]`.',
          solution:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\nlet given = ["4", "Osh", "4"];\n\nfunction mark(quiz, given) {\n  let right = 0;\n  for (let i = 0; i < quiz.length; i++) {\n    if (quiz[i].answer === given[i]) {\n      right += 1;\n    }\n  }\n  return right;\n}\n\nconsole.log(mark(quiz, given));',
          check: (ctx) => all(uses(ctx, /function\s+mark/), said(ctx, '2')),
        },
        {
          type: 'code',
          prompt:
            'Step 3 — the report card. Print one line per question saying `right` or `wrong`, then a final line `Score: 2 of 3`.',
          starter:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\nlet given = ["4", "Osh", "4"];\n\n',
          hint: 'One loop does both jobs: print right/wrong inside it, and count as you go.',
          solution:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "capital of Kyrgyzstan", answer: "Bishkek" },\n  { q: "letters in code", answer: "4" },\n];\nlet given = ["4", "Osh", "4"];\n\nlet right = 0;\nfor (let i = 0; i < quiz.length; i++) {\n  if (quiz[i].answer === given[i]) {\n    right += 1;\n    console.log("right");\n  } else {\n    console.log("wrong");\n  }\n}\n\nconsole.log(`Score: ${right} of ${quiz.length}`);',
          check: (ctx) => linesAre(ctx, ['right', 'wrong', 'right', 'Score: 2 of 3']),
        },
        {
          type: 'code',
          prompt:
            'Free build. Make the quiz yours: your own questions, a pass mark, a grade, a percentage — whatever you like.\n\nThe only rules: use a function you wrote, and print at least three lines.',
          starter:
            '// Your quiz. Change the questions to anything you know.\nlet quiz = [\n  { q: "your question", answer: "your answer" },\n];\n\nfunction report(quiz) {\n  return `${quiz.length} question(s) ready`;\n}\n\nconsole.log(report(quiz));\n',
          hint: 'There is no wrong answer here. Make it run and print three lines.',
          solution:
            'let quiz = [\n  { q: "2 + 2", answer: "4" },\n  { q: "3 * 3", answer: "9" },\n];\n\nfunction percent(right, total) {\n  return Math.round((right / total) * 100);\n}\n\nconsole.log("My quiz");\nconsole.log(`${quiz.length} questions`);\nconsole.log(`Perfect score would be ${percent(quiz.length, quiz.length)}%`);',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+\w+/, 'Write at least one function of your own.'),
              ctx.logs.length >= 3 ? true : `Print at least 3 lines — you printed ${ctx.logs.length}.`,
            ),
        },
        {
          type: 'unplugged',
          title: 'Final mission: run your quiz on a real person',
          text:
            'Read your questions out loud to someone and mark their answers by hand, the way your code does.\n\n' +
            'Then ask them the harder question: what should the program do if the answer is spelled right but in capitals? Every real app has to decide that, and now so do you.',
        },
      ],
    },
  ],
};
