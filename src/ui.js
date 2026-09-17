// ui.js — tiny DOM helpers. No framework, on purpose: everything here is
// readable by a learner who finishes Unit 5.

import { icon } from './icons.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(3)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** A very small Markdown subset: fenced code, **bold**, `code`, lists, blank-line paragraphs. */
export function md(text) {
  const src = String(text || '');
  const blocks = src.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const fenced = block.match(/^```[a-z]*\n([\s\S]*?)\n?```$/);
      if (fenced) return `<pre class="md-pre"><code>${escapeHtml(fenced[1])}</code></pre>`;
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return '<ul>' + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('') + '</ul>';
      }
      if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
        return '<ol>' + lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('') + '</ol>';
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

const MARK_OPEN = '@@hl';
const MARK_CLOSE = 'lh@@';

/** Syntax highlighting for read-only code samples. */
export function highlight(code) {
  const KEYWORDS = /\b(let|const|var|function|return|if|else|for|while|of|in|true|false|null|undefined|new|break|continue)\b/g;
  const BUILTINS = /\b(console|Math|log|push|length|toUpperCase|repeat|round|max|forward|turnLeft|turnRight|collect|canMove|print|trim)\b/g;
  const stash = [];
  const keep = (html) => `${MARK_OPEN}${stash.push(html) - 1}${MARK_CLOSE}`;

  let out = escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, (m) => keep(`<span class="tok-com">${m}</span>`))
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`[^`]*`)/g, (m) => keep(`<span class="tok-str">${m}</span>`))
    .replace(KEYWORDS, (m) => keep(`<span class="tok-kw">${m}</span>`))
    .replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => keep(`<span class="tok-num">${m}</span>`))
    .replace(BUILTINS, (m) => keep(`<span class="tok-fn">${m}</span>`));

  return out.replace(new RegExp(`${MARK_OPEN}(\\d+)${MARK_CLOSE}`, 'g'), (_, i) => stash[Number(i)]);
}

export function codeBlock(code, extraClass = '') {
  return h('pre', { class: `code-sample ${extraClass}` }, h('code', { html: highlight(code) }));
}

let toastTimer = null;
export function toast(message, kind = 'info') {
  let host = $('#toast');
  if (!host) {
    host = h('div', { id: 'toast' });
    document.body.append(host);
  }
  host.className = `toast toast-${kind} show`;
  host.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('show'), 2800);
}

const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--blue)', 'var(--purple)', 'var(--ok)'];
const CONFETTI_SHAPES = ['sq', 'circ', 'bar'];

export function confetti(count = 28) {
  // Calm mode and prefers-reduced-motion both mean: no falling paper.
  if (document.documentElement.dataset.motion === 'calm'
    || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const layer = h('div', { class: 'confetti-layer' });
  for (let i = 0; i < count; i++) {
    const shape = CONFETTI_SHAPES[i % CONFETTI_SHAPES.length];
    const piece = h('span', { class: `confetti confetti-${shape}` });
    piece.style.left = Math.random() * 100 + '%';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2600);
}

// --- sound: short synthesised blips, no asset files ---
let audioCtx = null;
export function sfx(kind, enabled = true) {
  if (!enabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      good: [660, 880],
      great: [523, 659, 784, 1047],
      bad: [220, 165],
      click: [440],
      badge: [784, 988, 1319],
    }[kind] || [440];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = audioCtx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    /* audio is a nice-to-have */
  }
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Filled / empty stars, drawn as icons rather than characters. */
export function starRow(filled, total = 3, size = 18) {
  const row = h('span', { class: 'stars' });
  for (let i = 0; i < total; i++) {
    const s = icon('star', { size, cls: i < filled ? 'star-on' : 'star-off' });
    row.append(s);
  }
  return row;
}
