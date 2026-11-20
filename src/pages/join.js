// join.js — type or scan a PIN, pick a nickname and a blook, get in.

import { h, fill } from '../ui/dom.js';
import { icon, logo, wordmark } from '../ui/icons.js';
import { blook, randomBlook, blookName, STARTERS } from '../ui/blooks.js';
import { usableBlooks } from '../services/progress.js';
import { busy } from '../ui/kit.js';
import { scanForPin } from '../ui/qr.js';
import { navigate } from '../router.js';
import { net, explain } from '../net/index.js';
import { me, myProfile } from '../services/session.js';
import { getMeta, gamePath, joinProblem } from '../services/games.js';
import { isClean, cleanName, randomName } from '../services/names.js';
import { modeOf } from '../game/modes/index.js';
import { LIMITS } from '../config.js';
import { sfx } from '../game/sound.js';
import { pageTitle } from './parts.js';

const shell = (...body) => h('div', { class: 'join-page pattern' },
  h('a', { class: 'logo join-logo', href: '/' }, logo(), wordmark()),
  h('div', { class: 'join-card' }, ...body));

function pinStep() {
  const pin = h('input', { class: 'input input-xl', inputmode: 'numeric', autocomplete: 'off', maxlength: 7, placeholder: 'Game PIN', 'aria-label': 'Game PIN' });
  const err = h('p', { class: 'error-text center', role: 'alert' });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block' }, 'Enter');
  const submit = () => {
    const v = pin.value.replace(/\D/g, '');
    if (v.length !== 6) { fill(err, 'A game PIN has 6 digits.'); pin.classList.add('is-bad'); pin.focus(); return; }
    navigate(`/join/${v}`);
  };
  pin.addEventListener('input', () => {
    const d = pin.value.replace(/\D/g, '').slice(0, 6);
    pin.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
    pin.classList.remove('is-bad'); fill(err);
    if (d.length === 6) submit();
  });
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  go.addEventListener('click', submit);
  setTimeout(() => pin.focus(), 50);
  return shell(pin, err, go,
    h('button', { class: 'btn btn-block', onclick: async () => { const p = await scanForPin(); if (p) navigate(`/join/${p}`); } }, icon('camera'), 'Scan a QR code'),
    h('p', { class: 'small center muted', style: { margin: 0 } }, 'The PIN is on the host’s screen.'));
}

function problem(text) {
  return shell(h('h2', { class: 'center' }, 'Can’t join'), h('p', { class: 'center' }, text),
    h('a', { class: 'btn btn-main btn-block', href: '/join' }, 'Try another PIN'));
}

export default async function Join({ params }) {
  pageTitle('Join a game');
  if (!params.pin) return pinStep();
  const pin = String(params.pin).replace(/\D/g, '');
  if (pin.length !== 6) return pinStep();

  // reading a game needs a signed-in user; players are quiet guests
  if (!me()) {
    try { await net.auth.anon(); } catch (err) { return problem(explain(err)); }
  }
  const uid = me().uid;
  let meta;
  try { meta = await getMeta(pin); } catch (err) { return problem(explain(err)); }
  const why = joinProblem(meta);
  const already = meta ? await net.live.get(gamePath(pin, `players/${uid}`)).catch(() => null) : null;
  if (already) { queueMicrotask(() => navigate(`/play/${pin}`, { replace: true })); return h('div'); }
  if (why) return problem(why);
  const kicked = await net.live.get(gamePath(pin, `kicked/${uid}`)).catch(() => null);
  if (kicked) return problem('The host removed you from this game.');

  const others = (await net.live.get(gamePath(pin, 'players')).catch(() => null)) || {};
  if (Object.keys(others).length >= LIMITS.playersMax) return problem(`This game is full (${LIMITS.playersMax} players).`);
  const taken = new Set(Object.values(others).map((p) => String(p.name).toLowerCase()));

  const profile = myProfile();
  const random = Boolean(meta.settings && meta.settings.randomNames);
  let pick = profile && profile.blook ? profile.blook : randomBlook();
  let name = random ? randomName(taken) : '';

  const preview = h('div', { class: 'join-preview' });
  const drawPreview = () => fill(preview, blook(pick));
  drawPreview();
  const nameBox = h('input', {
    class: 'input input-xl', maxlength: LIMITS.nameMax, autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false',
    placeholder: 'Nickname', 'aria-label': 'Nickname', value: random ? name : (profile ? cleanName(profile.displayName, LIMITS.nameMax) : ''),
    readonly: random,
  });
  const err = h('p', { class: 'error-text center', role: 'alert' });
  const reroll = random ? h('button', { class: 'btn btn-sm', onclick: () => { name = randomName(taken); nameBox.value = name; sfx('pick'); } }, icon('shuffle', { size: 16 }), 'Another name') : null;

  const grid = h('div', { class: 'blook-grid join-blooks' });
  // guests choose from the commons; accounts from their whole collection
  const choices = profile ? usableBlooks() : STARTERS;
  const drawGrid = () => fill(grid, ...choices.map((id) => h('button', {
    type: 'button', class: `blook-pick${id === pick ? ' is-on' : ''}`, 'aria-label': blookName(id), 'aria-pressed': String(id === pick),
    onclick: () => { pick = id; sfx('pick'); drawGrid(); drawPreview(); },
  }, blook(id))));
  drawGrid();

  const go = h('button', { class: 'btn btn-main btn-lg btn-block' }, 'Join', icon('arrowRight'));
  const submit = busy(go, async () => {
    fill(err);
    const n = nameBox.value.replace(/\s+/g, ' ').trim();
    if (!n) { fill(err, 'Type a nickname.'); nameBox.focus(); return; }
    if (n.length > LIMITS.nameMax) { fill(err, `${LIMITS.nameMax} characters at most.`); return; }
    if (!isClean(n)) { fill(err, 'Pick a different nickname.'); nameBox.select(); return; }
    const now = (await net.live.get(gamePath(pin, 'players')).catch(() => null)) || {};
    if (Object.values(now).some((p) => String(p.name).toLowerCase() === n.toLowerCase())) { fill(err, 'Someone already has that nickname.'); return; }
    const m = await getMeta(pin).catch(() => null);
    const stillWhy = joinProblem(m);
    if (stillWhy) { fill(err, stillWhy); return; }
    try {
      await net.live.set(gamePath(pin, `players/${uid}`), { name: n, blook: pick, at: net.live.TIMESTAMP });
    } catch (e) {
      fill(err, explain(e));
      return;
    }
    sfx('join');
    navigate(`/play/${pin}`, { replace: true });
  });
  go.addEventListener('click', submit);
  nameBox.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  if (!random) setTimeout(() => nameBox.focus(), 60);

  return shell(
    h('div', { class: 'center' }, h('span', { class: 'pill' }, modeOf(meta.mode).name), h('h2', { style: { marginTop: '8px' } }, meta.title)),
    preview,
    h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, nameBox, reroll),
    err,
    go,
    h('details', { class: 'blook-more' }, h('summary', {}, 'Choose your blook'), grid));
}
