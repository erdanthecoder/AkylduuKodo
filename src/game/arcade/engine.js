// engine.js — the small game engine every arcade mode is built on.
//
// A crisp canvas at any screen density, a fixed-rate update loop with smooth
// drawing between steps, keyboard + touch controls (a virtual joystick and
// buttons), particles, screen shake, seeded randomness and blook sprites.

import { blookImage } from '../../ui/blooks.js';

/* ----------------------------------------------------------------- canvas */

export function makeCanvas(parent) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  parent.append(canvas);
  const ctx = canvas.getContext('2d');
  const view = { canvas, ctx, w: 0, h: 0, dpr: 1 };
  const resize = () => {
    const r = parent.getBoundingClientRect();
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = Math.max(1, Math.round(r.width));
    view.h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    canvas.style.width = `${view.w}px`;
    canvas.style.height = `${view.h}px`;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  view.begin = () => { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.imageSmoothingEnabled = true; };
  view.destroy = () => { ro.disconnect(); canvas.remove(); };
  return view;
}

/* ------------------------------------------------------------------- loop */

/**
 * loop(update, draw): update(dt) runs at a fixed 60 steps a second, so the
 * physics are the same on every device; draw(alpha) runs once per frame.
 */
export function loop(update, draw) {
  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let running = true;
  const frame = (now) => {
    if (!running) return;
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 6) { update(STEP); acc -= STEP; steps++; }
    if (steps === 6) acc = 0;
    draw(acc / STEP);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const onVis = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); };
}

/* --------------------------------------------------------------- controls */

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'action', Enter: 'action', KeyJ: 'action', KeyK: 'action2', ShiftLeft: 'action2',
};

/**
 * controls(el, { joystick, buttons, aim }) — one state object for keyboard,
 * mouse and touch.
 *   state.x / state.y   movement, -1…1
 *   state.held(id)      a button (or its key) is down
 *   state.tapped(id)    pressed since the last call (one-shot)
 *   state.aim           {x, y} pointer position on the canvas, when aim is on
 */
export function controls(el, { joystick = false, buttons = [], aim = false } = {}) {
  const keys = new Set();
  const taps = new Set();
  const btnHeld = new Set();
  const state = { x: 0, y: 0, aim: null, aimDown: false, touch: matchMedia('(pointer: coarse)').matches };

  const onKey = (down) => (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    e.preventDefault();
    if (down && !keys.has(k)) taps.add(k);
    if (down) keys.add(k); else keys.delete(k);
  };
  const kd = onKey(true);
  const ku = onKey(false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  const blur = () => { keys.clear(); btnHeld.clear(); };
  window.addEventListener('blur', blur);

  const layer = document.createElement('div');
  layer.className = 'touch-layer';
  el.append(layer);

  // joystick: anywhere on the left half on touch screens
  let stick = null;
  const knob = document.createElement('div');
  knob.className = 'stick';
  knob.innerHTML = '<i></i>';
  if (joystick) layer.append(knob);
  const R = 46;

  const pads = buttons.map((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `touch-btn ${b.className || ''}`;
    btn.textContent = b.label;
    btn.setAttribute('aria-label', b.label);
    const down = (e) => { e.preventDefault(); if (!btnHeld.has(b.id)) taps.add(b.id); btnHeld.add(b.id); btn.classList.add('is-down'); };
    const up = (e) => { e.preventDefault(); btnHeld.delete(b.id); btn.classList.remove('is-down'); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    layer.append(btn);
    return btn;
  });

  const localPos = (e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pd = (e) => {
    if (e.target.closest && e.target.closest('.touch-btn, .q-overlay, button, input')) return;
    const p = localPos(e);
    if (joystick && e.pointerType !== 'mouse' && p.x < el.clientWidth * 0.5 && !stick) {
      stick = { id: e.pointerId, ox: p.x, oy: p.y };
      knob.style.left = `${p.x}px`; knob.style.top = `${p.y}px`;
      knob.classList.add('is-on');
      return;
    }
    if (aim) { state.aim = p; state.aimDown = true; taps.add('aim'); }
  };
  const pm = (e) => {
    const p = localPos(e);
    if (stick && e.pointerId === stick.id) {
      let dx = p.x - stick.ox;
      let dy = p.y - stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      state.sx = dx / R; state.sy = dy / R;
      knob.firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
      return;
    }
    if (aim && (e.pointerType === 'mouse' || state.aimDown)) state.aim = p;
  };
  const pu = (e) => {
    if (stick && e.pointerId === stick.id) {
      stick = null; state.sx = 0; state.sy = 0;
      knob.classList.remove('is-on');
      knob.firstChild.style.transform = '';
      return;
    }
    state.aimDown = false;
  };
  el.addEventListener('pointerdown', pd);
  window.addEventListener('pointermove', pm);
  window.addEventListener('pointerup', pu);
  window.addEventListener('pointercancel', pu);

  state.update = () => {
    let x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    let y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (state.sx || state.sy) { x = state.sx; y = state.sy; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    state.x = x; state.y = y;
  };
  state.held = (id) => keys.has(id) || btnHeld.has(id);
  state.tapped = (id) => { const t = taps.has(id); taps.delete(id); return t; };
  state.clear = () => { taps.clear(); };
  state.destroy = () => {
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    window.removeEventListener('blur', blur);
    el.removeEventListener('pointerdown', pd);
    window.removeEventListener('pointermove', pm);
    window.removeEventListener('pointerup', pu);
    window.removeEventListener('pointercancel', pu);
    layer.remove();
  };
  state.pads = pads;
  return state;
}

/* -------------------------------------------------------------- particles */

export function particles() {
  const list = [];
  return {
    burst(x, y, { n = 12, color = '#ffcd1f', speed = 220, life = 0.6, size = 5, gravity = 0 } = {}) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.6);
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color, size: size * (0.6 + Math.random() * 0.8), gravity });
      }
      if (list.length > 600) list.splice(0, list.length - 600);
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt;
        if (p.life <= 0) { list.splice(i, 1); continue; }
        p.vy += p.gravity * dt;
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    },
    draw(ctx) {
      for (const p of list) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + 0.5 * (p.life / p.max));
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* ------------------------------------------------------------------ shake */

export function shaker() {
  let power = 0;
  return {
    kick(p = 8) { power = Math.max(power, p); },
    update(dt) { power = Math.max(0, power - dt * 40); },
    apply(ctx) { if (power > 0.1) ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power); },
  };
}

/* ------------------------------------------------------------------ misc */

/** Seeded random numbers: the same seed gives every player the same world. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const lerp = (a, b, t) => a + (b - a) * t;

/** Draw a blook centred on (x, y), optionally flipped and squashed. */
export function drawBlook(ctx, id, x, y, size, { flip = false, squash = 1, alpha = 1, rot = 0 } = {}) {
  const img = blookImage(id);
  if (!img.complete || !img.naturalWidth) {
    ctx.fillStyle = '#6b4cff';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(flip ? -1 / squash : 1 / squash, squash);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/** A rounded rectangle path. */
export function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

/** Name tag above a player. */
export function nameTag(ctx, text, x, y, { bg = 'rgba(23,19,63,.75)', fg = '#fff', size = 12 } = {}) {
  ctx.font = `800 ${size}px Nunito, system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = bg;
  rr(ctx, x - w / 2, y - size - 6, w, size + 8, 7);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - size / 2 - 2);
}
