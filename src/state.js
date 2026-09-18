// state.js — everything the learner earns, kept in localStorage.

const BASE_KEY = 'akylduukodo.save.v1';

// Each signed-in account gets its own save file; signed-out learners use the
// plain key, so progress made before signing up is never lost.
let KEY = BASE_KEY;
let cloud = null;
let pushTimer = null;

const DEFAULT = {
  name: '',
  lang: 'en',
  goalPerWeek: 5,        // "5 lessons every week" — changeable in Settings
  xp: 0,
  done: {},              // lessonId -> { at, xp, stars }
  log: [],               // ISO dates of days with at least one finished lesson
  bests: {},             // activityId -> best score
  notes: {},             // noteKey -> { text, title, label, href, at }
  badges: [],
  mode: 'code',          // preferred step mode: 'blocks' | 'code'
  sound: true,
  created: null,

  // look and feel — see prefs.js, which writes these onto <html>
  theme: 'auto',         // 'auto' | 'dark' | 'light'
  motion: 'full',        // 'full' | 'calm'
  textSize: 'normal',    // 'normal' | 'large' | 'xl'
  codeSize: 'md',        // 'sm' | 'md' | 'lg'
};

let state = load();
const listeners = new Set();

// If this save was written under the old key, rewrite it once so the next read
// is already in the current shape.
try {
  const raw = globalThis.localStorage?.getItem(KEY);
  if (raw && raw.includes('"arcade"')) {
    globalThis.localStorage.setItem(KEY, JSON.stringify(state));
  }
} catch {
  /* private mode — nothing to normalise */
}

function load(key = KEY) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return { ...DEFAULT, created: today() };
    const saved = JSON.parse(raw);
    // `arcade` was the old name for this. Carry it over so nobody loses a score.
    if (saved.arcade && !saved.bests) {
      saved.bests = saved.arcade;
      delete saved.arcade;
    }
    return { ...DEFAULT, ...saved };
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
  pushToCloud();
  listeners.forEach((fn) => fn(state));
}

/** Cloud writes are debounced: a burst of XP changes costs one write. */
function pushToCloud() {
  if (!cloud) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    Promise.resolve(cloud.save(state)).catch((err) => console.warn('Cloud save failed:', err.message));
  }, 800);
}

/** Point the save file at an account (or back at the signed-out one). */
export function setProfile(uid, patch = {}) {
  const guest = load(BASE_KEY);
  KEY = uid ? `${BASE_KEY}:${uid}` : BASE_KEY;
  state = load();
  // The very first account created on this device adopts the signed-out
  // progress, so nobody loses the lessons they did before signing up. It is
  // claimed exactly once: on a shared school computer the next person to sign
  // up starts from zero rather than inheriting a classmate's streak.
  const unclaimed = guest.onboarded && !guest.claimedBy;
  if (uid && !state.onboarded && unclaimed) {
    state = { ...guest, ...state, done: { ...guest.done, ...state.done }, onboarded: true };
    state.xp = Math.max(guest.xp || 0, state.xp || 0);
    state.log = [...new Set([...(guest.log || []), ...(state.log || [])])].sort();
    state.badges = [...new Set([...(guest.badges || []), ...(state.badges || [])])];
    state.bests = { ...guest.bests, ...state.bests };
    delete state.claimedBy;
    try {
      globalThis.localStorage?.setItem(BASE_KEY, JSON.stringify({ ...guest, claimedBy: uid }));
    } catch {
      /* nothing to do — worst case the next account also adopts it */
    }
  }
  if (patch.name && !state.name) state.name = patch.name;
  if (uid) state.onboarded = true;
  save();
}

export function setCloud(next) {
  cloud = next;
}

