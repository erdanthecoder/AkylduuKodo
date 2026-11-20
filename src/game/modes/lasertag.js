// lasertag.js — Laser Tag: a neon arena, everyone at once.
//
// Move with WASD / arrows or the left thumb; aim with the mouse or tap where
// to fire. Every shot uses a charge. Out of charges? Answer a question: a right
// answer gives 6, a wrong one 2. Tagging someone is worth 100 points; being
// tagged costs nothing but a few seconds out.
//
// Positions travel player → host → everyone. The host checks every tag
// against its own copy of where everyone is, and counts the charges itself,
// so a tampered browser cannot tag from across the map or fire forever.

import { h } from '../../ui/dom.js';
import { makeCanvas, loop, controls, particles, shaker, drawBlook, nameTag, hashString, lerp, rr } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

/* ------------------------------------------------------------------ world */

export const W = 1600;
export const H = 1000;
const R = 22;                     // player radius
const SPEED = 270;
const BEAM = 720;
const COOLDOWN = 0.32;
const DEAD_MS = 2600;
const SHIELD_MS = 1600;
const MAX_CHARGE = 15;
const START_CHARGE = 6;
const TAG_POINTS = 100;

export const WALLS = [
  [300, 190, 40, 260], [1260, 550, 40, 260],
  [690, 110, 220, 40], [690, 850, 220, 40],
  [520, 480, 200, 40], [880, 480, 200, 40], [780, 400, 40, 200],
  [170, 700, 230, 40], [1200, 260, 230, 40],
  [1060, 690, 40, 170], [500, 140, 40, 170],
];
const SPAWNS = [[90, 90], [1510, 90], [90, 910], [1510, 910], [800, 260], [800, 740], [430, 590], [1170, 420], [240, 470], [1360, 520]];
const COLOURS = ['#ff4772', '#2f9bff', '#ffcd1f', '#12c9a6', '#ff8a2a', '#a560ff', '#59f0ff', '#ff7ae0'];
export const colourOf = (uid) => COLOURS[hashString(uid) % COLOURS.length];

/** Distance along a ray to the first wall or edge. */
export function rayLength(x, y, a, max = BEAM) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = max;
  const boxes = [...WALLS, [-1000, -1000, W + 2000, 1000], [-1000, H, W + 2000, 1000], [-1000, 0, 1000, H], [W, 0, 1000, H]];
  for (const [rx, ry, rw, rh] of boxes) {
    let t0 = 0;
    let t1 = best;
    for (const [o, d, lo, hi] of [[x, dx, rx, rx + rw], [y, dy, ry, ry + rh]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) { t0 = Infinity; break; } continue; }
      let a1 = (lo - o) / d;
      let a2 = (hi - o) / d;
      if (a1 > a2) [a1, a2] = [a2, a1];
      t0 = Math.max(t0, a1);
      t1 = Math.min(t1, a2);
      if (t0 > t1) { t0 = Infinity; break; }
    }
    if (t0 !== Infinity && t0 >= 0 && t0 < best) best = t0;
  }
  return best;
}

/** How far point (px, py) is from the segment, and how far along it. */
function segDist(x1, y1, x2, y2, px, py) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / len2));
  return { d: Math.hypot(x1 + vx * t - px, y1 + vy * t - py), along: t };
}

function collide(p) {
  p.x = Math.max(R, Math.min(W - R, p.x));
  p.y = Math.max(R, Math.min(H - R, p.y));
  for (const [rx, ry, rw, rh] of WALLS) {
    const cx = Math.max(rx, Math.min(p.x, rx + rw));
    const cy = Math.max(ry, Math.min(p.y, ry + rh));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < R) {
      if (d > 0.001) { p.x = cx + (dx / d) * R; p.y = cy + (dy / d) * R; } else { p.y = ry - R; }
    }
  }
}

/* -------------------------------------------------------------- drawing */

