// progress.js (view) — the overview.
//
// The page answers four questions in order: how far am I, what is closest to
// happening, how steady have I been, and where exactly did the time go.

import { h } from '../ui.js';
import { icon } from '../icons.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';
import {
  courseSummary, byLevel, activity, habitSummary, bookSummary,
  drillSummary, badgeSummary, milestones, readableMinutes,
} from '../progress.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS_SHOWN = 26;

/** "11 Aug 2026" — the same in every locale, and never 8/11/2026. */
function shortDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
const SVG = 'http://www.w3.org/2000/svg';

function svg(name, attrs = {}) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** A ring is the one place a percentage deserves to be a picture. */
function ring(pct, { size = 132, stroke = 10 } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const box = svg('svg', { viewBox: `0 0 ${size} ${size}`, class: 'ring', width: size, height: size });
  box.append(
    svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', class: 'ring-track', 'stroke-width': stroke }),
    svg('circle', {
      cx: size / 2, cy: size / 2, r, fill: 'none', class: 'ring-fill',
      'stroke-width': stroke, 'stroke-linecap': 'round',
      'stroke-dasharray': `${(c * pct) / 100} ${c}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }),
  );
  return box;
}

function bar(pct, cls = '') {
  return h('span', { class: `bar ${cls}` }, h('span', { class: 'bar-fill', style: `width:${Math.max(0, Math.min(100, pct))}%` }));
}

function readout(label, value, note) {
  return h('div', { class: 'readout' },
    h('span', { class: 'readout-label' }, label),
    h('span', { class: 'readout-value' }, value),
    note ? h('span', { class: 'readout-note' }, note) : null,
  );
}

/* ------------------------------------------------------------- the top */

function overview() {
  const course = courseSummary();
  const habit = habitSummary();
  const book = bookSummary();

  return h('section', { class: 'card overview' },
    h('div', { class: 'overview-ring' },
      ring(course.pct),
      h('div', { class: 'overview-ring-text' },
        h('strong', {}, `${course.pct}%`),
        h('span', {}, 'of the course'),
      ),
    ),
    h('div', { class: 'overview-grid' },
      readout('Lessons finished', `${course.done} / ${course.total}`,
        course.done ? `${course.stars} of ${course.starsPossible} stars` : 'Nothing yet — start anywhere'),
      readout('Experience', `${course.xp} XP`,
        course.level.next
          ? `Level ${course.level.index + 1} · ${course.level.name} — ${course.level.next.xp - course.xp} to go`
          : `Level ${course.level.index + 1} · ${course.level.name} — top level`),
      readout('Streak', `${habit.current} day${habit.current === 1 ? '' : 's'}`,
        habit.longest ? `Longest run: ${habit.longest} days` : 'Come back tomorrow to start one'),
      readout('Time on lessons', readableMinutes(course.minutes),
        `of about ${readableMinutes(course.minutesTotal)} in the whole course`),
      readout('Handbook', `${book.read} / ${book.total} pages`,
        book.started ? `${book.pct}% read` : 'Not opened yet'),
      readout('Active days', String(habit.activeDays),
        habit.firstDay ? `Since ${shortDate(habit.firstDay)}` : 'Today is day one'),
    ),
  );
}

function upNext(go) {
  const items = milestones();
  if (!items.length) return null;
  return h('section', { class: 'card next-up' },
    h('h2', { class: 'card-title' }, 'Closest to done'),
    h('div', { class: 'next-grid' },
      ...items.map((m) =>
        h('button', { class: 'next-tile', onclick: () => go(m.href) },
          h('span', { class: 'next-tile-head' },
            h('span', { class: 'next-tile-mark' }, icon(m.icon, { size: 15 })),
            h('span', { class: 'next-tile-label' }, m.label),
          ),
          h('p', {}, m.text),
          m.pct === null ? null : bar(m.pct, 'bar-thin'),
        ),
      ),
    ),
  );
}

/* ------------------------------------------------------------ activity */

function heatmap() {
  const days = activity(WEEKS_SHOWN * 7);
  const habit = habitSummary();

  // days come back Monday-aligned, so seven at a time is one column
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const grid = h('div', { class: 'heat-grid' });
  const months = h('div', { class: 'heat-months' });

  let lastMonth = -1;
  weeks.forEach((week) => {
    const first = week[0];
    const month = first.date.getMonth();
    const label = h('span', { class: 'heat-month' });
    if (month !== lastMonth && first.date.getDate() <= 7) {
      label.textContent = MONTHS[month];
      lastMonth = month;
    }
    months.append(label);

    const column = h('div', { class: 'heat-week' });
    week.forEach((day) => {
      const weight = !day.active ? 0 : Math.min(4, day.lessons + 1);
      const cell = h('span', {
        class: `heat-day heat-${weight}${day.today ? ' heat-today' : ''}`,
        title: `${day.iso} — ${day.lessons ? `${day.lessons} lesson${day.lessons === 1 ? '' : 's'}` : day.active ? 'active' : 'nothing'}`,
      });
      column.append(cell);
    });
    grid.append(column);
  });

  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title' }, 'Activity'),
      h('span', { class: 'muted small' }, `The last ${WEEKS_SHOWN} weeks`),
    ),
    h('div', { class: 'heat-layout' },
      h('div', { class: 'heat-main' },
        h('div', { class: 'heat-scroll' },
          h('div', { class: 'heat-inner' }, months, grid),
        ),
        h('div', { class: 'heat-legend' },
          h('span', { class: 'muted small' }, 'Quieter'),
          ...[0, 1, 2, 3, 4].map((n) => h('span', { class: `heat-day heat-${n}` })),
          h('span', { class: 'muted small' }, 'Busier'),
        ),
      ),
      h('div', { class: 'heat-side' },
        readout('Current streak', `${habit.current} day${habit.current === 1 ? '' : 's'}`),
        readout('Longest run', `${habit.longest} day${habit.longest === 1 ? '' : 's'}`),
        readout('Active days', String(habit.activeDays)),
        readout('This week', `${habit.week.count} / ${habit.week.goal}`),
      ),
    ),
  );
}

/* -------------------------------------------------------------- course */

function courseBreakdown(go) {
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title' }, 'The course, unit by unit'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => go('#/journey') }, 'Open the journey'),
    ),
    ...byLevel().map((level) =>
      h('div', { class: 'tier' },
        h('div', { class: 'tier-head' },
          h('span', { class: `level-chip level-${level.id}-chip` }, level.label),
          h('span', { class: 'muted small' }, `${level.done} of ${level.total} lessons`),
          bar(level.pct, 'bar-thin tier-bar'),
        ),
        h('div', { class: 'unit-rows' },
          ...level.units.map((u) =>
            h('button', {
              class: 'unit-row' + (u.complete ? ' is-complete' : '') + (u.started ? '' : ' is-untouched'),
              onclick: () => go('#/journey'),
            },
              h('span', { class: 'unit-row-mark' }, icon(u.complete ? 'check' : u.unit.icon, { size: 16 })),
              h('span', { class: 'unit-row-text' },
                h('span', { class: 'unit-row-city' }, u.city ? `${u.city.name}, ${u.city.country}` : ''),
                h('span', { class: 'unit-row-title' }, t(u.unit.title)),
              ),
              h('span', { class: 'unit-row-count' }, `${u.done}/${u.total}`),
              h('span', { class: 'unit-row-stars' },
                u.done ? icon('star', { size: 12 }) : null,
                u.done ? `${u.stars}/${u.starsPossible}` : '',
              ),
              bar(u.pct, 'bar-thin unit-row-bar'),
            ),
          ),
        ),
      ),
    ),
  );
}

/* --------------------------------------------------- book, drills, badges */

function handbook(go) {
  const book = bookSummary();
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title' }, 'The handbook'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => go(book.last ? `#/book/${book.last}` : '#/book') },
        book.started ? 'Continue reading' : 'Open the book'),
    ),
    h('div', { class: 'handbook-top' },
      h('strong', {}, `${book.read} of ${book.total} pages`),
      bar(book.pct, 'bar-thin'),
    ),
    h('div', { class: 'chapter-grid' },
      ...book.chapters.map((c, i) =>
        h('div', { class: 'chapter-row' + (c.read === c.total ? ' is-complete' : '') },
          h('span', { class: 'chapter-num' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'chapter-name' }, c.title),
          h('span', { class: 'chapter-count' }, `${c.read}/${c.total}`),
        ),
      ),
    ),
  );
}

