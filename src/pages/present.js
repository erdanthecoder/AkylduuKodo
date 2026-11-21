// present.js — Quickzy Presentation+ (Pro): make slides, present them on
// the big screen, and let the audience vote, answer and guess on phones.

import { h, fill } from '../ui/dom.js';
import { icon, logo } from '../ui/icons.js';
import { blook } from '../ui/blooks.js';
import { toast, busy, empty, confirm } from '../ui/kit.js';
import { navigate } from '../router.js';
import { net, explain } from '../net/index.js';
import { me, signedIn } from '../services/session.js';
import { isPro } from '../services/plan.js';
import * as D from '../services/decks.js';
import { celebrate } from '../ui/confetti.js';
import { sfx } from '../game/sound.js';
import { pageTitle } from './parts.js';
import NotFound from './notfound.js';

const BGS = ['linear-gradient(135deg,#6b4cff,#4a2fd6)', 'linear-gradient(135deg,#ff4772,#ff8a2a)', 'linear-gradient(135deg,#12c9a6,#2f9bff)',
  'linear-gradient(135deg,#17133f,#3a2399)', 'linear-gradient(135deg,#ffcd1f,#ff8a2a)', 'linear-gradient(135deg,#2f9bff,#a560ff)'];
const COLS = ['#ff4772', '#2f9bff', '#ffb21f', '#12c9a6', '#a560ff', '#ff8a2a'];

async function proGate() {
  if (!signedIn()) { navigate('/login?next=/present'); return h('div'); }
  if (await isPro(me().uid)) return null;
  return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack pres-upsell' },
    h('div', { class: 'pres-badge' }, 'Presentation+'),
    h('h1', {}, 'Present like a pro'),
    h('p', { class: 'muted' }, 'Slides with live polls, quiz questions and guess-the-number graphs that your audience answers on their phones. Presentation+ is for Quickzy Pro members.'),
    h('a', { class: 'btn btn-main btn-lg', href: '/pro' }, 'Start my free week of Pro')));
}

/* ----------------------------------------------------------- the slide */

