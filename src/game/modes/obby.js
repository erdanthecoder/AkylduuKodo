// obby.js — Obby: climb one tall tower of platforms.
//
// Run left and right, jump from platform to platform. Every jump uses one
// from your jump meter; when it is empty, answer a question for more (10 for
// a right answer, 4 for a wrong one). Higher up the platforms start to move,
// crumble and bounce. Every 10th floor is a checkpoint you fall back to.
// 20 points a floor, 100 extra for each checkpoint.
//
// The tower is generated from the game PIN, so everyone climbs the same one.

import { makeCanvas, loop, controls, particles, shaker, drawBlook, nameTag, rng, hashString, rr, lerp } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

const TW = 520;                   // tower width in world units
const GAP = 118;                  // height between floors
const PR = 17;                    // half size of the player
const GRAV = 2300;
const JUMP = 940;
const RUN = 330;
const MAX_FLOOR_RATE = 3;         // floors per second the host will believe
const START_JUMPS = 12;

/**
 * Floor n of the tower. Floor 0 is the full-width ground. Each floor sits
 * within one jump's reach of the one below it.
 */
function floorOf(seed, n, prev) {
  if (n === 0) return { n, x: 0, w: TW, y: 0, kind: 'ground' };
  const r = rng(seed + n * 1013);
  const w = Math.max(80, 190 - n * 1.6 - r() * 40);
  const centre = prev.kind === 'ground' ? TW / 2 : prev.kind === 'move' ? TW / 2 : prev.x + prev.w / 2;
  const reach = 150 + r() * 60;
  const want = centre + (r() < 0.5 ? -1 : 1) * reach * (0.35 + r() * 0.65);
  const x = Math.max(20, Math.min(TW - 20 - w, want - w / 2));
  let kind = 'solid';
  if (n % 10 === 0) kind = 'check';
  else if (n > 8 && r() < Math.min(0.35, n * 0.01)) kind = 'move';
  else if (n > 16 && r() < 0.22) kind = 'crumble';
  else if (n > 5 && r() < 0.12) kind = 'bounce';
  const phase = r() * Math.PI * 2;
  const speed = 0.6 + r() * 0.8;
  // some platforms carry a crystal (+2 jumps) or spring boots (higher jumps)
  const gem = kind !== 'check' && r() < 0.24 ? (r() < 0.7 ? 'jumps' : 'spring') : null;
  return { n, x, w: kind === 'check' ? Math.max(w, 170) : w, y: n * GAP, kind, phase, speed, gem };
}

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const seen = new Map();
  return {
    watch: ['prog'],
    join(p) { if (p.extra.f === undefined) Object.assign(p.extra, { f: 0, summary: 'Floor 0' }); },
    grant(p, ok) { return ok ? 10 : 4; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.f !== 'number') continue;
        const was = seen.get(uid) || { f: p.extra.f || 0, at: now - 1000 };
        const allowed = was.f + Math.ceil((MAX_FLOOR_RATE * (now - was.at)) / 1000) + 1;
        const f = Math.max(was.f, Math.min(Math.floor(v.f), allowed));
        let gained = 0;
        for (let k = was.f + 1; k <= f; k++) gained += 20 + (k % 10 === 0 ? 100 : 0);
        seen.set(uid, { f, at: now });
        p.extra.f = f;
        p.extra.h = Math.max(0, Number(v.h) || 0);
        p.extra.summary = `Floor ${f}`;
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
    tick() {
      const tower = {};
      for (const p of players.values()) tower[p.uid] = p.extra.f || 0;
      live.set(P('tower'), tower).catch(() => {});
    },
  };
}

/* ================================================================ player */

function platformX(f, t) {
  if (f.kind !== 'move') return f.x;
  const span = TW - 40 - f.w;
  return 20 + (Math.sin(t * f.speed + f.phase) * 0.5 + 0.5) * span;
}