/** Fold a cloud copy into the local one — the more advanced value always wins. */
export function mergeRemote(remote) {
  if (!remote || typeof remote !== 'object') return;
  const done = { ...state.done };
  for (const [id, rec] of Object.entries(remote.done || {})) {
    const mine = done[id];
    done[id] = !mine
      ? rec
      : { ...mine, xp: Math.max(mine.xp || 0, rec.xp || 0), stars: Math.max(mine.stars || 0, rec.stars || 0) };
  }
  const bests = { ...state.bests };
  for (const [id, score] of Object.entries(remote.bests || remote.arcade || {})) {
    bests[id] = Math.max(bests[id] || 0, score || 0);
  }
  state = {
    ...state,
    name: state.name || remote.name || '',
    goalPerWeek: state.goalPerWeek || remote.goalPerWeek || 5,
    xp: Math.max(state.xp || 0, remote.xp || 0),
    done,
    bests,
    log: [...new Set([...(state.log || []), ...(remote.log || [])])].sort(),
    notes: mergeNotes(state.notes, remote.notes),
    badges: [...new Set([...(state.badges || []), ...(remote.badges || [])])],
    onboarded: state.onboarded || remote.onboarded || false,
    created: remote.created || state.created,
  };
  save();
}

/** Two copies of a note: keep the fuller one rather than lose a paragraph. */
function mergeNotes(mine = {}, theirs = {}) {
  const out = { ...mine };
  for (const [key, note] of Object.entries(theirs || {})) {
    const have = out[key];
    if (!have) out[key] = note;
    else if ((note.text || '').length > (have.text || '').length) out[key] = note;
  }
  return out;
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

export function recordBest(activityId, score) {
  const best = state.bests[activityId] || 0;
  const isBest = score > best;
  if (isBest) state.bests[activityId] = score;
  state.xp += Math.round(score / 2);
  const d = today();
  if (!state.log.includes(d)) state.log.push(d);
  const earned = checkBadges();
  save();
  return { isBest, best: state.bests[activityId] || 0, earned };
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
  { xp: 0, name: 'Spark', icon: 'sparkle' },
  { xp: 120, name: 'Tinkerer', icon: 'wand' },
  { xp: 320, name: 'Loop Rider', icon: 'reset' },
  { xp: 640, name: 'Bug Hunter', icon: 'eye' },
  { xp: 1100, name: 'Function Smith', icon: 'puzzle' },
  { xp: 1700, name: 'Data Wrangler', icon: 'layers' },
  { xp: 2500, name: 'Code Nomad', icon: 'rover' },
  { xp: 3600, name: 'Akyl Master', icon: 'mountain' },
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
  { id: 'first-run', icon: 'play', name: 'First Run', desc: 'Finish your very first lesson.', test: (s) => Object.keys(s.done).length >= 1 },
  { id: 'five-a-week', icon: 'calendar', name: 'Weekly Goal', desc: 'Hit your weekly lesson goal.', test: () => weekProgress().count >= state.goalPerWeek },
  { id: 'streak-3', icon: 'flame', name: 'Three in a Row', desc: 'Code three days in a row.', test: () => streak() >= 3 },
  { id: 'streak-7', icon: 'flame', name: 'Week on Fire', desc: 'Code seven days in a row.', test: () => streak() >= 7 },
  { id: 'ten-lessons', icon: 'medal', name: 'Double Digits', desc: 'Finish 10 lessons.', test: (s) => Object.keys(s.done).length >= 10 },
  { id: 'activity-1', icon: 'target', name: 'First Activity', desc: 'Finish any activity.', test: (s) => Object.keys(s.bests).length >= 1 },
  { id: 'boss', icon: 'flame', name: 'Error Slayer', desc: 'Score 600+ in Boss Battle.', test: (s) => (s.bests['boss'] || 0) >= 600 },
  { id: 'level-4', icon: 'eye', name: 'Bug Hunter', desc: 'Reach the Bug Hunter level.', test: (s) => level(s.xp).index >= 3 },
];

/**
 * Award anything that has quietly become true. Badges are normally checked when
 * a lesson or drill ends, but a condition can start holding for another reason
 * — a streak reaching three overnight, say — so any screen that shows them
 * calls this first.
 */
export function refreshBadges() {
  const earned = checkBadges();
  if (earned.length) save();
  return earned;
}

/** Badge ids that were renamed; an old save still counts as earned. */
const BADGE_ALIASES = { 'activity-1': 'arcade' };

function hasBadge(state, id) {
  return state.badges.includes(id) || state.badges.includes(BADGE_ALIASES[id]);
}

function checkBadges() {
  const earned = [];
  for (const b of BADGES) {
    if (hasBadge(state, b.id)) continue;
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
