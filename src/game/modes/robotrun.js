// robotrun.js — Robot Run: an endless race on one shared course.
//
// Your blook rides a little robot that runs by itself. Tap, click or press
// Space to jump (twice for a double jump) over crates and spikes. Running
// drains the battery; when it is flat the robot crawls. Answer a question to
// recharge: a right answer also fires a speed boost. Bolts on the track top
// the battery up a little. One point per metre, plus points for answers.
//
// Everyone runs the same course (it is generated from the game PIN), and the
// other racers appear as ghosts. The host caps how fast anyone's distance may
// grow, so a tampered browser cannot teleport to the front.

import { makeCanvas, loop, controls, particles, shaker, drawBlook, nameTag, rng, hashString, rr, lerp } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { sfx } from '../sound.js';

const PX = 40;                    // pixels per metre
const BASE = 8;                   // m/s
const MAX_RATE = 17;              // m/s the host will believe, boosts included
const DRAIN = 4.2;                // battery per second
const CHUNK = 28;                 // metres of course per generated chunk

/** Obstacles and bolts for one chunk of the course. Same for everyone. */
function chunk(seed, i) {
  const r = rng(seed + i * 7919);
  const out = [];
  if (i === 0) return out;        // a clear run-up
  const n = 1 + Math.floor(r() * (i > 6 ? 3 : 2));
  let at = i * CHUNK + 4 + r() * 4;
  for (let k = 0; k < n && at < (i + 1) * CHUNK - 3; k++) {
    const kind = r() < 0.6 ? 'crate' : 'spike';
    const tall = kind === 'crate' && i > 4 && r() < 0.35 ? 2 : 1;
    out.push({ kind, x: at, w: kind === 'crate' ? 1 : 1.4, h: tall });
    if (r() < 0.5) out.push({ kind: 'bolt', x: at + (r() < 0.5 ? 0 : 3), y: tall + 1.6 + r() * 1.6, got: false });
    at += 7 + r() * 9 - Math.min(3, i * 0.08);
  }
  return out;
}

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const dist = new Map();         // uid -> {d, at}
  return {
    watch: ['prog'],
    dist,
    join(p) { if (p.extra.d === undefined) Object.assign(p.extra, { d: 0, summary: '0 m' }); },
    grant(p, ok) { return ok ? 60 : 22; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.d !== 'number') continue;
        const was = dist.get(uid) || { d: p.extra.d || 0, at: now - 1000 };
        const allowed = was.d + (MAX_RATE * (now - was.at)) / 1000 + 4;
        const d = Math.max(was.d, Math.min(v.d, allowed));
        const gained = Math.floor(d) - Math.floor(was.d);
        dist.set(uid, { d, at: now });
        p.extra.d = d;
        p.extra.summary = `${Math.floor(d)} m`;
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
    tick() {
      const race = {};
      for (const p of players.values()) race[p.uid] = Math.floor(p.extra.d || 0);
      live.set(P('race'), race).catch(() => {});
    },
  };
}

/* ================================================================ player */

function drawSky(ctx, w, h, off) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff8a2a');
  g.addColorStop(0.55, '#ff4772');
  g.addColorStop(1, '#6b2a8f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.26, Math.min(w, h) * 0.09, 0, Math.PI * 2); ctx.fill();
  // two layers of city, slower the further away
  for (const [speed, colour, base, step] of [[0.15, 'rgba(60,20,90,0.45)', 0.62, 90], [0.4, 'rgba(40,12,70,0.7)', 0.7, 70]]) {
    ctx.fillStyle = colour;
    const shift = (off * speed) % (step * 4);
    for (let x = -shift - step * 4; x < w + step * 4; x += step) {
      const k = Math.abs(Math.floor((x + off * speed) / step)) % 5;
      const bh = h * (0.08 + k * 0.035);
      ctx.fillRect(x, h * base - bh, step * 0.82, bh + h);
    }
  }
}

