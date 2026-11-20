// main.js — boot: connect to the servers, learn who is here, draw the page.

import { h, fill } from './ui/dom.js';
import { icon, logo, wordmark, verifiedBadge } from './ui/icons.js';
import { OWNER_UID } from './config.js';
import { site } from './services/site.js';
import { blook } from './ui/blooks.js';
import { loader } from './ui/loader.js';
import { connect, net } from './net/index.js';
import * as session from './services/session.js';
import { route, onRoute, render, navigate } from './router.js';

const app = document.getElementById('app');

/* ------------------------------------------------------------- routes */

// chrome: false is a full-screen game view with no top bar
route('/', () => import('./pages/home.js'));
route('/join', () => import('./pages/join.js'), { chrome: false });
route('/join/:pin', () => import('./pages/join.js'), { chrome: false });
route('/play/:pin', () => import('./pages/play.js'), { chrome: false });
route('/discover', () => import('./pages/discover.js'));
route('/quiz/:id', () => import('./pages/quiz.js'));
route('/practice/:id', () => import('./pages/practice.js'), { chrome: false });
route('/create', () => import('./pages/editor.js'), { auth: true });
route('/edit/:id', () => import('./pages/editor.js'), { auth: true });
route('/library', () => import('./pages/library.js'), { auth: true });
route('/host/:quizId', () => import('./pages/host-setup.js'), { auth: true });
route('/lobby/:pin', () => import('./pages/host-live.js'), { chrome: false, auth: true });
route('/u/:username', () => import('./pages/profile.js'));
route('/blooks', () => import('./pages/blooks.js'));
route('/owner', () => import('./pages/owner.js'), { auth: true });
route('/settings', () => import('./pages/settings.js'));
route('/login', () => import('./pages/auth.js'));
route('/signup', () => import('./pages/auth.js'));
route('/reset', () => import('./pages/auth.js'));
route('/terms', () => import('./pages/legal.js'));
route('/privacy', () => import('./pages/legal.js'));
route('*', () => import('./pages/notfound.js'));

/* ------------------------------------------------------------- chrome */

const NAV = [
  ['/', 'Home', 'home'],
  ['/discover', 'Discover', 'compass'],
  ['/blooks', 'Blooks', 'star'],
  ['/library', 'My quizzes', 'list'],
  ['/create', 'Create', 'plus'],
];

function topbar(path) {
  const { user, profile } = { user: session.me(), profile: session.myProfile() };
  const signed = user && !user.isAnonymous;
  const on = (href) => (href === '/' ? path === '/' : path.startsWith(href)) ? 'is-on' : '';
  return h('header', { class: 'topbar' },
    h('a', { class: 'logo', href: '/', 'aria-label': 'Quickzy home' }, logo(), wordmark()),
    h('nav', { class: 'nav', 'aria-label': 'Main' },
      ...NAV.filter(([href]) => signed || href === '/' || href === '/discover' || href === '/blooks')
        .map(([href, label]) => h('a', { href, class: on(href) }, label)),
      user && user.uid === OWNER_UID ? h('a', { href: '/owner', class: `nav-owner ${on('/owner')}` }, verifiedBadge(null, 'owner'), 'Owner') : null),
    h('div', { class: 'topbar-end' },
      h('a', { class: 'btn btn-main btn-sm', href: '/join' }, 'Join a game'),
      h('a', { class: `btn btn-sm btn-dark gear-btn ${on('/settings')}`, href: '/settings', 'aria-label': 'Settings', title: 'Settings' }, icon('gear', { size: 18 })),
      signed && profile
        ? h('a', { class: 'me-chip', href: `/u/${profile.username}`, 'aria-label': 'Your profile' },
            blook(profile.blook), h('span', {}, profile.displayName))
        : signed
          ? h('a', { class: 'btn btn-dark btn-sm', href: '/settings' }, 'Settings')
          : h('a', { class: 'btn btn-dark btn-sm', href: '/login' }, 'Sign in'),
    ),
  );
}

