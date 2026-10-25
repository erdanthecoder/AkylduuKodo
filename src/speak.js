// speak.js — reading a question out loud.
//
// A seven-year-old can do the maths in a word problem long before she can read
// the words of it. Reading the question to her removes a barrier that has
// nothing to do with whether she understands the maths.

let voice = null;

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice() {
  if (voice) return voice;
  const all = window.speechSynthesis.getVoices();
  // prefer a British English voice, since the maths is written in it
  voice = all.find((v) => v.lang === 'en-GB' && /female|kate|serena|sonia/i.test(v.name))
    || all.find((v) => v.lang === 'en-GB')
    || all.find((v) => v.lang?.startsWith('en'))
    || null;
  return voice;
}

/** Say something, cancelling anything already being said. */
export function say(text) {
  if (!canSpeak() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const line = new SpeechSynthesisUtterance(readable(text));
    const v = pickVoice();
    if (v) { line.voice = v; line.lang = v.lang; }
    line.rate = 0.92;          // a little slower than default, not babyish
    line.pitch = 1.05;
    window.speechSynthesis.speak(line);
  } catch {
    /* a voice is a help, never a requirement */
  }
}

export function hush() {
  if (canSpeak()) {
    try { window.speechSynthesis.cancel(); } catch { /* nothing to stop */ }
  }
}

/** Maths written for the eye has to be rewritten for the ear. */
export function readable(text) {
  return String(text)
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => fractionWords(Number(a), Number(b)))
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−|-/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ')
    .replace(/</g, ' is less than ')
    .replace(/>/g, ' is greater than ')
    .replace(/£(\d+)\.(\d\d)/g, (_, p, pence) => `${p} pounds ${Number(pence)} ${Number(pence) === 1 ? 'penny' : 'pence'}`)
    .replace(/(\d+)p\b/g, '$1 pence')
    .replace(/\bcm\b/g, 'centimetres').replace(/\bmm\b/g, 'millimetres')
    .replace(/\bml\b/g, 'millilitres').replace(/\bkg\b/g, 'kilograms')
    .replace(/\bg\b/g, 'grams').replace(/\bm\b/g, 'metres')
    .replace(/\s+/g, ' ')
    .trim();
}

const BOTTOM = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth',
  8: 'eighth', 10: 'tenth', 100: 'hundredth' };

function fractionWords(top, bottom) {
  const name = BOTTOM[bottom] || `${bottom}th`;
  if (top === 1) return ` one ${name} `;
  return ` ${top} ${name}s `;
}
