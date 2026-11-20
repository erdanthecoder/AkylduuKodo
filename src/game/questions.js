// questions.js — question types, answer checking and scoring.
//
// Pure logic, no DOM, so it is tested directly in Node.
//
// A quiz is stored in two halves:
//   • the public half: question text, options, time and points. Anyone who
//     can see the quiz can see this, and it is what players receive.
//   • the key: the correct answers. Only the quiz's author and signed-in hosts
//     can read it, and it never reaches a player's device — the host's browser
//     marks every answer. Looking at a player's network traffic shows nothing
//     worth copying.

export const TYPES = [
  { id: 'mc', label: 'Multiple choice', icon: 'list', hint: 'One right answer out of up to six.' },
  { id: 'tf', label: 'True or false', icon: 'toggle', hint: 'Two choices.' },
  { id: 'multi', label: 'Pick all that apply', icon: 'multi', hint: 'Several right answers; all must be picked.' },
  { id: 'type', label: 'Type the answer', icon: 'type', hint: 'Players type it; spelling variations you list count.' },
  { id: 'order', label: 'Put in order', icon: 'order', hint: 'Players arrange items into the right order.' },
  { id: 'number', label: 'Number', icon: 'hash', hint: 'A number, with as much leeway as you allow.' },
  { id: 'poll', label: 'Poll', icon: 'chart', hint: 'No right answer, no points. Just opinions.' },
];

export const TYPE_BY_ID = new Map(TYPES.map((t) => [t.id, t]));
export const TIMES = [5, 10, 15, 20, 30, 45, 60, 90, 120];
export const POINTS = [['standard', 'Standard'], ['double', 'Double'], ['none', 'No points']];
export const POINT_BASE = { standard: 1000, double: 2000, none: 0 };

const uid = () => Math.random().toString(36).slice(2, 10);

/** A new, empty question of a type, in the editor's full shape (answer included). */
export function blankQuestion(type = 'mc') {
  const base = { id: uid(), type, text: '', time: 20, points: 'standard' };
  if (type === 'mc') return { ...base, options: ['', '', '', ''], answer: 0 };
  if (type === 'tf') return { ...base, answer: true };
  if (type === 'multi') return { ...base, options: ['', '', '', ''], answer: [0] };
  if (type === 'type') return { ...base, time: 30, answer: [''] };
  if (type === 'order') return { ...base, time: 30, options: ['', '', ''] };
  if (type === 'number') return { ...base, answer: 0, tolerance: 0, unit: '' };
  if (type === 'poll') return { ...base, options: ['', '', '', ''], points: 'none' };
  return base;
}

/** Change a question's type, keeping whatever still makes sense. */
export function retype(q, type) {
  const next = blankQuestion(type);
  next.id = q.id;
  next.text = q.text;
  next.time = q.time;
  if (type !== 'poll') next.points = q.points === 'none' && q.type === 'poll' ? 'standard' : q.points;
  if (q.options && next.options) {
    next.options = q.options.slice(0, 6);
    while (next.options.length < (type === 'order' ? 3 : 2)) next.options.push('');
  }
  return next;
}

const trimmed = (s) => String(s ?? '').trim();

/** '' if the question is ready to play, otherwise what is missing. */
export function problem(q) {
  if (!trimmed(q.text)) return 'Write the question.';
  if (q.text.length > 240) return 'The question is too long (240 characters at most).';
  if (!TIMES.includes(q.time)) return 'Pick a time limit.';
  if (['mc', 'multi', 'poll', 'order'].includes(q.type)) {
    const filled = (q.options || []).map(trimmed).filter(Boolean);
    const need = q.type === 'order' ? 3 : 2;
    if (filled.length < need) return `Add at least ${need} ${q.type === 'order' ? 'items' : 'answers'}.`;
    if (filled.length !== (q.options || []).map(trimmed).length) return 'Fill in or remove the empty answers.';
    if (new Set(filled.map((o) => o.toLowerCase())).size !== filled.length) return 'Two answers are the same.';
    if (filled.some((o) => o.length > 90)) return 'An answer is too long (90 characters at most).';
  }
  if (q.type === 'mc' && !(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)) return 'Mark the right answer.';
  if (q.type === 'multi') {
    if (!Array.isArray(q.answer) || !q.answer.length) return 'Mark at least one right answer.';
    if (q.answer.some((i) => !(i >= 0 && i < q.options.length))) return 'Mark the right answers again.';
  }
  if (q.type === 'tf' && typeof q.answer !== 'boolean') return 'Choose true or false.';
  if (q.type === 'type') {
    const ok = (q.answer || []).map(trimmed).filter(Boolean);
    if (!ok.length) return 'Write the right answer.';
    if (ok.some((a) => a.length > 60)) return 'An accepted answer is too long (60 characters at most).';
  }
  if (q.type === 'number') {
    if (!Number.isFinite(Number(q.answer))) return 'Write the right number.';
    if (!(Number(q.tolerance) >= 0)) return 'The leeway must be zero or more.';
  }
  return '';
}

