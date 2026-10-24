// state.js — what Malika has done, kept on the device and synced when it can be.
//
// The device copy is the one that matters: if the network is down mid-task, she
// must still be able to finish, and nothing she has done may be lost.

const KEY = 'malikastudy.v1';

const BLANK = {
  name: 'Malika',
  family: null,          // the code that links her to a dashboard
  streak: 0,
  lastDone: null,        // 'YYYY-MM-DD'
  stickers: 0,
  history: {},           // skill id → { asked, right, accuracy, lastSeen }
  days: {},              // 'YYYY-MM-DD' → { minutes, right, asked, skills: [] }
  results: [],           // finished tasks waiting to be synced
  sound: true,
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

export function get() {
  return state;
}

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

export function doneToday() {
  return state.lastDone === today();
}

/**
 * Record a finished task: the day, the streak, and how she did on each skill.
 * Accuracy is weighted towards recent attempts, so improving shows up quickly.
 */
export function recordTask({ questions, answers, seconds, assignmentId }) {
  const day = today();
  const right = answers.filter((a) => a.right).length;
  const firstTime = answers.filter((a) => a.right && a.tries === 1).length;

  for (const answer of answers) {
    const prev = state.history[answer.skill] || { asked: 0, right: 0, accuracy: 0 };
    const asked = prev.asked + 1;
    const got = prev.right + (answer.tries === 1 && answer.right ? 1 : 0);
    state.history[answer.skill] = {
      asked,
      right: got,
      // recent attempts count for more than old ones
      accuracy: prev.asked ? prev.accuracy * 0.7 + (answer.tries === 1 && answer.right ? 1 : 0) * 0.3 : (answer.tries === 1 && answer.right ? 1 : 0),
      lastSeen: day,
    };
  }

  const was = state.days[day];
  state.days[day] = {
    minutes: (was?.minutes || 0) + Math.round(seconds / 60),
    right: (was?.right || 0) + right,
    asked: (was?.asked || 0) + questions.length,
    skills: [...new Set([...(was?.skills || []), ...questions.map((q) => q.skill)])],
  };

  if (state.lastDone !== day) {
    state.streak = state.lastDone === yesterday() ? state.streak + 1 : 1;
    state.lastDone = day;
  }
  state.stickers += firstTime >= questions.length - 1 ? 2 : 1;

  state.results.push({
    day,
    assignmentId: assignmentId || null,
    seconds,
    asked: questions.length,
    right,
    firstTime,
    answers: answers.map((a) => ({ skill: a.skill, n: a.n, prompt: a.prompt, given: a.given, right: a.right, tries: a.tries })),
    sentAt: null,
  });
  // keep the device copy small; anything synced is already safe on the server
  state.results = state.results.slice(-40);

  save();
  return { right, firstTime, streak: state.streak };
}

/** The last 14 days, oldest first, for the little row of dots on her home screen. */
export function recentDays(count = 14) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = today(d);
    out.push({ day: key, ...(state.days[key] || null) });
  }
  return out;
}
