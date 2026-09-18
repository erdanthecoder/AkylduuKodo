/**
 * course.js — the lesson content for <AkylduuKodoLesson />.
 *
 * Kept apart from the component so the curriculum can be swapped without
 * touching a line of UI. Every step is one idea, a starter file, and a check
 * that says what is still missing rather than just "wrong".
 */

/** Trimmed, blank lines dropped — so a learner's spacing never fails a check. */
const lines = (logs) => logs.map((l) => l.trim()).filter(Boolean);

export const COURSE = [
  {
    id: 'variables',
    title: 'Variables',
    blurb: 'Naming values so you can use them again.',
    steps: [
      {
        id: 'let-const',
        title: 'Two ways to name a value',
        lede: 'A variable is a name with a value behind it.',
        body: [
          '`let` makes a name you can change later. `const` makes one you cannot. Reach for `const` first — if a value never moves, saying so out loud makes the code easier to read, and the compiler will stop you if you forget.',
          'Both are block-scoped: they exist between the nearest `{` and `}`, and nowhere else.',
        ],
        goal: 'Declare a constant called `city` holding "Bishkek", then print it.',
        starter: `// Declare it, then log it.\nconst city = "";\n\nconsole.log(city);`,
        hint: 'Put Bishkek between the quotes: const city = "Bishkek";',
        solution: "const city = \"Bishkek\";\n\nconsole.log(city);",
        check: ({ logs, code }) => {
          if (!/\bconst\s+city\b/.test(code)) return 'Use `const city = ...` — the name has to be city.';
          if (!lines(logs).includes('Bishkek')) return 'Nothing printed "Bishkek" yet. Check the value and the console.log.';
          return null;
        },
      },
      {
        id: 'types',
        title: 'Values have types',
        lede: 'Text, numbers and true/false behave differently.',
        body: [
          'JavaScript works out the type from the value: `"14"` is text, `14` is a number, `true` is a boolean. The difference matters the moment you use `+`, because adding a number to text glues them together instead of doing arithmetic.',
          '`typeof` tells you what you actually have — the fastest way to explain a surprising result.',
        ],
        goal: 'Print the type of each value: a string, a number and a boolean.',
        starter: `const name = "Aisuluu";\nconst age = 14;\nconst learning = true;\n\nconsole.log(typeof name);\n// add the other two`,
        hint: 'console.log(typeof age); and console.log(typeof learning);',
        solution: "const name = \"Aisuluu\";\nconst age = 14;\nconst learning = true;\n\nconsole.log(typeof name);\nconsole.log(typeof age);\nconsole.log(typeof learning);",
        check: ({ logs }) => {
          const out = lines(logs);
          const want = ['string', 'number', 'boolean'];
          const missing = want.filter((w) => !out.includes(w));
          if (missing.length) return `Still missing: ${missing.join(', ')}. Print typeof for each value.`;
          return null;
        },
      },
      {
        id: 'templates',
        title: 'Building a sentence',
        lede: 'Backticks let you drop values straight into text.',
        body: [
          'A template literal uses backticks instead of quotes, and `${ }` puts a value inside the text. It beats gluing strings with `+` the moment there is more than one value, because you can read the sentence.',
          'Anything can go inside `${ }` — a variable, a sum, a function call.',
        ],
        goal: 'Print exactly: Aisuluu is 14 and codes in Bishkek',
        starter: `const name = "Aisuluu";\nconst age = 14;\nconst city = "Bishkek";\n\nconsole.log(\`\${name} is ...\`);`,
        hint: 'console.log(`${name} is ${age} and codes in ${city}`);',
        solution: "const name = \"Aisuluu\";\nconst age = 14;\nconst city = \"Bishkek\";\n\nconsole.log(`${name} is ${age} and codes in ${city}`);",
        check: ({ logs, code }) => {
          if (!code.includes('${')) return 'Use a template literal with ${ } rather than gluing strings together.';
          if (!lines(logs).includes('Aisuluu is 14 and codes in Bishkek')) {
            return 'Not quite the sentence yet — it should read: Aisuluu is 14 and codes in Bishkek';
          }
          return null;
        },
      },
    ],
  },
  {
    id: 'loops',
    title: 'Loops',
    blurb: 'Doing something many times without writing it many times.',
    steps: [
      {
        id: 'for',
        title: 'The counted loop',
        lede: 'Start, keep-going test, and the step after each pass.',
        body: [
          'A `for` loop gathers the three parts of counting into one line: where to start, when to stop, and what to change each time round. Everything inside the braces runs once per pass.',
          'Counting from 0 and testing with `<` is the habit worth building — it is how arrays are indexed, and it avoids running one pass too many.',
        ],
        goal: 'Print the numbers 1 to 5, one per line.',
        starter: `for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}`,
        hint: 'Change the condition to i <= 5.',
        solution: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
        check: ({ logs }) => {
          const out = lines(logs);
          const want = ['1', '2', '3', '4', '5'];
          if (out.join(',') !== want.join(',')) return `Expected 1 to 5 on their own lines. You printed: ${out.join(', ') || 'nothing'}`;
          return null;
        },
      },
      {
        id: 'accumulate',
        title: 'Keeping a running total',
        lede: 'The shape behind every sum, count and maximum.',
        body: [
          'Declare the total **before** the loop, change it **inside**, and use it **after**. That is the whole pattern, and almost every loop that produces an answer is a version of it.',
          'A sum starts at 0. A product starts at 1. A maximum starts at the first item — never at zero, or a list of negative numbers gives the wrong answer.',
        ],
        goal: 'Add up 1 to 10 and print the total (55).',
        starter: `let total = 0;\n\nfor (let i = 1; i <= 10; i++) {\n  // add i to total\n}\n\nconsole.log(total);`,
        hint: 'total += i; inside the loop.',
        solution: "let total = 0;\n\nfor (let i = 1; i <= 10; i++) {\n  total += i;\n}\n\nconsole.log(total);",
        check: ({ logs }) => {
          if (!lines(logs).includes('55')) return 'The total should come out as 55. Add i to total on each pass.';
          return null;
        },
      },
      {
        id: 'for-of',
        title: 'Every item, no counter',
        lede: 'When you do not care about positions, ask for the items.',
        body: [
          '`for (const item of list)` hands you each element in turn. There is no index to get wrong and no way to run off the end.',
          'Use the counted `for` when the position matters, and `for...of` when it does not — which is most of the time.',
        ],
        goal: 'Print each city in the list, in order.',
        starter: `const cities = ["London", "Rome", "Bishkek"];\n\n// loop over them here`,
        hint: 'for (const city of cities) { console.log(city); }',
        solution: "const cities = [\"London\", \"Rome\", \"Bishkek\"];\n\nfor (const city of cities) {\n  console.log(city);\n}",
        check: ({ logs, code }) => {
          if (!/for\s*\(\s*(const|let)\s+\w+\s+of\s+/.test(code)) return 'Use a for...of loop for this one.';
          const out = lines(logs);
          if (out.join(',') !== 'London,Rome,Bishkek') return `Expected London, Rome, Bishkek in order. You printed: ${out.join(', ') || 'nothing'}`;
          return null;
        },
      },
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    blurb: 'Naming a piece of work so you can do it again.',
    steps: [
      {
        id: 'declare',
        title: 'Your first function',
        lede: 'A name, some inputs, and a value handed back.',
        body: [
          'A function packages work up so it can be run from anywhere, as many times as you like. `return` sends a value back to whoever called it and ends the function there and then.',
          'A function without `return` still runs — it simply answers `undefined`, which is exactly right when its job is to do something rather than to work something out.',
        ],
        goal: 'Write `double(n)` so that double(7) prints 14.',
        starter: `function double(n) {\n  // return twice n\n}\n\nconsole.log(double(7));`,
        hint: 'return n * 2;',
        solution: "function double(n) {\n  return n * 2;\n}\n\nconsole.log(double(7));",
        check: ({ logs }) => {
          if (!lines(logs).includes('14')) return 'double(7) should print 14 — remember to return the value.';
          return null;
        },
      },
      {
        id: 'params',
        title: 'More than one input',
        lede: 'Parameters are matched by position, not by name.',
        body: [
          'The names in the definition are parameters; the values at the call are arguments. They line up in order, which is why swapping two arguments is such an easy mistake and such a quiet one.',
          'Keep the list short. A function with five parameters is usually two functions.',
        ],
        goal: 'Write `greet(name, city)` so it prints: Salam, Aibek from Osh!',
        starter: `function greet(name, city) {\n  return "";\n}\n\nconsole.log(greet("Aibek", "Osh"));`,
        hint: 'return `Salam, ${name} from ${city}!`;',
        solution: "function greet(name, city) {\n  return `Salam, ${name} from ${city}!`;\n}\n\nconsole.log(greet(\"Aibek\", \"Osh\"));",
        check: ({ logs }) => {
          if (!lines(logs).includes('Salam, Aibek from Osh!')) return 'Expected exactly: Salam, Aibek from Osh!';
          return null;
        },
      },
      {
        id: 'arrow',
        title: 'The short form',
        lede: 'Arrow functions, for the small ones.',
        body: [
          'An arrow function is the same idea with less ceremony: `const f = (x) => x * 2`. With a single expression and no braces, the value is returned automatically.',
          'Use them for short helpers and for the functions you hand to `map` and `filter`. Keep the full `function` form when the body has real work in it.',
        ],
        goal: 'Rewrite `square` as an arrow function and print square(9).',
        starter: `// turn this into an arrow function\nfunction square(n) {\n  return n * n;\n}\n\nconsole.log(square(9));`,
        hint: 'const square = (n) => n * n;',
        solution: "const square = (n) => n * n;\n\nconsole.log(square(9));",
        check: ({ logs, code }) => {
          if (!/=>/.test(code)) return 'Use an arrow function: const square = (n) => ...';
          if (/function\s+square/.test(code)) return 'The old function declaration is still there — replace it.';
          if (!lines(logs).includes('81')) return 'square(9) should print 81.';
          return null;
        },
      },
    ],
  },
  {
    id: 'arrays',
    title: 'Arrays',
    blurb: 'Many values under one name.',
    steps: [
      {
        id: 'basics',
        title: 'A list of values',
        lede: 'Indexed from zero, and it knows its own length.',
        body: [
          'An array holds values in order. `list[0]` is the first, `list.length - 1` is the last, and `push` adds to the end.',
          'Reading past the end is not an error in JavaScript — it quietly gives you `undefined`, which is why an off-by-one shows up much later than it happened.',
        ],
        goal: 'Add "Almaty" to the list, then print how many cities there are.',
        starter: `const cities = ["London", "Rome", "Bishkek"];\n\n// add Almaty\n\nconsole.log(cities.length);`,
        hint: 'cities.push("Almaty");',
        solution: "const cities = [\"London\", \"Rome\", \"Bishkek\"];\n\ncities.push(\"Almaty\");\n\nconsole.log(cities.length);",
        check: ({ logs, code }) => {
          if (!/push\s*\(/.test(code)) return 'Use cities.push("Almaty") to add to the end.';
          if (!lines(logs).includes('4')) return 'After adding one city the length should print as 4.';
          return null;
        },
      },
      {
        id: 'map-filter',
        title: 'Transform and select',
        lede: 'map makes a new list; filter keeps some of it.',
        body: [
          '`map` runs a function over every item and gives back a new array of the results — same length, different values. `filter` keeps only the items for which your function answers true.',
          'Neither one changes the original array. That is the point: you can chain them without wondering what has been modified behind your back.',
        ],
        goal: 'Print only the scores above 50, doubled.',
        starter: `const scores = [12, 80, 33, 91, 7];\n\nconst big = scores.filter((n) => n > 50);\nconst doubled = big; // map it\n\nconsole.log(doubled.join(", "));`,
        hint: 'const doubled = big.map((n) => n * 2);',
        solution: "const scores = [12, 80, 33, 91, 7];\n\nconst big = scores.filter((n) => n > 50);\nconst doubled = big.map((n) => n * 2);\n\nconsole.log(doubled.join(\", \"));",
        check: ({ logs, code }) => {
          if (!/\.map\s*\(/.test(code)) return 'Use .map() to double each remaining score.';
          if (!lines(logs).includes('160, 182')) return 'Expected 160, 182 — filter above 50 first, then double.';
          return null;
        },
      },
    ],
  },
  {
    id: 'objects',
    title: 'Objects',
    blurb: 'Values that belong together, with names.',
    steps: [
      {
        id: 'props',
        title: 'Named fields',
        lede: 'When position is not enough, name the parts.',
        body: [
          'An object groups related values under keys: `{ name: "Aisuluu", age: 14 }`. Reach in with a dot — `person.name` — and you can read the code aloud.',
          'Arrays are for many of the same thing. Objects are for one thing with several parts. Most real data is arrays of objects.',
        ],
        goal: 'Print the learner\'s name and city from the object.',
        starter: `const learner = {\n  name: "Aisuluu",\n  city: "Bishkek",\n  streak: 5,\n};\n\nconsole.log(learner.name);\n// print the city too`,
        hint: 'console.log(learner.city);',
        solution: "const learner = {\n  name: \"Aisuluu\",\n  city: \"Bishkek\",\n  streak: 5,\n};\n\nconsole.log(learner.name);\nconsole.log(learner.city);",
        check: ({ logs }) => {
          const out = lines(logs);
          if (!out.includes('Aisuluu') || !out.includes('Bishkek')) return 'Print both learner.name and learner.city.';
          return null;
        },
      },
      {
        id: 'methods',
        title: 'Objects that do something',
        lede: 'A function stored on an object is a method.',
        body: [
          'A value in an object can be a function, and inside it `this` refers to the object it was called on. That is the whole idea behind methods — data and the operations on that data, kept together.',
          'Watch the arrow: a method written as an arrow function does **not** get its own `this`, so use the shorthand form for methods.',
        ],
        goal: 'Add a `summary()` method that returns: Aisuluu — 5 day streak',
        starter: `const learner = {\n  name: "Aisuluu",\n  streak: 5,\n  summary() {\n    return "";\n  },\n};\n\nconsole.log(learner.summary());`,
        hint: 'return `${this.name} — ${this.streak} day streak`;',
        solution: "const learner = {\n  name: \"Aisuluu\",\n  streak: 5,\n  summary() {\n    return `${this.name} \u2014 ${this.streak} day streak`;\n  },\n};\n\nconsole.log(learner.summary());",
        check: ({ logs, code }) => {
          if (!/this\./.test(code)) return 'Use this.name and this.streak inside the method.';
          if (!lines(logs).includes('Aisuluu — 5 day streak')) return 'Expected exactly: Aisuluu — 5 day streak';
          return null;
        },
      },
    ],
  },
];

export const ALL_STEPS = COURSE.flatMap((chapter) =>
  chapter.steps.map((step) => ({ ...step, chapterId: chapter.id, chapterTitle: chapter.title })),
);
