// index.js — the lessons, in the order she meets them.
//
// Every lesson is the same shape, and that shape is the teaching:
//
//   teach    — the idea, said plainly, with a picture. Nothing to answer.
//   show     — one worked example, revealed a step at a time, so she sees
//              somebody do it before she is asked to do it.
//   practice — a few questions of her own, from the generators.
//
// That order matters. The old version went straight to "practice" and called
// it teaching, which is why it taught nothing: being asked a question you were
// never shown how to answer is a test, not a lesson.
//
// Lesson 1 is the starting point. There is always exactly one lesson that is
// next, and the path makes it obvious which.

export const LESSONS = [
  {
    id: 'hto',
    title: 'Hundreds, tens and ones',
    goal: 'Know what each digit in a number means.',
    teach: [
      { say: 'Every digit in a number has its own place. The place tells you what it is worth.',
        visual: { type: 'places', n: 365 } },
      { say: 'In 365, the 3 is three hundreds, the 6 is six tens, and the 5 is five ones. Add them back up and you get 365 again.' },
      { say: 'So the same digit is worth different amounts depending on where it sits. In 300 the 3 means three hundred. In 30 it means thirty.' },
    ],
    show: {
      prompt: 'How many tens are in 472?',
      steps: [
        { say: 'Write it in its places: 4 hundreds, 7 tens, 2 ones.', visual: { type: 'places', n: 472 } },
        { say: 'The tens digit is the middle one. That is the 7.' },
        { say: 'So there are 7 tens in 472.' },
      ],
    },
    practice: { skill: 'partition', level: 1, count: 5 },
  },
  {
    id: 'compare',
    title: 'Which number is bigger',
    goal: 'Compare two numbers up to 1000.',
    teach: [
      { say: 'To compare two numbers, start at the left. Look at the hundreds first.' },
      { say: 'If the hundreds are the same, look at the tens. If those are the same too, look at the ones.' },
      { say: 'We write it with < or >. The open end always faces the bigger number, like a mouth that wants more.' },
    ],
    show: {
      prompt: 'Which is bigger: 418 or 462?',
      steps: [
        { say: 'Hundreds first: both have 4 hundreds. Those are the same, so keep going.' },
        { say: 'Tens next: 1 ten against 6 tens. 6 is more.' },
        { say: 'So 462 is bigger. We write 418 < 462.' },
      ],
    },
    practice: { skill: 'compare', level: 1, count: 5 },
  },
  {
    id: 'more-less',
    title: '10 more and 100 more',
    goal: 'Jump by 10 or 100 without counting one at a time.',
    teach: [
      { say: 'Adding 10 only changes the tens digit. Nothing else moves.',
        visual: { type: 'numberline', from: 340, step: 10, count: 3 } },
      { say: 'Adding 100 only changes the hundreds digit.' },
      { say: 'Taking away works the same way, but the digit goes down instead of up.' },
    ],
    show: {
      prompt: 'What is 10 more than 426?',
      steps: [
        { say: 'Only the tens digit changes. The tens digit is 2.' },
        { say: '2 tens plus 1 ten is 3 tens.' },
        { say: 'So 426 becomes 436.' },
      ],
    },
    practice: { skill: 'more-less', level: 1, count: 5 },
  },
  {
    id: 'count-4s',
    title: 'Counting in 4s',
    goal: 'Count up in 4s without stopping.',
    teach: [
      { say: 'Counting in 4s means adding 4 every time you jump.',
        visual: { type: 'numberline', from: 0, step: 4, count: 4 } },
      { say: 'Lots of things come in 4s — the wheels on a car, the legs on a chair.',
        visual: { type: 'array', rows: 3, cols: 4 } },
      { say: 'Say it out loud until it sounds easy: 4, 8, 12, 16, 20, 24.' },
    ],
    show: {
      prompt: 'Carry on: 12, 16, 20, ?',
      steps: [
        { say: 'Each jump adds 4.', visual: { type: 'numberline', from: 12, step: 4, count: 3 } },
        { say: 'So take the last number and add 4 more: 20 + 4.' },
        { say: '20 + 4 = 24.' },
      ],
    },
    practice: { skill: 'count-steps', level: 1, count: 5 },
  },
  {
    id: 'table-4',
    title: 'The 4 times table',
    goal: 'Know your 4s.',
    teach: [
      { say: '4 x 3 means 3 groups of 4. You can draw it as rows of dots.',
        visual: { type: 'array', rows: 3, cols: 4 } },
      { say: 'To find the answer you can count up in 4s, one jump for each row: 4, 8, 12.' },
      { say: '4 x 3 and 3 x 4 give the same answer. Turning the rows sideways does not change how many dots there are.',
        visual: { type: 'array', rows: 4, cols: 3 } },
    ],
    show: {
      prompt: 'What is 4 x 6?',
      steps: [
        { say: 'That is 6 rows of 4.', visual: { type: 'array', rows: 6, cols: 4 } },
        { say: 'Count up in 4s, six times: 4, 8, 12, 16, 20, 24.' },
        { say: 'So 4 x 6 = 24.' },
      ],
    },
    practice: { skill: 'table-4', level: 1, count: 6 },
  },
  {
    id: 'table-3',
    title: 'The 3 times table',
    goal: 'Know your 3s.',
    teach: [
      { say: '3 x 5 means 5 groups of 3.', visual: { type: 'array', rows: 5, cols: 3 } },
      { say: 'Count up in 3s for each row: 3, 6, 9, 12, 15.' },
      { say: 'The 3s go: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30.' },
    ],
    show: {
      prompt: 'What is 3 x 7?',
      steps: [
        { say: 'Seven rows of 3.', visual: { type: 'array', rows: 7, cols: 3 } },
        { say: 'Count in 3s seven times: 3, 6, 9, 12, 15, 18, 21.' },
        { say: 'So 3 x 7 = 21.' },
      ],
    },
    practice: { skill: 'table-3', level: 1, count: 6 },
  },
  {
    id: 'table-8',
    title: 'The 8 times table',
    goal: 'Know your 8s, using the 4s you already know.',
    teach: [
      { say: '8 is double 4. So every answer in the 8 times table is double the one in the 4 times table.' },
      { say: '4 x 3 = 12, so 8 x 3 = 24. Double 12 is 24.',
        visual: { type: 'array', rows: 3, cols: 8 } },
      { say: 'That means you do not have to learn the 8s from scratch. Do the 4s, then double.' },
    ],
    show: {
      prompt: 'What is 8 x 5?',
      steps: [
        { say: 'Start with the 4 times table: 4 x 5 = 20.' },
        { say: '8 is double 4, so double the answer: 20 + 20.' },
        { say: '8 x 5 = 40.' },
      ],
    },
    practice: { skill: 'table-8', level: 1, count: 6 },
  },
  {
    id: 'divide',
    title: 'Sharing out',
    goal: 'Divide by 3, 4 and 8.',
    teach: [
      { say: 'Dividing is sharing into equal groups. 12 divided by 4 asks: how many 4s fit into 12?',
        visual: { type: 'array', rows: 3, cols: 4 } },
      { say: 'There are 3 rows of 4, so 12 divided by 4 = 3.' },
      { say: 'Dividing undoes multiplying. If you know 4 x 3 = 12, then you already know 12 divided by 4 = 3.' },
    ],
    show: {
      prompt: 'What is 24 divided by 8?',
      steps: [
        { say: 'Ask: how many 8s make 24?' },
        { say: 'Count up in 8s: 8, 16, 24. That took three jumps.' },
        { say: 'So 24 divided by 8 = 3.' },
      ],
    },
    practice: { skill: 'divide', level: 1, count: 5 },
  },
  {
    id: 'add-column',
    title: 'Adding big numbers',
    goal: 'Add two three-digit numbers in columns.',
    teach: [
      { say: 'Line the numbers up so hundreds sit under hundreds, tens under tens, ones under ones.',
        visual: { type: 'columns', a: 243, b: 125, op: '+' } },
      { say: 'Always start on the right, with the ones. Then the tens. Then the hundreds.' },
      { say: 'If a column adds up to 10 or more, carry the ten into the next column along.' },
    ],
    show: {
      prompt: 'What is 243 + 125?',
      steps: [
        { say: 'Ones first: 3 + 5 = 8.', visual: { type: 'columns', a: 243, b: 125, op: '+' } },
        { say: 'Then the tens: 4 + 2 = 6.' },
        { say: 'Then the hundreds: 2 + 1 = 3. The answer is 368.' },
      ],
    },
    practice: { skill: 'add-column', level: 1, count: 5 },
  },
  {
    id: 'sub-column',
    title: 'Taking away big numbers',
    goal: 'Subtract three-digit numbers in columns.',
    teach: [
      { say: 'Line them up the same way, with the bigger number on top.',
        visual: { type: 'columns', a: 586, b: 243, op: '-' } },
      { say: 'Start on the right again: ones, then tens, then hundreds.' },
      { say: 'You can always check a subtraction by adding your answer back on. If it gets you back to where you started, you were right.' },
    ],
    show: {
      prompt: 'What is 586 - 243?',
      steps: [
        { say: 'Ones: 6 - 3 = 3.', visual: { type: 'columns', a: 586, b: 243, op: '-' } },
        { say: 'Tens: 8 - 4 = 4.' },
        { say: 'Hundreds: 5 - 2 = 3. The answer is 343. Check: 343 + 243 = 586.' },
      ],
    },
    practice: { skill: 'sub-column', level: 1, count: 5 },
  },
  {
    id: 'fraction',
    title: 'What a fraction is',
    goal: 'Read a fraction and say what it means.',
    teach: [
      { say: 'A fraction is a way of talking about part of a whole thing.',
        visual: { type: 'bar', parts: 4, filled: 1 } },
      { say: 'The bottom number says how many equal parts the whole was cut into. Here it is 4.' },
      { say: 'The top number says how many of those parts we have. Here it is 1. So this is 1/4 — one quarter.',
        visual: { type: 'bar', parts: 4, filled: 3 } },
      { say: 'And this one is 3/4 — three quarters. Same four parts, but we have three of them.' },
    ],
    show: {
      prompt: 'What fraction is shaded?',
      steps: [
        { say: 'Count all the parts first. There are 5.', visual: { type: 'bar', parts: 5, filled: 2 } },
        { say: 'Now count the shaded ones. There are 2.' },
        { say: 'So it is 2 out of 5, written 2/5.' },
      ],
    },
    practice: { skill: 'name-fraction', level: 1, count: 5 },
  },
  {
    id: 'tenths',
    title: 'Tenths',
    goal: 'Split a whole into ten equal parts.',
    teach: [
      { say: 'When you cut a whole into ten equal parts, each part is one tenth.',
        visual: { type: 'bar', parts: 10, filled: 1 } },
      { say: 'We write one tenth as 1/10.' },
      { say: 'Three of those parts is 3/10 — three tenths.',
        visual: { type: 'bar', parts: 10, filled: 3 } },
    ],
    show: {
      prompt: 'What fraction is shaded?',
      steps: [
        { say: 'The whole is cut into 10 equal parts, so these are tenths.', visual: { type: 'bar', parts: 10, filled: 7 } },
        { say: 'Count the shaded parts: 7.' },
        { say: 'So it is 7/10.' },
      ],
    },
    practice: { skill: 'tenths', level: 1, count: 5 },
  },
  {
    id: 'fraction-of',
    title: 'Fractions of amounts',
    goal: 'Find a fraction of a number.',
    teach: [
      { say: 'To find 1/4 of something, share it into 4 equal piles and take one pile.',
        visual: { type: 'array', rows: 4, cols: 3 } },
      { say: 'Here 12 dots are shared into 4 rows. Each row has 3. So 1/4 of 12 is 3.' },
      { say: 'The bottom number tells you how many piles to make. Dividing is how you make them.' },
    ],
    show: {
      prompt: 'What is 1/3 of 18?',
      steps: [
        { say: 'The bottom number is 3, so share 18 into 3 equal piles.' },
        { say: '18 divided by 3 = 6, so each pile has 6.' },
        { say: 'We want one pile, so 1/3 of 18 = 6.' },
      ],
    },
    practice: { skill: 'fraction-of', level: 1, count: 5 },
  },
  {
    id: 'clock',
    title: 'Telling the time',
    goal: 'Read a clock with hands.',
    teach: [
      { say: 'The short hand points to the hour. The long hand counts the minutes.',
        visual: { type: 'clock', h: 3, m: 0 } },
      { say: 'When the long hand is straight up, it is o\'clock. This says 3 o\'clock.' },
      { say: 'When the long hand is straight down, it is half past. This says half past 3.',
        visual: { type: 'clock', h: 3, m: 30 } },
      { say: 'A quarter of the way round is quarter past. Three quarters of the way round is quarter to the next hour.',
        visual: { type: 'clock', h: 3, m: 15 } },
    ],
    show: {
      prompt: 'What time does this say?',
      steps: [
        { say: 'Find the short hand first. It is just past the 9, so the hour is 9.', visual: { type: 'clock', h: 9, m: 45 } },
        { say: 'Now the long hand. It is three quarters of the way round, pointing at the 9.' },
        { say: 'Three quarters past means quarter to the next hour. So it is quarter to 10.' },
      ],
    },
    practice: { skill: 'clock-read', level: 1, count: 5 },
  },
  {
    id: 'money',
    title: 'Money',
    goal: 'Add up coins and work out change.',
    teach: [
      { say: 'There are 100 pence in a pound. So 100p and £1 are the same thing.',
        visual: { type: 'coins', coins: [100, 50, 20] } },
      { say: 'To add coins up, start with the biggest ones. £1 and 50p and 20p makes £1.70.' },
      { say: 'To find change, count up from what it cost to what you paid.' },
    ],
    show: {
      prompt: 'Something costs 60p. You pay £1. How much change?',
      steps: [
        { say: 'Count up from 60p to £1.' },
        { say: '60p to 70p, 80p, 90p, 100p. That is 4 jumps of 10p.' },
        { say: '4 lots of 10p is 40p. So the change is 40p.' },
      ],
    },
    practice: { skill: 'money-change', level: 1, count: 5 },
  },
  {
    id: 'perimeter',
    title: 'All the way round',
    goal: 'Measure the perimeter of a shape.',
    teach: [
      { say: 'The perimeter is the distance all the way round the outside of a shape.',
        visual: { type: 'rect', w: 5, h: 3 } },
      { say: 'To find it, add up every side. Do not miss any out.' },
      { say: 'For this rectangle: 5 + 3 + 5 + 3 = 16 cm.' },
    ],
    show: {
      prompt: 'What is the perimeter of this rectangle?',
      steps: [
        { say: 'Write down all four sides: 6, 4, 6 and 4.', visual: { type: 'rect', w: 6, h: 4 } },
        { say: 'Add them up: 6 + 4 = 10, and 6 + 4 = 10.' },
        { say: '10 + 10 = 20. So the perimeter is 20 cm.' },
      ],
    },
    practice: { skill: 'perimeter', level: 1, count: 5 },
  },
];

