// home.js — the dashboard: where you are, what is next, how the week is going.

import { h, md } from '../ui.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';
import { ALL_LESSONS, nextUpFor, UNITS } from '../data/index.js';
import * as auth from '../auth.js';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeView(go) {
  const s = store.get();
  const week = store.weekProgress();
  const lvl = store.level();
  const streak = store.streak();
  const next = nextUpFor(s.done);
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
        h('span', { class: 'day-dot' }, active ? '🔥' : ''),
      ),
    );
  }

  return h(
    'div',
    { class: 'view home' },
    h(
      'section',
      { class: 'card hero' },
      h('div', { class: 'hero-text' },
        h('h1', {}, s.name ? `${ui('welcome')}, ${s.name}!` : ui('welcome_new')),
        h('p', { class: 'muted' }, ui('tagline')),
      ),
      h('div', { class: 'hero-level' },
        h('div', { class: 'level-emoji' }, lvl.emoji),
        h('div', {},
          h('strong', {}, `${ui('level')} ${lvl.index + 1} · ${lvl.name}`),
          h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${lvl.pct}%` })),
          h('small', { class: 'muted' }, lvl.next ? `${s.xp} / ${lvl.next.xp} ${ui('xp')}` : `${s.xp} ${ui('xp')} — max level 🏔️`),
        ),
      ),
    ),

    h(
      'section',
      { class: 'stat-row' },
      statCard('📚', `${week.count}/${week.goal}`, ui('this_week'), week.pct),
      statCard('🔥', String(streak), ui('streak')),
      statCard('⚡', String(s.xp), ui('xp')),
      statCard('🎯', `${doneCount}/${ALL_LESSONS.length}`, ui('lessons_done')),
    ),

    h('section', { class: 'card' },
      h('h3', {}, '🗓️ ' + ui('this_week')),
      weekDays,
      h('div', { class: 'bar big' }, h('div', { class: 'bar-fill', style: `width:${week.pct}%` })),
      h('p', { class: 'muted' },
        week.count >= week.goal
          ? ui('goal_reached')
          : `${week.goal - week.count} ${ui('keep_going')} — ${ui('goal_note')}`),
    ),

    next
      ? h('section', { class: 'card next-card' },
          h('div', { class: 'next-emoji' }, next.emoji),
          h('div', { class: 'next-body' },
            h('small', { class: 'muted' }, t(next.unitTitle)),
            h('h3', {}, t(next.title)),
            h('p', { class: 'muted' }, t(next.blurb)),
            h('div', { class: 'chips' },
              h('span', { class: 'chip' }, `⏱️ ${next.minutes} min`),
              h('span', { class: 'chip' }, `⚡ ${next.xp} XP`),
              h('span', { class: 'chip' }, `${next.steps.length} steps`),
            ),
          ),
          h('button', { class: 'btn btn-primary', onclick: () => go(`#/lesson/${next.id}`) }, ui('continue') + ' →'),
        )
      : h('section', { class: 'card celebrate' },
          h('div', { class: 'big-emoji' }, '🏔️'),
          h('h2', {}, 'You finished every lesson!'),
          h('p', {}, 'Now the real work: build something of your own in the Code Lab, or beat your best score in Practice.'),
          h('div', { class: 'row gap' },
            h('button', { class: 'btn btn-primary', onclick: () => go('#/lab') }, ui('nav_lab')),
            h('button', { class: 'btn btn-ghost', onclick: () => go('#/practice') }, ui('nav_practice')),
          ),
        ),

    !auth.user()
      ? h('section', { class: 'card save-prompt' },
          h('div', { class: 'big-emoji' }, '☁️'),
          h('div', { class: 'next-body' },
            h('h3', {}, 'Keep your progress safe'),
            h('p', { class: 'muted' }, 'Sign in with Google or an email address and your lessons, streak and XP follow you to any computer.'),
          ),
          h('button', { class: 'btn btn-primary', onclick: () => go('#/account') }, 'Sign in'),
        )
      : null,

    h('section', { class: 'card' },
      h('h3', {}, '🏅 ' + ui('badges')),
      h('div', { class: 'badge-grid' },
        ...store.BADGES.map((b) => {
          const got = s.badges.includes(b.id);
          return h('div', { class: `badge ${got ? 'badge-on' : ''}`, title: b.desc },
            h('span', { class: 'badge-emoji' }, got ? b.emoji : '🔒'),
            h('span', { class: 'badge-name' }, b.name),
          );
        }),
      ),
    ),

    h('section', { class: 'card' },
      h('h3', {}, '🗺️ The road ahead'),
      h('div', { class: 'unit-mini' },
        ...UNITS.map((u) => {
          const total = u.lessons.length;
          const done = u.lessons.filter((l) => s.done[l.id]).length;
          return h('button', { class: 'unit-pill', onclick: () => go('#/journey') },
            h('span', {}, `${u.emoji} ${t(u.title)}`),
            h('small', { class: 'muted' }, `${done}/${total}`),
          );
        }),
      ),
    ),
  );
}

function statCard(emoji, value, label, pct) {
  return h('div', { class: 'card stat' },
    h('div', { class: 'stat-emoji' }, emoji),
    h('div', { class: 'stat-value' }, value),
    h('div', { class: 'stat-label' }, label),
    pct !== undefined ? h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${pct}%` })) : null,
  );
}