function drawBackdrop(ctx, w, h, camY, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const k = Math.min(1, camY / 9000);
  g.addColorStop(0, `rgb(${Math.round(lerp(47, 20, k))},${Math.round(lerp(155, 40, k))},${Math.round(lerp(255, 120, k))})`);
  g.addColorStop(1, `rgb(${Math.round(lerp(18, 60, k))},${Math.round(lerp(201, 30, k))},${Math.round(lerp(166, 140, k))})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // drifting clouds, slower than the tower
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 7; i++) {
    const x = ((i * 173 + t * (8 + i * 3)) % (w + 200)) - 100;
    const y = ((i * 211 + camY * 0.2) % (h + 120)) - 60;
    ctx.beginPath(); ctx.ellipse(x, y, 60 + i * 6, 18, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPlatform(ctx, f, x, y, t, crumbled) {
  const colours = { ground: '#17133f', solid: '#ffffff', move: '#ffcd1f', crumble: '#ff8a2a', bounce: '#12c9a6', check: '#6b4cff' };
  ctx.globalAlpha = crumbled ? 0.25 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rr(ctx, x + 3, y + 5, f.w, 18, 8); ctx.fill();
  ctx.fillStyle = colours[f.kind];
  rr(ctx, x, y, f.w, 18, 8); ctx.fill();
  if (f.kind === 'crumble') {
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + f.w * 0.3, y); ctx.lineTo(x + f.w * 0.36, y + 18); ctx.moveTo(x + f.w * 0.7, y); ctx.lineTo(x + f.w * 0.62, y + 18); ctx.stroke();
  }
  if (f.kind === 'bounce') {
    ctx.fillStyle = '#fff';
    for (let k = 0; k < 3; k++) { const cx = x + f.w * (0.25 + k * 0.25); ctx.fillRect(cx - 7, y - 6 - Math.abs(Math.sin(t * 6 + k)) * 3, 14, 6); }
  }
  if (f.kind === 'check') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + f.w - 26, y - 44, 4, 44);
    ctx.fillStyle = '#ffcd1f';
    ctx.beginPath(); ctx.moveTo(x + f.w - 22, y - 44); ctx.lineTo(x + f.w + 2 + Math.sin(t * 5) * 3, y - 36); ctx.lineTo(x + f.w - 22, y - 28); ctx.fill();
    ctx.font = '800 12px Nunito, system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`Floor ${f.n}`, x + f.w / 2, y + 9);
  }
  ctx.globalAlpha = 1;
}

export function mountPlayer(game) {
  const { stage, uid, live, P, meta } = game;
  const view = makeCanvas(stage);
  const ctl = controls(stage, { joystick: true, buttons: [{ id: 'action', label: 'Jump', className: 'is-right' }] });
  const fx = particles();
  const shake = shaker();
  const seed = hashString(`${meta.quizId}:${meta.createdAt || 0}`);
  const floors = new Map();
  const getFloor = (n) => {
    if (!floors.has(n)) {
      let k = n;
      while (k > 0 && !floors.has(k - 1)) k -= 1;
      for (; k <= n; k++) floors.set(k, floorOf(seed, k, floors.get(k - 1)));
    }
    return floors.get(n);
  };
  const crumble = new Map();      // floor -> seconds since stepped on
  const names = new Map();
  let tower = {};
  const unsubs = [];
  unsubs.push(live.on(P('players'), (v) => { for (const [u, p] of Object.entries(v || {})) names.set(u, p); preloadBlooks([...names.values()].map((p) => p.blook)); }));
  unsubs.push(live.on(P('tower'), (v) => { tower = v || {}; }));

  // world y grows upwards; screen y = base - (y - cam)
  const me = { x: TW / 2, y: 18, vx: 0, vy: 0, on: 0, face: 1, squash: 1 };
  let jumps = START_JUMPS;
  let springs = 0;                 // jumps left with spring boots
  const gemsTaken = new Set();
  let best = 0;
  let checkpoint = 0;
  let cam = 0;
  let lastProg = 0;
  let asked = false;
  let tSec = 0;
  game.grantText = (g) => `+${g} jumps`;
  // particles live in screen space; this converts a world point at burst time
  const geo = { s: 1, ox: 0, base: 0 };
  const pop = (x, y, opts) => fx.burst(geo.ox + x * geo.s, geo.base - (y - cam) * geo.s, opts);

  async function moreJumps() {
    if (game.asking) return;
    asked = true;
    const r = await game.ask({ title: 'Answer for more jumps' });
    asked = false;
    if (r && r.g) jumps += r.g;
  }

  const stop = loop((dt) => {
    tSec += dt;
    ctl.update();
    fx.update(dt); shake.update(dt);
    if (game.asking) { ctl.clear(); return; }
    const over = game.timeLeft() <= 0;
    const want = over ? 0 : ctl.x;
    me.vx = lerp(me.vx, want * RUN, me.on !== null ? 0.3 : 0.12);
    if (want) me.face = Math.sign(want);
    if (!over && (ctl.tapped('action') || ctl.tapped('up'))) {
      if (me.on !== null) {
        if (jumps > 0) {
          jumps -= 1;
          me.vy = springs > 0 ? JUMP * 1.3 : JUMP; me.on = null; me.squash = 0.7;
          if (springs > 0) springs -= 1;
          sfx('jump');
          if (jumps === 0) setTimeout(() => { if (jumps === 0 && !game.asking) moreJumps(); }, 900);
        } else if (!asked) { game.flash('No jumps left: answer for more', 'is-bad'); moreJumps(); }
      }
    }
    me.vy -= GRAV * dt;
    const prevY = me.y;
    me.x += me.vx * dt;
    me.y += me.vy * dt;
    me.x = Math.max(PR, Math.min(TW - PR, me.x));

    // landing: only when falling through the top of a platform
    if (me.vy <= 0) {
      const lo = Math.max(0, Math.floor((me.y - 40) / GAP));
      const hi = Math.floor((prevY + 10) / GAP);
      let landed = null;
      for (let n = hi; n >= lo; n--) {
        const f = getFloor(n);
        if ((crumble.get(n) || 0) > 0.8) continue;
        const fx2 = platformX(f, tSec);
        const top = f.y + 18;
        if (prevY >= top - 1 && me.y <= top && me.x + PR * 0.6 > fx2 && me.x - PR * 0.6 < fx2 + f.w) { landed = f; me.y = top; break; }
      }
      if (landed) {
        if (me.on === null) { me.squash = 1.25; sfx('land'); pop(me.x, me.y, { n: 6, color: '#fff', speed: 90, life: 0.3 }); }
        me.on = landed.n;
        me.vy = 0;
        if (landed.kind === 'bounce') { me.vy = JUMP * 1.45; me.on = null; sfx('boost'); }
        if (landed.kind === 'crumble' && !crumble.has(landed.n)) crumble.set(landed.n, 0.001);
        if (landed.gem && !gemsTaken.has(landed.n)) {
          gemsTaken.add(landed.n);
          if (landed.gem === 'jumps') { jumps += 2; game.flash('+2 jumps', 'is-ok'); } else { springs = 3; game.flash('Spring boots: 3 big jumps', 'is-ok'); }
          sfx('coin');
          pop(me.x, me.y + 20, { n: 16, color: landed.gem === 'jumps' ? '#59f0ff' : '#ff4772', speed: 200 });
        }
        if (landed.n > best) {
          best = landed.n;
          if (landed.n % 10 === 0) { checkpoint = landed.n; sfx('checkpoint'); game.flash(`Checkpoint: floor ${landed.n}`, 'is-ok'); pop(me.x, me.y + 20, { n: 30, color: '#ffcd1f', speed: 260 }); } else sfx('coin');
        }
      } else if (me.on !== null) {
        const f = getFloor(me.on);
        const fx2 = platformX(f, tSec);
        if (me.x + PR * 0.6 <= fx2 || me.x - PR * 0.6 >= fx2 + f.w || (crumble.get(me.on) || 0) > 0.8) me.on = null;
      }
    }
    // ride a moving platform
    if (me.on !== null && getFloor(me.on).kind === 'move') {
      const f = getFloor(me.on);
      me.x += platformX(f, tSec) - platformX(f, tSec - dt);
    }
    for (const [n, s] of crumble) {
      const next = s + dt;
      if (next > 3.5) crumble.delete(n); else crumble.set(n, next);
    }
    // fell well below the camera: back to the checkpoint
    if (me.y < cam - 260) {
      sfx('fall');
      shake.kick(8);
      const f = getFloor(checkpoint);
      me.x = platformX(f, tSec) + f.w / 2; me.y = f.y + 18; me.vy = 0; me.on = checkpoint;
      game.flash(`Fell! Back to floor ${checkpoint}`, 'is-bad');
    }
    me.squash = lerp(me.squash, 1, 0.2);
    cam = lerp(cam, Math.max(0, me.y - 160), 0.08);
    game.setMeter('Jumps', Math.min(1, jumps / 12), springs > 0 ? `${jumps} · spring x${springs}` : `${jumps}`);
    const now = live.now();
    if (now - lastProg > 600) { lastProg = now; game.sendProg({ f: best, h: Math.round(me.y) }); }
  }, () => {
    const { ctx, w, h } = view;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    drawBackdrop(ctx, w, h, cam, tSec);
    const s = Math.min(w / TW, h / 640);
    const ox = (w - TW * s) / 2;
    const base = h - 40;
    const sy = (y) => base - (y - cam) * s;
    Object.assign(geo, { s, ox, base });
    ctx.translate(ox, 0);
    // tower walls
    ctx.fillStyle = 'rgba(23,19,63,0.18)';
    ctx.fillRect(-8 * s, 0, 8 * s, h); ctx.fillRect(TW * s, 0, 8 * s, h);
    const lo = Math.max(0, Math.floor((cam - 80) / GAP));
    const hi = Math.ceil((cam + h / s + 80) / GAP);
    ctx.save();
    ctx.scale(s, s);
    for (let n = lo; n <= hi; n++) {
      const f = getFloor(n);
      const c = crumble.get(n) || 0;
      if (c > 0.8) continue;
      const shakeX = c > 0 ? (Math.random() - 0.5) * 4 : 0;
      drawPlatform(ctx, f, platformX(f, tSec) + shakeX, sy(f.y + 18) / s, tSec, false);
      if (f.gem && !gemsTaken.has(n)) {
        const gx = platformX(f, tSec) + f.w / 2;
        const gy = sy(f.y + 18) / s - 20 + Math.sin(tSec * 3 + n) * 3;
        ctx.save();
        ctx.shadowColor = f.gem === 'jumps' ? '#59f0ff' : '#ff4772'; ctx.shadowBlur = 14;
        ctx.fillStyle = f.gem === 'jumps' ? '#59f0ff' : '#ff4772';
        ctx.beginPath(); ctx.moveTo(gx, gy - 11); ctx.lineTo(gx + 8, gy); ctx.lineTo(gx, gy + 11); ctx.lineTo(gx - 8, gy); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    // others, as ghosts at their highest floor
    for (const [u, fl] of Object.entries(tower)) {
      if (u === uid) continue;
      const info = names.get(u);
      if (!info) continue;
      const f = getFloor(fl);
      const y = sy(f.y + 18) - 16 * s;
      if (y < -40 || y > h + 40) continue;
      const x = (platformX(f, tSec) + f.w / 2) * s + ((hashString(u) % 40) - 20) * s;
      drawBlook(ctx, info.blook, x, y, 30 * s, { alpha: 0.45 });
      nameTag(ctx, info.name, x, y - 18 * s, { bg: 'rgba(23,19,63,.4)', size: 10 });
    }
    drawBlook(ctx, game.blook, me.x * s, sy(me.y) - PR * s, PR * 2.2 * s, { squash: me.squash, flip: me.face < 0 });
    ctx.restore();
    fx.draw(ctx);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 28px "Lilita One", system-ui';
    ctx.fillText(`Floor ${best}`, 16, 12);
  });

  return () => { stop(); ctl.destroy(); view.destroy(); unsubs.forEach((u) => u()); };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const view = makeCanvas(el);
  let t = 0;
  const shown = new Map();
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx, w, h } = view;
    view.begin();
    drawBackdrop(ctx, w, h, 0, t);
    const list = ref.ranked().slice(0, 12);
    const top = Math.max(10, ...list.map((p) => p.extra.f || 0));
    const towerTop = Math.ceil((top + 3) / 10) * 10;
    const x0 = 90;
    const bottom = h - 40;
    const span = bottom - 40;
    // floor lines every 10
    ctx.font = '800 13px Nunito, system-ui'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (let f = 0; f <= towerTop; f += 10) {
      const y = bottom - (f / towerTop) * span;
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(x0, y, w - x0 - 20, 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(`${f}`, x0 - 10, y);
    }
    const colW = (w - x0 - 40) / Math.max(1, list.length);
    list.forEach((p, i) => {
      const target = bottom - ((p.extra.f || 0) / towerTop) * span;
      const y = lerp(shown.get(p.uid) ?? bottom, target, 0.08);
      shown.set(p.uid, y);
      const x = x0 + 20 + colW * i + colW / 2;
      ctx.fillStyle = 'rgba(23,19,63,.25)';
      rr(ctx, x - 6, y, 12, bottom - y, 6); ctx.fill();
      const size = Math.min(56, colW * 0.7);
      drawBlook(ctx, p.blook, x, y - size / 2 + Math.sin(t * 3 + i) * 3, size);
      nameTag(ctx, `${p.name} · ${p.extra.f || 0}`, x, y - size - 4, { size: 12, bg: i === 0 ? '#ffcd1f' : 'rgba(23,19,63,.8)', fg: i === 0 ? '#17133f' : '#fff' });
    });
  });
  return () => { stop(); view.destroy(); };
}
