// whatsnew.js — the "What's new" popup, shown once after each update.

import { h } from './dom.js';
import { icon, logo } from './icons.js';
import { modal } from './kit.js';
import { VERSION } from '../config.js';
import { sfx } from '../game/sound.js';
import { myProfile } from '../services/session.js';
import { isOwner } from '../services/site.js';

export const pilotBlook = () => (myProfile() && myProfile().blook) || 'fox';

const KEY = 'quickzy.seenVersion';

export const NEWS_11 = [
  ['star', '#6b4cff', 'Everything on the left', 'One tidy sidebar on bigger screens: play, make, collect.'],
  ['gear', '#ff8a2a', 'Special events and surprises', 'Double coins, lucky boxes and live surprises from the owner.'],
  ['volume', '#ff4772', 'Real music', 'New songs with drums and melodies for the lobby, games, the last 30 seconds and the podium.'],
  ['bolt', '#ffcd1f', 'A brand new logo', 'Quickzy got a fresh look.'],
  ['trophy', '#12c9a6', 'Sky Climb', 'Six worlds to climb. Fall and you drop. Get questions right to keep going.'],
  ['check', '#ffb21f', 'Quickzy Pro, free to test', 'Everyone gets Pro for 3 months: gold badge, instant publishing, 100 players, every game mode, custom blooks and flags.'],
  ['play', '#ff4772', 'Video quizzes', 'A YouTube clip plays, stops, and then the question is asked.'],
  ['edit', '#12c9a6', 'Make quizzes together', 'Invite friends by username, even free accounts, to build a quiz with you.'],
  ['users', '#2f9bff', 'Team mode', 'Split into 2, 3 or 4 teams and win together. Small teams can still win.'],
  ['user', '#12c9a6', 'Channels', 'Follow your favourite quiz makers.'],
  ['play', '#a560ff', 'Better games', 'Rank-up shouts, streaks, comeback alerts and a final countdown in every game.'],
];

export const NEWS_12 = [
  ['play', '#ff8a2a', 'Sky Race', 'Fly your plane, answer 3 to charge a BOOST, and outrun the fighter jets. 10 boosts, 3 minutes.'],
  ['user', '#6b4cff', 'New profiles', 'A big banner (pick a scene or use your own picture), a bio, stats, emblems and an animated founder profile.'],
  ['trophy', '#ffb21f', 'Achievements', '16 goals to reach, and a special badge for playing a game hosted by the founder.'],
  ['compass', '#2f9bff', 'A new Discover', 'Featured quizzes with real photos, Trending, and a shelf for every subject.'],
  ['book', '#12c9a6', 'Homework', 'Set any quiz with a due date. Students play it on their own and you see every score.'],
  ['chart', '#ff4772', 'Presentation+ (Pro)', 'Slides with live polls, quiz questions and guess-the-number graphs, answered on phones.'],
  ['star', '#a560ff', 'Sky Climb, rebuilt', 'Floating islands, scenery in every world, checkpoint arches, dust, trails and flying critters.'],
  ['bolt', '#ffcd1f', 'Better box openings', 'Cards spin in, holographic foil on rare ones, light beams, and the card tilts in your hand.'],
  ['star', '#17133f', 'A brand new logo', 'A Q made of the four answer colours, with a lightning tail.'],
];

export const NEWS = VERSION === '1.2' ? NEWS_12 : NEWS_11;

export function showWhatsNew() {
  try { localStorage.setItem(KEY, VERSION); } catch { /* private mode */ }
  sfx('reveal');
  return modal((close) => [h('div', { class: 'wn' },
    h('div', { class: 'wn-hero' }, logo(), h('div', {}, h('h2', {}, `Quickzy ${VERSION}`), h('p', { style: { margin: 0, fontWeight: 800, opacity: 0.9 } }, 'The biggest update yet'))),
    h('ul', { class: 'wn-list' }, ...NEWS.map(([ic, col, title, text]) => h('li', {},
      h('span', { class: 'wn-ic', style: { background: col } }, icon(ic, { size: 18 })), h('div', {}, h('b', {}, title), h('small', {}, text))))),
    h('div', { class: 'row' },
      h('button', { class: 'btn grow', onclick: () => { close(); playFilm(); } }, icon('play', { size: 16 }), `Watch the ${VERSION} film`),
      VERSION !== '1.2' && isOwner() ? h('button', { class: 'btn grow', onclick: () => { close(); playFilm('1.2'); } }, icon('star', { size: 16 }), 'Preview 1.2 (only you)') : null,
      h('button', { class: 'btn btn-main grow', onclick: () => close() }, "Let's play")))]);
}

/** After an update, once per device (first-time visitors see the intro instead). */
export const markSeen = () => { try { localStorage.setItem(KEY, VERSION); } catch { /* ignore */ } };

export function maybeShowWhatsNew() {
  let seen = '';
  try { seen = localStorage.getItem(KEY) || ''; } catch { return; }
  if (seen === VERSION) return;
  markSeen();
  // the update arrives by plane
  playFilm();
}

/** The film for this version: 1.2 is the 3D Sky Race film; 1.1 the plane film. */
export function playFilm(version = VERSION) {
  if (version === '1.2') return import('./film12.js').then((f) => f.playFilm12({ pilot: pilotBlook() }));
  return import('./flight.js').then((f) => f.playFlight({ pilot: pilotBlook() }));
}