function drawArena(ctx, t) {
  ctx.fillStyle = '#0d0b2e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(89,240,255,0.07)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 80) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  // pads at the spawn points
  for (const [x, y] of SPAWNS) {
    ctx.fillStyle = 'rgba(107,76,255,0.18)';
    ctx.beginPath(); ctx.arc(x, y, 34 + Math.sin(t * 2 + x) * 3, 0, Math.PI * 2); ctx.fill();
  }
  // walls glow
  ctx.save();
  ctx.shadowColor = '#59f0ff';
  ctx.shadowBlur = 18;
  for (const [x, y, w, h] of WALLS) {
    ctx.fillStyle = '#1d2a6e';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#59f0ff'; ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#ff4772'; ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
}

function drawPlayer(ctx, p, { me = false, t = 0, k = 1 } = {}) {
  const R = 22 * k;
  if (p.dead) {
    ctx.globalAlpha = 0.25;
    drawBlook(ctx, p.blook, p.x, p.y, R * 2.1, { rot: 0.4 });
    ctx.globalAlpha = 1;
    return;
  }
  const c = colourOf(p.uid);
  ctx.save();
  ctx.shadowColor = c; ctx.shadowBlur = 16;
  ctx.strokeStyle = c; ctx.lineWidth = me ? 5 : 4;
  ctx.beginPath(); ctx.arc(p.x, p.y, R + 5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // aiming notch
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.a) * (R + 11), p.y + Math.sin(p.a) * (R + 11), 5, 0, Math.PI * 2);
  ctx.fill();
  drawBlook(ctx, p.blook, p.x, p.y, R * 2.1, { flip: Math.cos(p.a) < 0 });
  if (p.shield) {
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 10) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(p.x, p.y, R + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  nameTag(ctx, p.name, p.x, p.y - R - 10, { bg: me ? '#ffcd1f' : 'rgba(23,19,63,.8)', fg: me ? '#17133f' : '#fff', size: Math.round(12 * k) });
}

function drawBeams(ctx, beams, now) {
  for (const b of beams) {
    const age = (now - b.at) / 380;
    if (age >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.shadowColor = b.c; ctx.shadowBlur = 20;
    ctx.strokeStyle = b.c; ctx.lineWidth = 7 * (1 - age) + 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.restore();
  }
}

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const beams = [];               // [{x1,y1,x2,y2,c,at}]
  const feed = [];                // [{a, b, at}]
  const pos = new Map();          // uid -> {x, y, a, s, at}
  const extra = (p) => p.extra;

  const api = {
    watch: ['prog'],
    beams, feed, pos,
    join(p) {
      const e = extra(p);
      if (e.ch === undefined) Object.assign(e, { ch: START_CHARGE, tags: 0, outs: 0, deadUntil: 0, shieldUntil: 0, lastShot: 0, summary: '0 tags' });
    },
    grant(p, ok) {
      const add = ok ? 6 : 2;
      p.extra.ch = Math.min(MAX_CHARGE, (p.extra.ch || 0) + add);
      return add;
    },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        if (!v || typeof v.x !== 'number') continue;
        const p = players.get(uid);
        if (!p) continue;
        const was = pos.get(uid);
        const next = { x: Math.max(R, Math.min(W - R, v.x)), y: Math.max(R, Math.min(H - R, v.y)), a: Number(v.a) || 0, s: v.s ? 1 : 0, at: now };
        // a respawn is the only time anyone may jump across the map
        if (was && p.extra.deadUntil > now) continue;
        pos.set(uid, next);
      }
    },
    act(p, a) {
      if (a.k !== 's') return;
      const now = live.now();
      const e = p.extra;
      const me = pos.get(p.uid);
      if (!me || e.deadUntil > now || me.s) return;
      if (now - e.lastShot < COOLDOWN * 1000 * 0.75) return;
      if ((e.ch || 0) <= 0) return;
      e.lastShot = now;
      e.ch -= 1;
      const ang = Number(a.a) || 0;
      const len = rayLength(me.x, me.y, ang);
      const x2 = me.x + Math.cos(ang) * len;
      const y2 = me.y + Math.sin(ang) * len;
      beams.push({ x1: me.x, y1: me.y, x2, y2, c: colourOf(p.uid), at: now });
      if (beams.length > 40) beams.splice(0, beams.length - 40);
      const target = a.h && players.get(a.h);
      const tp = target && pos.get(a.h);
      if (!target || !tp || target === p) return;
      const te = target.extra;
      if (te.deadUntil > now || te.shieldUntil > now || tp.s) return;
      // generous enough for a fast mover on a slow connection, not for a cheat
      const { d } = segDist(me.x, me.y, x2, y2, tp.x, tp.y);
      if (d > R + 34) return;
      te.deadUntil = now + DEAD_MS;
      te.shieldUntil = now + DEAD_MS + SHIELD_MS;
      te.outs += 1;
      e.tags += 1;
      e.summary = `${e.tags} tag${e.tags === 1 ? '' : 's'}`;
      p.score += TAG_POINTS;
      dirty.add(p.uid);
      feed.push({ a: p.name, b: target.name, ca: colourOf(p.uid), cb: colourOf(target.uid), at: now });
      if (feed.length > 6) feed.shift();
    },
    stop() { clearInterval(snapTimer); },
  };

  // the arena, as everyone sees it, about six times a second
  const snapTimer = setInterval(() => {
    const now = live.now();
    const p = {};
    for (const [uid, v] of pos) {
      const pl = players.get(uid);
      if (!pl) { pos.delete(uid); continue; }
      const e = pl.extra;
      const state = e.deadUntil > now ? 1 : (e.shieldUntil > now || v.s) ? 2 : 0;
      p[uid] = [Math.round(v.x), Math.round(v.y), Math.round(v.a * 100) / 100, state];
    }
    const b = beams.filter((x) => now - x.at < 400).map((x) => [Math.round(x.x1), Math.round(x.y1), Math.round(x.x2), Math.round(x.y2), x.c, x.at]);
    const d = {};
    for (const pl of players.values()) if (pl.extra.deadUntil > now) d[pl.uid] = pl.extra.deadUntil;
    const k = feed.filter((f) => now - f.at < 5000).map((f) => [f.a, f.b, f.at]);
    live.set(P('snap'), { t: now, p, b, d, k }).catch(() => {});
  }, 160);

  return api;
}