export function mountPlayer(game) {
  const { stage, uid, live, P, meta } = game;
  const view = makeCanvas(stage);
  const ctl = controls(stage, { buttons: [{ id: 'action', label: 'Jump', className: 'is-right' }] });
  const fx = particles();
  const shake = shaker();
  const seed = hashString(`${meta.quizId}:${game.meta.createdAt || 0}`);
  const chunks = new Map();
  const names = new Map();
  let race = {};
  const unsubs = [];

  unsubs.push(live.on(P('players'), (v) => { for (const [u, p] of Object.entries(v || {})) names.set(u, p); preloadBlooks([...names.values()].map((p) => p.blook)); }));
  unsubs.push(live.on(P('race'), (v) => { race = v || {}; }));

  const bot = { d: 0, y: 0, vy: 0, jumps: 0, stumble: 0, boost: 0, battery: 100, squash: 1, onGround: true };
  let lastProg = 0;
  let asked = false;
  game.grantText = (g) => `+${g}% battery${g >= 60 ? ' and a boost' : ''}`;

  const obstaclesNear = (from, to) => {
    const out = [];
    for (let i = Math.max(0, Math.floor(from / CHUNK)); i <= Math.floor(to / CHUNK); i++) {
      if (!chunks.has(i)) chunks.set(i, chunk(seed, i));
      out.push(...chunks.get(i));
    }
    if (chunks.size > 40) for (const k of chunks.keys()) if (k < from / CHUNK - 3) chunks.delete(k);
    return out;
  };

  async function recharge() {
    if (game.asking) return;
    asked = true;
    const r = await game.ask({ title: 'Recharge your robot' });
    asked = false;
    if (r && r.g) {
      bot.battery = Math.min(100, bot.battery + r.g);
      if (r.ok) { bot.boost = 3.2; sfx('boost'); fx.burst(view.w * 0.28, groundY() - 30, { n: 26, color: '#59f0ff', speed: 300 }); }
    }
  }

  const groundY = () => Math.round(view.h * 0.8);
  let tSec = 0;

  const stop = loop((dt) => {
    tSec += dt;
    ctl.update();
    if (game.asking) { ctl.clear(); return; }
    const flat = bot.battery <= 0;
    let speed = flat ? 2 : BASE + Math.min(4, bot.d / 400);
    if (bot.boost > 0) { speed *= 1.55; bot.boost -= dt; }
    if (bot.stumble > 0) { speed *= 0.3; bot.stumble -= dt; }
    if (game.timeLeft() <= 0) speed = 0;
    bot.d += speed * dt;
    bot.battery = Math.max(0, bot.battery - DRAIN * dt);
    if (flat && !asked) { game.flash('Battery flat: answer to recharge', 'is-bad'); recharge(); }

    if (ctl.tapped('action') || ctl.tapped('up') || ctl.tapped('aim')) {
      if (bot.onGround || bot.jumps < 2) {
        bot.vy = bot.onGround ? 15.5 : 13;
        bot.jumps += 1;
        bot.onGround = false;
        bot.squash = 0.75;
        sfx('jump');
      }
    }
    bot.vy -= 42 * dt;
    bot.y += bot.vy * dt;
    if (bot.y <= 0) {
      if (!bot.onGround) { bot.squash = 1.3; sfx('land'); }
      bot.y = 0; bot.vy = 0; bot.onGround = true; bot.jumps = 0;
    }
    bot.squash = lerp(bot.squash, 1, 0.2);

    // the robot is about 0.8 m wide and 1 m tall
    for (const o of obstaclesNear(bot.d - 2, bot.d + 2)) {
      if (o.kind === 'bolt') {
        if (!o.got && Math.abs(o.x - bot.d) < 0.7 && Math.abs(o.y - (bot.y + 0.6)) < 0.9) {
          o.got = true; bot.battery = Math.min(100, bot.battery + 8); sfx('coin');
          fx.burst(view.w * 0.28, groundY() - (bot.y + 0.6) * PX, { n: 10, color: '#ffcd1f', speed: 180 });
        }
        continue;
      }
      if (o.hit) continue;
      const overlapX = bot.d + 0.4 > o.x && bot.d - 0.4 < o.x + o.w;
      const tall = o.kind === 'spike' ? 0.7 : o.h;
      if (overlapX && bot.y < tall - 0.05) {
        o.hit = true;
        bot.stumble = 1.1;
        bot.boost = 0;
        shake.kick(10);
        sfx('bump');
        if (navigator.vibrate) navigator.vibrate(60);
        fx.burst(view.w * 0.28, groundY() - 20, { n: 16, color: o.kind === 'spike' ? '#ffffff' : '#c07a3a', speed: 240, gravity: 600 });
      }
    }
    fx.update(dt);
    shake.update(dt);
    game.setMeter('Battery', bot.battery / 100, `${Math.round(bot.battery)}%`);
    const now = live.now();
    if (now - lastProg > 500) { lastProg = now; game.sendProg({ d: Math.round(bot.d * 10) / 10 }); }
  }, () => {
    const { ctx, w, h } = view;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    const off = bot.d * PX;
    drawSky(ctx, w, h, off);
    const gy = groundY();
    const botX = w * 0.28;
    // ground
    ctx.fillStyle = '#2a1650';
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = '#3f2475';
    const stripe = 80;
    for (let x = -(off % stripe); x < w; x += stripe) ctx.fillRect(x, gy + 8, stripe * 0.5, 8);
    ctx.fillStyle = '#ffcd1f';
    ctx.fillRect(0, gy, w, 4);
    // distance marks every 50 m
    ctx.font = '800 13px Nunito, system-ui'; ctx.textAlign = 'center';
    for (let m = Math.floor((bot.d - 10) / 50) * 50; m < bot.d + w / PX; m += 50) {
      if (m <= 0) continue;
      const x = botX + (m - bot.d) * PX;
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - 1, gy, 2, 26);
      ctx.fillStyle = '#fff'; ctx.fillText(`${m} m`, x, gy + 42);
    }
    // the course
    for (const o of obstaclesNear(bot.d - botX / PX - 2, bot.d + (w - botX) / PX + 2)) {
      const x = botX + (o.x - bot.d) * PX;
      if (o.kind === 'crate') {
        for (let k = 0; k < o.h; k++) {
          const y = gy - (k + 1) * PX;
          ctx.fillStyle = o.hit ? '#8a5a2a' : '#d98b3a';
          rr(ctx, x, y, o.w * PX, PX - 2, 6); ctx.fill();
          ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + PX - 6, y + PX - 8); ctx.moveTo(x + PX - 6, y + 6); ctx.lineTo(x + 6, y + PX - 8); ctx.stroke();
        }
      } else if (o.kind === 'spike') {
        ctx.fillStyle = '#e8ecff';
        const n = 3;
        const sw = (o.w * PX) / n;
        for (let k = 0; k < n; k++) {
          ctx.beginPath(); ctx.moveTo(x + k * sw, gy); ctx.lineTo(x + k * sw + sw / 2, gy - PX * 0.72); ctx.lineTo(x + (k + 1) * sw, gy); ctx.fill();
        }
      } else if (o.kind === 'bolt' && !o.got) {
        const y = gy - o.y * PX + Math.sin(tSec * 4 + o.x) * 4;
        ctx.fillStyle = '#ffcd1f';
        ctx.beginPath(); ctx.moveTo(x + 4, y - 14); ctx.lineTo(x - 8, y + 2); ctx.lineTo(x, y + 2); ctx.lineTo(x - 4, y + 14); ctx.lineTo(x + 8, y - 2); ctx.lineTo(x, y - 2); ctx.closePath(); ctx.fill();
      }
    }
    // ghosts of the other racers
    for (const [u, d] of Object.entries(race)) {
      if (u === uid) continue;
      const info = names.get(u);
      if (!info) continue;
      const x = botX + (d - bot.d) * PX;
      if (x < -60 || x > w + 60) continue;
      drawBlook(ctx, info.blook, x, gy - 26, 44, { alpha: 0.45 });
      nameTag(ctx, info.name, x, gy - 54, { bg: 'rgba(23,19,63,.45)', size: 11 });
    }
    // our robot: a little cart under the blook
    const by = gy - bot.y * PX;
    const wobble = bot.onGround ? Math.sin(tSec * 22) * 2 : 0;
    ctx.fillStyle = '#e8ecff';
    rr(ctx, botX - 26, by - 22 + wobble * 0.3, 52, 18, 8); ctx.fill();
    ctx.fillStyle = '#17133f';
    for (const wx of [-16, 16]) { ctx.beginPath(); ctx.arc(botX + wx, by - 4, 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#59f0ff';
    rr(ctx, botX - 18, by - 18 + wobble * 0.3, 36, 6, 3); ctx.fill();
    if (bot.boost > 0) {
      ctx.fillStyle = `rgba(89,240,255,${0.5 + Math.random() * 0.4})`;
      ctx.beginPath(); ctx.moveTo(botX - 26, by - 20); ctx.lineTo(botX - 60 - Math.random() * 20, by - 13); ctx.lineTo(botX - 26, by - 6); ctx.fill();
    }
    const alpha = bot.stumble > 0 && Math.floor(tSec * 12) % 2 ? 0.45 : 1;
    drawBlook(ctx, game.blook, botX, by - 46 + wobble, 52, { squash: bot.squash, alpha });
    fx.draw(ctx);
    ctx.restore();
    // distance in big type
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 30px "Lilita One", system-ui';
    ctx.fillText(`${Math.floor(bot.d)} m`, 16, 12);
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
    drawSky(ctx, w, h, t * 200);
    const list = ref.ranked().slice(0, 10);
    const lead = Math.max(50, ...list.map((p) => p.extra.d || 0));
    const lane = Math.min(64, (h - 60) / Math.max(5, list.length));
    const top = (h - lane * list.length) / 2;
    const left = 150;
    const right = w - 70;
    list.forEach((p, i) => {
      const y = top + i * lane;
      ctx.fillStyle = i % 2 ? 'rgba(42,22,80,.55)' : 'rgba(42,22,80,.7)';
      ctx.fillRect(0, y, w, lane - 4);
      const target = left + ((p.extra.d || 0) / lead) * (right - left);
      const x = lerp(shown.get(p.uid) ?? left, target, 0.08);
      shown.set(p.uid, x);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = `800 ${Math.min(16, lane * 0.3)}px Nunito, system-ui`;
      ctx.fillText(`${i + 1}. ${p.name}`, 12, y + lane / 2 - 2);
      drawBlook(ctx, p.blook, x, y + lane / 2 - 4 + Math.sin(t * 14 + i) * 2, lane * 0.75);
      ctx.font = `800 ${Math.min(13, lane * 0.26)}px Nunito, system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.floor(p.extra.d || 0)} m`, Math.min(x + lane * 0.45, w - 60), y + lane / 2 - 2);
    });
    ctx.fillStyle = '#ffcd1f';
    ctx.fillRect(right + 20, top, 6, lane * list.length);
  });
  return () => { stop(); view.destroy(); };
}
