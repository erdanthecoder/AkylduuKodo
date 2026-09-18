// progress.js — every question the app can answer about how far someone has
// come, worked out in one place.
//
// Nothing here is stored: it is all derived from what the save file already
// holds — which lessons are finished, which days were active, which pages were
// read, which drills were played. That means it is correct for people who were
// already using the app, with nothing to migrate.

import * as store from './state.js';
import { UNITS, ALL_LESSONS, LEVELS } from './data/index.js';
import { DRILLS } from './data/drills.js';
import { CHAPTERS, PAGES } from './data/book/index.js';

const DAY = 86400000;

function isoOf(value) {
  return store.today(new Date(value));
}

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / DAY);
}

/* ------------------------------------------------------------- the course */

/** Headline numbers: how much of the course is done, and what it cost. */
export function courseSummary() {
  const s = store.get();
  const done = s.done || {};
  const finished = ALL_LESSONS.filter((l) => done[l.id]);

  const minutes = finished.reduce((n, l) => n + (l.minutes || 0), 0);
  const minutesTotal = ALL_LESSONS.reduce((n, l) => n + (l.minutes || 0), 0);
  const stars = finished.reduce((n, l) => n + (done[l.id].stars || 0), 0);

  return {
    done: finished.length,
    total: ALL_LESSONS.length,
    pct: ALL_LESSONS.length ? Math.round((finished.length / ALL_LESSONS.length) * 100) : 0,
    minutes,
    minutesTotal,
    stars,
    starsPossible: finished.length * 3,
    xp: s.xp,
    level: store.level(),
  };
}

/** One row per unit: the city, how many lessons are done, and how cleanly. */
export function byUnit() {
  const done = store.get().done || {};
  return UNITS.map((unit) => {
    const finished = unit.lessons.filter((l) => done[l.id]);
    const stars = finished.reduce((n, l) => n + (done[l.id].stars || 0), 0);
    return {
      unit,
      city: unit.city || null,
      level: unit.level,
      done: finished.length,
      total: unit.lessons.length,
      pct: Math.round((finished.length / unit.lessons.length) * 100),
      stars,
      starsPossible: finished.length * 3,
      complete: finished.length === unit.lessons.length,
      started: finished.length > 0,
    };
  });
}

/** The same, gathered into the three difficulty tiers. */
export function byLevel() {
  const units = byUnit();
  return LEVELS.map((level) => {
    const mine = units.filter((u) => u.level === level.id);
    const done = mine.reduce((n, u) => n + u.done, 0);
    const total = mine.reduce((n, u) => n + u.total, 0);
    return {
      ...level,
      units: mine,
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  });
}

/* ------------------------------------------------------------- the habit */

/**
 * One entry per day for the last `days` days, padded backwards to a Monday so
 * the grid lines up in weeks.
 */
export function activity(days = 126) {
  const s = store.get();

  // A day counts as active if anything happened; the number of lessons
  // finished that day is what gives the square its weight.
  const lessonsOn = new Map();
  for (const record of Object.values(s.done || {})) {
    if (!record?.at) continue;
    const iso = isoOf(record.at);
    lessonsOn.set(iso, (lessonsOn.get(iso) || 0) + 1);
  }
  const active = new Set(s.log || []);

  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * DAY);
  // rewind to Monday so every column is a full week
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);

  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
    const date = new Date(t);
    const iso = store.today(date);
    const lessons = lessonsOn.get(iso) || 0;
    out.push({
      iso,
      date,
      lessons,
      active: lessons > 0 || active.has(iso),
      today: iso === store.today(),
      future: false,
    });
  }
  return out;
}

/** The longest run of consecutive active days there has ever been. */
export function longestStreak() {
  const days = [...new Set(store.get().log || [])].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

export function habitSummary() {
  const s = store.get();
  const days = [...new Set(s.log || [])].sort();
  const week = store.weekProgress();
  return {
    current: store.streak(),
    longest: longestStreak(),
    activeDays: days.length,
    firstDay: days[0] || null,
    lastDay: days[days.length - 1] || null,
    week,
  };
}

/* -------------------------------------------------------------- the book */

export function bookSummary() {
  const read = store.get().book?.read || {};
  const chapters = CHAPTERS.map((chapter) => {
    const count = chapter.pages.filter((p) => read[p.id]).length;
    return { id: chapter.id, title: chapter.title, read: count, total: chapter.pages.length };
  });
  const readCount = chapters.reduce((n, c) => n + c.read, 0);
  return {
    read: readCount,
    total: PAGES.length,
    pct: PAGES.length ? Math.round((readCount / PAGES.length) * 100) : 0,
    chapters,
    started: readCount > 0,
    last: store.get().book?.last || null,
  };
}

/* ------------------------------------------------------------ practice */

export function drillSummary() {
  const arcade = store.get().arcade || {};
  return DRILLS.map((drill) => ({
    id: drill.id,
    name: drill.name,
    icon: drill.icon,
    best: arcade[drill.id] || 0,
    played: Boolean(arcade[drill.id]),
  }));
}

/* -------------------------------------------------------------- badges */

export function badgeSummary() {
  const s = store.get();
  return store.BADGES.map((badge) => ({
    ...badge,
    earned: (s.badges || []).includes(badge.id),
  }));
}

/* ----------------------------------------------------------- what is near */

/**
 * The two or three things closest to happening. Each one is something the
 * learner could finish today, so the page always ends with a reason to carry on.
 */
export function milestones() {
  const course = courseSummary();
  const habit = habitSummary();
  const out = [];

  if (habit.week.count < habit.week.goal) {
    const left = habit.week.goal - habit.week.count;
    out.push({
      icon: 'calendar',
      label: 'This week',
      text: `${left} more lesson${left === 1 ? '' : 's'} to hit your goal of ${habit.week.goal}`,
      pct: Math.round((habit.week.count / habit.week.goal) * 100),
      href: '#/journey',
    });
  }

  if (course.level.next) {
    const need = course.level.next.xp - course.xp;
    out.push({
      icon: 'bolt',
      label: `Level ${course.level.index + 2}`,
      text: `${need} XP to ${course.level.next.name}`,
      pct: course.level.pct,
      href: '#/journey',
    });
  }

  const unit = byUnit().find((u) => !u.complete);
  if (unit) {
    const left = unit.total - unit.done;
    out.push({
      icon: 'map',
      label: unit.city ? unit.city.name : 'Next unit',
      text: `${left} lesson${left === 1 ? '' : 's'} left to fly on`,
      pct: unit.pct,
      href: '#/journey',
    });
  }

  const badge = badgeSummary().find((b) => !b.earned);
  if (badge) {
    out.push({ icon: badge.icon, label: badge.name, text: badge.desc, pct: null, href: '#/progress' });
  }

  return out.slice(0, 3);
}

/** "4h 20m", or "35m" — never "260 minutes". */
export function readableMinutes(total) {
  if (!total) return '0m';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}
