// task.js — turn "ten minutes on the 4 times table and tenths" into a paper.
//
// A task is built from a seed, so the same assignment makes the same questions
// on Malika's tablet and on the dashboard. Nothing is stored question by
// question; the seed is the paper.

import { rng, seedFrom, shuffle } from './kit.js';
import { GENERATORS } from './index.js';
import { SKILL_BY_ID, TEACHING_ORDER } from './topics.js';

/** A seven-year-old needs about half a minute a question, reading included. */
export function questionCount(minutes) {
  return Math.max(4, Math.min(18, Math.round(minutes * 1.8)));
}

/**
 * Build the questions for an assignment.
 *
 * @param {object} spec
 * @param {Array<{id: string, level?: number}>} spec.skills what to practise
 * @param {number} spec.minutes how long it should take
 * @param {string} spec.seed    anything stable — usually the assignment id
 */
export function buildTask({ skills, minutes = 5, seed = 'today' }) {
  const wanted = questionCount(minutes);
  const r = rng(seedFrom(seed));
  const chosen = (skills || []).filter((s) => GENERATORS[s.id]);
  if (!chosen.length) throw new Error('a task needs at least one skill');

  // deal the questions round-robin, so every skill gets a fair share
  const order = [];
  while (order.length < wanted) {
    for (const s of shuffle(r, chosen)) {
      if (order.length >= wanted) break;
      order.push(s);
    }
  }

  const questions = [];
  const seen = new Set();
  order.forEach((spec_, i) => {
    const meta = SKILL_BY_ID.get(spec_.id);
    const level = Math.max(1, Math.min(meta?.levels || 3, spec_.level || 1));
    let q = null;
    // a repeated question inside one short task feels like a mistake, so try again
    for (let tries = 0; tries < 12; tries++) {
      const made = GENERATORS[spec_.id](r, level);
      if (!seen.has(made.prompt + (made.statement || ''))) {
        q = made;
        break;
      }
    }
    if (!q) q = GENERATORS[spec_.id](r, level);
    seen.add(q.prompt + (q.statement || ''));
    questions.push({
      ...q,
      n: i + 1,
      skill: spec_.id,
      skillName: meta?.name || spec_.id,
      level,
    });
  });

  return { questions, minutes, seed, skills: chosen };
}

/**
 * What to practise when nobody has set anything: the next thing in the year,
 * plus two older skills to keep warm. Spacing beats cramming at this age.
 */
export function suggestSkills(history = {}, howMany = 3) {
  const done = new Set(Object.keys(history));
  const next = TEACHING_ORDER.find((id) => !done.has(id)) || TEACHING_ORDER[0];

  // the weakest thing she has met before is the one worth revisiting
  const seen = TEACHING_ORDER.filter((id) => done.has(id) && id !== next);
  seen.sort((a, b) => (history[a]?.accuracy ?? 1) - (history[b]?.accuracy ?? 1));

  const out = [{ id: next, level: 1 }];
  for (const id of seen) {
    if (out.length >= howMany) break;
    const acc = history[id]?.accuracy ?? 0;
    out.push({ id, level: acc > 0.9 ? 3 : acc > 0.7 ? 2 : 1 });
  }
  // a brand new learner has no history, so fill from the start of the year
  for (const id of TEACHING_ORDER) {
    if (out.length >= howMany) break;
    if (!out.some((s) => s.id === id)) out.push({ id, level: 1 });
  }
  return out.slice(0, howMany);
}
