// decks.js — Quickzy Presentation+ (Pro): slides with live interaction.
//
//   Firestore decks/{id}   {owner, title, slides: [...], updatedAt}
//   RTDB shows/{pin}       meta {host, title, deck, n, at}
//                          cur  {i, s (the slide, answers hidden until reveal), reveal}
//                          votes/{slide}/{uid}: a number (option index, or a guess)
//
// Slide kinds:
//   title  {head, body, img}            content {head, body, img}
//   poll   {head, opts}                 quiz    {head, opts, ans}
//   guess  {head, min, max, unit, ans}  (everyone guesses a number; a graph shows the spread)

import { net } from '../net/index.js';
import { me, signedIn } from './session.js';

export const KINDS = [
  ['title', 'Title', 'star'], ['content', 'Content', 'list'], ['poll', 'Fun poll', 'chart'],
  ['quiz', 'Quiz question', 'check'], ['guess', 'Guess the number', 'hash'],
];
export const MAX_SLIDES = 40;

export function blank(t = 'content') {
  if (t === 'title') return { t, head: 'My presentation', body: 'By me', img: '', bg: 0 };
  if (t === 'poll') return { t, head: 'What do you think?', opts: ['Yes', 'No', 'Maybe'], bg: 2 };
  if (t === 'quiz') return { t, head: 'Which is right?', opts: ['A', 'B', 'C', 'D'], ans: 0, bg: 1 };
  if (t === 'guess') return { t, head: 'How many…?', min: 0, max: 100, unit: '', ans: 50, bg: 3 };
  return { t: 'content', head: 'A new slide', body: 'Write your points here.\nOne per line.', img: '', bg: 4 };
}

const clip = (v, n) => String(v ?? '').slice(0, n);
const okImg = (v) => (typeof v === 'string' && /^https:\/\/[^\s"'<>]{8,290}$/.test(v) ? v : '');
/** Keep a slide to its own fields and sizes. */
export function cleanSlide(s) {
  const t = KINDS.some((k) => k[0] === s.t) ? s.t : 'content';
  const base = { t, head: clip(s.head, 140), bg: Math.max(0, Math.min(5, Number(s.bg) || 0)) };
  if (t === 'title' || t === 'content') return { ...base, body: clip(s.body, 600), img: okImg(s.img) };
  if (t === 'poll' || t === 'quiz') {
    const opts = (s.opts || []).map((o) => clip(o, 60)).filter((o) => o.trim()).slice(0, 6);
    const out = { ...base, opts: opts.length >= 2 ? opts : ['Yes', 'No'] };
    if (t === 'quiz') out.ans = Math.max(0, Math.min(out.opts.length - 1, Number(s.ans) || 0));
    return out;
  }
  const min = Number.isFinite(+s.min) ? +s.min : 0;
  const max = Number.isFinite(+s.max) && +s.max > min ? +s.max : min + 100;
  return { ...base, min, max, unit: clip(s.unit, 12), ans: Math.max(min, Math.min(max, Number(s.ans) || min)) };
}

export const myDecks = () => (signedIn() ? net.store.query('decks', { where: [['owner', '==', me().uid]], limit: 100 }).catch(() => []) : Promise.resolve([]));
export const getDeck = (id) => net.store.get('decks', id);
export const removeDeck = (id) => net.store.del('decks', id);

export async function saveDeck(deck) {
  const data = { owner: me().uid, title: clip(deck.title, 80) || 'Untitled', slides: (deck.slides || []).slice(0, MAX_SLIDES).map(cleanSlide), updatedAt: net.store.serverTime() };
  if (deck.id) { await net.store.set('decks', deck.id, data); return deck.id; }
  return net.store.add('decks', data);
}

/* ------------------------------------------------------------------ live */

export const showPath = (pin, sub = '') => `shows/${pin}${sub ? `/${sub}` : ''}`;
const newPin = () => String(100000 + Math.floor(Math.random() * 900000));

/** Start presenting: a PIN the audience joins with. */
export async function startShow(deck) {
  for (let i = 0; i < 6; i++) {
    const pin = newPin();
    const taken = await net.live.get(showPath(pin, 'meta')).catch(() => null);
    if (taken) continue;
    await net.live.set(showPath(pin, 'meta'), { host: me().uid, title: clip(deck.title, 80), deck: deck.id, n: deck.slides.length, at: net.live.TIMESTAMP });
    return pin;
  }
  throw new Error('Could not open a room. Try again.');
}

/** What the audience may see of a slide: answers stay hidden until reveal. */
export function publicSlide(s, reveal) {
  const out = { ...s };
  if (!reveal) delete out.ans;
  return out;
}

export const showSlide = (pin, i, slide, reveal = false) => net.live.set(showPath(pin, 'cur'), { i, s: publicSlide(slide, reveal), reveal: Boolean(reveal) });
export const endShow = (pin) => net.live.remove(showPath(pin)).catch(() => {});
export const vote = (pin, i, value) => net.live.set(showPath(pin, `votes/${i}/${me().uid}`), value);
export const onVotes = (pin, i, fn) => net.live.on(showPath(pin, `votes/${i}`), (v) => fn(v || {}));
export const onCurrent = (pin, fn) => net.live.on(showPath(pin, 'cur'), fn);
export const showMeta = (pin) => net.live.get(showPath(pin, 'meta'));