function practice(go) {
  const drills = drillSummary();
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title' }, 'Practice bests'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => go('#/practice') }, 'Open practice'),
    ),
    h('div', { class: 'drill-rows' },
      ...drills.map((d) =>
        h('div', { class: 'drill-row' + (d.played ? '' : ' is-untouched') },
          h('span', { class: 'drill-row-mark' }, icon(d.icon, { size: 16 })),
          h('span', { class: 'drill-row-name' }, d.name),
          h('span', { class: 'drill-row-best' }, d.played ? `${d.best}` : 'not played'),
        ),
      ),
    ),
  );
}

function badges() {
  const all = badgeSummary();
  const earned = all.filter((b) => b.earned).length;
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title' }, ui('badges')),
      h('span', { class: 'muted small' }, `${earned} of ${all.length}`),
    ),
    h('div', { class: 'badge-rows' },
      ...all.map((b) =>
        h('div', { class: 'badge-row' + (b.earned ? ' is-earned' : '') },
          h('span', { class: 'badge-row-mark' }, icon(b.earned ? b.icon : 'lock', { size: 16 })),
          h('span', { class: 'badge-row-text' },
            h('strong', {}, b.name),
            h('span', { class: 'muted small' }, b.desc),
          ),
          b.earned ? h('span', { class: 'badge-row-tick' }, icon('check', { size: 14 })) : null,
        ),
      ),
    ),
  );
}

/* ---------------------------------------------------------------- view */

export function ProgressView(go) {
  // Anything that became true while the learner was elsewhere is awarded now,
  // so a badge is never shown locked when its condition already holds.
  store.refreshBadges();
  const s = store.get();
  return h('div', { class: 'view progress-view' },
    h('h1', { class: 'view-title' }, 'Progress'),
    h('p', { class: 'muted view-lede' },
      s.name ? `Everything you have done, ${s.name}, and what is closest to happening next.`
             : 'Everything you have done, and what is closest to happening next.'),
    overview(),
    upNext(go),
    heatmap(),
    courseBreakdown(go),
    handbook(go),
    practice(go),
    badges(),
  );
}
