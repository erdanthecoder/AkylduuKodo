// kit.js — the small tools every question generator needs.
//
// The random number generator is seeded on purpose. A task built from the same
// seed is the same task on every device, so the dashboard can show exactly the
// questions Malika was given, and "try it again" really is the same paper.

/** mulberry32: tiny, fast, and the same sequence everywhere. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn any string into a seed, so an assignment id can seed its own paper. */
export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function int(r, lo, hi) {
  return lo + Math.floor(r() * (hi - lo + 1));
}

export function pick(r, list) {
  return list[Math.floor(r() * list.length)];
}

export function shuffle(r, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A few distinct wrong answers near the right one, so guessing does not pay. */
export function distractors(r, answer, { count = 3, spread = 10, min = 0, whole = true } = {}) {
  const seen = new Set([answer]);
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 200) {
    const step = int(r, 1, spread) * (r() < 0.5 ? -1 : 1);
    let value = answer + step;
    if (whole) value = Math.round(value);
    if (value < min) continue;
    const key = String(value);
    if (seen.has(value) || seen.has(key)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/* ------------------------------------------------------------------ words */

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0–1000 in words, the way a Year 3 book writes them. */
export function words(n) {
  if (n === 1000) return 'one thousand';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (!rest) return `${ONES[h]} hundred`;
  return `${ONES[h]} hundred and ${words(rest)}`;
}

/* ------------------------------------------------------------------ money */

/** 350 → "£3.50", 7 → "7p" — written the way the question should read. */
export function money(pence) {
  if (pence < 100) return `${pence}p`;
  return `£${(pence / 100).toFixed(2)}`;
}

/** Always in pounds, for an answer box that wears a £ sign. */
export function pounds(pence) {
  return (pence / 100).toFixed(2);
}

/* ------------------------------------------------------------------- time */

export function clockWords(h, m) {
  const hour12 = ((h + 11) % 12) + 1;
  const next = (hour12 % 12) + 1;
  if (m === 0) return `${hour12} o'clock`;
  if (m === 15) return `quarter past ${hour12}`;
  if (m === 30) return `half past ${hour12}`;
  if (m === 45) return `quarter to ${next}`;
  if (m < 30) return `${m} minutes past ${hour12}`;
  return `${60 - m} minutes to ${next}`;
}

export function hhmm(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/* -------------------------------------------------------------- fractions */

export function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

/** "3/4" as the answer box wants it, with no spaces to trip the marking. */
export function frac(top, bottom) {
  return `${top}/${bottom}`;
}

/* ----------------------------------------------------------------- names */

/** Names Malika will recognise, used in word problems. */
export const NAMES = ['Malika', 'Aisuluu', 'Bek', 'Nuriza', 'Timur', 'Aida', 'Elnur', 'Saule'];
export const THINGS = [
  { one: 'apple', many: 'apples' },
  { one: 'sticker', many: 'stickers' },
  { one: 'pencil', many: 'pencils' },
  { one: 'marble', many: 'marbles' },
  { one: 'button', many: 'buttons' },
  { one: 'conker', many: 'conkers' },
  { one: 'shell', many: 'shells' },
  { one: 'bead', many: 'beads' },
];

export function plural(n, thing) {
  return `${n} ${n === 1 ? thing.one : thing.many}`;
}
