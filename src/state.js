// state.js — everything the learner earns, kept in localStorage.

const KEY = 'akylduukodo.save.v1';

const DEFAULT = {
  name: '',
  lang: 'en',
  goalPerWeek: 5,        // "5 lessons every week" — changeable in Settings
  xp: 0,
  done: {},              // lessonId -> { at, xp, stars }
  log: [],               // ISO dates of days with at least one finished lesson
  arcade: {},            // gameId -> best score
  badges: [],
  mode: 'code',          // preferred step mode: 'blocks' | 'code'
  sound: true,
  created: null,
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return { ...DEFAULT, created: today() };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT, created: today() };
  }
}

export function save() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode — progress just won't persist */
  }
  listeners.forEach((fn) => fn(state));
}

export function get() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function set(patch) {
  state = { ...state, ...patch };
  save();
}

export function reset() {
  state = { ...DEFAULT, created: today() };
  save();
}

export function today(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** Monday-based start of the week for a date. */
export function weekStart(d = new Date()) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Mon = 0
  copy.setDate(copy.getDate() - day);
  return today(copy);
}

export function isDone(lessonId) {
  return Boolean(state.done[lessonId]);
}

export function completeLesson(lessonId, xp, stars = 3) {
  const first = !state.done[lessonId];
  const gained = first ? xp : Math.round(xp * 0.25); // replays give a little
  state.done[lessonId] = {
    at: new Date().toISOString(),
    xp: Math.max(state.done[lessonId]?.xp || 0, xp),
    stars: Math.max(state.done[lessonId]?.stars || 0, stars),
  };
  state.xp += gained;
  const d = today();
  if (!state.log.includes(d)) state.log.push(d);
  const earned = checkBadges();
  save();
  return { gained, first, earned };
}

export function recordArcade(gameId, score) {
  const best = state.arcade[gameId] || 0;
  const isBest = score > best;
  if (isBest) state.arcade[gameId] = score;
  state.xp += Math.round(score / 2);
  const d = today();
  if (!state.log.includes(d)) state.log.push(d);
  const earned = checkBadges();
  save();
  return { isBest, best: state.arcade[gameId] || 0, earned };
}

/** Lessons finished since Monday. */
export function weekProgress() {
  const start = weekStart();
  const count = Object.values(state.done).filter((d) => today(new Date(d.at)) >= start).length;
  return { count, goal: state.goalPerWeek, pct: Math.min(100, Math.round((count / state.goalPerWeek) * 100)) };
}

/** Consecutive days (ending today or yesterday) with activity. */
export function streak() {
  const days = new Set(state.log);
  let n = 0;
  const cursor = new Date();
  if (!days.has(today(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(today(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export const LEVELS = [
  { xp: 0, name: 'Spark', emoji: '✨' },
  { xp: 120, name: 'Tinkerer', emoji: '🔧' },
  { xp: 320, name: 'Loop Rider', emoji: '🔁' },
  { xp: 640, name: 'Bug Hunter', emoji: '🔎' },
  { xp: 1100, name: 'Function Smith', emoji: '⚒️' },
  { xp: 1700, name: 'Data Wrangler', emoji: '📦' },
  { xp: 2500, name: 'Code Nomad', emoji: '🐎' },
  { xp: 3600, name: 'Akyl Master', emoji: '🏔️' },
];

export function level(xp = state.xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.xp - cur.xp : 1;
  return {
    index: idx,
    ...cur,
    next,
    intoLevel: xp - cur.xp,
    span,
    pct: next ? Math.round(((xp - cur.xp) / span) * 100) : 100,
  };
}

export const BADGES = [
  { id: 'first-run', emoji: '🚀', name: 'First Run', desc: 'Finish your very first lesson.', test: (s) => Object.keys(s.done).length >= 1 },
  { id: 'five-a-week', emoji: '🗓️', name: 'Weekly Goal', desc: 'Hit your weekly lesson goal.', test: () => weekProgress().count >= state.goalPerWeek },
  { id: 'streak-3', emoji: '🔥', name: 'Three in a Row', desc: 'Code three days in a row.', test: () => streak() >= 3 },
  { id: 'streak-7', emoji: '☄️', name: 'Week on Fire', desc: 'Code seven days in a row.', test: () => streak() >= 7 },
  { id: 'ten-lessons', emoji: '🎓', name: 'Double Digits', desc: 'Finish 10 lessons.', test: (s) => Object.keys(s.done).length >= 10 },
  { id: 'arcade', emoji: '🕹️', name: 'Arcade Rookie', desc: 'Play any arcade game.', test: (s) => Object.keys(s.arcade).length >= 1 },
  { id: 'maze', emoji: '🐃', name: 'Yak Whisperer', desc: 'Score 300+ in Robot Maze.', test: (s) => (s.arcade['maze'] || 0) >= 300 },
  { id: 'level-4', emoji: '🔎', name: 'Bug Hunter', desc: 'Reach the Bug Hunter level.', test: (s) => level(s.xp).index >= 3 },
];

function checkBadges() {
  const earned = [];
  for (const b of BADGES) {
    if (state.badges.includes(b.id)) continue;
    let ok = false;
    try {
      ok = b.test(state);
    } catch {
      ok = false;
    }
    if (ok) {
      state.badges.push(b.id);
      earned.push(b);
    }
  }
  return earned;
}
