// spacecraft.js — Spacecraft: blast asteroids, refuel with answers.
//
// Steer with the arrows / WASD, the mouse, or by dragging a thumb; the ship
// fires by itself while it has fuel. Small rocks are worth 10, medium 25,
// big 50. Fuel burns down; answer to refuel. A right answer also upgrades the
// cannon (up to three barrels); a wrong one drops it a level. Three shields:
// lose them all and the ship rebuilds after a moment, cannon reset.
//
// Rock points are counted on the device, so the host caps how quickly they
// may grow, which keeps a tampered browser from inventing a fortune.

import { makeCanvas, loop, controls, particles, shaker, drawBlook, rr, hashString } from '../arcade/engine.js';
import { sfx } from '../sound.js';

const MAX_RATE = 70;              // points per second the host will believe
const BURN = 5.5;                 // fuel per second
const SIZES = [{ r: 16, hp: 1, pts: 10 }, { r: 28, hp: 3, pts: 25 }, { r: 44, hp: 6, pts: 50 }];

/* ================================================================== host */

export function createHost({ live, players, dirty }) {
  const last = new Map();
  return {
    watch: ['prog'],
    join(p) { if (p.extra.k === undefined) Object.assign(p.extra, { k: 0, summary: '0 rocks' }); },
    grant(p, ok) { return ok ? 100 : 35; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.k !== 'number') continue;
        const was = last.get(uid) || { k: p.extra.k || 0, at: now - 1000 };
        const allowed = was.k + (MAX_RATE * (now - was.at)) / 1000 + 50;
        const k = Math.max(was.k, Math.min(Math.floor(v.k), allowed));
        const gained = k - was.k;
        last.set(uid, { k, at: now });
        p.extra.k = k;
        p.extra.rocks = Math.max(p.extra.rocks || 0, Number(v.n) || 0);
        p.extra.lvl = Math.max(1, Math.min(3, Number(v.l) || 1));
        p.extra.summary = `${p.extra.rocks} rocks`;
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
  };
}

/* ================================================================ player */

function stars(n, seed) {
  const out = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 16807) % 2147483647;
    const a = s / 2147483647;
    s = (s * 16807) % 2147483647;
    const b = s / 2147483647;
    out.push({ x: a, y: b, z: 0.3 + ((i * 7) % 10) / 10 });
  }
  return out;
}