/** Draw a slide (the big screen and the editor preview use the same one). */
export function slideView(s, { votes = {}, reveal = false, pin = '', count = 0 } = {}) {
  const tally = (n) => { const c = Array(n).fill(0); for (const v of Object.values(votes)) if (Number.isInteger(v) && v >= 0 && v < n) c[v] += 1; return c; };
  const kids = [];
  if (s.t === 'title') {
    kids.push(h('div', { class: 'sl-title' }, h('h1', {}, s.head), s.body ? h('p', {}, s.body) : null));
  } else if (s.t === 'content' && s.img && !s.head && !String(s.body || '').trim()) {
    kids.push(h('img', { class: 'sl-full', src: s.img, alt: '', referrerpolicy: 'no-referrer' }));
  } else if (s.t === 'content') {
    kids.push(h('div', { class: `sl-content${s.img ? ' has-img' : ''}` },
      h('div', {}, h('h2', {}, s.head), h('ul', {}, ...String(s.body || '').split('\n').filter((l) => l.trim()).map((l) => h('li', {}, l)))),
      s.img ? h('img', { src: s.img, alt: '', referrerpolicy: 'no-referrer' }) : null));
  } else if (s.t === 'poll' || s.t === 'quiz') {
    const c = tally(s.opts.length);
    const max = Math.max(1, ...c);
    kids.push(h('h2', { class: 'sl-q' }, s.head),
      h('div', { class: 'sl-bars' }, ...s.opts.map((o, i) => h('div', { class: `sl-bar${reveal && s.t === 'quiz' ? (i === s.ans ? ' is-right' : ' is-wrong') : ''}` },
        h('div', { class: 'sl-bar-track' }, h('i', { style: { height: `${(c[i] / max) * 100}%`, background: COLS[i % 6] } }, h('b', {}, String(c[i])))),
        h('span', { style: { background: COLS[i % 6] } }, reveal && s.t === 'quiz' && i === s.ans ? icon('check', { size: 16 }) : null, o)))));
  } else if (s.t === 'guess') {
    const vals = Object.values(votes).filter((v) => typeof v === 'number');
    const span = s.max - s.min || 1;
    const pos = (v) => `${((v - s.min) / span) * 100}%`;
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    // a histogram: 20 buckets
    const buckets = Array(20).fill(0);
    for (const v of vals) buckets[Math.min(19, Math.max(0, Math.floor(((v - s.min) / span) * 20)))] += 1;
    const top = Math.max(1, ...buckets);
    kids.push(h('h2', { class: 'sl-q' }, s.head),
      h('div', { class: 'sl-guess' },
        h('div', { class: 'sl-hist' }, ...buckets.map((b) => h('i', { style: { height: `${(b / top) * 100}%` } }))),
        h('div', { class: 'sl-axis' }, h('span', {}, `${s.min}${s.unit ? ` ${s.unit}` : ''}`), h('span', {}, `${s.max}${s.unit ? ` ${s.unit}` : ''}`)),
        avg !== null ? h('div', { class: 'sl-mark is-avg', style: { left: pos(avg) } }, h('small', {}, `Average ${Math.round(avg * 10) / 10}`)) : null,
        reveal && s.ans !== undefined ? h('div', { class: 'sl-mark is-ans', style: { left: pos(s.ans) } }, h('small', {}, `Answer: ${s.ans}${s.unit ? ` ${s.unit}` : ''}`)) : null));
  }
  return h('div', { class: `slide sl-${s.t}`, style: { background: BGS[s.bg % BGS.length] } },
    ...kids,
    pin ? h('div', { class: 'sl-pin' }, h('small', {}, `Join at ${location.host}`), h('b', {}, `${pin.slice(0, 3)} ${pin.slice(3)}`), count ? h('small', {}, `${count} answered`) : null) : null);
}

/* ------------------------------------------------- PowerPoint import */

/** A button that reads a .pptx file and hands back its slides. */
function importButton(label, onSlides, { main = false } = {}) {
  const file = h('input', { type: 'file', accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation', hidden: true });
  const btn = h('button', { class: `btn${main ? ' btn-lg' : ''}`, type: 'button', onclick: () => file.click() }, icon('download', { size: 18 }), label);
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (!f) return;
    const was = btn.innerHTML;
    btn.disabled = true;
    try {
      const { readPptx } = await import('../services/pptx.js');
      const res = await readPptx(f, { onProgress: (i, n) => { btn.textContent = `Reading slide ${i} of ${n}…`; } });
      await onSlides(res);
      sfx('win');
      toast(`Imported ${res.slides.length} slides. Now add polls, quizzes and guesses between them!`, 'ok');
    } catch (e) { toast(e.message || 'Could not read that file', 'bad'); }
    btn.disabled = false; btn.innerHTML = was;
  });
  return h('span', {}, btn, file);
}

/* ---------------------------------------------------- list and editor */

