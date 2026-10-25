// app.js — Malika Study: a path of lessons, and the lesson you are on.

import { h } from './ui.js';
import * as store from './state.js';
import { lesson as lessonById, numbered } from './lessons/index.js';
import { PathView } from './views/path.js';
import { LessonView } from './views/lesson.js';
import { DoneView, AlbumView } from './views/done.js';
import { canSpeak } from './speak.js';

const root = document.getElementById('app');

function show(node) {
  root.replaceChildren(node);
  window.scrollTo(0, 0);
}

function chrome() {
  const s = store.get();
  document.getElementById('top').replaceChildren(...[
    h('button', { class: 'brand', onclick: home },
      h('span', { class: 'brand-mark' }, 'M'),
      'Malika Study',
    ),
    s.streak > 0 ? h('span', { class: 'streak', title: 'Days in a row' }, '★', String(s.streak)) : null,
  ].filter(Boolean));
}

function home() {
  chrome();
  show(h('div', {},
    PathView({ onStart: start, onAlbum: album }),
    canSpeak()
      ? h('div', { class: 'wrap' },
          h('label', { class: 'setting' },
            h('input', {
              type: 'checkbox', checked: store.get().readAloud,
              onchange: (e) => store.set({ readAloud: e.target.checked }),
            }),
            'Read everything to me',
          ),
        )
      : null,
  ));
}

function album() {
  chrome();
  show(AlbumView({ onBack: home }));
}

function start(id) {
  const l = numbered().find((x) => x.id === id) || lessonById(id);
  if (!l) return home();
  chrome();
  show(LessonView(l, {
    onQuit: home,
    onFinish: ({ lesson: done, answers, right, asked }) => {
      const result = store.finishLesson(done.id, { right, asked });
      chrome();
      show(DoneView({
        lesson: done, answers, right, asked,
        earned: result.earned,
        onNext: start,
        onHome: home,
      }));
    },
  }));
}

home();
