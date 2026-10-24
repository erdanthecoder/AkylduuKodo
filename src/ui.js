// ui.js — the few DOM helpers the whole site is built from.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  }
  children.flat().filter(Boolean).forEach((c) => el.append(c));
  return el;
}

/** A short, warm sound. Off by default — some children find it a distraction. */
export function sound(kind, on = true) {
  if (!on) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = kind === 'right' ? [523, 659, 784] : kind === 'done' ? [523, 659, 784, 1047] : [294, 247];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.2);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* sound is a nicety; never let it break a question */
  }
}

/** Paper shapes falling, for finishing. Stopped by the reduce-motion setting. */
export function cheer(count = 26) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const layer = h('div', { class: 'cheer' });
  for (let i = 0; i < count; i++) {
    const bit = h('i');
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.animationDelay = `${Math.random() * 0.4}s`;
    bit.style.setProperty('--tilt', `${Math.random() * 360}deg`);
    bit.style.setProperty('--hue', String(Math.floor(Math.random() * 5)));
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2600);
}