/* -------------------------------------------------------------- splitting */

/** Shuffle with a seeded generator, so a split is reproducible in tests. */
function shuffled(list, rand = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A question's picture: one of Quickzy's own characters ("blook:fox") or a
 * picture on the web (an https address). Anything else is dropped.
 */
export function cleanPic(v) {
  const s = String(v ?? '').trim();
  if (/^blook:[a-z0-9-]{1,20}$/.test(s)) return s;
  if (s.length <= 500 && /^https:\/\/[^\s"'<>()\\]+$/i.test(s)) {
    try { return new URL(s).protocol === 'https:' ? s : ''; } catch { return ''; }
  }
  return '';
}

/** A YouTube video id from any usual YouTube link (or the id itself). */
export function youTubeId(text) {
  const s = String(text ?? '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

/**
 * A question's video clip: a YouTube video from `start` to `end` seconds.
 * It plays first, stops, and then the question is asked. Up to 10 minutes.
 */
export function cleanVideo(v) {
  if (!v || typeof v !== 'object') return null;
  const id = youTubeId(v.id);
  const start = Math.max(0, Math.floor(Number(v.start) || 0));
  const end = Math.floor(Number(v.end) || 0);
  if (!id || !(end > start) || end - start > 600 || end > 36000) return null;
  return { id, start, end };
}

/** "1:05" or "65" -> 65 seconds. */
export function parseTime(text) {
  const parts = String(text ?? '').trim().split(':').map((x) => Number(x));
  if (!parts.length || parts.some((x) => !Number.isFinite(x) || x < 0)) return NaN;
  return parts.reduce((acc, x) => acc * 60 + x, 0);
}
export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Turn the editor's full questions into the public half and the key.
 * For "order", the public options are shuffled: in the right order they would
 * give the answer away.
 */
export function split(questions, rand = Math.random) {
  const pub = [];
  const key = [];
  for (const q of questions) {
    const p = { id: q.id, type: q.type, text: trimmed(q.text), time: q.time, points: q.type === 'poll' ? 'none' : q.points };
    const pic = cleanPic(q.img);
    if (pic) p.img = pic;
    const clip = cleanVideo(q.video);
    if (clip) p.video = clip;
    let k = null;
    if (q.type === 'mc' || q.type === 'multi' || q.type === 'poll') {
      p.options = q.options.map(trimmed);
      if (q.type === 'mc') k = q.answer;
      if (q.type === 'multi') k = [...new Set(q.answer)].sort((a, b) => a - b);
    }
    if (q.type === 'tf') k = Boolean(q.answer);
    if (q.type === 'type') k = q.answer.map(trimmed).filter(Boolean);
    if (q.type === 'order') {
      const items = q.options.map(trimmed);
      let order = shuffled(items.map((_, i) => i), rand);
      // never publish the items already in the right order
      if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
      p.options = order.map((i) => items[i]);
      // k[n] = which shown option belongs in position n
      k = items.map((_, correctPos) => order.indexOf(correctPos));
    }
    if (q.type === 'number') {
      k = { value: Number(q.answer), tolerance: Math.max(0, Number(q.tolerance) || 0) };
      if (trimmed(q.unit)) p.unit = trimmed(q.unit).slice(0, 12);
    }
    pub.push(p);
    key.push(k);
  }
  return { pub, key };
}

/** The reverse: rebuild the editor's full questions from the two halves. */
export function join(pub, key) {
  return pub.map((p, i) => {
    const k = key ? key[i] : null;
    const q = { id: p.id || uid(), type: p.type, text: p.text, time: p.time, points: p.points };
    if (cleanPic(p.img)) q.img = cleanPic(p.img);
    if (cleanVideo(p.video)) q.video = cleanVideo(p.video);
    if (p.type === 'mc') Object.assign(q, { options: [...p.options], answer: k ?? 0 });
    if (p.type === 'multi') Object.assign(q, { options: [...p.options], answer: k ? [...k] : [0] });
    if (p.type === 'poll') Object.assign(q, { options: [...p.options] });
    if (p.type === 'tf') q.answer = k ?? true;
    if (p.type === 'type') q.answer = k ? [...k] : [''];
    if (p.type === 'order') q.options = k ? k.map((shownIndex) => p.options[shownIndex]) : [...p.options];
    if (p.type === 'number') Object.assign(q, { answer: k ? k.value : 0, tolerance: k ? k.tolerance : 0, unit: p.unit || '' });
    return q;
  });
}

/* --------------------------------------------------------------- marking */

/** Forgiving comparison for typed answers: case, accents, spacing, punctuation. */
export function normaliseText(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mark one answer. Returns { correct, poll, display } — display is the right
 * answer written out, for showing after the question.
 */
export function check(pub, key, choice) {
  const t = pub.type;
  if (t === 'poll') return { correct: false, poll: true, display: '' };
  if (t === 'mc') return { correct: Number(choice) === key, display: pub.options[key] };
  if (t === 'tf') return { correct: Boolean(choice) === key && typeof choice === 'boolean', display: key ? 'True' : 'False' };
  if (t === 'multi') {
    const picked = Array.isArray(choice) ? [...new Set(choice.map(Number))].sort((a, b) => a - b) : [];
    return {
      correct: picked.length === key.length && picked.every((v, i) => v === key[i]),
      display: key.map((i) => pub.options[i]).join(', '),
    };
  }
  if (t === 'type') {
    const said = normaliseText(choice);
    return { correct: Boolean(said) && key.some((a) => normaliseText(a) === said), display: key[0] };
  }
  if (t === 'order') {
    const got = Array.isArray(choice) ? choice.map(Number) : [];
    return {
      correct: got.length === key.length && got.every((v, i) => v === key[i]),
      display: key.map((i) => pub.options[i]).join(' → '),
    };
  }
  if (t === 'number') {
    const n = Number(String(choice ?? '').replace(',', '.'));
    return {
      correct: String(choice ?? '').trim() !== '' && Number.isFinite(n) && Math.abs(n - key.value) <= key.tolerance + 1e-9,
      display: `${key.value}${pub.unit ? ` ${pub.unit}` : ''}${key.tolerance ? ` (± ${key.tolerance})` : ''}`,
    };
  }
  return { correct: false, display: '' };
}

/** Is `choice` a well-formed answer for this question at all? */
export function validChoice(pub, choice) {
  const n = (pub.options || []).length;
  if (pub.type === 'mc' || pub.type === 'poll') return Number.isInteger(choice) && choice >= 0 && choice < n;
  if (pub.type === 'tf') return typeof choice === 'boolean';
  if (pub.type === 'multi') return Array.isArray(choice) && choice.length > 0 && choice.length <= n && choice.every((c) => Number.isInteger(c) && c >= 0 && c < n);
  if (pub.type === 'order') return Array.isArray(choice) && choice.length === n && new Set(choice).size === n && choice.every((c) => Number.isInteger(c) && c >= 0 && c < n);
  if (pub.type === 'type' || pub.type === 'number') return typeof choice === 'string' && choice.length <= 80;
  return false;
}

/* --------------------------------------------------------------- scoring */

/**
 * Points for one answer.
 *   speed on  — a right answer earns between half and all of the base, the
 *               faster the more; the very first instant gets all of it.
 *   speed off — every right answer earns the full base.
 * A streak adds 100 per answer in a row beyond the first, up to +500,
 * scaled with the question's points.
 */
export function points({ correct, elapsedMs, limitS, kind = 'standard', speed = true, streak = 1 }) {
  const base = POINT_BASE[kind] ?? 1000;
  if (!correct || !base) return 0;
  let p = base;
  if (speed) {
    const frac = Math.min(1, Math.max(0, elapsedMs / (limitS * 1000)));
    p = Math.round(base * (1 - frac / 2));
  }
  const bonus = Math.min(Math.max(streak - 1, 0), 5) * 100 * (base / 1000);
  return p + bonus;
}
