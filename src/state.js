// state.js — what Malika has done. On the device, and nowhere else.
//
// There is no account and no server. Everything lives in this browser, which
// is the whole of the privacy story: nothing about a seven-year-old leaves her
// tablet.

import { stickerIndex } from './stickers.js';

const KEY = 'malikastudy.v2';

const BLANK = {
  name: 'Malika',
  done: [],              // lesson ids finished, in the order she finished them
  streak: 0,
  lastDone: null,        // 'YYYY-MM-DD'
  album: [],             // sticker indexes earned
  days: {},              // 'YYYY-MM-DD' → { lessons, right, asked }
  sound: true,
  readAloud: false,
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...BLANK };
    return { ...BLANK, ...JSON.parse(raw) };
  } catch {
    return { ...BLANK };
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* a full disk must not stop her working */
  }
}

export function get() { return state; }

export function set(patch) {
  state = { ...state, ...patch };
  save();
  return state;
}

export function today(d = new Date()) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return today(d);
}

export function isDone(lessonId) {
  return state.done.includes(lessonId);
}

/** Finishing a lesson: mark it, keep the streak, earn a sticker. */
export function finishLesson(lessonId, { right, asked }) {
  const day = today();
  if (!state.done.includes(lessonId)) state.done = [...state.done, lessonId];

  const was = state.days[day];
  state.days[day] = {
    lessons: (was?.lessons || 0) + 1,
    right: (was?.right || 0) + right,
    asked: (was?.asked || 0) + asked,
  };

  if (state.lastDone !== day) {
    state.streak = state.lastDone === yesterday() ? state.streak + 1 : 1;
    state.lastDone = day;
  }

  const earned = [stickerIndex(day, state.album.length)];
  if (right === asked && asked > 0) earned.push(stickerIndex(day, state.album.length + 1));
  state.album = [...state.album, ...earned];

  save();
  return { earned, streak: state.streak };
}

export function recentDays(count = 7) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = today(d);
    out.push({ day: key, ...(state.days[key] || null) });
  }
  return out;
}
