// whatsnew.js — the "What's new" popup, shown once after each update.

import { h } from './dom.js';
import { icon, logo } from './icons.js';
import { modal } from './kit.js';
import { VERSION } from '../config.js';
import { sfx } from '../game/sound.js';
import { myProfile } from '../services/session.js';

export const pilotBlook = () => (myProfile() && myProfile().blook) || 'fox';

const KEY = 'quickzy.seenVersion';

export const NEWS = [
  ['star', '#6b4cff', 'Everything on the left', 'One tidy sidebar on bigger screens: play, make, collect.'],
  ['gear', '#ff8a2a', 'Special events and surprises', 'Double coins, lucky boxes and live surprises from the owner.'],
  ['volume', '#ff4772', 'Real music', 'New songs with drums and melodies for the lobby, games, the last 30 seconds and the podium.'],
  ['bolt', '#ffcd1f', 'A brand new logo', 'Quickzy got a fresh look.'],
  ['trophy', '#12c9a6', 'Sky Climb', 'Six worlds to climb. Fall and you drop. Get questions right to keep going.'],
  ['users', '#2f9bff', 'Channels', 'Follow your favourite quiz makers.'],
  ['play', '#a560ff', 'Better games', 'Rank-up shouts, streaks, comeback alerts and a final countdown in every game.'],
];

export function showWhatsNew() {
  try { localStorage.setItem(KEY, VERSION); } catch { /* private mode */ }
  sfx('reveal');
  return modal((close) => [h('div', { class: 'wn' },
    h('div', { class: 'wn-hero' }, logo(), h('div', {}, h('h2', {}, `Quickzy ${VERSION}`), h('p', { style: { margin: 0, fontWeight: 800, opacity: 0.9 } }, 'The biggest update yet'))),
    h('ul', { class: 'wn-list' }, ...NEWS.map(([ic, col, title, text]) => h('li', {},
      h('span', { class: 'wn-ic', style: { background: col } }, icon(ic, { size: 18 })), h('div', {}, h('b', {}, title), h('small', {}, text))))),
    h('div', { class: 'row' },
      h('button', { class: 'btn grow', onclick: () => { close(); import('./flight.js').then((f) => f.playFlight({ pilot: pilotBlook() })); } }, icon('play', { size: 16 }), 'Watch the 1.1 film'),
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
  import('./flight.js').then((f) => f.playFlight({ pilot: pilotBlook() }));
}
