// journey.js — the path. One node per lesson, numbered, walked from the top
// down. Exactly one node is "next", it is the biggest thing on screen, and the
// mascot stands beside it, so there is never a question about what to do.

import { h, starRow } from '../ui.js';
import { icon, mascot } from '../icons.js';
import { ui, t } from '../i18n.js';
import * as store from '../state.js';
import { UNITS, ALL_LESSONS, LEVELS, isUnlocked } from '../data/index.js';
import { routeMap } from '../map.js';

const STEP_ICON = {
  teach: 'book',
  quiz: 'target',
  predict: 'eye',
  order: 'list',
  type: 'keyboard',
  code: 'code',
  bug: 'bug',
  robot: 'rover',
  unplugged: 'globe',
  web: 'globe',
};

/** Nodes swing left and right down the page, like a mountain trail. */
const OFFSETS = [0, 62, 88, 62, 0, -62, -88, -62];

export function JourneyView(go) {
  const s = store.get();
  const nextUp = ALL_LESSONS.find((l) => !s.done[l.id]);
  let number = 0;

  const path = h('div', { class: 'path' });

  let shownLevel = null;

  UNITS.forEach((unit, unitIndex) => {
    const done = unit.lessons.filter((l) => s.done[l.id]).length;

    // A banner announces each difficulty tier the first time it appears, so the
    // jump from "tiny steps" to "real problems" is never a surprise.
    if (unit.level !== shownLevel) {
      shownLevel = unit.level;
      const meta = LEVELS.find((l) => l.id === unit.level);
      path.append(
        h('div', { class: `level-divider level-${unit.level}` },
          h('span', { class: 'level-chip' }, meta?.label || unit.level),
          h('span', { class: 'level-blurb' }, meta?.blurb || ''),
        ),
      );
    }

    const band = h('section', { class: `band band-${(unitIndex % 7) + 1}`, id: 'band-' + unit.id });

    band.append(
      h('header', { class: 'band-head' },
        h('span', { class: 'band-mark' }, icon(unit.icon, { size: 22 })),
        h('div', { class: 'band-text' },
          h('span', { class: 'band-kicker' },
            unit.city ? `${unit.city.name}, ${unit.city.country}` : `Part ${unitIndex + 1}`),
          h('h2', {}, t(unit.title)),
          h('p', {}, t(unit.blurb)),
        ),
        h('span', { class: 'band-progress' },
          h('span', { class: 'mini-bar' },
            h('span', { class: 'mini-bar-fill', style: `width:${Math.round((done / unit.lessons.length) * 100)}%` })),
        ),
      ),
    );

    const trail = h('ol', { class: 'trail' });

    unit.lessons.forEach((lesson) => {
      number += 1;
      const record = s.done[lesson.id];
      const open = isUnlocked(lesson.id, s.done);
      const isNext = nextUp && nextUp.id === lesson.id;
      const state = record ? 'done' : isNext ? 'next' : open ? 'open' : 'locked';

      const node = h(
        'button',
        {
          class: `node node-${state}`,
          disabled: !open,
          title: open ? t(lesson.title) : ui('locked'),
          onclick: () => open && go(`#/lesson/${lesson.id}`),
        },
        h('span', { class: 'node-face' },
          record ? icon('check', { size: 30 }) : open ? h('span', { class: 'node-num' }, String(number)) : icon('lock', { size: 22 }),
        ),
      );

      const item = h(
        'li',
        { class: `trail-item trail-${state}` },
        isNext ? h('span', { class: 'node-callout' }, ui('start')) : null,
        node,
        h('div', { class: 'node-label' },
          h('strong', {}, `Lesson ${number}`),
          h('span', {}, t(lesson.title)),
          record
            ? starRow(record.stars, 3, 13)
            : h('span', { class: 'node-meta' },
                icon('clock', { size: 12 }), `${lesson.minutes} min`,
                h('span', { class: 'node-kinds' },
                  ...[...new Set(lesson.steps.map((st) => STEP_ICON[st.type] || 'code'))].slice(0, 5)
                    .map((n) => icon(n, { size: 13 })),
                ),
              ),
        ),
        isNext ? h('span', { class: 'trail-mascot' }, mascot(92, 'happy')) : null,
      );
      item.style.setProperty('--shift', OFFSETS[(number - 1) % OFFSETS.length] + 'px');
      trail.append(item);
    });

    band.append(trail);
    path.append(band);
  });

  const doneUnits = new Set(UNITS.filter((u) => u.lessons.every((l) => s.done[l.id])).map((u) => u.id));
  const currentUnit = nextUp ? UNITS.find((u) => u.lessons.some((l) => l.id === nextUp.id)) : null;

  const mapCard = h('section', { class: 'card route-card' },
    h('div', { class: 'route-head' },
      h('h3', {}, 'Your route'),
      h('span', { class: 'route-now' },
        icon('map', { size: 16 }),
        currentUnit
          ? h('span', {}, 'Now in ', h('b', {}, currentUnit.city?.name || ''), ' — ', String(doneUnits.size), ' of ', String(UNITS.length), ' cities visited')
          : h('span', {}, 'Every city visited'),
      ),
    ),
    routeMap({
      doneUnits,
      currentUnitId: currentUnit?.id || null,
      onPick: (unitId) => document.getElementById('band-' + unitId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    }),
  );

  return h(
    'div',
    { class: 'view journey' },
    h('div', { class: 'journey-head' },
      h('div', {},
        h('h1', { class: 'view-title' }, ui('nav_journey')),
        h('p', { class: 'muted' },
          nextUp ? `Next up: Lesson ${ALL_LESSONS.indexOf(nextUp) + 1} — ${t(nextUp.title)}` : 'Every lesson finished. Try the practice drills.'),
      ),
      nextUp
        ? h('button', { class: 'btn btn-primary btn-jump', onclick: () => go(`#/lesson/${nextUp.id}`) },
            ui('continue'), icon('arrowRight', { size: 17 }))
        : null,
    ),
    mapCard,
    path,
  );
}
