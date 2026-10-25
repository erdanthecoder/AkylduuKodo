// measure.js — length, mass, capacity and perimeter, in the standard units
// Year 3 is expected to use.

import { int, pick, shuffle, distractors } from '../kit.js';

export const length = (r, level) => {
  const mode = level === 1 ? 'convert-cm' : pick(r, ['convert-cm', 'convert-m', 'add', 'compare']);
  if (mode === 'convert-cm') {
    const cm = int(r, 2, 40);
    const toMm = r() < 0.5;
    return toMm
      ? { kind: 'number', prompt: `${cm} cm = ? mm`, suffix: 'mm', answer: String(cm * 10),
          hint: '1 cm is 10 mm.', why: `${cm} × 10 = ${cm * 10} mm.` }
      : { kind: 'number', prompt: `${cm * 10} mm = ? cm`, suffix: 'cm', answer: String(cm),
          hint: '10 mm make 1 cm.', why: `${cm * 10} ÷ 10 = ${cm} cm.` };
  }
  if (mode === 'convert-m') {
    const m = int(r, 2, 9);
    const cm = int(r, 1, 9) * 10;
    return { kind: 'number', prompt: `${m} m and ${cm} cm = ? cm`, suffix: 'cm', answer: String(m * 100 + cm),
      hint: '1 m is 100 cm.', why: `${m} m is ${m * 100} cm. ${m * 100} + ${cm} = ${m * 100 + cm} cm.` };
  }
  if (mode === 'add') {
    const a = int(r, 20, 400);
    const b = int(r, 20, 400);
    return { kind: 'number', prompt: `A ribbon is ${a} cm. Another is ${b} cm. How long are they together?`,
      suffix: 'cm', answer: String(a + b), hint: 'Add the two lengths.', why: `${a} + ${b} = ${a + b} cm.` };
  }
  const m = int(r, 1, 5);
  const cm = int(r, 110, 480);
  const bigger = m * 100 > cm ? `${m} m` : `${cm} cm`;
  return { kind: 'choice', prompt: `Which is longer: ${m} m or ${cm} cm?`, choices: shuffle(r, [`${m} m`, `${cm} cm`]),
    answer: bigger, hint: 'Change them both to cm first.', why: `${m} m is ${m * 100} cm. ${Math.max(m * 100, cm)} cm is more, so ${bigger} is longer.` };
};

export const massCapacity = (r, level) => {
  const liquid = r() < 0.5;
  const unit = liquid ? ['ml', 'litres', 1000] : ['g', 'kg', 1000];
  const mode = level === 1 ? 'convert' : pick(r, ['convert', 'add', 'part']);
  if (mode === 'convert') {
    const big = int(r, 2, 9);
    const small = int(r, 1, 9) * 100;
    return { kind: 'number', prompt: `${big} ${unit[1]} and ${small} ${unit[0]} = ? ${unit[0]}`, suffix: unit[0],
      answer: String(big * 1000 + small), hint: `1 ${liquid ? 'litre' : 'kg'} is 1000 ${unit[0]}.`,
      why: `${big} ${unit[1]} is ${big * 1000} ${unit[0]}. Add ${small}: ${big * 1000 + small} ${unit[0]}.` };
  }
  if (mode === 'add') {
    const a = int(r, 50, 600);
    const b = int(r, 50, 390);
    return { kind: 'number', prompt: liquid
        ? `A jug holds ${a} ml. Another holds ${b} ml. How much altogether?`
        : `One bag weighs ${a} g. Another weighs ${b} g. How much altogether?`,
      suffix: unit[0], answer: String(a + b), hint: 'Add them.', why: `${a} + ${b} = ${a + b} ${unit[0]}.` };
  }
  const total = int(r, 4, 9) * 100;
  const used = int(r, 1, 3) * 100;
  return { kind: 'number', prompt: liquid
      ? `A bottle holds ${total} ml. ${used} ml is poured out. How much is left?`
      : `A bag holds ${total} g of flour. ${used} g is used. How much is left?`,
    suffix: unit[0], answer: String(total - used), hint: 'Take away what has gone.',
    why: `${total} − ${used} = ${total - used} ${unit[0]}.` };
};

export const perimeter = (r, level) => {
  if (level === 1 || r() < 0.4) {
    const w = int(r, 2, 12);
    const h = int(r, 2, 12);
    return {
      kind: 'number',
      prompt: 'What is the perimeter of this rectangle?',
      visual: { type: 'rect', w, h },
      suffix: 'cm',
      answer: String(2 * (w + h)),
      hint: 'Add up all four sides.',
      why: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm. Perimeter is the whole way round.`,
    };
  }
  if (level === 2) {
    const side = int(r, 3, 15);
    return {
      kind: 'number',
      prompt: `A square has sides of ${side} cm. What is its perimeter?`,
      visual: { type: 'rect', w: side, h: side },
      suffix: 'cm',
      answer: String(side * 4),
      hint: 'A square has four equal sides.',
      why: `${side} × 4 = ${side * 4} cm.`,
    };
  }
  // work backwards from the perimeter, which is where it stops being a formula
  const w = int(r, 3, 14);
  const h = int(r, 3, 14);
  return {
    kind: 'number',
    prompt: `A rectangle has a perimeter of ${2 * (w + h)} cm. One side is ${w} cm. How long is the side next to it?`,
    suffix: 'cm',
    answer: String(h),
    hint: 'Two sides are ' + w + ' cm. Take both away first.',
    why: `${2 * (w + h)} − ${w} − ${w} = ${2 * h}. That is the other two sides, so one of them is ${2 * h} ÷ 2 = ${h} cm.`,
  };
};