function drawSpace(ctx, w, h, field, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#05071f');
  g.addColorStop(1, '#14246b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (const s of field) {
    const y = ((s.y * h + t * 90 * s.z) % h + h) % h;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + s.z * 0.5})`;
    ctx.fillRect(s.x * w, y, s.z * 2.4, s.z * 2.4);
  }
}

export function drawShip(ctx, x, y, blookId, { lvl = 1, flame = true, alpha = 1, size = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size, size);
  if (flame) {
    ctx.fillStyle = `rgba(255,${150 + Math.random() * 80 | 0},40,0.9)`;
    ctx.beginPath(); ctx.moveTo(-10, 26); ctx.lineTo(0, 44 + Math.random() * 14); ctx.lineTo(10, 26); ctx.fill();
  }
  ctx.fillStyle = '#ff4772';
  ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(-36, 28); ctx.lineTo(-14, 24); ctx.fill();
  ctx.beginPath(); ctx.moveTo(18, 6); ctx.lineTo(36, 28); ctx.lineTo(14, 24); ctx.fill();
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath(); ctx.moveTo(0, -38); ctx.bezierCurveTo(22, -22, 22, 14, 16, 28); ctx.lineTo(-16, 28); ctx.bezierCurveTo(-22, 14, -22, -22, 0, -38); ctx.fill();
  if (lvl >= 2) { ctx.fillStyle = '#ffcd1f'; ctx.fillRect(-30, 8, 6, 16); ctx.fillRect(24, 8, 6, 16); }
  if (lvl >= 3) { ctx.fillStyle = '#59f0ff'; ctx.fillRect(-3, -46, 6, 12); }
  ctx.fillStyle = '#59f0ff';
  ctx.beginPath(); ctx.arc(0, -6, 15, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawBlook(ctx, blookId, x, y - 6 * size, 24 * size, { alpha });
}

export function mountPlayer(game) {
  const { stage, live, uid } = game;
  const view = makeCanvas(stage);
  // drag anywhere (or move the mouse) and the ship follows; keys work too
  const ctl = controls(stage, { aim: true });
  const fx = particles();
  const shake = shaker();
  const field = stars(120, hashString(uid) || 7);
  const ship = { x: 0.5, y: 0.82, lvl: 1, shields: 3, fuel: 100, down: 0, inv: 0 };
  const bullets = [];
  const rocks = [];
  let pts = 0;
  let count = 0;
  let cool = 0;
  let spawn = 0;
  let lastProg = 0;
  let tSec = 0;
  let asked = false;
  game.grantText = (g) => (g >= 100 ? 'Full tank and a cannon upgrade' : `+${g}% fuel`);

  async function refuel() {
    if (game.asking) return;
    asked = true;
    const r = await game.ask({ title: 'Refuel your ship' });
    asked = false;
    if (!r || r.error || r.timeout || r.skip) return;
    ship.fuel = Math.min(100, ship.fuel + (r.g || 0));
    if (r.ok) { ship.lvl = Math.min(3, ship.lvl + 1); sfx('boost'); } else if (!r.poll) ship.lvl = Math.max(1, ship.lvl - 1);
  }

  const stop = loop((dt) => {
    tSec += dt;
    ctl.update();
    const { w, h } = view;
    fx.update(dt); shake.update(dt);
    if (game.asking) { ctl.clear(); return; }
    const over = game.timeLeft() <= 0;
    const level = Math.min(1, (game.meta.settings.minutes * 60000 - game.timeLeft()) / 240000);

    if (ship.down > 0) {
      ship.down -= dt;
      if (ship.down <= 0) { ship.shields = 3; ship.lvl = 1; ship.inv = 2; ship.x = 0.5; }
    } else if (!over) {
      // steering: keys / stick, or follow the pointer
      if (ctl.x || ctl.y) {
        ship.x += (ctl.x * 460 * dt) / w;
        ship.y += (ctl.y * 360 * dt) / h;
        ctl.aim = null;
      } else if (ctl.aim) {
        const tx = ctl.aim.x / w;
        const ty = ctl.aim.y / h;
        ship.x += (tx - ship.x) * Math.min(1, dt * 10);
        ship.y += (Math.max(0.45, ty) - ship.y) * Math.min(1, dt * 10);
      }
      ship.x = Math.max(0.04, Math.min(0.96, ship.x));
      ship.y = Math.max(0.45, Math.min(0.92, ship.y));
      if (ship.fuel > 0) {
        ship.fuel = Math.max(0, ship.fuel - BURN * dt);
        cool -= dt;
        if (cool <= 0) {
          cool = 0.2;
          const sx = ship.x * w;
          const sy = ship.y * h - 40;
          const shots = ship.lvl === 1 ? [0] : ship.lvl === 2 ? [-12, 12] : [-18, 0, 18];
          for (const o of shots) bullets.push({ x: sx + o, y: sy, vx: o * 6, vy: -900 });
          sfx('shoot');
        }
      } else if (!asked) { game.flash('Out of fuel: answer to refuel', 'is-bad'); refuel(); }
      ship.inv = Math.max(0, ship.inv - dt);
    }

    spawn -= dt;
    if (spawn <= 0 && !over) {
      spawn = Math.max(0.28, 0.9 - level * 0.55) * (0.6 + Math.random() * 0.8);
      const s = Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2;
      const size = SIZES[s];
      rocks.push({ x: Math.random() * w, y: -size.r * 2, r: size.r, hp: size.hp, s, vx: (Math.random() - 0.5) * 60, vy: 90 + Math.random() * 90 + level * 120, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 2, seed: Math.random() });
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -20) { bullets.splice(i, 1); continue; }
      for (const r of rocks) {
        if (r.hp > 0 && Math.hypot(b.x - r.x, b.y - r.y) < r.r + 4) {
          r.hp -= 1; bullets.splice(i, 1);
          fx.burst(b.x, b.y, { n: 4, color: '#ffcd1f', speed: 120, life: 0.25 });
          if (r.hp <= 0) {
            pts += SIZES[r.s].pts; count += 1;
            fx.burst(r.x, r.y, { n: 10 + r.s * 10, color: '#c9b7ff', speed: 200 + r.s * 60, size: 4 + r.s * 2 });
            shake.kick(2 + r.s * 3);
            sfx(r.s ? 'boom' : 'coin');
          }
          break;
        }
      }
    }
    const sx = ship.x * w;
    const sy = ship.y * h;
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
      if (r.hp <= 0 || r.y > h + 80) { rocks.splice(i, 1); continue; }
      if (ship.down <= 0 && ship.inv <= 0 && Math.hypot(r.x - sx, r.y - sy) < r.r + 22) {
        r.hp = 0;
        ship.shields -= 1;
        ship.inv = 1.2;
        shake.kick(14);
        sfx('bump');
        if (navigator.vibrate) navigator.vibrate(80);
        fx.burst(sx, sy, { n: 18, color: '#ff4772', speed: 260 });
        if (ship.shields <= 0) {
          ship.down = 2;
          fx.burst(sx, sy, { n: 50, color: '#ff8a2a', speed: 380, size: 6 });
          sfx('boom');
          game.flash('Ship down! Rebuilding…', 'is-bad');
        }
      }
    }
    game.setMeter('Fuel', ship.fuel / 100, `${Math.round(ship.fuel)}%`);
    const now = live.now();
    if (now - lastProg > 800) { lastProg = now; game.sendProg({ k: pts, n: count, l: ship.lvl }); }
  }, () => {
    const { ctx, w, h } = view;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    drawSpace(ctx, w, h, field, tSec);
    for (const r of rocks) {
      ctx.save();
      ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      ctx.fillStyle = ['#8f86c9', '#7a6fb8', '#6a5ea6'][r.s];
      ctx.beginPath();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const rr2 = r.r * (0.82 + ((Math.sin(k * 12.9898 + r.seed * 78.233) + 1) / 2) * 0.3);
        if (k) ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); else ctx.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.arc(r.r * 0.25, -r.r * 0.2, r.r * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffcd1f';
    for (const b of bullets) { rr(ctx, b.x - 3, b.y - 10, 6, 18, 3); ctx.fill(); }
    if (ship.down <= 0) {
      const blink = ship.inv > 0 && Math.floor(tSec * 14) % 2;
      drawShip(ctx, ship.x * w, ship.y * h, game.blook, { lvl: ship.lvl, flame: ship.fuel > 0, alpha: blink ? 0.4 : 1 });
      // shield pips
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < ship.shields ? '#59f0ff' : 'rgba(255,255,255,.2)';
        ctx.beginPath(); ctx.arc(ship.x * w - 14 + i * 14, ship.y * h + 52, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    fx.draw(ctx);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 26px "Lilita One", system-ui';
    ctx.fillText(`${count} rocks`, 16, 12);
  });

  return () => { stop(); ctl.destroy(); view.destroy(); };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const view = makeCanvas(el);
  const field = stars(160, 99);
  let t = 0;
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx, w, h } = view;
    view.begin();
    drawSpace(ctx, w, h, field, t);
    const list = ref.ranked().slice(0, 12);
    const cols = Math.min(6, Math.max(1, list.length));
    const rows = Math.ceil(list.length / cols) || 1;
    const cw = w / cols;
    const ch = Math.min(h / rows, 260);
    const top = (h - ch * rows) / 2;
    list.forEach((p, i) => {
      const cx = (i % cols) * cw + cw / 2;
      const cy = top + Math.floor(i / cols) * ch + ch / 2 + Math.sin(t * 2 + i) * 6;
      const size = Math.min(1.2, ch / 170);
      drawShip(ctx, cx, cy - 10, p.blook, { lvl: p.extra.lvl || 1, size });
      ctx.fillStyle = i === 0 ? '#ffcd1f' : '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = `800 ${Math.round(14 * size + 2)}px Nunito, system-ui`;
      ctx.fillText(`${i + 1}. ${p.name}`, cx, cy + 50 * size);
      ctx.font = `800 ${Math.round(12 * size + 2)}px Nunito, system-ui`;
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(`${p.score.toLocaleString()} pts · ${p.extra.rocks || 0} rocks`, cx, cy + 72 * size);
    });
  });
  return () => { stop(); view.destroy(); };
}
