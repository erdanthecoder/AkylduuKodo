// app.js — router, top bar, bottom nav, and the first-run welcome.

import { h, clear, sfx, confetti } from './ui.js';
import { ui, LANGS } from './i18n.js';
import * as store from './state.js';
import { HomeView } from './views/home.js';
import { JourneyView } from './views/journey.js';
import { LessonView } from './views/lesson.js';
import { ArcadeView } from './views/arcade.js';
import { PlayView } from './views/play.js';
import { SettingsView } from './views/settings.js';

const NAV = [
  { hash: '#/home', icon: '🏠', key: 'nav_home' },
  { hash: '#/journey', icon: '🗺️', key: 'nav_journey' },
  { hash: '#/arcade', icon: '🕹️', key: 'nav_arcade' },
  { hash: '#/play', icon: '🧪', key: 'nav_play' },
  { hash: '#/settings', icon: '⚙️', key: 'nav_settings' },
];

const root = document.getElementById('app');
let currentView = null;

function go(hash, force = false) {
  if (location.hash === hash && force) render();
  else if (location.hash === hash) render();
  else location.hash = hash;
}

function mount(node) {
  if (currentView) currentView.dispatchEvent(new CustomEvent('view-destroy'));
  currentView = node;
  const main = document.getElementById('main');
  clear(main).append(node);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function render() {
  const s = store.get();
  if (!s.onboarded) return mount(Onboarding());

  const [, route, arg] = (location.hash || '#/home').split('/');
  void route;
  const path = (location.hash || '#/home').replace('#/', '').split('/');

  switch (path[0]) {
    case 'journey':
      mount(JourneyView(go));
      break;
    case 'lesson':
      mount(LessonView(path[1], go));
      break;
    case 'arcade':
      mount(ArcadeView(go, path[1]));
      break;
    case 'play':
      mount(PlayView());
      break;
    case 'settings':
      mount(SettingsView(go, render));
      break;
    default:
      mount(HomeView(go));
  }
  void arg;
  paintChrome();
}

function paintChrome() {
  const s = store.get();
  const lvl = store.level();
  const week = store.weekProgress();
  const bar = document.getElementById('topbar');
  clear(bar).append(
    h('button', { class: 'brand', onclick: () => go('#/home') },
      h('span', { class: 'brand-mark' }, '🏔️'),
      h('span', { class: 'brand-name' }, 'Akyldu', h('em', {}, 'u'), 'Kodo'),
    ),
    h('div', { class: 'top-stats' },
      h('span', { class: 'pill', title: ui('level') }, `${lvl.emoji} ${lvl.name}`),
      h('span', { class: 'pill', title: ui('xp') }, `⚡ ${s.xp}`),
      h('span', { class: 'pill', title: ui('streak') }, `🔥 ${store.streak()}`),
      h('span', { class: 'pill', title: ui('this_week') }, `🎯 ${week.count}/${week.goal}`),
    ),
  );

  const nav = document.getElementById('nav');
  const active = (location.hash || '#/home').split('/').slice(0, 2).join('/');
  clear(nav).append(
    ...NAV.map((item) =>
      h('button', {
        class: 'nav-btn ' + (active === item.hash ? 'nav-on' : ''),
        onclick: () => {
          sfx('click', store.get().sound);
          go(item.hash);
        },
      },
        h('span', { class: 'nav-icon' }, item.icon),
        h('span', { class: 'nav-label' }, ui(item.key)),
      ),
    ),
  );
}

// --------------------------------------------------------------- first run

function Onboarding() {
  let name = '';
  let goal = 5;
  let lang = store.get().lang || 'en';

  const el = h('div', { class: 'view onboard' },
    h('div', { class: 'card hero onboard-hero' },
      h('div', { class: 'big-emoji' }, '🏔️'),
      h('h1', {}, 'AkylduuKodo'),
      h('p', { class: 'muted' }, 'Smart code, one fun step at a time.'),
    ),
    h('div', { class: 'card' },
      h('h3', {}, '🌍 ' + ui('lang')),
      h('div', { class: 'chips' },
        ...LANGS.map((l) =>
          h('button', {
            class: `chip chip-btn ${lang === l.id ? 'chip-on' : ''}`,
            onclick: (e) => {
              lang = l.id;
              store.set({ lang });
              [...e.target.parentElement.children].forEach((c) => c.classList.remove('chip-on'));
              e.target.classList.add('chip-on');
            },
          }, `${l.flag} ${l.label}`),
        ),
      ),
    ),
    h('div', { class: 'card' },
      h('h3', {}, '🙋 ' + ui('name_q')),
      h('input', { class: 'text-input', placeholder: 'Aisuluu', oninput: (e) => (name = e.target.value) }),
    ),
    h('div', { class: 'card' },
      h('h3', {}, '🎯 ' + ui('goal_q')),
      h('p', { class: 'muted' }, ui('goal_note')),
      h('div', { class: 'chips' },
        ...[3, 5, 7, 10].map((n) =>
          h('button', {
            class: `chip chip-btn ${n === goal ? 'chip-on' : ''}`,
            onclick: (e) => {
              goal = n;
              [...e.target.parentElement.children].forEach((c) => c.classList.remove('chip-on'));
              e.target.classList.add('chip-on');
            },
          }, `${n} / week`),
        ),
      ),
    ),
    h('div', { class: 'card start-card' },
      h('h3', {}, 'How it works'),
      h('ul', { class: 'how' },
        h('li', {}, '📖 Tiny explanations — then you try it immediately'),
        h('li', {}, '🧩 Start with blocks if you like, switch to typing any time'),
        h('li', {}, '🐛 Hunt bugs, 🔮 predict output, 🐃 drive a robot yak'),
        h('li', {}, '🌍 Offline quests away from the screen'),
        h('li', {}, '🔥 Keep your streak and hit your weekly goal'),
      ),
      h('button', {
        class: 'btn btn-primary btn-big',
        onclick: () => {
          store.set({ name: name.trim(), goalPerWeek: goal, onboarded: true, created: store.today() });
          confetti(24);
          go('#/home');
          render();
        },
      }, "Let's code 🚀"),
    ),
  );
  return el;
}

window.addEventListener('hashchange', render);
store.subscribe(() => {
  if (store.get().onboarded) paintChrome();
});
render();
