// import.js — turn a quiz written by an AI chatbot into Quickzy questions.
//
// Quickzy hands the person a prompt asking for one exact JSON shape. They
// paste it into ChatGPT, Claude or Gemini, and paste the reply back. The
// reader below is forgiving about how chatbots really answer: code fences,
// chatter before and after, trailing commas, smart quotes, an answer given
// as "B" or as the option's text. Every question is then checked with the
// same rules as the editor; anything that cannot be fixed is skipped and
// reported, never silently changed.

import { blankQuestion, problem, TIMES } from './questions.js';

export const LEVELS = [['kids', 'Kids (7–11)'], ['teens', 'Teens (12–16)'], ['adults', 'Adults']];

/** The prompt to paste into an AI chatbot. */
export function aiPrompt({ topic, count = 10, level = 'kids', language = 'English' }) {
  const who = { kids: 'children aged 7 to 11', teens: 'teenagers aged 12 to 16', adults: 'adults' }[level] || 'children aged 7 to 11';
  return `Write a quiz about "${topic}" for ${who}, in ${language}.

Make exactly ${count} questions. Mix these question types, mostly "mc":
- "mc": multiple choice, 4 options, one right answer
- "tf": true or false
- "multi": 4 options, two or more right answers
- "type": the player types a short answer (one or two words)
- "order": 3 to 5 items the player puts in order
- "number": the answer is a number

Rules:
- Every fact must be correct and not disputed. Avoid trick questions.
- Questions at most 200 characters, options at most 60 characters.
- Do not repeat the answer inside the question.

Reply with ONLY this JSON, no other text:

{
  "title": "Quiz title",
  "description": "One sentence about the quiz",
  "questions": [
    { "type": "mc", "question": "…?", "options": ["…", "…", "…", "…"], "answer": 0 },
    { "type": "tf", "question": "…", "answer": true },
    { "type": "multi", "question": "…?", "options": ["…", "…", "…", "…"], "answers": [0, 2] },
    { "type": "type", "question": "…?", "accept": ["main answer", "other spelling"] },
    { "type": "order", "question": "Put these in order from … to …", "items": ["first", "second", "third"] },
    { "type": "number", "question": "How many …?", "answer": 8 }
  ]
}

"answer" and "answers" are positions in "options", counting from 0. For "order", list "items" in the CORRECT order.`;
}

/* --------------------------------------------------------------- reading */

/** Find the JSON object in a chatbot's reply and parse it, forgivingly. */
export function extractJSON(text) {
  let t = String(text || '')
    .replace(/[“”„″]/g, '"')      // smart double quotes
    .replace(/[‘’]/g, "'")
    .replace(/ /g, ' ');
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1];
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No quiz found in what you pasted. Paste the whole reply from the AI.');
  let body = t.slice(start, end + 1);
  try { return JSON.parse(body); } catch { /* try fixing common slips */ }
  body = body.replace(/,\s*([}\]])/g, '$1');            // trailing commas
  try { return JSON.parse(body); } catch {
    throw new Error('The pasted text is not complete. Ask the AI to "reply with only the JSON", then paste all of it.');
  }
}

const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const nearestTime = (t, fallback) => {
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return TIMES.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
};

/** An answer given as 1, "1", "B", "b)" or the option's own text, as a position. */
function toIndex(answer, options) {
  if (typeof answer === 'number' && Number.isInteger(answer)) {
    if (answer >= 0 && answer < options.length) return answer;
    return null;
  }
  const a = String(answer ?? '').trim();
  if (/^\d+$/.test(a)) return toIndex(Number(a), options);
  const letter = a.match(/^([a-fA-F])[).:]?$/);
  if (letter) return letter[1].toUpperCase().charCodeAt(0) - 65 < options.length ? letter[1].toUpperCase().charCodeAt(0) - 65 : null;
  const byText = options.findIndex((o) => o.toLowerCase() === a.toLowerCase());
  return byText >= 0 ? byText : null;
}

