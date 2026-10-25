// today.js — what Malika sees when she opens the site.
//
// One job above all: start today's task. Everything else on the page is there
// to make coming back tomorrow feel worth it — the week so far, the stickers
// she has collected, and Ilbirs, who is pleased to see her.

import { h, svg } from '../ui.js';
import * as store from '../state.js';
import { mascot } from '../mascot.js';
import { sticker, stickerIndex, TOTAL } from '../stickers.js';
import { SKILL_BY_ID } from '../maths/topics.js';
import { questionCount } from '../maths/task.js';
import { canSpeak } from '../speak.js';

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Seven dots, this week, so a streak is something she can see. */
function weekRow() {
  const days = store.recentDays(7);
  return h('div', { class: 'week' },
    ...days.map((d) => {
      const date = new Date(`${d.day}T00:00:00`);
      const done = Boolean(d.asked);
      const isToday = d.day === store.today();
      return h('div', { class: 'week-day' + (isToday ? ' is-today' : '') },
        h('span', { class: 'week-letter' }, DAY_LETTER[date.getDay()]),
        h('span', { class: 'week-dot' + (done ? ' is-done' : '') },
          done ? tickMark(14) : null),
      );
    }),
  );
}

function tickMark(size = 18) {
  const s = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' });
  s.append(svg('path', { d: 'M5 13 l5 5 l9 -11', fill: 'none', stroke: 'currentColor',
    'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

/** The album, with what she has and an outline of what comes next. */
function albumStrip(onOpen) {
  const album = store.get().album || [];
  const shown = album.slice(-8);
  // with nothing collected yet, show what today would earn rather than a gap
  if (!album.length) {
    return h('button', { class: 'album-strip is-empty', onclick: onOpen, 'aria-label': 'Open your stickers' },
      h('div', { class: 'album-row' }, sticker(stickerIndex(store.today(), 0), 44)),
      h('span', { class: 'album-count' }, 'Finish today to win this one'),
    );
  }
  return h('button', { class: 'album-strip', onclick: onOpen, 'aria-label': 'Open your stickers' },
    h('div', { class: 'album-row' },
      ...shown.map((i) => sticker(i, 40)),
      album.length < TOTAL ? sticker(stickerIndex(store.today(), album.length), 40, true) : null,
    ),
    h('span', { class: 'album-count' }, `${album.length} sticker${album.length === 1 ? '' : 's'}`),
  );
}

export function TodayView({ assignment, skills, minutes, onStart, onExtra, onAlbum }) {
  const s = store.get();
  const done = store.doneToday();
  const names = skills.map((x) => SKILL_BY_ID.get(x.id)?.name || x.id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Hello' : 'Good evening';

  const head = h('div', { class: 'hello-row' },
    mascot(done ? 'cheer' : 'hello', 76),
    h('div', {},
      h('p', { class: 'hello' }, `${greeting}, ${s.name}.`),
      h('p', { class: 'muted' },
        done ? 'You have done your maths today.'
          : assignment ? 'Here is what you have been set.'
          : 'Here is today\'s maths.'),
    ),
  );

  const card = done
    ? h('div', { class: 'card today-card is-done' },
        h('div', { class: 'big-tick' }, tickMark(52)),
        h('h1', {}, 'All done for today'),
        s.streak > 1 ? h('p', { class: 'streak-line' }, `${s.streak} days in a row.`) : null,
        h('button', { class: 'btn btn-big', onclick: onExtra }, 'One more, just for fun'),
      )
    : h('div', { class: 'card today-card' },
        h('h1', {}, 'Today\'s task'),
        h('div', { class: 'chips' },
          h('span', { class: 'chip' }, `${minutes} minutes`),
          h('span', { class: 'chip' }, `${questionCount(minutes)} questions`),
        ),
        h('div', { class: 'chips' }, ...names.map((n) => h('span', { class: 'chip chip-topic' }, n))),
        assignment?.note
          ? h('div', { class: 'note' }, h('strong', {}, 'A note for you'), assignment.note)
          : null,
        h('button', { class: 'btn btn-go btn-big', onclick: onStart }, 'Start'),
      );

  return h('div', { class: 'wrap' },
    head,
    weekRow(),
    card,
    albumStrip(onAlbum),
    canSpeak()
      ? h('label', { class: 'setting' },
          h('input', {
            type: 'checkbox', checked: s.readAloud,
            onchange: (e) => store.set({ readAloud: e.target.checked }),
          }),
          'Read the questions to me',
        )
      : null,
  );
}

/** The whole album, as a page of its own. */
export function AlbumView({ onBack }) {
  const album = store.get().album || [];
  const have = new Map();
  album.forEach((i) => have.set(i, (have.get(i) || 0) + 1));
  return h('div', { class: 'wrap' },
    h('div', { class: 'row spread' },
      h('h1', {}, 'Your stickers'),
      h('button', { class: 'btn btn-quiet', onclick: onBack }, 'Back'),
    ),
    h('p', { class: 'muted' }, `${have.size} of ${TOTAL} different ones. One for every task you finish.`),
    h('div', { class: 'album-grid' },
      ...Array.from({ length: TOTAL }, (_, i) =>
        h('div', { class: 'album-cell' + (have.has(i) ? '' : ' is-locked') },
          sticker(i, 56, !have.has(i)),
          have.get(i) > 1 ? h('span', { class: 'album-many' }, `×${have.get(i)}`) : null,
        ),
      ),
    ),
  );
}