function tabbar(path) {
  const signed = session.signedIn();
  const profile = session.myProfile();
  const items = [
    ['/', 'Home', 'home'],
    signed ? null : ['/discover', 'Discover', 'compass'],
    ['/join', 'Join', 'play'],
    ['/blooks', 'Blooks', 'star'],
    signed ? ['/create', 'Create', 'plus'] : null,
    signed && profile ? [`/u/${profile.username}`, 'Me', 'user'] : ['/login', 'Sign in', 'user'],
  ].filter(Boolean);
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    ...items.map(([href, label, ic]) => h('a', {
      href, class: (href === '/' ? path === '/' : path.startsWith(href)) ? 'is-on' : '',
    }, icon(ic, { size: 22 }), label)));
}

/* -------------------------------------------------------------- render */

let pageRoot = null;

// the owner's announcement, under the top bar on every page until dismissed
const banner = h('div', { class: 'announce', hidden: true });
async function loadBanner() {
  const { announce, announceAt } = await site(true).catch(() => ({ announce: '' }));
  let dismissed = '';
  try { dismissed = localStorage.getItem('quickzy.announce.closed') || ''; } catch { /* ignore */ }
  const id = `${announceAt}`;
  banner.hidden = !announce || dismissed === id;
  fill(banner, icon('info', { size: 18 }), h('span', { class: 'grow' }, announce),
    h('button', { class: 'announce-x', 'aria-label': 'Dismiss', onclick: () => {
      banner.hidden = true;
      try { localStorage.setItem('quickzy.announce.closed', id); } catch { /* ignore */ }
    } }, icon('close', { size: 16 })));
}

onRoute(async (match, mod, query, keep) => {
  if (match.opts.auth && !session.signedIn()) {
    navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    return;
  }
  const chrome = match.opts.chrome !== false;
  document.body.classList.toggle('in-game', !chrome);
  pageRoot = h('main', { id: 'page' }, loader());
  fill(app, chrome ? topbar(location.pathname) : null, chrome ? banner : null, pageRoot, chrome ? tabbar(location.pathname) : null);
  window.scrollTo(0, 0);

  let page;
  try {
    page = await mod.default({ params: match.params, query, path: location.pathname });
  } catch (err) {
    console.error(err);
    page = h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' },
      h('h2', {}, 'This page did not load'),
      h('p', { class: 'muted' }, 'Something went wrong on our side. Try again in a moment.'),
      h('a', { class: 'btn btn-main', href: '/' }, 'Go home')));
  }
  if (!keep(page)) return;
  fill(pageRoot, page.el || page);
});

/* --------------------------------------------------------------- start */

async function boot() {
  session.setPrefs({});
  fill(app, loader({ full: true }));
  try {
    await connect();
    await session.start();
  } catch (err) {
    console.error(err);
    fill(app, h('div', { class: 'page narrow' }, h('div', { class: 'card center stack', style: { marginTop: '12vh' } },
      h('h2', {}, 'Quickzy could not connect'),
      h('p', { class: 'muted' }, 'The game servers did not answer. Check your connection — if you are on a school network, it may be blocking them.'),
      h('button', { class: 'btn btn-main', onclick: () => location.reload() }, 'Try again'))));
    return;
  }
  // a first visit to the home page opens with the intro
  if (location.pathname === '/' && !navigator.webdriver) {
    import('./ui/cutscene.js').then((m) => { if (!m.introSeen()) m.playIntro(); }).catch(() => {});
  }
  // when someone signs in or out, or renames themselves, redraw the bars only:
  // redrawing the page would throw away whatever they were typing
  let firstSession = true;
  let wasSignedIn = session.signedIn();
  session.onSession(() => {
    if (firstSession) { firstSession = false; return; }
    if (document.body.classList.contains('in-game')) return;
    const bar = app.querySelector(':scope > .topbar');
    const tabs = app.querySelector(':scope > .tabbar');
    if (bar) bar.replaceWith(topbar(location.pathname));
    if (tabs) tabs.replaceWith(tabbar(location.pathname));
    // signing out of a page that needs an account leaves it
    const now = session.signedIn();
    if (wasSignedIn && !now) render();
    wasSignedIn = now;
  });
  loadBanner();
  render();
}

boot();

// for the browser tests
window.__quickzy = { net, session, navigate };