/* ================================================================ player */

export function mountPlayer(game) {
  const { stage, uid, live, P } = game;
  const view = makeCanvas(stage);
  const ctl = controls(stage, { joystick: true, aim: true, buttons: [{ id: 'recharge', label: 'Recharge', className: 'is-right is-small' }] });
  const fx = particles();
  const shake = shaker();
  const names = new Map();
  const others = new Map();       // uid -> drawn state, eased towards the snapshot
  let beams = [];
  const unsubs = [];

  unsubs.push(live.on(P('players'), (val) => {
    for (const [u, p] of Object.entries(val || {})) names.set(u, p);
    preloadBlooks([...names.values()].map((p) => p.blook));
  }));

  const spawn = SPAWNS[hashString(uid) % SPAWNS.length];
  const me = { uid, name: game.name, blook: game.blook, x: spawn[0], y: spawn[1], a: 0, dead: false, shield: true };
  let charges = START_CHARGE;
  let cool = 0;
  let deadUntil = 0;
  let shieldUntil = live.now() + SHIELD_MS;
  let lastSent = 0;
  let lastSentState = '';
  let killer = '';
  const seenFeed = new Set();

  game.grantText = (g) => `+${g} charges`;
  const meter = () => game.setMeter('Laser', charges / MAX_CHARGE, `${charges}`);
  meter();

  unsubs.push(live.on(P('snap'), (s) => {
    if (!s) return;
    const seen = new Set();
    for (const [u, [x, y, a, st]] of Object.entries(s.p || {})) {
      if (u === uid) continue;
      seen.add(u);
      const o = others.get(u) || { uid: u, x, y, a, tx: x, ty: y };
      Object.assign(o, { tx: x, ty: y, a, dead: st === 1, shield: st === 2 });
      const info = names.get(u);
      if (info) { o.name = info.name; o.blook = info.blook; }
      others.set(u, o);
    }
    for (const u of [...others.keys()]) if (!seen.has(u)) others.delete(u);
    for (const [x1, y1, x2, y2, c, at] of s.b || []) {
      if (!beams.some((b) => b.at === at && b.x1 === x1)) {
        beams.push({ x1, y1, x2, y2, c, at, local: live.now() });
        if (Math.hypot(x1 - me.x, y1 - me.y) < 700) sfx('laser');
      }
    }
    beams = beams.filter((b) => live.now() - b.local < 400);
    const until = s.d && s.d[uid];
    if (until && until > deadUntil) {
      deadUntil = until;
      shieldUntil = until + SHIELD_MS;
      me.dead = true;
      const f = (s.k || []).filter((k) => k[1] === game.name).pop();
      killer = f ? f[0] : '';
      fx.burst(me.x, me.y, { n: 30, color: colourOf(uid), speed: 320 });
      shake.kick(14);
      sfx('tagged');
      if (navigator.vibrate) navigator.vibrate(120);
    }
    for (const [a, b, at] of s.k || []) {
      const key = `${a}|${b}|${at}`;
      if (seenFeed.has(key)) continue;
      seenFeed.add(key);
      if (a === game.name) { game.flash(`You tagged ${b}  +${TAG_POINTS}`, 'is-ok'); sfx('coin'); }
    }
  }));

  async function recharge() {
    if (game.asking) return;
    me.shield = true;
    const r = await game.ask({ title: 'Recharge your laser' });
    if (r && r.g) charges = Math.min(MAX_CHARGE, charges + r.g);
    meter();
  }

  function fire() {
    if (cool > 0 || me.dead || game.asking) return;
    if (charges <= 0) { recharge(); return; }
    cool = COOLDOWN;
    charges -= 1;
    meter();
    const len = rayLength(me.x, me.y, me.a);
    const x2 = me.x + Math.cos(me.a) * len;
    const y2 = me.y + Math.sin(me.a) * len;
    // what did it hit? the nearest rival the beam passes through
    let hit = '';
    let bestAlong = 2;
    for (const o of others.values()) {
      if (o.dead || o.shield) continue;
      const { d, along } = segDist(me.x, me.y, x2, y2, o.x, o.y);
      if (d <= R + 6 && along < bestAlong) { bestAlong = along; hit = o.uid; }
    }
    beams.push({ x1: me.x, y1: me.y, x2, y2, c: colourOf(uid), at: -1, local: live.now(), mine: true });
    fx.burst(x2, y2, { n: 8, color: colourOf(uid), speed: 160, life: 0.3 });
    sfx('laser');
    game.sendAct({ k: 's', a: Math.round(me.a * 1000) / 1000, h: hit });
    if (charges === 0) setTimeout(() => { if (!game.asking && charges === 0) recharge(); }, 500);
  }

  let tSec = 0;
  const stop = loop((dt) => {
    tSec += dt;
    ctl.update();
    const now = live.now();
    if (me.dead && now >= deadUntil) {
      const s = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
      me.x = s[0]; me.y = s[1]; me.dead = false;
      fx.burst(me.x, me.y, { n: 20, color: '#fff', speed: 200 });
    }
    me.shield = game.asking || now < shieldUntil;
    if (!me.dead && !game.asking) {
      me.x += ctl.x * SPEED * dt;
      me.y += ctl.y * SPEED * dt;
      collide(me);
      if (ctl.aim) {
        const cam = camera();
        const wx = (ctl.aim.x - cam.ox) / cam.s;
        const wy = (ctl.aim.y - cam.oy) / cam.s;
        me.a = Math.atan2(wy - me.y, wx - me.x);
      } else if (ctl.x || ctl.y) me.a = Math.atan2(ctl.y, ctl.x);
      if (ctl.tapped('aim') || ctl.tapped('action') || (ctl.held('action') && cool <= 0)) fire();
      if (ctl.tapped('recharge')) recharge();
    } else ctl.clear();
    cool = Math.max(0, cool - dt);
    for (const o of others.values()) { o.x = lerp(o.x, o.tx, 0.25); o.y = lerp(o.y, o.ty, 0.25); }
    fx.update(dt);
    shake.update(dt);
    // send where we are, about eight times a second
    const state = `${Math.round(me.x)},${Math.round(me.y)},${Math.round(me.a * 20)},${me.shield ? 1 : 0}`;
    if (now - lastSent > 125 && state !== lastSentState) {
      lastSent = now; lastSentState = state;
      game.sendProg({ x: Math.round(me.x), y: Math.round(me.y), a: Math.round(me.a * 100) / 100, s: me.shield ? 1 : 0 });
    }
  }, () => {
    const { ctx } = view;
    view.begin();
    ctx.fillStyle = '#07061c';
    ctx.fillRect(0, 0, view.w, view.h);
    const cam = camera();
    ctx.save();
    shake.apply(ctx);
    ctx.translate(cam.ox, cam.oy);
    ctx.scale(cam.s, cam.s);
    drawArena(ctx, tSec);
    drawBeams(ctx, beams.map((b) => ({ ...b, at: b.local })), live.now());
    for (const o of others.values()) if (o.name) drawPlayer(ctx, o, { t: tSec });
    drawPlayer(ctx, me, { me: true, t: tSec });
    fx.draw(ctx);
    ctx.restore();
    if (me.dead) {
      ctx.fillStyle = 'rgba(255,71,114,0.25)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '400 34px "Lilita One", system-ui';
      ctx.fillText(killer ? `Tagged by ${killer}` : 'Tagged', view.w / 2, view.h / 2 - 10);
      ctx.font = '800 16px Nunito, system-ui';
      ctx.fillText(`Back in ${Math.max(0, Math.ceil((deadUntil - live.now()) / 1000))}`, view.w / 2, view.h / 2 + 24);
    }
  });

  function camera() {
    // about 1250 world units across the longer side of the screen
    const s = Math.max(0.5, Math.min(1.1, Math.max(view.w, view.h) / 1250));
    let ox = view.w / 2 - me.x * s;
    let oy = view.h / 2 - me.y * s;
    // keep the arena edges on screen when it is smaller than the view
    if (W * s <= view.w) ox = (view.w - W * s) / 2; else ox = Math.min(0, Math.max(view.w - W * s, ox));
    if (H * s <= view.h) oy = (view.h - H * s) / 2; else oy = Math.min(0, Math.max(view.h - H * s, oy));
    return { s, ox, oy };
  }

  return () => {
    stop(); ctl.destroy(); view.destroy();
    unsubs.forEach((u) => u());
  };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref, live }) {
  const view = makeCanvas(el);
  const mh = () => ref.modeHost;
  let t = 0;
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx } = view;
    view.begin();
    ctx.fillStyle = '#07061c';
    ctx.fillRect(0, 0, view.w, view.h);
    const s = Math.min(view.w / W, view.h / H) * 0.96;
    ctx.save();
    ctx.translate((view.w - W * s) / 2, (view.h - H * s) / 2);
    ctx.scale(s, s);
    drawArena(ctx, t);
    const host = mh();
    if (host) {
      const now = live.now();
      drawBeams(ctx, host.beams, now);
      for (const [uid, v] of host.pos) {
        const p = ref.players.get(uid);
        if (!p) continue;
        drawPlayer(ctx, { uid, name: p.name, blook: p.blook, x: v.x, y: v.y, a: v.a, dead: p.extra.deadUntil > now, shield: p.extra.shieldUntil > now || v.s }, { t, k: 1.5 });
      }
    }
    ctx.restore();
    // tag feed
    if (host) {
      const now = live.now();
      let y = 18;
      for (const f of host.feed.filter((x) => now - x.at < 5000).slice(-4)) {
        const text = `${f.a}  tagged  ${f.b}`;
        ctx.font = '800 15px Nunito, system-ui';
        const w = ctx.measureText(text).width + 24;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        rr(ctx, view.w - w - 16, y, w, 30, 10); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(text, view.w - w - 4, y + 15);
        y += 38;
      }
    }
  });
  return () => { stop(); view.destroy(); };
}

export const screenNote = () => h('span', {}, 'Tag rivals with your laser. Answer questions to recharge.');
