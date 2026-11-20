// host-setup.js — choose how to play a quiz, then open a lobby.

import { h, fill, plural } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toggle, segmented, busy, toast } from '../ui/kit.js';
import { navigate } from '../router.js';
import { explain } from '../net/index.js';
import { getQuiz, getKey, hostProblems } from '../services/quizzes.js';
import { join } from '../game/questions.js';
import { createGame } from '../services/games.js';
import { MODES, modeOf, modeArt } from '../game/modes/index.js';
import { pageTitle, cover } from './parts.js';

const PREF_KEY = 'quickzy.hostPrefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* ignore */ } };

export default async function HostSetup({ params }) {
  const quiz = await getQuiz(params.quizId).catch(() => null);
  const key = quiz ? await getKey(quiz.id) : null;
  if (!quiz || !key) {
    return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' },
      h('h2', {}, 'This quiz cannot be hosted'),
      h('p', { class: 'muted' }, quiz ? 'Its answers could not be loaded. Only published quizzes, or your own, can be hosted.' : 'It may have been deleted or made private.'),
      h('a', { class: 'btn btn-main', href: '/discover' }, 'Find a quiz')));
  }
  pageTitle(`Host ${quiz.title}`);
  const issues = hostProblems({ questions: join(quiz.questions || [], key) });

  const saved = loadPrefs();
  const s = {
    mode: MODES.some((m) => m.id === saved.mode) ? saved.mode : 'classic',
    speed: saved.speed !== false,
    minutes: [3, 5, 7, 10].includes(saved.minutes) ? saved.minutes : 5,
    shuffle: Boolean(saved.shuffle),
    lateJoin: saved.lateJoin !== false,
    randomNames: Boolean(saved.randomNames),
    showText: saved.showText !== false,
  };

  const modeBox = h('div', { class: 'mode-pick' });
  const options = h('div', { class: 'card stack' });
  const drawModes = () => fill(modeBox, ...MODES.map((m) => h('button', {
    type: 'button', class: `mode-opt${m.id === s.mode ? ' is-on' : ''}`, style: { background: m.bg },
    'aria-pressed': String(m.id === s.mode),
    onclick: () => { s.mode = m.id; drawModes(); drawOptions(); },
  }, modeArt(m.id), h('b', {}, m.name), h('small', {}, m.tagline))));

  const opt = (title, text, control) => h('div', { class: 'set-row' },
    h('div', { class: 'grow' }, h('b', {}, title), h('p', { class: 'muted small' }, text)), control);

  const drawOptions = () => {
    const m = modeOf(s.mode);
    fill(options,
      h('h2', {}, `${m.name} settings`),
      opt('Speed scoring', s.speed ? 'Faster right answers earn more points: up to 1000, never less than 500.' : 'Every right answer earns the same points, however long it took.',
        segmented([[true, 'Faster = more'], [false, 'Same for all']], s.speed, (v) => { s.speed = v; drawOptions(); })),
      m.kind === 'arcade'
        ? opt('Game length', 'The game ends for everyone when the time runs out.',
          segmented(m.durations.map((d) => [d, `${d} min`]), s.minutes, (v) => { s.minutes = v; }))
        : null,
      opt('Shuffle questions', m.kind === 'arcade' ? 'Arcade games always give each player their own order.' : 'Ask the questions in a random order.',
        m.kind === 'arcade' ? h('span', { class: 'pill' }, 'Always') : toggle(s.shuffle, (v) => { s.shuffle = v; })),
      opt('Show answers on devices', 'Players see the answer text on their own screen, not only the colours and shapes. Best when the big screen is hard to read.',
        toggle(s.showText, (v) => { s.showText = v; })),
      opt('Let people join late', 'Players can still join after the game has started.', toggle(s.lateJoin, (v) => { s.lateJoin = v; })),
      opt('Random names', 'Players get a friendly made-up name instead of typing one. The safest choice for young classes.',
        toggle(s.randomNames, (v) => { s.randomNames = v; })));
  };
  drawModes(); drawOptions();

  const start = h('button', { class: 'btn btn-main btn-xl', disabled: issues.length > 0 }, icon('play'), 'Open the lobby');
  start.addEventListener('click', busy(start, async () => {
    savePrefs(s);
    const m = modeOf(s.mode);
    try {
      const pin = await createGame({
        quizId: quiz.id, title: quiz.title, mode: s.mode, count: (quiz.questions || []).length,
        settings: {
          speed: s.speed, minutes: m.kind === 'arcade' ? s.minutes : 0, shuffle: m.kind === 'arcade' ? true : s.shuffle,
          lateJoin: s.lateJoin, randomNames: s.randomNames, showText: s.showText, locked: false,
        },
      });
      navigate(`/lobby/${pin}`);
    } catch (err) {
      toast(err.message && !err.code ? err.message : explain(err), 'bad');
    }
  }));

  const c = cover(quiz);
  c.style.borderRadius = '16px';
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('div', { class: 'row spread' },
      h('div', {}, h('p', { class: 'muted', style: { margin: 0 } }, 'Host a live game'), h('h1', {}, quiz.title),
        h('p', { class: 'muted', style: { margin: '4px 0 0' } }, plural((quiz.questions || []).length, 'question'))),
      start),
    issues.length ? h('div', { class: 'card', style: { borderColor: 'var(--bad)' } }, h('b', {}, 'Fix this quiz before hosting it:'),
      h('ul', {}, ...issues.slice(0, 5).map((t) => h('li', {}, t)))) : null,
    h('h2', {}, 'Pick a game'),
    modeBox,
    options);
}
