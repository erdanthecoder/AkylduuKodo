// main.js — boot: connect to the servers, learn who is here, draw the page.

import { h, fill } from './ui/dom.js';
import { icon, logo, wordmark, verifiedBadge } from './ui/icons.js';
import { OWNER_UID } from './config.js';
import { site, EVENTS } from './services/site.js';
import { blook } from './ui/blooks.js';
import { loader } from './ui/loader.js';
import { connect, net } from './net/index.js';
import * as session from './services/session.js';
import { route, onRoute, render, navigate } from './router.js';
import { VERSION } from './config.js';

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
route('/channels', () => import('./pages/channels.js'));
route('/pro', () => import('./pages/pro.js'));
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


const isOn = (path, href) => (href === '/' ? path === '/' : path.startsWith(href)) ? 'is-on' : '';

/** The left sidebar on bigger screens: everything in one tidy place. */
function sidebar(path) {
  const { user, profile } = { user: session.me(), profile: session.myProfile() };
  const signed = user && !user.isAnonymous;
  const link = (href, label, ic, extra = '') => h('a', { href, class: `side-link ${isOn(path, href)} ${extra}` }, icon(ic, { size: 20 }), h('span', {}, label));
  const group = (title, ...links) => h('div', { class: 'side-group' }, h('small', {}, title), ...links.filter(Boolean));
  const music = h('button', { class: 'side-link side-music', type: 'button' });
  const drawMusic = () => {
    const on = session.prefs().music;
    fill(music, icon(on ? 'volume' : 'mute', { size: 20 }), h('span', {}, on ? 'Music on' : 'Music off'));
  };
  music.addEventListener('click', () => { session.setPrefs({ music: !session.prefs().music }); drawMusic(); });
  drawMusic();
  return h('aside', { class: 'sidebar', 'aria-label': 'Main' },
    h('a', { class: 'logo side-logo', href: '/', 'aria-label': 'Quickzy home' }, logo(), wordmark(), h('span', { class: 'ver' }, VERSION)),
    h('a', { class: 'btn btn-main side-join', href: '/join' }, icon('play', { size: 18 }), 'Join a game'),
    h('nav', { class: 'side-nav' },
      group('Play', link('/', 'Home', 'home'), link('/discover', 'Discover', 'compass'), link('/channels', 'Channels', 'users')),
      signed ? group('Make', link('/create', 'Create a quiz', 'plus'), link('/library', 'My quizzes', 'list')) : null,
      group('Collect', link('/blooks', 'Blooks', 'star'), h('a', { href: '/pro', class: `side-link side-pro ${isOn(path, '/pro')}` }, verifiedBadge(null, 'pro'), h('span', {}, 'Quickzy Pro'))),
      user && user.uid === OWNER_UID ? group('Owner', h('a', { href: '/owner', class: `side-link nav-owner ${isOn(path, '/owner')}` }, verifiedBadge(null, 'owner'), h('span', {}, 'Owner panel'))) : null),
    h('div', { class: 'side-end' },
      h('button', { class: 'side-link', type: 'button', onclick: () => import('./ui/whatsnew.js').then((m) => m.showWhatsNew()) }, icon('bolt', { size: 20 }), h('span', {}, `What's new in ${VERSION}`)),
      music,
      link('/settings', 'Settings', 'gear', 'gear-btn'),
      signed && profile
        ? h('a', { class: 'me-chip side-me', href: `/u/${profile.username}`, 'aria-label': 'Your profile' },
          blook(profile.blook), h('span', {}, profile.displayName))
        : signed ? null
          : h('div', { class: 'side-auth' }, h('a', { class: 'btn btn-dark btn-sm', href: '/login' }, 'Sign in'), h('a', { class: 'btn btn-sm', href: '/signup' }, 'Sign up'))));
}

/** The slim bar on phones (the sidebar is hidden there; the tab bar is at the bottom). */
function topbar(path) {
  const { user, profile } = { user: session.me(), profile: session.myProfile() };
  const signed = user && !user.isAnonymous;
  return h('header', { class: 'topbar' },
    h('a', { class: 'logo', href: '/', 'aria-label': 'Quickzy home' }, logo(), wordmark()),
    h('div', { class: 'topbar-end' },
      h('a', { class: 'btn btn-main btn-sm', href: '/join' }, 'Join'),
      h('a', { class: `btn btn-sm btn-dark top-gear ${isOn(path, '/settings')}`, href: '/settings', 'aria-label': 'Settings', title: 'Settings' }, icon('gear', { size: 18 })),
      signed && profile
        ? h('a', { class: 'top-chip', href: `/u/${profile.username}`, 'aria-label': 'Your profile' }, blook(profile.blook))
        : signed ? null : h('a', { class: 'btn btn-dark btn-sm', href: '/login' }, 'Sign in'),
    ),
  );
}