const TYPE_NAMES = {
  mc: 'mc', multiple_choice: 'mc', 'multiple-choice': 'mc', choice: 'mc', quiz: 'mc',
  tf: 'tf', true_false: 'tf', 'true-false': 'tf', truefalse: 'tf', boolean: 'tf',
  multi: 'multi', multiple: 'multi', checkbox: 'multi', select_all: 'multi',
  type: 'type', text: 'type', short: 'type', short_answer: 'type', typed: 'type', input: 'type',
  order: 'order', ordering: 'order', sequence: 'order', sort: 'order', puzzle: 'order',
  number: 'number', numeric: 'number', slider: 'number',
  poll: 'poll', survey: 'poll', opinion: 'poll',
};

/** One question from the AI into the editor's full form, or a reason it can't be. */
function convert(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'not a question' };
  const type = TYPE_NAMES[String(raw.type || 'mc').toLowerCase().replace(/\s+/g, '_')] || null;
  if (!type) return { error: `unknown type "${raw.type}"` };
  const q = blankQuestion(type);
  q.text = clean(raw.question ?? raw.text ?? raw.q, 240);
  q.time = nearestTime(raw.time, q.time);
  const opts = (list) => (Array.isArray(list) ? list.map((o) => clean(typeof o === 'object' && o ? o.text : o, 90)).filter(Boolean).slice(0, 6) : []);

  if (type === 'mc' || type === 'poll') {
    q.options = opts(raw.options ?? raw.choices);
    if (type === 'mc') {
      const i = toIndex(raw.answer ?? raw.correct ?? raw.correctAnswer, q.options);
      if (i === null) return { error: 'its right answer is not one of the options' };
      q.answer = i;
    }
  } else if (type === 'tf') {
    const a = raw.answer ?? raw.correct;
    const s = String(a).trim().toLowerCase();
    if (a === true || ['true', 'yes', 't', 'correct'].includes(s)) q.answer = true;
    else if (a === false || ['false', 'no', 'f', 'incorrect'].includes(s)) q.answer = false;
    else return { error: 'it is not marked true or false' };
  } else if (type === 'multi') {
    q.options = opts(raw.options ?? raw.choices);
    const given = raw.answers ?? raw.answer ?? raw.correct;
    const list = (Array.isArray(given) ? given : [given]).map((a) => toIndex(a, q.options));
    if (!list.length || list.some((i) => i === null)) return { error: 'its right answers are not among the options' };
    q.answer = [...new Set(list)].sort((a, b) => a - b);
  } else if (type === 'type') {
    const acc = raw.accept ?? raw.answers ?? raw.answer;
    q.answer = (Array.isArray(acc) ? acc : [acc]).map((a) => clean(a, 60)).filter(Boolean).slice(0, 5);
    if (!q.answer.length) return { error: 'it has no answer' };
  } else if (type === 'order') {
    q.options = opts(raw.items ?? raw.order ?? raw.options);
  } else if (type === 'number') {
    const n = Number(String(raw.answer ?? '').replace(',', '.'));
    if (!Number.isFinite(n)) return { error: 'its answer is not a number' };
    q.answer = n;
    q.tolerance = Math.max(0, Number(raw.tolerance) || 0);
    q.unit = clean(raw.unit, 12);
  }
  const p = problem(q);
  return p ? { error: p.replace(/\.$/, '').toLowerCase() } : { question: q };
}

/**
 * Read a pasted reply. Returns { title, description, questions, skipped },
 * where skipped lists "Question 4: why" for anything left out.
 */
export function readAIQuiz(text) {
  const data = extractJSON(text);
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list) || !list.length) throw new Error('The pasted quiz has no questions.');
  const questions = [];
  const skipped = [];
  list.slice(0, 100).forEach((raw, i) => {
    const r = convert(raw);
    if (r.question) questions.push(r.question); else skipped.push(`Question ${i + 1}: ${r.error}`);
  });
  return {
    title: clean(Array.isArray(data) ? '' : data.title, 80),
    description: clean(Array.isArray(data) ? '' : data.description, 280),
    questions,
    skipped,
  };
}
