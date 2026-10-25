// app.js — Malika's app: three screens and the thread between them.

import { h } from './ui.js';
import * as store from './state.js';
import * as cloud from './cloud.js';
import { buildTask, suggestSkills } from './maths/task.js';
import { TodayView, AlbumView } from './views/today.js';
import { TaskView } from './views/task.js';
import { DoneView } from './views/done.js';

const root = document.getElementById('app');
let assignment = null;

function show(node) {
  root.replaceChildren(node);
  window.scrollTo(0, 0);
}

function chrome() {
  const s = store.get();
  const bar = document.getElementById('top');
  // replaceChildren turns a null into the text "null", so filter first
  bar.replaceChildren(...[
    h('div', { class: 'brand' },
      h('span', { class: 'brand-mark' }, 'M'),
      'Malika Study',
    ),
    s.streak > 0
      ? h('span', { class: 'streak', title: 'Days in a row' }, '★', String(s.streak))
      : null,
  ].filter(Boolean));
}

/* ------------------------------------------------------------------ screens */

function home() {
  chrome();
  const s = store.get();
  const skills = assignment?.skills?.length ? assignment.skills : suggestSkills(s.history);
  const minutes = assignment?.minutes || 5;
  show(TodayView({
    assignment,
    skills,
    minutes,
    onStart: () => start(skills, minutes, assignment?.id || store.today()),
    onExtra: () => start(suggestSkills(s.history), 3, `extra-${Date.now()}`),
    onAlbum: album,
  }));
}

function album() {
  chrome();
  show(AlbumView({ onBack: home }));
}

function start(skills, minutes, seed) {
  const task = buildTask({ skills, minutes, seed });
  show(TaskView(task, {
    onQuit: home,
    onFinish: ({ questions, answers, seconds }) => {
      const result = store.recordTask({
        questions, answers, seconds,
        assignmentId: assignment?.id || null,
      });
      push();
      show(DoneView({
        questions, answers,
        result,
        onHome: home,
        onAgain: () => start(suggestSkills(store.get().history), 3, `extra-${Date.now()}`),
      }));
    },
  }));
}

/** Send anything waiting, quietly. Never blocks her. */
function push() {
  const s = store.get();
  cloud.syncResults(s.family, s.results, (sent) => {
    sent.sentAt = Date.now();
    store.save();
  }).catch(() => {});
}

/* -------------------------------------------------------------------- start */

async function boot() {
  chrome();
  home();                       // show something immediately, network or not
  const s = store.get();
  if (!s.family) return;
  try {
    const found = await cloud.todaysAssignment(s.family, store.today());
    if (found && !store.doneToday()) {
      assignment = found;
      home();
    }
    push();
  } catch {
    /* offline is a normal day; the device copy is enough */
  }
}

// a family code can be handed over as a link, so nobody has to type it
const fromLink = new URLSearchParams(location.search).get('family');
if (fromLink) {
  store.set({ family: fromLink.trim().toLowerCase() });
  history.replaceState(null, '', location.pathname);
}

boot();
