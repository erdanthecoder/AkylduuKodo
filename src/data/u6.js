import { all, said, linesAre, uses, avoids, varIs, saidContains } from './checks.js';

export default {
  id: 'u6',
  level: 'expert',
  icon: 'wand',
  title: { en: 'Text Workshop', ky: 'Текст устаканасы' },
  blurb: 'Cut, join and rebuild words. This is how chat apps, search boxes and secret codes work.',
  lessons: [
    {
      id: 'u6l1',
      icon: 'keyboard',
      title: { en: 'Slicing Words', ky: 'Сөздү кесүү' },
      minutes: 12,
      xp: 60,
      blurb: 'Take a string apart, piece by piece.',
      steps: [
        {
          type: 'teach',
          title: 'A string is a row of numbered boxes',
          text:
            'Every letter sits at a position, counting from 0. `slice(start, end)` cuts out a piece — it takes the start position and stops *before* the end one.\n\n' +
            'Negative numbers count backwards from the end, which is handy for "the last few letters".',
          code:
            'let word = "Kyrgyzstan";\nconsole.log(word.slice(0, 6));\nconsole.log(word.slice(6));\nconsole.log(word.slice(-4));\nconsole.log(word.toUpperCase().slice(0, 3));',
          tip: 'Reading `slice(0, 6)` out loud as "from 0 up to but not including 6" saves you a lot of off-by-one bugs.',
        },
        {
          type: 'predict',
          code: 'let s = "programmer";\nconsole.log(s.slice(0, 3) + s.slice(-2));',
          options: ['proer', 'prore', 'proger', 'pro er'],
          answer: 0,
          why: '`slice(0, 3)` is "pro" and `slice(-2)` takes the last two letters, "er". Glued together: "proer".',
        },
        {
          type: 'code',
          prompt:
            'Initials machine. Given `first` and `last`, print the initials with dots, like `A.K.`',
          starter: 'let first = "Aisuluu";\nlet last = "Karimova";\n',
          hint: 'first[0] gives the first letter. Build the line with a template string.',
          solution:
            'let first = "Aisuluu";\nlet last = "Karimova";\nconsole.log(`${first[0]}.${last[0]}.`);',
          check: (ctx) => all(said(ctx, 'A.K.'), avoids(ctx, /"A\.K\."|'A\.K\.'/, 'Build it from the variables, do not type the answer.')),
        },
        {
          type: 'bug',
          prompt: 'This should print the last three letters of the word. It prints the wrong piece. Fix it.',
          starter: 'let word = "mountain";\nconsole.log(word.slice(3));',
          hint: 'Counting backwards from the end needs a negative number.',
          solution: 'let word = "mountain";\nconsole.log(word.slice(-3));',
          check: (ctx) => said(ctx, 'ain'),
        },
        {
          type: 'code',
          prompt:
            'Capitalise properly. Given `name` in lowercase, print it with only the first letter uppercase: `aisuluu` becomes `Aisuluu`.\n\nUse `slice`, not a hand-typed word.',
          starter: 'let name = "aisuluu";\n',
          hint: 'name[0].toUpperCase() + name.slice(1)',
          solution: 'let name = "aisuluu";\nconsole.log(name[0].toUpperCase() + name.slice(1));',
          check: (ctx) =>
            all(
              said(ctx, 'Aisuluu'),
              uses(ctx, /slice/, 'Use `slice` so it works for any name.'),
              avoids(ctx, /"Aisuluu"|'Aisuluu'/, 'Do not type the finished word.'),
            ),
        },
        {
          type: 'order',
          prompt: 'Rebuild the capitaliser in the right order.',
          lines: [
            'let name = "bek";',
            'let head = name[0].toUpperCase();',
            'let tail = name.slice(1);',
            'console.log(head + tail);',
          ],
        },
      ],
    },
    {
      id: 'u6l2',
      icon: 'scale',
      title: { en: 'Splitting and Joining', ky: 'Бөлүү жана бириктирүү' },
      minutes: 13,
      xp: 65,
      blurb: 'Turn a sentence into a list, and a list back into a sentence.',
      steps: [
        {
          type: 'teach',
          title: 'split makes a list, join makes a string',
          text:
            '`split(" ")` chops a sentence wherever it finds a space and hands you an array. `join("-")` glues an array back together with whatever glue you choose.\n\n' +
            'This pair is behind word counters, tag inputs, CSV files and search boxes.',
          code:
            'let line = "salam dostor kandaysyz";\nlet words = line.split(" ");\nconsole.log(words);\nconsole.log(words.length);\nconsole.log(words.join("-"));',
        },
        {
          type: 'predict',
          code: 'let tags = "red,green,blue".split(",");\nconsole.log(tags[1]);\nconsole.log(tags.length);',
          options: ['green then 3', 'red then 3', 'green then 2', 'g then 3'],
          answer: 0,
          why: 'Splitting on the comma gives ["red", "green", "blue"], so position 1 is "green" and the length is 3.',
        },
        {
          type: 'code',
          prompt: 'Word counter. Print how many words are in `sentence`.',
          starter: 'let sentence = "code a little every single day";\n',
          hint: 'Split on the space, then read `.length`.',
          solution: 'let sentence = "code a little every single day";\nconsole.log(sentence.split(" ").length);',
          check: (ctx) => all(uses(ctx, /split/, 'Use `split`.'), avoids(ctx, /\b6\b/, 'Let the code count, do not type 6.'), said(ctx, '6')),
        },
        {
          type: 'code',
          prompt:
            'Reverse the word order of the sentence and print it, so `one two three` becomes `three two one`.\n\nArrays have a `.reverse()` method.',
          starter: 'let sentence = "one two three";\n',
          hint: 'split, then reverse, then join with a space again.',
          solution: 'let sentence = "one two three";\nconsole.log(sentence.split(" ").reverse().join(" "));',
          check: (ctx) => all(said(ctx, 'three two one'), uses(ctx, /split/), uses(ctx, /join/)),
        },
        {
          type: 'code',
          prompt:
            'Shout every word. Print each word of the sentence on its own line, in capitals.',
          starter: 'let sentence = "keep going you got this";\n',
          hint: 'Split into a list, loop over it, print `word.toUpperCase()`.',
          solution:
            'let sentence = "keep going you got this";\n\nfor (let word of sentence.split(" ")) {\n  console.log(word.toUpperCase());\n}',
          check: (ctx) => all(uses(ctx, /for\s*\(/, 'Use a loop.'), linesAre(ctx, ['KEEP', 'GOING', 'YOU', 'GOT', 'THIS'])),
        },
        {
          type: 'unplugged',
          title: 'Offline mission: be the split function',
          text:
            'Write a long sentence on paper and cut it with scissors at every space. You now hold an array.\n\n' +
            'Shuffle the pieces and hand them to someone: can they rebuild the sentence? That is exactly the work `join` does, and why the order inside an array matters so much.',
        },
      ],
    },
    {
      id: 'u6l3',
      icon: 'key',
      title: { en: 'Secret Messages', ky: 'Жашыруун кат' },
      minutes: 14,
      xp: 70,
      blurb: 'Build a cipher, then break it.',
      steps: [
        {
          type: 'teach',
          title: 'Letters are secretly numbers',
          text:
            'Every character has a code number. `charCodeAt(0)` gives you the number, and `String.fromCharCode(n)` turns a number back into a letter.\n\n' +
            'Shift every letter by the same amount and you have built a Caesar cipher — the oldest trick in cryptography.',
          code:
            'console.log("a".charCodeAt(0));\nconsole.log(String.fromCharCode(98));\n\nlet shifted = String.fromCharCode("a".charCodeAt(0) + 1);\nconsole.log(shifted);',
          tip: 'Lowercase letters run from 97 ("a") to 122 ("z"). Uppercase starts at 65.',
        },
        {
          type: 'predict',
          code: 'console.log(String.fromCharCode("m".charCodeAt(0) + 2));',
          options: ['n', 'o', 'p', 'm2'],
          answer: 1,
          why: 'Moving "m" two places along the alphabet lands on "o".',
        },
        {
          type: 'code',
          prompt:
            'Write `encode(text)` that shifts every letter forward by one and returns the result. Spaces stay as they are.\n\nPrint `encode("salam")` — it should read `tbmbn`.',
          starter: 'function encode(text) {\n  let out = "";\n  \n  return out;\n}\n\n',
          hint: 'Loop over the text. If the character is a space, add it unchanged; otherwise add the shifted character.',
          solution:
            'function encode(text) {\n  let out = "";\n  for (let ch of text) {\n    out += ch === " " ? " " : String.fromCharCode(ch.charCodeAt(0) + 1);\n  }\n  return out;\n}\n\nconsole.log(encode("salam"));',
          check: (ctx) => all(uses(ctx, /function\s+encode/, 'Keep the function named `encode`.'), said(ctx, 'tbmbn')),
        },
        {
          type: 'code',
          prompt:
            'Now the other half: `decode(text)` shifts every letter back by one.\n\nPrint `decode("tbmbn")`, which should read `salam`.',
          starter: 'function decode(text) {\n  let out = "";\n  \n  return out;\n}\n\n',
          hint: 'Exactly like encode, but subtract 1 instead of adding.',
          solution:
            'function decode(text) {\n  let out = "";\n  for (let ch of text) {\n    out += ch === " " ? " " : String.fromCharCode(ch.charCodeAt(0) - 1);\n  }\n  return out;\n}\n\nconsole.log(decode("tbmbn"));',
          check: (ctx) => all(uses(ctx, /function\s+decode/), said(ctx, 'salam')),
        },
        {
          type: 'bug',
          prompt:
            'This cipher has a bug: it returns an empty string no matter what you give it. Find it.',
          starter:
            'function encode(text) {\n  let out = "";\n  for (let ch of text) {\n    let shifted = String.fromCharCode(ch.charCodeAt(0) + 1);\n  }\n  return out;\n}\n\nconsole.log(encode("abc"));',
          hint: 'The shifted letter is computed... and then thrown away. Nothing is ever added to `out`.',
          solution:
            'function encode(text) {\n  let out = "";\n  for (let ch of text) {\n    out += String.fromCharCode(ch.charCodeAt(0) + 1);\n  }\n  return out;\n}\n\nconsole.log(encode("abc"));',
          check: (ctx) => said(ctx, 'bcd'),
        },
      ],
    },
    {
      id: 'u6l4',
      icon: 'medal',
      title: { en: 'Project: Text Toolkit', ky: 'Долбоор: Текст куралдары' },
      minutes: 15,
      xp: 80,
      blurb: 'Three tools real apps actually ship with.',
      steps: [
        {
          type: 'teach',
          title: 'Searching inside text',
          text:
            '`includes` answers yes or no. `indexOf` tells you where something starts, or `-1` when it is missing. `replace` swaps the first match, `replaceAll` swaps every one. `trim` removes stray spaces at the ends — the bug behind countless broken login forms.',
          code:
            'let msg = "  the yak walks slowly  ";\nconsole.log(msg.trim());\nconsole.log(msg.includes("yak"));\nconsole.log(msg.indexOf("walks"));\nconsole.log(msg.trim().replace("slowly", "fast"));',
        },
        {
          type: 'quiz',
          q: 'A form keeps rejecting the correct password. What is the classic cause?',
          options: [
            'The password is too short',
            'Spaces at the start or end that nobody can see',
            'JavaScript cannot compare strings',
            'The keyboard language',
          ],
          answer: 1,
          why: 'An invisible space makes " secret" different from "secret". Trimming input before comparing fixes it.',
        },
        {
          type: 'code',
          prompt:
            'Tool 1 — a search box. Write `search(list, term)` that returns how many items contain the term.\n\nPrint `search(books, "code")`.',
          starter:
            'let books = ["learn to code", "cooking basics", "code every day", "mountain walks"];\n\nfunction search(list, term) {\n  \n}\n\n',
          hint: 'Count with an accumulator: loop, and add 1 whenever `item.includes(term)`.',
          solution:
            'let books = ["learn to code", "cooking basics", "code every day", "mountain walks"];\n\nfunction search(list, term) {\n  let count = 0;\n  for (let item of list) {\n    if (item.includes(term)) {\n      count += 1;\n    }\n  }\n  return count;\n}\n\nconsole.log(search(books, "code"));',
          check: (ctx) => all(uses(ctx, /function\s+search/), uses(ctx, /includes/, 'Use `includes` to test each item.'), said(ctx, '2')),
        },
        {
          type: 'code',
          prompt:
            'Tool 2 — a username cleaner. Write `clean(text)` that trims the spaces, lowercases it, and replaces every space inside with an underscore.\n\nPrint `clean("  Aisuluu K  ")` — it should read `aisuluu_k`.',
          starter: 'function clean(text) {\n  \n}\n\n',
          hint: 'Chain them: text.trim().toLowerCase().replaceAll(" ", "_")',
          solution:
            'function clean(text) {\n  return text.trim().toLowerCase().replaceAll(" ", "_");\n}\n\nconsole.log(clean("  Aisuluu K  "));',
          check: (ctx) => all(uses(ctx, /function\s+clean/), uses(ctx, /trim/, 'Remember to `trim`.'), said(ctx, 'aisuluu_k')),
        },
        {
          type: 'code',
          prompt:
            'Tool 3 — the finale. Write `summary(text)` that returns a line like:\n\n`4 words, 18 letters, longest: mountain`\n\n(Letters means characters without the spaces.)\n\nTest it on the sentence given.',
          starter: 'let text = "the mountain path is very long";\n\nfunction summary(text) {\n  \n}\n\n',
          hint:
            'Split into words for the count. For letters, join the words back with no glue and take the length. For the longest, loop and keep the biggest.',
          solution:
            'let text = "the mountain path is very long";\n\nfunction summary(text) {\n  let words = text.split(" ");\n  let letters = words.join("").length;\n  let longest = words[0];\n  for (let w of words) {\n    if (w.length > longest.length) {\n      longest = w;\n    }\n  }\n  return `${words.length} words, ${letters} letters, longest: ${longest}`;\n}\n\nconsole.log(summary(text));',
          check: (ctx) =>
            all(
              uses(ctx, /function\s+summary/, 'Write a function named `summary`.'),
              saidContains(ctx, '6 words', 'The sentence has 6 words.'),
              saidContains(ctx, '25 letters', 'Count the characters without spaces.'),
              saidContains(ctx, 'longest: mountain', 'The longest word is `mountain`.'),
            ),
        },
      ],
    },
  ],
};
