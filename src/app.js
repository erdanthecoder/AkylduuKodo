// app.js — router, top bar, bottom nav, and the first-run welcome.

import { h, clear, sfx, confetti } from './ui.js';
import { icon, mascot } from './icons.js';
import { ui, LANGS } from './i18n.js';
import * as store from './state.js';
import { HomeView } from './views/home.js';
import { JourneyView } from './views/journey.js';
import { LessonView } from './views/lesson.js';
import { PracticeView } from './views/practice.js';
import { LabView } from './views/lab.js';
import { SettingsView } from './views/settings.js';
import { BookView } from './views/book.js';
import { NotesView } from './views/notes.js';
import { ProgressView } from './views/progress.js';
import { AccountView } from './views/account.js';
import { WelcomeView } from './views/welcome.js';
import * as auth from './auth.js';
import { animateIn, countUp } from './anim.js';
// Preferences write themselves onto <html> as soon as this module loads, so the
// first paint is already the right theme and the right text size.
import './prefs.js';

// Four places to go, and no more. Everything else is reached from the page it
// belongs to: the Lab from Practice, the Notebook and Settings from the top bar.
const NAV = [
  { hash: '#/home', icon: 'home', key: 'nav_home' },
  { hash: '#/journey', icon: 'map', key: 'nav_journey' },
  { hash: '#/book', icon: 'book', key: 'nav_book' },
  { hash: '#/practice', icon: 'target', key: 'nav_practice' },
];

/** Which nav item a route belongs under, when it is not a nav route itself. */
const NAV_PARENT = {
  lesson: '#/journey',
  lab: '#/practice',
  activities: '#/practice',
  progress: '#/home',
};

let currentView = null;
let lastXp = 0;

/** A small round button for the top bar: icon only, with a tooltip. */
function topIcon(name, label, hash) {
  return h('button', {
    class: 'pill pill-btn pill-icon' + (location.hash.startsWith(hash) ? ' pill-on' : ''),
    title: label,
    'aria-label': label,
    onclick: () => go(hash),
  }, icon(name, { size: 16 }));
}

function accountButton() {
  const u = auth.user();
  if (!u) {
    return h('button', { class: 'pill pill-btn pill-signin', onclick: () => go('#/account') }, icon('user', { size: 15 }), 'Sign in');
  }
  return h('button', { class: 'pill pill-btn pill-user', onclick: () => go('#/account'), title: u.email || u.name },
    u.photo
      ? h('img', { class: 'pill-avatar', src: u.photo, alt: '', referrerpolicy: 'no-referrer' })
      : h('span', { class: 'pill-avatar pill-avatar-letter' }, (u.name || '?').slice(0, 1).toUpperCase()),
    h('span', { class: 'pill-user-name' }, (u.name || 'Account').split(' ')[0]),
  );
}

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
  animateIn(node);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function render() {
  const s = store.get();
  if (!s.onboarded) {
    document.body.dataset.view = 'welcome';
    return mount(WelcomeView(go, render));
  }

  const [, route, arg] = (location.hash || '#/home').split('/');
  void route;
  const path = (location.hash || '#/home').replace('#/', '').split('/');

  document.body.dataset.view = path[0] || 'home';

  switch (path[0]) {
    case 'journey':
      mount(JourneyView(go));
      break;
    case 'lesson':
      mount(LessonView(path[1], go));
      break;
    case 'activities':
    case 'practice':
      mount(PracticeView(go, path[1]));
      break;
    case 'lab':
      mount(LabView());
      break;
    case 'book':
      mount(BookView(path[1], go));
      break;
    case 'notes':
      mount(NotesView(go, render));
      break;
    case 'progress':
      mount(ProgressView(go));
      break;
    case 'settings':
      mount(SettingsView(go, render));
      break;
    case 'account':
      mount(AccountView(go, render));
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
  const xpPill = h('span', { class: 'pill', title: ui('xp') }, icon('bolt', { size: 15 }), h('b', { class: 'xp-count' }, String(lastXp)));
  clear(bar).append(
    h('button', { class: 'brand', onclick: () => go('#/home') },
      h('span', { class: 'brand-mark' }, '\u{1F3D4}\uFE0F'),
      h('span', { class: 'brand-name' }, 'Akyldu', h('em', {}, 'u'), 'Kodo'),
    ),
    h('div', { class: 'top-stats' },
      h('span', { class: 'pill pill-level', title: ui('level') }, icon(lvl.icon, { size: 15 }), lvl.name),
      xpPill,
      h('span', { class: 'pill', title: ui('streak') }, icon('flame', { size: 15, cls: 'flame' }), String(store.streak())),
      h('span', { class: 'pill pill-week', title: ui('this_week') }, icon('target', { size: 15 }), `${week.count}/${week.goal}`),
      topIcon('pencil', ui('nav_notes'), '#/notes'),
      topIcon('settings', ui('nav_settings'), '#/settings'),
      accountButton(),
    ),
  );
  countUp(xpPill.querySelector('.xp-count'), lastXp, s.xp);
  lastXp = s.xp;

  const nav = document.getElementById('nav');
  const route = (location.hash || '#/home').replace('#/', '').split('/')[0];
  const active = NAV_PARENT[route] || `#/${route || 'home'}`;
  clear(nav).append(
    ...NAV.map((item) =>
      h('button', {
        class: 'nav-btn ' + (active === item.hash ? 'nav-on' : ''),
        onclick: () => {
          sfx('click', store.get().sound);
          go(item.hash);
        },
      },
        h('span', { class: 'nav-icon' }, icon(item.icon, { size: 22 })),
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
      h('div', { class: 'onboard-mascot' }, mascot(140, 'happy')),
      h('h1', {}, 'AkylduuKodo'),
      h('p', { class: 'muted' }, 'Learn to write real code, one clear step at a time.'),
    ),
    h('div', { class: 'card' },
      h('h3', {}, ui('lang')),
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
          }, l.label),
        ),
      ),
    ),
    h('div', { class: 'card' },
      h('h3', {}, ui('name_q')),
      h('input', { class: 'text-input', placeholder: 'Aisuluu', oninput: (e) => (name = e.target.value) }),
    ),
    h('div', { class: 'card' },
      h('h3', {}, ui('goal_q')),
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
        ...[
          ['book', 'Short explanations, then you write code immediately'],
          ['puzzle', 'Start with blocks if you like, switch to typing any time'],
          ['bug', 'Hunt bugs, predict output, and program a rover through mazes'],
          ['globe', 'Offline missions away from the screen'],
          ['flame', 'Keep your streak and hit your weekly goal'],
        ].map(([ic, text]) => h('li', {}, icon(ic, { size: 18 }), h('span', {}, text))),
      ),
      h('button', {
        class: 'btn btn-primary btn-big',
        onclick: () => {
          store.set({ name: name.trim(), goalPerWeek: goal, onboarded: true, created: store.today() });
          confetti(24);
          go('#/home');
          render();
        },
      }, "Start learning"),
    ),
  );
  return el;
}

window.addEventListener('hashchange', render);
store.subscribe(() => {
  if (store.get().onboarded) paintChrome();
});
auth.onChange(() => {
  if (store.get().onboarded) paintChrome();
});

render();
auth.init().then(render);