function tabbar(path) {
  const signed = session.signedIn();
  const profile = session.myProfile();
  const items = [
    ['/', 'Home', 'home'],
    ['/discover', 'Discover', 'compass'],
    ['/join', 'Join', 'play'],
    ['/blooks', 'Blooks', 'star'],
    ['/channels', 'Channels', 'users'],
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
// a special event, while it runs: a bright strip with a countdown
const eventBar = h('a', { class: 'event-bar', hidden: true, href: '/blooks' });
let eventTimer = 0;
function drawEvent(ev) {
  clearInterval(eventTimer);
  if (!ev || !EVENTS[ev.kind]) { eventBar.hidden = true; return; }
  const info = EVENTS[ev.kind];
  eventBar.hidden = false;
  eventBar.style.background = info.colour;
  const left = h('b', { class: 'event-left' });
  const tick = () => {
    const ms = ev.ends - Date.now();
    if (ms <= 0) { eventBar.hidden = true; clearInterval(eventTimer); return; }
    const hrs = Math.floor(ms / 3600000);
    const min = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    left.textContent = hrs >= 24 ? `${Math.floor(hrs / 24)}d ${hrs % 24}h left` : `${hrs}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')} left`;
  };
  tick();
  eventTimer = setInterval(tick, 1000);
  fill(eventBar, h('span', { class: 'event-spark' }, icon('star', { size: 16 })), h('b', {}, ev.title || info.name), h('span', { class: 'grow event-blurb' }, info.blurb), left);
}

// the owner's countdown: ticks every second, then celebrates
const countBar = h('div', { class: 'count-bar', hidden: true });
let countTimer = 0;
function drawCountdown(c) {
  clearInterval(countTimer);
  if (!c || !c.to) { countBar.hidden = true; return; }
  countBar.hidden = false;
  const cells = ['d', 'h', 'm', 's'].map((u) => h('span', { class: 'count-cell' }, h('b', {}, '00'), h('small', {}, u)));
  fill(countBar, icon('clock', { size: 18 }), h('b', { class: 'count-title' }, c.title), h('span', { class: 'count-cells' }, ...cells));
  let fired = false;
  const tick = () => {
    const ms = c.to - Date.now();
    if (ms <= 0) {
      clearInterval(countTimer);
      if (fired) return;
      fired = true;
      fill(countBar, icon('star', { size: 18 }), h('b', { class: 'count-title' }, "It's here!"), h('button', { class: 'btn btn-sm btn-main', onclick: () => location.reload() }, 'Refresh to see it'));
      countBar.classList.add('is-done');
      import('./ui/confetti.js').then((m) => m.celebrate()).catch(() => {});
      return;
    }
    const parts = [Math.floor(ms / 86400000), Math.floor(ms / 3600000) % 24, Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60];
    parts.forEach((v, i) => { cells[i].firstChild.textContent = String(v).padStart(2, '0'); });
    cells[0].hidden = parts[0] === 0;
  };
  tick();
  countTimer = setInterval(tick, 1000);
}

async function loadBanner() {
  const { announce, announceAt, event, countdown } = await site(true).catch(() => ({ announce: '' }));
  drawEvent(event);
  drawCountdown(countdown);
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
  app.classList.toggle('with-side', chrome);
  fill(app, chrome ? sidebar(location.pathname) : null, chrome ? topbar(location.pathname) : null, chrome ? countBar : null, chrome ? eventBar : null, chrome ? banner : null, pageRoot, chrome ? tabbar(location.pathname) : null);
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
  // know early whether this account is Pro (badges, flags, custom blooks)
  if (session.signedIn()) import('./services/plan.js').then((p) => p.myPlan()).catch(() => {});

  // the owner's admin abuse reaches every open screen; coin rain is real coins
  import('./ui/abuse.js').then(({ listen }) => listen(net.live, 'abuse', async (e) => {
    if (!session.signedIn()) return;
    const p = await session.reloadProfile();
    if (!p || p.lastGift === e.id) return;
    await session.patchProfile({ coins: (p.coins || 0) + e.coins, lastGift: e.id }).catch(() => {});
  })).catch(() => {});

  // a first visit to the home page opens with the intro
  if (location.pathname === '/' && !navigator.webdriver) {
    import('./ui/cutscene.js').then((m) => {
      if (!m.introSeen()) m.playIntro();
      else import('./ui/whatsnew.js').then((w) => w.maybeShowWhatsNew());
      import('./pages/pro.js').then((p) => p.maybeShowLetter()).catch(() => {});
    }).catch(() => {});
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
    const side = app.querySelector(':scope > .sidebar');
    if (side) side.replaceWith(sidebar(location.pathname));
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
