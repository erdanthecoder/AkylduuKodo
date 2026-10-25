// shapedata.js — angles, lines, shape properties, and reading charts.

import { int, pick, shuffle } from '../kit.js';

const SHAPES_2D = [
  { name: 'triangle', sides: 3, corners: 3, right: 0 },
  { name: 'square', sides: 4, corners: 4, right: 4 },
  { name: 'rectangle', sides: 4, corners: 4, right: 4 },
  { name: 'pentagon', sides: 5, corners: 5, right: 0 },
  { name: 'hexagon', sides: 6, corners: 6, right: 0 },
  { name: 'octagon', sides: 8, corners: 8, right: 0 },
];

const SHAPES_3D = [
  { name: 'cube', faces: 6, edges: 12, vertices: 8 },
  { name: 'cuboid', faces: 6, edges: 12, vertices: 8 },
  { name: 'square-based pyramid', faces: 5, edges: 8, vertices: 5 },
  { name: 'triangular prism', faces: 5, edges: 9, vertices: 6 },
  { name: 'cylinder', faces: 3, edges: 2, vertices: 0 },
];

export const rightAngles = (r, level) => {
  if (level === 1 || r() < 0.5) {
    const turns = pick(r, [1, 2, 3, 4]);
    const names = { 1: 'a quarter turn', 2: 'a half turn', 3: 'three quarters of a turn', 4: 'a whole turn' };
    return {
      kind: 'number',
      prompt: `How many right angles are there in ${names[turns]}?`,
      answer: String(turns),
      hint: 'A quarter turn is one right angle.',
      why: `${names[turns]} is ${turns} right angle${turns === 1 ? '' : 's'}. Four right angles make a whole turn.`,
    };
  }
  const shape = pick(r, SHAPES_2D);
  return {
    kind: 'number',
    prompt: `How many right angles does a ${shape.name} have?`,
    answer: String(shape.right),
    hint: 'A right angle is a square corner.',
    why: `A ${shape.name} has ${shape.right} right angle${shape.right === 1 ? '' : 's'}.`,
  };
};

export const lines = (r) => {
  const parallel = r() < 0.5;
  return {
    kind: 'choice',
    prompt: parallel
      ? 'Which pair of lines is parallel?'
      : 'Which pair of lines is perpendicular?',
    visual: { type: 'lines', want: parallel ? 'parallel' : 'perpendicular' },
    choices: ['A', 'B', 'C'],
    answer: 'A',
    hint: parallel ? 'Parallel lines never meet.' : 'Perpendicular lines meet at a right angle.',
    why: parallel
      ? 'Parallel lines stay the same distance apart for ever, so they never cross.'
      : 'Perpendicular lines cross and make a square corner — a right angle.',
  };
};

export const shapeProps = (r, level) => {
  if (level === 1 || r() < 0.5) {
    const shape = pick(r, SHAPES_2D);
    const ask = pick(r, ['sides', 'corners']);
    return {
      kind: 'number',
      prompt: `How many ${ask} does a ${shape.name} have?`,
      answer: String(shape[ask]),
      hint: 'Picture it, then count round.',
      why: `A ${shape.name} has ${shape[ask]} ${ask}.`,
    };
  }
  const shape = pick(r, SHAPES_3D);
  const ask = pick(r, ['faces', 'edges', 'vertices']);
  return {
    kind: 'number',
    prompt: `How many ${ask} does a ${shape.name} have?`,
    answer: String(shape[ask]),
    hint: ask === 'vertices' ? 'Vertices are the corners.' : ask === 'faces' ? 'Faces are the flat sides.' : 'Edges are where two faces meet.',
    why: `A ${shape.name} has ${shape[ask]} ${ask}.`,
  };
};

/* ------------------------------------------------------------------ charts */

const CHART_SETS = [
  { title: 'Favourite fruit', labels: ['Apples', 'Pears', 'Plums', 'Figs'] },
  { title: 'Books read this month', labels: ['Mon', 'Tue', 'Wed', 'Thu'] },
  { title: 'Pets in our class', labels: ['Cats', 'Dogs', 'Fish', 'Birds'] },
  { title: 'Goals scored', labels: ['Reds', 'Blues', 'Greens', 'Yellows'] },
];

function chartData(r, level, step) {
  const set = pick(r, CHART_SETS);
  const values = set.labels.map(() => int(r, 1, level === 1 ? 6 : 10) * step);
  return { ...set, values, step };
}

export const barChart = (r, level) => {
  const step = level === 3 ? pick(r, [2, 5]) : 1;
  const data = chartData(r, level, step);
  const mode = level === 1 ? 'read' : pick(r, ['read', 'most', 'difference', 'total']);
  const max = Math.max(...data.values);
  const min = Math.min(...data.values);
  const which = int(r, 0, data.labels.length - 1);
  const visual = { type: 'bars', ...data };
  if (mode === 'read') {
    return { kind: 'number', prompt: `Look at the chart. How many for ${data.labels[which]}?`, visual,
      answer: String(data.values[which]), hint: 'Follow the bar across to the numbers.',
      why: `The bar for ${data.labels[which]} reaches ${data.values[which]}.` };
  }
  if (mode === 'most') {
    return { kind: 'choice', prompt: 'Which one has the most?', visual, choices: shuffle(r, data.labels),
      answer: data.labels[data.values.indexOf(max)], hint: 'Find the tallest bar.',
      why: `${data.labels[data.values.indexOf(max)]} has ${max}, the tallest bar.` };
  }
  if (mode === 'difference') {
    return { kind: 'number', prompt: 'How many more does the biggest have than the smallest?', visual,
      answer: String(max - min), hint: 'Take the smallest away from the biggest.',
      why: `The biggest is ${max} and the smallest is ${min}. ${max} − ${min} = ${max - min}.` };
  }
  const total = data.values.reduce((a, b) => a + b, 0);
  return { kind: 'number', prompt: 'How many are there altogether?', visual, answer: String(total),
    hint: 'Add every bar.', why: `${data.values.join(' + ')} = ${total}.` };
};

export const pictogram = (r, level) => {
  const each = level === 1 ? 1 : pick(r, [2, 5, 10]);
  const set = pick(r, CHART_SETS);
  const counts = set.labels.map(() => int(r, 1, 6));
  const which = int(r, 0, set.labels.length - 1);
  const visual = { type: 'picto', title: set.title, labels: set.labels, counts, each };
  if (r() < 0.6) {
    return {
      kind: 'number',
      prompt: `Each picture stands for ${each}. How many for ${set.labels[which]}?`,
      visual,
      answer: String(counts[which] * each),
      hint: `Count the pictures, then multiply by ${each}.`,
      why: `There are ${counts[which]} pictures and each one is ${each}, so ${counts[which]} × ${each} = ${counts[which] * each}.`,
    };
  }
  const total = counts.reduce((a, b) => a + b, 0) * each;
  return {
    kind: 'number',
    prompt: `Each picture stands for ${each}. How many altogether?`,
    visual,
    answer: String(total),
    hint: 'Count every picture first.',
    why: `${counts.reduce((a, b) => a + b, 0)} pictures × ${each} = ${total}.`,
  };
};
