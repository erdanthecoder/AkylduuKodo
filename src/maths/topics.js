// topics.js — the Year 3 maths curriculum, as things Malika can practise.
//
// The statutory Year 3 programme of study (England, 2014) in nine units. Each
// unit holds skills, and each skill is one idea narrow enough to practise in a
// few minutes and to mark without ambiguity.
//
// `levels` is how far a skill can stretch: level 1 is the first time she meets
// it, level 3 is secure. The generator for the skill decides what that means
// for its own numbers — see src/maths/gen/.
//
// `says` is the sentence shown to her. It is written for a seven-year-old: no
// word longer than it needs to be, and never the word "cannot".

export const UNITS = [
  {
    id: 'numbers',
    name: 'Big Numbers',
    colour: 'berry',
    icon: 'numbers',
    skills: [
      { id: 'count-steps', name: 'Counting in steps', says: 'Count in 4s, 8s, 50s and 100s.', levels: 3 },
      { id: 'read-write', name: 'Numbers in words', says: 'Read and write numbers up to 1000.', levels: 2 },
      { id: 'partition', name: 'Splitting numbers', says: 'Break a number into hundreds, tens and ones.', levels: 2 },
      { id: 'compare', name: 'Bigger or smaller', says: 'Say which number is bigger.', levels: 3 },
      { id: 'order', name: 'Putting in order', says: 'Put numbers in order, smallest first.', levels: 2 },
      { id: 'more-less', name: '10 and 100 more', says: 'Find 10 or 100 more or less than a number.', levels: 3 },
    ],
  },
  {
    id: 'addsub',
    name: 'Adding and Taking Away',
    colour: 'sky',
    icon: 'plus',
    skills: [
      { id: 'add-mental', name: 'Adding in your head', says: 'Add ones, tens or hundreds in your head.', levels: 3 },
      { id: 'sub-mental', name: 'Taking away in your head', says: 'Take away ones, tens or hundreds in your head.', levels: 3 },
      { id: 'add-column', name: 'Adding in columns', says: 'Add two big numbers, one column at a time.', levels: 3 },
      { id: 'sub-column', name: 'Taking away in columns', says: 'Take away a big number, one column at a time.', levels: 3 },
      { id: 'missing-number', name: 'The missing number', says: 'Find the number that is hiding.', levels: 3 },
      { id: 'estimate', name: 'Good guesses', says: 'Guess the answer before you work it out.', levels: 2 },
    ],
  },
  {
    id: 'tables',
    name: 'Times Tables',
    colour: 'sun',
    icon: 'times',
    skills: [
      { id: 'table-3', name: 'The 3 times table', says: 'Know your 3 times table.', levels: 3 },
      { id: 'table-4', name: 'The 4 times table', says: 'Know your 4 times table.', levels: 3 },
      { id: 'table-8', name: 'The 8 times table', says: 'Know your 8 times table.', levels: 3 },
      { id: 'table-mixed', name: 'All your tables', says: 'Mix up everything you know.', levels: 3 },
      { id: 'divide', name: 'Sharing out', says: 'Divide by 3, 4 and 8.', levels: 3 },
      { id: 'multiply-2digit', name: 'Bigger multiplying', says: 'Multiply a two-digit number.', levels: 3 },
    ],
  },
  {
    id: 'fractions',
    name: 'Fractions',
    colour: 'mint',
    icon: 'fraction',
    skills: [
      { id: 'name-fraction', name: 'Naming fractions', says: 'Say what fraction is shaded.', levels: 2 },
      { id: 'tenths', name: 'Tenths', says: 'Split things into ten equal parts.', levels: 2 },
      { id: 'fraction-of', name: 'Fractions of amounts', says: 'Find a fraction of a number.', levels: 3 },
      { id: 'equivalent', name: 'Fractions that match', says: 'Find fractions worth the same.', levels: 2 },
      { id: 'compare-fractions', name: 'Which fraction is bigger', says: 'Compare fractions with the same bottom number.', levels: 2 },
      { id: 'add-fractions', name: 'Adding fractions', says: 'Add and take away fractions.', levels: 2 },
    ],
  },
  {
    id: 'measuring',
    name: 'Measuring',
    colour: 'grape',
    icon: 'ruler',
    skills: [
      { id: 'length', name: 'Length', says: 'Work with mm, cm and m.', levels: 3 },
      { id: 'mass-capacity', name: 'Heavy and full', says: 'Work with g, kg, ml and litres.', levels: 3 },
      { id: 'perimeter', name: 'All the way round', says: 'Measure the edge all the way round a shape.', levels: 3 },
    ],
  },
  {
    id: 'money',
    name: 'Money',
    colour: 'leaf',
    icon: 'coin',
    skills: [
      { id: 'money-total', name: 'Adding up money', says: 'Add up pounds and pence.', levels: 3 },
      { id: 'money-change', name: 'Giving change', says: 'Work out the change.', levels: 3 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    colour: 'sky',
    icon: 'clock',
    skills: [
      { id: 'clock-read', name: 'Reading a clock', says: 'Read a clock with hands.', levels: 3 },
      { id: 'roman', name: 'Roman numbers', says: 'Read Roman numbers from I to XII.', levels: 2 },
      { id: 'duration', name: 'How long it takes', says: 'Work out how much time has gone by.', levels: 3 },
    ],
  },
  {
    id: 'shapes',
    name: 'Shapes',
    colour: 'berry',
    icon: 'shape',
    skills: [
      { id: 'right-angles', name: 'Right angles', says: 'Spot a right angle and a turn.', levels: 2 },
      { id: 'lines', name: 'Lines', says: 'Find lines that are parallel or perpendicular.', levels: 2 },
      { id: 'shape-props', name: 'Shape facts', says: 'Know your 2D and 3D shapes.', levels: 2 },
    ],
  },
  {
    id: 'charts',
    name: 'Charts',
    colour: 'sun',
    icon: 'chart',
    skills: [
      { id: 'bar-chart', name: 'Bar charts', says: 'Read a bar chart.', levels: 3 },
      { id: 'pictogram', name: 'Picture charts', says: 'Read a chart made of pictures.', levels: 3 },
    ],
  },
];

/** Every skill, flattened, each carrying the unit it belongs to. */
export const SKILLS = UNITS.flatMap((unit) =>
  unit.skills.map((skill) => ({ ...skill, unit: unit.id, unitName: unit.name, colour: unit.colour })),
);

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function skill(id) {
  return SKILL_BY_ID.get(id) || null;
}

export function unit(id) {
  return UNITS.find((u) => u.id === id) || null;
}

/**
 * The order a year typically runs in, so "carry on from where she is" has
 * somewhere sensible to go when nobody has set anything.
 */
export const TEACHING_ORDER = [
  'count-steps', 'read-write', 'partition', 'compare', 'order', 'more-less',
  'add-mental', 'sub-mental', 'add-column', 'sub-column', 'missing-number', 'estimate',
  'table-3', 'table-4', 'table-8', 'divide', 'table-mixed', 'multiply-2digit',
  'name-fraction', 'tenths', 'fraction-of', 'equivalent', 'compare-fractions', 'add-fractions',
  'length', 'mass-capacity', 'perimeter',
  'money-total', 'money-change',
  'clock-read', 'roman', 'duration',
  'right-angles', 'lines', 'shape-props',
  'bar-chart', 'pictogram',
];