/**
 * The lessons grouped the way the maths itself is grouped. Sixteen rows in a
 * list is a wall; five named parts with their own progress is a course you can
 * see the shape of, and can tell where you are in.
 */
export const UNITS = [
  { id: 'numbers', name: 'Numbers', about: 'Reading, comparing and building numbers up to 1000.',
    colour: 'sky', lessons: ['hto', 'compare', 'more-less'] },
  { id: 'tables', name: 'Times tables', about: 'Counting in steps, then the 3s, 4s and 8s.',
    colour: 'sun', lessons: ['count-4s', 'table-4', 'table-3', 'table-8', 'divide'] },
  { id: 'addsub', name: 'Adding and taking away', about: 'Working with big numbers in columns.',
    colour: 'mint', lessons: ['add-column', 'sub-column'] },
  { id: 'fractions', name: 'Fractions', about: 'Parts of a whole, and parts of an amount.',
    colour: 'grape', lessons: ['fraction', 'tenths', 'fraction-of'] },
  { id: 'world', name: 'Time, money and shape', about: 'The maths you use outside a maths book.',
    colour: 'berry', lessons: ['clock', 'money', 'perimeter'] },
];

export const BY_ID = new Map(LESSONS.map((l, i) => [l.id, { ...l, n: i + 1 }]));

/** Which unit a lesson belongs to, for the label inside the lesson itself. */
export const UNIT_OF = new Map(
  UNITS.flatMap((u) => u.lessons.map((id) => [id, u])),
);

export function lesson(id) {
  return BY_ID.get(id) || null;
}

export function numbered() {
  return LESSONS.map((l, i) => ({ ...l, n: i + 1, unit: UNIT_OF.get(l.id) || null }));
}

/** The units, each carrying its lessons and how far through them she is. */
export function unitsWith(isDone) {
  const all = numbered();
  return UNITS.map((u) => {
    const lessons = u.lessons.map((id) => all.find((l) => l.id === id)).filter(Boolean);
    const done = lessons.filter((l) => isDone(l.id)).length;
    return { ...u, lessons, done, total: lessons.length };
  });
}
