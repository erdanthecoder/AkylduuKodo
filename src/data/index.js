import u1 from './u1.js';
import u2 from './u2.js';
import u3 from './u3.js';
import u4 from './u4.js';
import u5 from './u5.js';
import u6 from './u6.js';
import u7 from './u7.js';

export const UNITS = [u1, u2, u3, u4, u5, u6, u7];

export const ALL_LESSONS = UNITS.flatMap((u) =>
  u.lessons.map((l) => ({ ...l, unitId: u.id, unitIcon: u.icon, unitTitle: u.title })),
);

export function lessonById(id) {
  return ALL_LESSONS.find((l) => l.id === id) || null;
}

export function lessonIndex(id) {
  return ALL_LESSONS.findIndex((l) => l.id === id);
}

export function nextLesson(id) {
  const i = lessonIndex(id);
  return i >= 0 ? ALL_LESSONS[i + 1] || null : null;
}

/** The first lesson the learner has not finished yet. */
export function nextUpFor(done) {
  return ALL_LESSONS.find((l) => !done[l.id]) || null;
}

/** A lesson unlocks when the one before it is finished (the first is always open). */
export function isUnlocked(id, done) {
  const i = lessonIndex(id);
  if (i <= 0) return true;
  return Boolean(done[ALL_LESSONS[i - 1].id]);
}
