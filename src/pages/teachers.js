// teachers.js — Quickzy for classrooms: why teachers love it and how to
// run a first game in two minutes.

import { h } from '../ui/dom.js';
import { icon, logo } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { MODES, modeArt } from '../game/modes/index.js';
import { signedIn } from '../services/session.js';
import { pageTitle } from './parts.js';

const STEPS = [
  ['compass', 'Pick a quiz', 'Choose one of 50+ ready-made quizzes on Discover, or make your own in minutes (or with AI).'],
  ['play', 'Host it on the big screen', 'Choose a game mode and press Open the lobby. A 6-digit PIN and a QR code appear.'],
  ['users', 'Students join on any device', 'Phones, tablets, laptops. No app and no account needed: they type the PIN and a name.'],
  ['trophy', 'Play and see results', 'Watch the race live, then download every answer as a spreadsheet.'],
];

const WHY = [
  ['check', 'Free to use', 'Classic, Robot Run, Sky Climb and Sky Race are free for every teacher, for up to 40 players.'],
  ['star', 'Students beg to play', 'Ten game modes: racing planes, treasure chests, towers, robots. Everyone answers at once, so nobody sits waiting.'],
  ['list', 'Real learning', 'Multiple choice, true/false, type the answer, put in order, numbers, polls, pictures and video questions.'],
  ['users', 'Safe for kids', 'Random friendly names, no chat, and a profanity filter on names and quizzes.'],
  ['download', 'Reports', 'Every game saves a report: who answered what, and how fast. Download it as CSV.'],
  ['globe', 'Works anywhere', 'Runs in any browser. Big buttons, bright colours and shapes for young players.'],
];

export default function Teachers() {
  pageTitle('Quickzy for teachers');
  const card = ([ic, title, text], i) => h('div', { class: 'tch-card', style: { animationDelay: `${i * 0.06}s` } },
    h('span', { class: 'tch-ic' }, icon(ic, { size: 20 })), h('b', {}, title), h('p', {}, text));
  return h('div', { class: 'page stack', style: { gap: '28px' } },
    h('section', { class: 'tch-hero' },
      h('div', { class: 'tch-hero-text' },
        h('span', { class: 'pill' }, 'For classrooms'),
        h('h1', {}, 'Your whole class, playing and learning together'),
        h('p', {}, 'Quickzy turns any lesson into a game. Put a quiz on the big screen, students join with a PIN, and the room lights up.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-main btn-lg', href: signedIn() ? '/discover' : '/signup?next=/discover' }, icon('play', { size: 18 }), signedIn() ? 'Find a quiz to host' : 'Start free'),
          h('a', { class: 'btn btn-lg', href: '/create' }, icon('plus', { size: 18 }), 'Make a quiz'))),
      h('div', { class: 'tch-hero-art' },
        h('div', { class: 'tch-screen' }, logo(), h('b', {}, 'Game PIN'), h('span', {}, '482 913')),
        h('div', { class: 'tch-kids' }, ...['fox', 'unicorn', 'robot', 'panda', 'kyrgyzstan', 'dragon'].map((id) => blook(id, 52))))),

    h('section', { class: 'stack' },
      h('h2', {}, 'Your first game in two minutes'),
      h('div', { class: 'tch-steps' }, ...STEPS.map(([ic, title, text], i) => h('div', { class: 'tch-step' },
        h('span', { class: 'tch-num' }, String(i + 1)), h('div', {}, h('b', {}, title), h('p', {}, text)))))),

    h('section', { class: 'stack' },
      h('h2', {}, 'Why teachers choose Quickzy'),
      h('div', { class: 'tch-grid' }, ...WHY.map(card))),

    h('section', { class: 'stack' },
      h('h2', {}, 'Ten ways to play'),
      h('div', { class: 'features' }, ...MODES.map((m) => h('div', { class: 'mode-card', style: { background: m.bg } },
        modeArt(m.id), h('h3', {}, m.name), h('p', {}, m.tagline))))),

    h('section', { class: 'tch-cta' },
      h('h2', {}, 'Ready for your next lesson?'),
      h('p', {}, 'Share Quickzy with the teachers you work with: it is the fastest way to make it better for everyone.'),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('a', { class: 'btn btn-main btn-lg', href: '/discover' }, 'Browse quizzes'),
        h('button', { class: 'btn btn-lg', onclick: () => import('../services/invite.js').then((m) => m.shareInvite('Try Quickzy with your class: free quiz games your students will love.')) }, icon('users', { size: 18 }), 'Share with a teacher'))));
}
