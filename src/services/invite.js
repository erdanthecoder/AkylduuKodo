// invite.js — invite friends, both get rewards.
//
//   Your link: https://<site>/?ref=<your uid>
//   A friend who opens it and makes an account gets 100 coins.
//   You get 150 coins and the Buddy blook (once) for each friend who joins.
//
// The new account writes referrals/{its uid} {by, name}; the rules allow that
// only for an account made in the last day, once. The inviter's device
// finds unclaimed referrals and claims them.

import { net } from '../net/index.js';
import { me, signedIn, myProfile, reloadProfile, patchProfile } from './session.js';
import { toast, modal } from '../ui/kit.js';
import { h } from '../ui/dom.js';
import { blook } from '../ui/blooks.js';
import { sfx } from '../game/sound.js';

const KEY = 'quickzy.ref';
export const NEW_FRIEND_COINS = 100;
export const INVITER_COINS = 150;
const okId = (v) => typeof v === 'string' && /^[A-Za-z0-9]{10,40}$/.test(v);

/** Remember who invited this visitor (from ?ref=…). */
export function captureRef() {
  try {
    const ref = new URLSearchParams(location.search).get('ref');
    if (okId(ref) && !localStorage.getItem(KEY)) localStorage.setItem(KEY, ref);
  } catch { /* private mode */ }
}

/** The link to share: the site, with you as the inviter when signed in. */
export function inviteLink() {
  const base = `${location.origin}/`;
  return signedIn() ? `${base}?ref=${me().uid}` : base;
}

/** Share with the phone's share sheet, or copy the link. */
export async function shareInvite(text = 'Play Quickzy with me! Fun quiz games: Sky Race, Treasure Hunt and more.') {
  const url = inviteLink();
  try {
    if (navigator.share) { await navigator.share({ title: 'Quickzy', text, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Invite link copied! Send it to a friend.', 'ok'); } catch { toast(url); }
}

const celebrate = (title, text, id) => {
  sfx('win');
  import('../ui/confetti.js').then((c) => c.celebrate()).catch(() => {});
  modal((close) => [h('div', { class: 'stack center', style: { gap: '12px', textAlign: 'center' } },
    blook(id, 96), h('h2', {}, title), h('p', { class: 'muted', style: { margin: 0 } }, text),
    h('button', { class: 'btn btn-main btn-block', onclick: () => close() }, 'Yay!'))]);
};

/** After sign-in: record a pending invite, and claim friends who joined. */
export async function settleInvites() {
  if (!signedIn()) return;
  const uid = me().uid;
  const p = myProfile();
  if (!p) return;
  // 1. this account was invited
  let ref = null;
  try { ref = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (ref) {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    const fresh = Date.now() - (Number(p.createdAt) || 0) < 20 * 3600 * 1000;
    if (ref !== uid && fresh) {
      try {
        await net.store.set('referrals', uid, { by: ref, name: String(p.displayName || 'A friend').slice(0, 30), at: net.store.serverTime(), claimed: false });
        const now = await reloadProfile();
        await patchProfile({ coins: (now.coins || 0) + NEW_FRIEND_COINS });
        celebrate('A gift from your friend!', `You joined with a friend's invite: here are ${NEW_FRIEND_COINS} coins.`, 'buddy');
      } catch { /* already used, or not a new account */ }
    }
  }
  // 2. friends this account invited
  const rows = await net.store.query('referrals', { where: [['by', '==', uid]], limit: 50 }).catch(() => []);
  const fresh = rows.filter((r) => r.claimed === false);
  for (const r of fresh) {
    try {
      await net.store.update('referrals', r.id, { claimed: true });
      const now = await reloadProfile();
      await patchProfile({ coins: (now.coins || 0) + INVITER_COINS, owned: { ...(now.owned || {}), buddy: true } });
      celebrate(`${r.name || 'A friend'} joined!`, `Thanks for inviting them. You got ${INVITER_COINS} coins and the Buddy blook.`, 'buddy');
    } catch { /* claimed on another device */ }
  }
}

/** A friendly invite card, for the Me page and the end of games. */
export function inviteCard({ compact = false } = {}) {
  return h('div', { class: `invite-card${compact ? ' is-compact' : ''}` },
    blook('buddy', compact ? 44 : 64),
    h('div', { class: 'grow' },
      h('b', {}, 'Invite friends, get rewards'),
      h('small', {}, signedIn()
        ? `Each friend who joins gives you ${INVITER_COINS} coins and the Buddy blook. They get ${NEW_FRIEND_COINS} coins too!`
        : 'Share Quickzy with your friends. Sign in to earn rewards for every friend who joins.')),
    h('button', { class: 'btn btn-main', onclick: () => shareInvite() }, 'Invite'));
}

let settling = null;
/** Settle once the profile has loaded (and only one at a time). */
export async function whenReady(session) {
  if (settling) return settling;
  settling = session.whenProfile().then(() => settleInvites()).catch(() => {}).finally(() => { settling = null; });
  return settling;
}