export default async function Present({ params }) {
  pageTitle('Presentation+');
  const gate = await proGate();
  if (gate) return gate;
  if (params.id) return editor(params.id);
  const decks = (await D.myDecks()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const create = h('button', { class: 'btn btn-main btn-lg' }, icon('plus', { size: 18 }), 'New presentation');
  create.addEventListener('click', busy(create, async () => {
    const id = await D.saveDeck({ title: 'My presentation', slides: [D.blank('title'), D.blank('content'), D.blank('poll'), D.blank('quiz'), D.blank('guess')] });
    navigate(`/present/${id}`);
  }));
  return h('div', { class: 'page stack', style: { gap: '18px' } },
    h('section', { class: 'pres-hero' },
      h('div', { class: 'pres-badge' }, 'Presentation+'),
      h('h1', {}, 'Slides that talk back'),
      h('p', {}, 'Bring your PowerPoint, then add live polls, quiz questions and guess-the-number graphs between the slides. Your audience joins with a PIN and answers on their phones.'),
      h('div', { class: 'row' }, importButton('Import PowerPoint (.pptx)', async ({ title, slides }) => {
        const id = await D.saveDeck({ title, slides });
        navigate(`/present/${id}`);
      }, { main: true }), create),
      h('small', { class: 'pres-note' }, 'Google Slides and Keynote: use File → Download / Export as .pptx.')),
    decks.length
      ? h('div', { class: 'pres-grid' }, ...decks.map((d) => h('a', { class: 'pres-card', href: `/present/${d.id}` },
        h('div', { class: 'pres-thumb' }, d.slides && d.slides[0] ? slideView(d.slides[0]) : null),
        h('b', {}, d.title), h('small', { class: 'muted' }, `${(d.slides || []).length} slides`))))
      : h('div', { class: 'card flat' }, empty('No presentations yet', 'Press "New presentation" to make your first one. It starts with one of every kind of slide.')));
}

async function editor(id) {
  const deck = await D.getDeck(id).catch(() => null);
  if (!deck || deck.owner !== me().uid) return NotFound();
  deck.id = id;
  let cur = 0;
  let dirty = false;
  const title = h('input', { class: 'input pres-title', value: deck.title, maxlength: 80, 'aria-label': 'Presentation title' });
  title.addEventListener('input', () => { deck.title = title.value; dirty = true; });
  const rail = h('div', { class: 'pres-rail' });
  const form = h('div', { class: 'card stack pres-form' });
  const preview = h('div', { class: 'pres-preview' });
  const save = h('button', { class: 'btn' }, icon('check', { size: 16 }), 'Save');
  const present = h('button', { class: 'btn btn-main' }, icon('play', { size: 16 }), 'Present');
  const doSave = async () => { await D.saveDeck(deck); dirty = false; };
  save.addEventListener('click', busy(save, async () => { try { await doSave(); toast('Saved', 'ok'); } catch (e) { toast(explain(e), 'bad'); } }));
  present.addEventListener('click', busy(present, async () => { try { await doSave(); navigate(`/present/${id}/live`); } catch (e) { toast(explain(e), 'bad'); } }));

  const drawRail = () => fill(rail, ...deck.slides.map((s, i) => h('button', { class: `pres-mini${i === cur ? ' is-on' : ''}`, onclick: () => { cur = i; draw(); } },
    h('span', {}, String(i + 1)), h('div', { class: 'pres-thumb' }, slideView(s)))),
  h('div', { class: 'pres-add' }, ...D.KINDS.map(([t, label, ic]) => h('button', { class: 'btn btn-sm', title: `Add ${label}`, onclick: () => {
    if (deck.slides.length >= D.MAX_SLIDES) { toast(`At most ${D.MAX_SLIDES} slides`, 'bad'); return; }
    deck.slides.splice(cur + 1, 0, D.blank(t)); cur += 1; dirty = true; draw();
  } }, icon(ic, { size: 14 }), label))));
  const drawPreview = () => fill(preview, slideView(D.cleanSlide(deck.slides[cur])));
  const inp = (key, attrs = {}) => {
    const s = deck.slides[cur];
    const el = h(attrs.tag || 'input', { class: 'input', value: s[key] ?? '', ...attrs });
    if (attrs.tag === 'textarea') el.value = s[key] ?? '';
    el.addEventListener('input', () => { s[key] = attrs.type === 'number' ? Number(el.value) : el.value; dirty = true; drawPreview(); drawRail(); });
    return el;
  };
  const drawForm = () => {
    const s = deck.slides[cur];
    const kind = D.KINDS.find((k) => k[0] === s.t);
    const opts = () => h('div', { class: 'stack', style: { gap: '6px' } }, ...s.opts.map((o, i) => h('div', { class: 'row', style: { gap: '6px', flexWrap: 'nowrap' } },
      s.t === 'quiz' ? h('button', { class: `btn btn-sm${s.ans === i ? ' btn-ok' : ''}`, title: 'The right answer', onclick: () => { s.ans = i; dirty = true; drawForm(); drawPreview(); } }, icon('check', { size: 14 })) : null,
      (() => { const e = h('input', { class: 'input', value: o, maxlength: 60 }); e.addEventListener('input', () => { s.opts[i] = e.value; dirty = true; drawPreview(); }); return e; })(),
      s.opts.length > 2 ? h('button', { class: 'btn btn-sm btn-ghost', onclick: () => { s.opts.splice(i, 1); if (s.ans >= s.opts.length) s.ans = 0; dirty = true; drawForm(); drawPreview(); } }, icon('trash', { size: 14 })) : null)),
    s.opts.length < 6 ? h('button', { class: 'btn btn-sm', onclick: () => { s.opts.push(`Option ${s.opts.length + 1}`); dirty = true; drawForm(); drawPreview(); } }, icon('plus', { size: 14 }), 'Add option') : null);
    fill(form,
      h('div', { class: 'row spread' }, h('b', {}, icon(kind[2], { size: 16 }), ` ${kind[1]}`),
        h('div', { class: 'row', style: { gap: '6px' } },
          h('button', { class: 'btn btn-sm', disabled: cur === 0, onclick: () => { [deck.slides[cur - 1], deck.slides[cur]] = [deck.slides[cur], deck.slides[cur - 1]]; cur -= 1; dirty = true; draw(); } }, 'Up'),
          h('button', { class: 'btn btn-sm', disabled: cur === deck.slides.length - 1, onclick: () => { [deck.slides[cur + 1], deck.slides[cur]] = [deck.slides[cur], deck.slides[cur + 1]]; cur += 1; dirty = true; draw(); } }, 'Down'),
          deck.slides.length > 1 ? h('button', { class: 'btn btn-sm btn-ghost', onclick: () => { deck.slides.splice(cur, 1); cur = Math.max(0, cur - 1); dirty = true; draw(); } }, icon('trash', { size: 14 })) : null)),
      h('label', { class: 'field' }, h('span', {}, s.t === 'title' || s.t === 'content' ? 'Heading' : 'Question'), inp('head', { maxlength: 140 })),
      s.t === 'title' || s.t === 'content' ? h('label', { class: 'field' }, h('span', {}, s.t === 'title' ? 'Subtitle' : 'Points (one per line)'), inp('body', { tag: 'textarea', rows: 4, maxlength: 600 })) : null,
      s.t === 'content' && String(s.img || '').startsWith('data:')
        ? h('div', { class: 'field' }, h('span', {}, 'Picture (from PowerPoint)'), h('div', { class: 'row' }, h('img', { src: s.img, alt: '', style: { height: '70px', borderRadius: '8px' } }),
          h('button', { class: 'btn btn-sm btn-ghost', onclick: () => { s.img = ''; dirty = true; drawForm(); drawPreview(); drawRail(); } }, icon('trash', { size: 14 }), 'Remove picture')))
        : s.t === 'content' ? h('label', { class: 'field' }, h('span', {}, 'Picture link (optional)'), inp('img', { type: 'url', placeholder: 'https://…', maxlength: 290 })) : null,
      s.t === 'poll' || s.t === 'quiz' ? h('div', { class: 'field' }, h('span', {}, s.t === 'quiz' ? 'Answers (tick the right one)' : 'Choices'), opts()) : null,
      s.t === 'guess' ? h('div', { class: 'row' },
        h('label', { class: 'field grow' }, h('span', {}, 'From'), inp('min', { type: 'number' })),
        h('label', { class: 'field grow' }, h('span', {}, 'To'), inp('max', { type: 'number' })),
        h('label', { class: 'field grow' }, h('span', {}, 'Answer'), inp('ans', { type: 'number' })),
        h('label', { class: 'field grow' }, h('span', {}, 'Unit'), inp('unit', { maxlength: 12, placeholder: 'km, years…' }))) : null,
      h('div', { class: 'field' }, h('span', {}, 'Background'),
        h('div', { class: 'row', style: { gap: '6px' } }, ...BGS.map((bg, i) => h('button', { class: `pres-bg${(s.bg || 0) === i ? ' is-on' : ''}`, style: { background: bg }, 'aria-label': `Background ${i + 1}`, onclick: () => { s.bg = i; dirty = true; drawForm(); drawPreview(); drawRail(); } })))));
  };
  const draw = () => { drawRail(); drawForm(); drawPreview(); };
  draw();
  const delBtn = h('button', { class: 'btn btn-ghost' }, icon('trash', { size: 16 }), 'Delete');
  delBtn.addEventListener('click', async () => {
    if (!(await confirm({ title: 'Delete this presentation?', yes: 'Delete', danger: true }))) return;
    await D.removeDeck(id).catch(() => {}); navigate('/present');
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); }, { once: true });
  return h('div', { class: 'page pres-editor' },
    h('div', { class: 'row spread pres-top' }, h('div', { class: 'row grow' }, h('span', { class: 'pres-badge' }, 'Presentation+'), title),
      h('div', { class: 'row' }, importButton('Add from PowerPoint', ({ slides }) => {
        const room = D.MAX_SLIDES - deck.slides.length;
        deck.slides.splice(cur + 1, 0, ...slides.slice(0, room)); cur += 1; dirty = true; draw();
      }), delBtn, save, present)),
    h('p', { class: 'pres-tip' }, icon('info', { size: 16 }), 'Tip: pick a slide on the left, then press Fun poll, Quiz question or Guess the number to add one right after it.'),
    h('div', { class: 'pres-layout' }, rail, h('div', { class: 'stack' }, preview, form)));
}

