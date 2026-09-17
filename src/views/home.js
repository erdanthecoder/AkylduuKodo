// home.js — the dashboard: where you are, what is next, how the week is going.

import { h } from '../ui.js';
import { icon, mascot } from '../icons.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';
import { nextUpFor, UNITS, ALL_LESSONS } from '../data/index.js';
import { PAGES } from '../data/book/index.js';
import { bookProgress } from './book.js';
import { noteCount } from '../notes.js';
import * as auth from '../auth.js';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeView(go) {
  const s = store.get();
  const week = store.weekProgress();
  const lvl = store.level();
  const streak = store.streak();
  const next = nextUpFor(s.done);
  const lessonNumber = next ? ALL_LESSONS.findIndex((l) => l.id === next.id) + 1 : 0;
  const doneCount = Object.keys(s.done).length;

  const weekDays = h('div', { class: 'week-strip' });
  const start = new Date(store.weekStart());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = store.today(d);
    const active = s.log.includes(iso);
    const isToday = iso === store.today();
    weekDays.append(
      h(
        'div',
        { class: `day ${active ? 'day-on' : ''} ${isToday ? 'day-today' : ''}`, title: iso },
        h('span', { class: 'day-letter' }, DAY_LETTERS[i]),
        h('span', { class: 'day-num' }, String(d.getDate())),
        h('span', { class: 'day-dot' }, active ? icon('flame', { size: 15 }) : ''),
      ),
    );
  }

  return h(
    'div',
    { class: 'view home' },
    h(
      'section',
      { class: 'card hero' },
      h('div', { class: 'hero-mascot' }, mascot(110, 'happy')),
      h('div', { class: 'hero-text' },
        h('h1', {}, s.name ? `${ui('welcome')}, ${s.name}!` : ui('welcome_new')),
        h('p', { class: 'muted' }, ui('tagline')),
      ),
      h('div', { class: 'hero-level' },
        h('div', { class: 'level-mark' }, icon(lvl.icon, { size: 30 })),
        h('div', {},
          h('strong', {}, `${ui('level')} ${lvl.index + 1} · ${lvl.name}`),
          h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${lvl.pct}%` })),
          h('small', { class: 'muted' }, lvl.next ? `${s.xp} / ${lvl.next.xp} ${ui('xp')}` : `${s.xp} ${ui('xp')} — top level`),
        ),
      ),
    ),

    h(
      'section',
      { class: 'stat-row' },
      statCard('calendar', `${week.count}/${week.goal}`, ui('this_week'), week.pct),
      statCard('flame', String(streak), ui('streak')),
      statCard('bolt', String(s.xp), ui('xp')),
      statCard('check', String(doneCount), ui('lessons_done')),
    ),

    h('section', { class: 'card' },
      h('h3', {}, ui('this_week')),
      weekDays,
      h('div', { class: 'bar big' }, h('div', { class: 'bar-fill', style: `width:${week.pct}%` })),
      h('p', { class: 'muted' },
        week.count >= week.goal
          ? ui('goal_reached')
          : `${week.goal - week.count} ${ui('keep_going')} — ${ui('goal_note')}`),
    ),

    next
      ? h('section', { class: 'card next-card' },
          h('div', { class: 'next-mark' }, icon(next.icon, { size: 26 })),
          h('div', { class: 'next-body' },
            h('small', { class: 'muted' }, `${t(next.unitTitle)} · Lesson ${lessonNumber}`),
            h('h3', {}, t(next.title)),
            h('p', { class: 'muted' }, t(next.blurb)),
            h('div', { class: 'chips' },
              h('span', { class: 'chip' }, icon('clock', { size: 13 }), `${next.minutes} min`),
              h('span', { class: 'chip' }, icon('bolt', { size: 13 }), `${next.xp} XP`),
              h('span', { class: 'chip' }, `${next.steps.length} steps`),
            ),
          ),
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/lesson/${next.id}`) }, ui('continue') + ' →'),
        )
      : h('section', { class: 'card celebrate' },
          h('div', { class: 'big-mark' }, icon('mountain', { size: 48 })),
          h('h2', {}, 'You finished every lesson!'),
          h('p', {}, 'Now the real work: build something of your own in the Code Lab, or beat your best score in Practice.'),
          h('div', { class: 'row gap' },
            h('button', { class: 'btn btn-primary', onclick: () => go('#/lab') }, ui('nav_lab')),
            h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
          ),
        ),

    // The handbook sits right under the next lesson: it is the thing to reach
    // for the moment a lesson raises a question.
    (() => {
      const bp = bookProgress();
      const last = s.book?.last;
      return h('section', { class: 'card book-promo' },
        h('div', { class: 'promo-mark' }, icon('book', { size: 28 })),
        h('div', { class: 'next-body' },
          h('small', { class: 'muted' }, 'The handbook'),
          h('h3', {}, 'C++ from the beginning'),
          h('p', { class: 'muted' },
            bp.count
              ? `You have read ${bp.count} of ${bp.total} pages. Pick up where you stopped.`
              : `Every part of the language, one idea to a page — ${PAGES.length} of them, in order.`),
          h('div', { class: 'chips' },
            h('span', { class: 'chip' }, icon('book', { size: 13 }), `${PAGES.length} pages`),
            h('span', { class: 'chip' }, icon('pencil', { size: 13 }), `${noteCount()} notes`),
          ),
        ),
        h('button', {
          class: 'btn btn-primary',
          onclick: () => go(last ? `#/book/${last}` : '#/book'),
        }, bp.count ? 'Continue reading' : 'Open the book'),
      );
    })(),

    !auth.user()
      ? h('section', { class: 'card save-prompt' },
          h('div', { class: 'big-mark' }, icon('cloud', { size: 34 })),
          h('div', { class: 'next-body' },
            h('h3', {}, 'Keep your progress safe'),
            h('p', { class: 'muted' }, 'Sign in with Google or an email address and your lessons, streak and XP follow you to any computer.'),
          ),
          h('button', { class: 'btn btn-primary', onclick: () => go('#/account') }, 'Sign in'),
        )
      : null,

    h('section', { class: 'card' },
      h('h3', {}, ui('badges')),
      h('div', { class: 'badge-grid' },
        ...store.BADGES.map((b) => {
          const got = s.badges.includes(b.id);
          return h('div', { class: `badge ${got ? 'badge-on' : ''}`, title: b.desc },
            h('span', { class: 'badge-mark' }, icon(got ? b.icon : 'lock', { size: 22 })),
            h('span', { class: 'badge-name' }, b.name),
          );
        }),
      ),
    ),

    h('section', { class: 'card' },
      h('h3', {}, 'The road ahead'),
      h('div', { class: 'unit-mini' },
        ...UNITS.map((u) => {
          const total = u.lessons.length;
          const done = u.lessons.filter((l) => s.done[l.id]).length;
          return h('button', { class: 'unit-pill', onclick: () => go('#/journey') },
            h('span', { class: 'unit-pill-name' }, icon(u.icon, { size: 17 }), t(u.title)),
            h('span', { class: 'mini-bar' }, h('span', { class: 'mini-bar-fill', style: `width:${Math.round((done / total) * 100)}%` })),
          );
        }),
      ),
    ),
  );
}

function statCard(name, value, label, pct) {
  return h('div', { class: 'card stat' },
    h('div', { class: 'stat-mark' }, icon(name, { size: 20 })),
    h('div', { class: 'stat-value' }, value),
    h('div', { class: 'stat-label' }, label),
    pct !== undefined ? h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${pct}%` })) : null,
  );
}
