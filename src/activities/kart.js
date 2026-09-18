// kart.js — Kart Battle.
//
// Distance is measured in characters typed correctly, so the throttle is your
// accuracy: a wrong character stops the kart until you fix it. Three rivals run
// at steady, honest typing speeds — beating them means typing real syntax
// without looking down.

import { h, confetti, sfx, shuffle } from '../ui.js';
import { icon, rover } from '../icons.js';
import * as store from '../state.js';
import { KART_LINES } from '../data/activities.js';
import { activityShell, finishCard, hudItem, briefing } from './shell.js';

const RACE_LINES = 10;
const LIMIT = 120;         // seconds before the race is called

/** Steady characters-per-second, roughly beginner, steady and quick. */
const RIVALS = [
  { name: 'Bot One', cps: 1.9, cls: 'is-r1' },
  { name: 'Bot Two', cps: 2.6, cls: 'is-r2' },
  { name: 'Bot Three', cps: 3.4, cls: 'is-r3' },
];

export function kartActivity(activity, go) {
  const speedItem = hudItem('bolt', '0', 'Characters per minute');
  const lapItem = hudItem('check', `0/${RACE_LINES}`, 'Lines done');
  const clock = hudItem('clock', LIMIT, 'Seconds left');
  const { el, stage } = activityShell(activity, go, speedItem.wrap, lapItem.wrap, clock.wrap);

  let raf = null;
  let clockTimer = null;
  el.addEventListener('view-destroy', () => {
    cancelAnimationFrame(raf);
    clearInterval(clockTimer);
  });

  stage.replaceChildren(briefing(activity, {
    rules: [
      'Type each line exactly — brackets, quotes and semicolons included.',
      'Every correct character moves your kart. A wrong one stops it until you fix it.',
      'Three rivals type at a steady pace the whole way. First past the line wins.',
    ],
    cta: 'Line up',
    onStart: run,
  }));

  function run() {
    const lines = shuffle(KART_LINES).slice(0, RACE_LINES);
    const distance = lines.reduce((n, l) => n + l.length, 0);

    let done = 0;              // characters banked from finished lines
    let li = 0;
    let mistakes = 0;
    let ended = false;
    let left = LIMIT;
    const started = performance.now();

    /* ------------------------------------------------------------- the track */

    const you = { name: 'You', progress: 0, node: null, finished: 0 };
    const racers = [you, ...RIVALS.map((r) => ({ ...r, progress: 0, finished: 0 }))];

    const track = h('div', { class: 'kart-track' });
    racers.forEach((r, i) => {
      const mark = h('div', { class: 'kart-mark' }, r === you ? rover(28) : icon('rover', { size: 22 }));
      const lane = h('div', { class: 'kart-lane' + (r === you ? ' is-you' : ` ${r.cls}`) },
        h('span', { class: 'kart-name' }, r.name),
        h('div', { class: 'kart-strip' }, mark),
      );
      r.node = mark;
      track.append(lane);
    });

    const mirror = h('div', { class: 'type-target kart-line' });
    const input = h('input', {
      class: 'type-input kart-input',
      spellcheck: 'false',
      autocomplete: 'off',
      autocapitalize: 'off',
      'aria-label': 'Type the line',
    });
    const upNext = h('p', { class: 'muted small kart-next' }, '');

    stage.replaceChildren(
      h('div', { class: 'card kart-card' },
        h('div', { class: 'kart-flag' }, icon('flame', { size: 15 }), h('span', {}, 'Finish'),),
        track,
        h('div', { class: 'kart-cockpit' }, mirror, input, upNext),
      ),
    );

    /* ------------------------------------------------------------- the typing */

    function paint() {
      const target = lines[li];
      const typed = input.value;
      let firstBad = -1;
      mirror.replaceChildren(
        ...[...target].map((ch, i) => {
          const got = typed[i];
          let cls = 'ch';
          if (got !== undefined) {
            if (got === ch) cls = 'ch ok';
            else { cls = 'ch bad'; if (firstBad < 0) firstBad = i; }
          }
          return h('span', { class: cls + (i === typed.length ? ' ch-cursor' : '') }, ch === ' ' ? ' ' : ch);
        }),
      );
      // extra characters past the end still count as wrong
      const clean = firstBad < 0 ? Math.min(typed.length, target.length) : firstBad;
      mirror.classList.toggle('is-stalled', firstBad >= 0 || typed.length > target.length);
      return clean;
    }

    function nextLine() {
      input.value = '';
      upNext.textContent = li + 1 < lines.length ? `Next: ${lines[li + 1]}` : 'Last line — then the flag.';
      paint();
      lapItem.set(`${li}/${RACE_LINES}`);
    }

    let stalled = false;

    input.addEventListener('input', () => {
      const target = lines[li];
      const clean = paint();
      you.progress = done + clean;
      // one mistake per stall, not one per keystroke while it is being fixed
      const bad = clean < input.value.length;
      if (bad && !stalled) mistakes += 1;
      stalled = bad;

      if (input.value === target) {
        done += target.length;
        you.progress = done;
        li += 1;
        lapItem.set(`${li}/${RACE_LINES}`);
        sfx('good', store.get().sound);
        you.node.classList.remove('is-boost');
        void you.node.offsetWidth;
        you.node.classList.add('is-boost');
        if (li >= lines.length) return stop();
        nextLine();
      }
    });

    /* ---------------------------------------------------------------- motion */

    function frame() {
      const secs = (performance.now() - started) / 1000;
      for (const r of racers) {
        if (r === you) continue;
        r.progress = Math.min(distance, r.cps * secs);
        if (!r.finished && r.progress >= distance) r.finished = secs;
      }
      racers.forEach((r) => {
        const pct = Math.min(1, r.progress / distance);
        r.node.style.left = `calc(${pct * 100}% - ${pct * 30}px)`;
      });
      const cpm = Math.round((you.progress / Math.max(1, secs)) * 60);
      speedItem.set(String(cpm));
      if (!ended) raf = requestAnimationFrame(frame);
    }

    clockTimer = setInterval(() => {
      left -= 1;
      clock.set(left);
      clock.wrap.classList.toggle('hot', left <= 10);
      if (left <= 0) stop();
    }, 1000);

    nextLine();
    input.focus();
    raf = requestAnimationFrame(frame);

    /* ------------------------------------------------------------ the flag */

    function stop() {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      clearInterval(clockTimer);
      const secs = Math.max(1, (performance.now() - started) / 1000);
      const ahead = racers.filter((r) => r !== you && r.progress > you.progress).length;
      const place = ahead + 1;
      const cpm = Math.round((you.progress / secs) * 60);
      const accuracy = Math.round((you.progress / Math.max(1, you.progress + mistakes)) * 100);
      const finished = li >= lines.length;
      // ground covered is the bulk of it, with a bonus for where you came and a
      // smaller one for pace, so the numbers sit alongside the other activities
      const placeBonus = [260, 150, 80, 30][place - 1] || 0;
      const total = Math.round(you.progress * 1.4 + (finished ? placeBonus : 0) + Math.min(cpm, 420) / 2);
      if (place === 1 && finished) confetti(36);
      stage.replaceChildren(
        finishCard(activity, total, go, {
          title: finished
            ? `${['First', 'Second', 'Third', 'Fourth'][place - 1]} across the line`
            : `Time — ${li} of ${RACE_LINES} lines`,
          mark: place === 1 && finished ? 'trophy' : 'rover',
          lines: [
            { value: `${cpm}`, label: 'chars / min' },
            { value: `${accuracy}%`, label: 'accuracy' },
            { value: `${li}/${RACE_LINES}`, label: 'lines' },
          ],
        }),
      );
    }
  }

  return el;
}