/* ------------------------------------------------------- presenting */

export async function PresentLive({ params }) {
  const gate = await proGate();
  if (gate) return gate;
  const deck = await D.getDeck(params.id).catch(() => null);
  if (!deck || deck.owner !== me().uid || !deck.slides.length) return NotFound();
  pageTitle(deck.title);
  deck.id = params.id;
  const pin = await D.startShow(deck);
  let i = 0;
  let reveal = false;
  let votes = {};
  let off = () => {};
  const stage = h('div', { class: 'pres-stage' });
  const counter = h('span', { class: 'pres-count' });
  const revealBtn = h('button', { class: 'btn btn-main' }, 'Reveal answer');
  const draw = () => { fill(stage, slideView(deck.slides[i], { votes, reveal, pin, count: Object.keys(votes).length })); counter.textContent = `${i + 1} / ${deck.slides.length}`; revealBtn.hidden = !['quiz', 'guess'].includes(deck.slides[i].t) || reveal; };
  const go = async (k) => {
    i = Math.max(0, Math.min(deck.slides.length - 1, k));
    reveal = false; votes = {};
    off(); off = D.onVotes(pin, i, (v) => { votes = v; draw(); });
    await D.showSlide(pin, i, deck.slides[i], false).catch(() => {});
    sfx('pick'); draw();
  };
  revealBtn.addEventListener('click', async () => { reveal = true; await D.showSlide(pin, i, deck.slides[i], true).catch(() => {}); sfx('win'); celebrate(); draw(); });
  const key = (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') go(i + 1); if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1); };
  window.addEventListener('keydown', key);
  const end = async () => { window.removeEventListener('keydown', key); off(); await D.endShow(pin); navigate(`/present/${deck.id}`); };
  go(0);
  return h('div', { class: 'pres-live' },
    stage,
    h('div', { class: 'pres-controls' },
      h('button', { class: 'btn', onclick: () => go(i - 1) }, icon('arrowLeft', { size: 18 })),
      counter,
      h('button', { class: 'btn', onclick: () => go(i + 1) }, icon('arrowRight', { size: 18 })),
      revealBtn,
      h('button', { class: 'btn', onclick: () => document.documentElement.requestFullscreen?.().catch(() => {}) }, 'Full screen'),
      h('button', { class: 'btn btn-ghost', onclick: end }, 'End')));
}

/* --------------------------------------------------------- audience */

export async function Audience({ params }) {
  const pin = String(params.pin || '').replace(/\D/g, '');
  if (!me()) { try { await net.auth.anon(); } catch (e) { return h('div', { class: 'page narrow' }, h('p', {}, explain(e))); } }
  const meta = await D.showMeta(pin).catch(() => null);
  if (!meta) return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' }, h('h2', {}, 'No presentation with that PIN'), h('a', { class: 'btn btn-main', href: '/join' }, 'Try again')));
  pageTitle(meta.title);
  const box = h('div', { class: 'aud-box' });
  let mine = null;
  let last = -1;
  const draw = (cur) => {
    if (!cur) { fill(box, h('h2', {}, 'Waiting for the presenter…'), blook('owl', 96)); return; }
    const s = cur.s;
    if (cur.i !== last) { mine = null; last = cur.i; }
    const voteBtn = (v, label, col) => h('button', { class: `aud-opt${mine === v ? ' is-mine' : ''}${cur.reveal && s.t === 'quiz' ? (v === s.ans ? ' is-right' : ' is-wrong') : ''}`, style: { background: col }, disabled: mine !== null,
      onclick: async () => { mine = v; sfx('pick'); draw(cur); await D.vote(pin, cur.i, v).catch(() => {}); } }, label);
    if (s.t === 'poll' || s.t === 'quiz') {
      fill(box, h('h2', {}, s.head), h('div', { class: 'aud-opts' }, ...s.opts.map((o, k) => voteBtn(k, o, COLS[k % 6]))),
        mine !== null ? h('p', { class: 'aud-sent' }, cur.reveal && s.t === 'quiz' ? (mine === s.ans ? 'Correct! 🎉' : 'Not this time') : 'Sent! Look at the big screen.') : null);
      if (cur.reveal && s.t === 'quiz' && mine === s.ans) celebrate();
    } else if (s.t === 'guess') {
      const out = h('b', { class: 'aud-num' }, String(Math.round((s.min + s.max) / 2)));
      const slider = h('input', { type: 'range', min: s.min, max: s.max, step: (s.max - s.min) > 50 ? 1 : 0.1, value: (s.min + s.max) / 2, class: 'aud-range', disabled: mine !== null });
      slider.addEventListener('input', () => { out.textContent = slider.value; });
      const send = h('button', { class: 'btn btn-main btn-lg', disabled: mine !== null, onclick: async () => { mine = Number(slider.value); sfx('pick'); await D.vote(pin, cur.i, mine).catch(() => {}); draw(cur); } }, 'Lock in my guess');
      fill(box, h('h2', {}, s.head), out, slider, h('div', { class: 'row spread' }, h('small', {}, `${s.min}`), h('small', {}, `${s.max} ${s.unit || ''}`)),
        mine === null ? send : h('p', { class: 'aud-sent' }, cur.reveal ? `The answer: ${s.ans} ${s.unit || ''}. You guessed ${mine}.` : `You guessed ${mine}. Look at the big screen!`));
    } else {
      fill(box, h('div', { class: 'aud-look' }, logo(), h('h2', {}, s.head), h('p', {}, 'Look at the big screen')));
    }
  };
  const off = D.onCurrent(pin, draw);
  const root = h('div', { class: 'aud' }, h('div', { class: 'aud-top' }, h('b', {}, meta.title), h('span', { class: 'pres-badge' }, 'Presentation+')), box);
  return { el: root, destroy: off };
}
