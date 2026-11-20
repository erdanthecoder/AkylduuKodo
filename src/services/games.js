// games.js — live games in the Realtime Database.
//
// games/{pin}
//   meta      host uid, quiz, mode, status (lobby | play | end), settings, times
//   players   {uid: {name, blook, at}}         each player writes only their own
//   kicked    {uid: true}                      host only; a kicked player cannot rejoin
//   qs        the questions, without answers   host writes, players read
//   cur       the current question (classic)   host writes, players read
//   ans       {pushId: {u, q, c, t}}           players add, only the host reads
//   res       {uid: {pushId: {ok, pts, ...}}}  host writes the mark for an answer;
//                                              only that player reads it
//   me        {uid: {s, r, ...}}               host writes each player's own score
//   act       {pushId: {u, k, ...}}            players' game events (laser tag shots)
//   prog      {uid: {...}}                     players' progress / positions, read by the host
//   snap      host's summary of the arena, read by players
//   top       the top five, read by players
//   final     the full results, once the game ends
// gameIndex/{pin}  {host, at} so stale games can be found and removed
//
// The host's browser is the referee: it alone holds the answers, marks every
// answer and keeps the score. The security rules make sure players can only
// write their own entries, and only the host can write anything that counts.

import { net } from '../net/index.js';
import { me } from './session.js';

export const gamePath = (pin, sub = '') => `games/${pin}${sub ? `/${sub}` : ''}`;
const DAY = 24 * 60 * 60 * 1000;

/** Remove games older than a day. Any host may do this; the rules check the age. */
export async function sweepOldGames() {
  try {
    const cutoff = net.live.now() - DAY;
    const old = await net.live.query('gameIndex', { orderBy: 'at', endAt: cutoff, limitToFirst: 25 });
    for (const pin of Object.keys(old || {})) {
      await net.live.remove(gamePath(pin)).catch(() => {});
      await net.live.remove(`gameIndex/${pin}`).catch(() => {});
    }
  } catch { /* cleaning up is a courtesy, never a blocker */ }
}

/** Reserve a free 6-digit PIN and create the game in the lobby state. */
export async function createGame({ quizId, title, mode, settings, count }) {
  const user = me();
  if (!user || user.isAnonymous) throw new Error('Sign in to host a game.');
  sweepOldGames();
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    const meta = {
      host: user.uid, quizId, title: String(title).slice(0, 80), mode, status: 'lobby',
      // a plain number: server placeholders are not reliable inside a transaction
      settings, count, createdAt: Math.round(net.live.now()),
    };
    const r = await net.live.transaction(gamePath(pin, 'meta'), (current) => (current ? undefined : meta)).catch(() => ({ committed: false }));
    if (r.committed) {
      await net.live.set(`gameIndex/${pin}`, { host: user.uid, at: net.live.TIMESTAMP });
      return pin;
    }
  }
  throw new Error('Could not find a free game PIN. Try again.');
}

export const getMeta = (pin) => net.live.get(gamePath(pin, 'meta'));

export async function endAndRemove(pin) {
  await net.live.remove(gamePath(pin)).catch(() => {});
  await net.live.remove(`gameIndex/${pin}`).catch(() => {});
}

/** A readable reason a PIN cannot be joined, or '' if it can. */
export function joinProblem(meta) {
  if (!meta) return 'There is no game with that PIN. Check the number on the big screen.';
  if (meta.status === 'end') return 'That game has finished.';
  if (meta.settings && meta.settings.locked) return 'The host has locked this game. Ask them to unlock it.';
  if (meta.status === 'play' && !(meta.settings && meta.settings.lateJoin)) return 'That game has already started, and the host is not letting people join late.';
  return '';
}
