// skyrace.js — Sky Race: fly fast, answer faster, outrun the fighter jets.
//
// Your plane cruises slowly. Fighter jets chase from behind and fire
// missiles: dodge them (up and down). Every 3 right answers charge a BOOST;
// press it and your plane rockets ahead, leaving the jets behind. A wrong
// answer charges nothing: answer another. Fly slowly for too long and the
// jets catch you: shot down, you lose ground and start again.
// Each player has 10 boosts. The game ends at the time limit, or as soon
// as everyone has used all 10.
//
// Points: 1 per metre flown, 100 per boost.

import { makeCanvas, loop, controls, particles, shaker, drawBlook, nameTag, rr, lerp, hashString } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { h } from '../../ui/dom.js';
import { sfx } from '../sound.js';

export const BOOSTS = 10;
export const PER_BOOST = 3;        // right answers for one boost
const CRUISE = 12;                 // m/s without a boost
const BOOST_SPEED = 48;            // m/s while boosting
const BOOST_TIME = 4;              // seconds
const JET_SPEED = 14.5;            // the jets are a little faster than a cruise
const START_GAP = 160;             // metres between you and the jets
const MAX_RATE = 52;               // m/s the host will believe

export const pointsFor = (d, boosts) => Math.floor(d) + boosts * 100;

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const seen = new Map();
  return {
    watch: ['prog'],
    join(p) { if (p.extra.d === undefined) Object.assign(p.extra, { d: 0, b: 0, g: START_GAP, summary: '0 m · 0 boosts' }); },
    // a wrong answer charges nothing: the player answers another
    grant(p, ok) { return ok ? 1 : 0; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.d !== 'number') continue;
        const was = seen.get(uid) || { d: p.extra.d || 0, b: p.extra.b || 0, at: now - 1000 };
        const secs = Math.max(0.2, (now - was.at) / 1000);
        // distance can only grow so fast; boosts are earned by right answers
        const d = Math.max(0, Math.min(Number(v.d) || 0, was.d + MAX_RATE * secs + 5));
        const earned = Math.min(BOOSTS, Math.floor((p.correct || 0) / PER_BOOST));
        const b = Math.max(was.b, Math.min(Math.floor(Number(v.b) || 0), earned));
        const gained = pointsFor(Math.max(d, was.d), b) - pointsFor(was.d, was.b);
        seen.set(uid, { d: Math.max(d, was.d), b, at: now });
        Object.assign(p.extra, { d: Math.max(d, was.d), b, g: Math.max(0, Math.min(400, Number(v.g) || 0)), summary: `${Math.floor(Math.max(d, was.d))} m · ${b}/${BOOSTS} boosts` });
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
    /** Everyone has used all their boosts: the race is over. */
    done() {
      if (!players.size) return false;
      for (const p of players.values()) if ((p.extra.b || 0) < BOOSTS) return false;
      return true;
    },
    tick() {
      const race = {};
      for (const p of players.values()) race[p.uid] = Math.floor(p.extra.d || 0);
      live.set(P('race'), race).catch(() => {});
    },
  };
}

/* ================================================================ player */

function drawSky(ctx, w, hh, scroll, t, boosting) {
  const g = ctx.createLinearGradient(0, 0, 0, hh);
  g.addColorStop(0, '#2a6fdb'); g.addColorStop(0.6, '#7cc2ff'); g.addColorStop(1, '#ffe2b0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hh);
  // sun
  ctx.fillStyle = 'rgba(255,245,200,0.9)';
  ctx.beginPath(); ctx.arc(w * 0.85, hh * 0.18, 34, 0, Math.PI * 2); ctx.fill();
  // far mountains, slow
  ctx.fillStyle = '#6b84c9';
  ctx.beginPath(); ctx.moveTo(0, hh);
  for (let x = 0; x <= w + 40; x += 40) {
    const k = (x + scroll * 0.05) / 160;
    ctx.lineTo(x, hh * 0.78 - Math.abs(Math.sin(k)) * 90 - Math.sin(k * 2.3) * 20);
  }
  ctx.lineTo(w, hh); ctx.fill();
  ctx.fillStyle = '#4c66b0';
  ctx.beginPath(); ctx.moveTo(0, hh);
  for (let x = 0; x <= w + 40; x += 30) {
    const k = (x + scroll * 0.12) / 110;
    ctx.lineTo(x, hh * 0.88 - Math.abs(Math.sin(k)) * 60);
  }
  ctx.lineTo(w, hh); ctx.fill();
  // clouds, fast
  for (let i = 0; i < 8; i++) {
    const cw = 120 + (i % 3) * 40;
    const x = w - ((scroll * (0.5 + (i % 3) * 0.25) + i * 230) % (w + cw * 2)) + cw;
    const y = 40 + ((i * 97) % (hh * 0.6));
    ctx.fillStyle = `rgba(255,255,255,${0.55 + (i % 2) * 0.2})`;
    ctx.beginPath(); ctx.ellipse(x, y, cw / 2, 18, 0, 0, Math.PI * 2); ctx.ellipse(x + 30, y - 12, cw / 3, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  // speed lines when boosting
  if (boosting) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const y = (i * 61 + t * 900) % hh;
      const x = w - ((t * 2400 + i * 173) % (w + 200));
      ctx.moveTo(x, y); ctx.lineTo(x + 120, y);
    }
    ctx.stroke();
  }
}

function drawPlane(ctx, x, y, s, { tilt = 0, blookId, boosting, t, colour = '#ffffff' }) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  if (boosting) {
    // afterburner flame
    const f = 30 + Math.sin(t * 60) * 8;
    const g = ctx.createLinearGradient(-60 - f, 0, -50, 0);
    g.addColorStop(0, 'rgba(255,80,40,0)'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, '#ffe45c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-50, -6); ctx.lineTo(-60 - f, 0); ctx.lineTo(-50, 6); ctx.fill();
  }
  ctx.fillStyle = '#e8112d';
  ctx.beginPath(); ctx.moveTo(-48, -2); ctx.lineTo(-60, -26); ctx.lineTo(-44, -26); ctx.lineTo(-30, -4); ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(0, 0, 54, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9cff5';
  ctx.beginPath(); ctx.ellipse(0, 6, 50, 6, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#6b4cff';
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(22, 2); ctx.lineTo(4, 30); ctx.lineTo(-14, 30); ctx.fill();
  ctx.fillStyle = '#17133f';
  ctx.beginPath(); ctx.moveTo(34, -6); ctx.quadraticCurveTo(48, -6, 54, 0); ctx.lineTo(34, 0); ctx.fill();
  ctx.restore();
  if (blookId) drawBlook(ctx, blookId, x + 14 * s, y - 16 * s, 26 * s);
}

function drawJet(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const f = 14 + Math.sin(t * 50) * 4;
  ctx.fillStyle = '#ff8a2a';
  ctx.beginPath(); ctx.moveTo(-36, -4); ctx.lineTo(-40 - f, 0); ctx.lineTo(-36, 4); ctx.fill();
  ctx.fillStyle = '#4a5068';
  ctx.beginPath(); ctx.moveTo(-36, -6); ctx.lineTo(30, -3); ctx.lineTo(44, 0); ctx.lineTo(30, 3); ctx.lineTo(-36, 6); ctx.fill();
  ctx.fillStyle = '#2b3043';
  ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-26, 22); ctx.lineTo(-16, 22); ctx.lineTo(10, 3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-28, -4); ctx.lineTo(-38, -18); ctx.lineTo(-30, -18); ctx.lineTo(-20, -4); ctx.fill();
  ctx.fillStyle = '#9be7ff';
  ctx.beginPath(); ctx.ellipse(18, -4, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function mountPlayer(game) {
  const { stage, uid, live, P } = game;
  const view = makeCanvas(stage);
  const ctl = controls(stage, { joystick: true, buttons: [] });
  const fx = particles();
  const shake = shaker();
  const names = new Map();
  let race = {};
  const unsubs = [];
  unsubs.push(live.on(P('players'), (v) => { for (const [u, p] of Object.entries(v || {})) names.set(u, p); preloadBlooks([...names.values()].map((p) => p.blook)); }));
  unsubs.push(live.on(P('race'), (v) => { race = v || {}; }));

  const me = { d: 0, y: 0.5, vy: 0, speed: CRUISE, boostLeft: 0, down: 0, hits: 0 };
  let gap = START_GAP;
  let charge = 0;                  // right answers towards the next boost
  let ready = 0;                   // boosts charged and waiting
  let used = 0;                    // boosts used
  let jetSpeed = JET_SPEED;
  const missiles = [];
  let fireIn = 3;
  let t = 0;
  let lastProg = 0;
  let asking = false;
  game.grantText = () => '';

  // the controls under the sky: answer to charge, BOOST to fly
  const pips = h('span', { class: 'sr-pips' });
  const answerBtn = h('button', { class: 'btn btn-main sr-answer' }, 'Answer to charge');
  const boostBtn = h('button', { class: 'btn sr-boost', disabled: true }, 'BOOST');
  const left = h('span', { class: 'sr-left' });
  stage.append(h('div', { class: 'sr-bar' }, h('div', { class: 'sr-charge' }, pips, left), answerBtn, boostBtn));
  const drawBar = () => {
    pips.replaceChildren(...Array.from({ length: PER_BOOST }, (_, i) => h('i', { class: i < charge ? 'is-on' : '' })));
    left.textContent = `${BOOSTS - used} boosts left${ready ? ` · ${ready} ready` : ''}`;
    boostBtn.disabled = !ready || me.down > 0;
    boostBtn.classList.toggle('is-ready', ready > 0);
    answerBtn.disabled = asking || used + ready >= BOOSTS;
    answerBtn.textContent = used + ready >= BOOSTS ? 'All boosts earned' : 'Answer to charge';
  };
  drawBar();

  // questions until a boost is charged; a wrong answer charges nothing
  async function charging() {
    if (asking || game.asking || used + ready >= BOOSTS) return;
    asking = true; drawBar();
    while (game.timeLeft() > 0 && charge < PER_BOOST) {
      const r = await game.ask({ title: `Charge your boost: ${charge}/${PER_BOOST}` });
      if (!r || r.error || r.timeout || r.skip) break;
      if (r.ok || r.poll) { charge += 1; sfx('coin'); drawBar(); }
    }
    if (charge >= PER_BOOST) { charge = 0; ready += 1; sfx('checkpoint'); game.flash('BOOST READY! Press it!', 'is-ok'); }
    asking = false; drawBar();
  }
  answerBtn.addEventListener('click', () => charging());

  function boost() {
    if (!ready || me.down > 0) return;
    ready -= 1; used += 1;
    me.boostLeft = BOOST_TIME;
    sfx('boost'); shake.kick(6);
    game.flash(used >= BOOSTS ? 'Last boost!' : `BOOST ${used}/${BOOSTS}`, 'is-ok');
    drawBar();
  }
  boostBtn.addEventListener('click', boost);

  const geo = { w: 0, h: 0 };
  const px = () => (geo.w && geo.w < 600 ? 0.58 : 0.42);   // where your plane flies, across the screen
  const stop = loop((dt) => {
    t += dt;
    ctl.update();
    fx.update(dt); shake.update(dt);
    if (game.timeLeft() <= 0) return;

    // shot down: fall, then a fresh start behind
    if (me.down > 0) {
      me.down -= dt;
      me.y = Math.min(1.1, me.y + dt * 0.5);
      if (me.down <= 0) { me.y = 0.5; gap = START_GAP; game.flash('Back in the air!', 'is-ok'); }
      drawBar();
      return;
    }
    // steer: up and down (keys, joystick, or the half of the screen you hold)
    if (!game.asking) me.vy = lerp(me.vy, ctl.y * 0.9, 0.15);
    else me.vy = lerp(me.vy, 0, 0.1);
    me.y = Math.max(0.12, Math.min(0.86, me.y + me.vy * dt));

    const boosting = me.boostLeft > 0;
    me.boostLeft = Math.max(0, me.boostLeft - dt);
    me.speed = lerp(me.speed, boosting ? BOOST_SPEED : CRUISE, boosting ? 0.2 : 0.04);
    jetSpeed += dt * 0.012;
    me.d += me.speed * dt;
    gap = Math.max(0, Math.min(320, gap + (me.speed - jetSpeed) * dt));

    // the jets fire when they are close
    fireIn -= dt;
    if (gap < 110 && fireIn <= 0) {
      fireIn = 1.4 + gap / 70;
      missiles.push({ x: -0.05, y: me.y + (Math.random() - 0.5) * 0.25, speed: 0.55 });
      sfx('shoot');
    }
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.x += m.speed * dt;
      m.y = lerp(m.y, me.y, 0.008);
      if (Math.abs(m.x - px()) < 0.03 && Math.abs(m.y - me.y) < 0.06) {
        missiles.splice(i, 1);
        gap = Math.max(0, gap - 28);
        shake.kick(10); sfx('boom');
        fx.burst(geo.w * px(), geo.h * me.y, { n: 24, color: '#ff8a2a', speed: 220 });
        game.flash('Hit! The jets are closing in', 'is-bad');
      } else if (m.x > 1.1) missiles.splice(i, 1);
    }
    if (gap <= 0) {
      me.down = 3;
      me.d = Math.max(0, me.d - 120);
      missiles.length = 0;
      shake.kick(16); sfx('fall');
      fx.burst(geo.w * px(), geo.h * me.y, { n: 40, color: '#ff4772', speed: 260 });
      game.flash('Shot down! -120 m', 'is-bad');
    }
    game.setMeter('Escape', Math.min(1, gap / START_GAP), gap < 40 ? 'DANGER' : `${Math.floor(gap)} m ahead`);
    const now = game.now();
    if (now - lastProg > 500) { lastProg = now; game.sendProg({ d: Math.round(me.d), b: used, g: Math.round(gap) }); }
  }, () => {
    const { ctx, w, h: hh } = view;
    geo.w = w; geo.h = hh;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    const boosting = me.boostLeft > 0;
    drawSky(ctx, w, hh, me.d * 20, t, boosting);
    const s = Math.min(1.4, Math.max(0.7, w / 700));
    // other racers: ghosts ahead or behind by distance
    for (const [u, d] of Object.entries(race)) {
      if (u === uid) continue;
      const info = names.get(u);
      if (!info) continue;
      const dx = (d - me.d) * 4;
      const x = w * px() + dx;
      if (x < -80 || x > w + 80) continue;
      const y = hh * (0.2 + (hashString(u) % 60) / 100);
      ctx.globalAlpha = 0.45;
      drawPlane(ctx, x, y, s * 0.6, { blookId: info.blook, t });
      ctx.globalAlpha = 1;
      nameTag(ctx, info.name, x, y - 30 * s, { size: 10, bg: 'rgba(23,19,63,.45)' });
    }
    // the jets, behind: closer when the gap is small
    const jx = Math.max(40 * s, w * px() - (gap / START_GAP) * w * 0.3 - 70 * s);
    for (let k = 0; k < 2; k++) drawJet(ctx, jx - k * 40 * s, hh * (me.y + (k ? 0.1 : -0.06)) + Math.sin(t * 3 + k) * 6, s * 0.9, t);
    // missiles
    for (const m of missiles) {
      const x = m.x * w; const y = m.y * hh;
      ctx.fillStyle = '#d8dbe8'; rr(ctx, x - 14, y - 3, 22, 6, 3); ctx.fill();
      ctx.fillStyle = '#ff4772'; ctx.beginPath(); ctx.moveTo(x + 8, y - 3); ctx.lineTo(x + 14, y); ctx.lineTo(x + 8, y + 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 18, y, 4, 0, Math.PI * 2); ctx.fill();
    }
    // you
    const tilt = me.down > 0 ? t * 3 : me.vy * 0.5;
    drawPlane(ctx, w * px(), hh * me.y, s, { tilt, blookId: game.blook, boosting, t });
    if (gap < 40 && me.down <= 0) {
      ctx.fillStyle = `rgba(255,40,60,${0.18 + Math.sin(t * 12) * 0.1})`;
      ctx.fillRect(0, 0, w, hh);
    }
    ctx.restore();
    fx.draw(ctx);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 26px "Lilita One", system-ui';
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6;
    ctx.fillText(`${Math.floor(me.d)} m`, 14, 10);
    ctx.font = '800 14px Nunito, system-ui';
    ctx.fillText(`Boosts: ${used}/${BOOSTS}`, 14, 42);
    ctx.shadowBlur = 0;
  });

  const key = (e) => { if (e.code === 'Space' || e.key === 'b' || e.key === 'B') { e.preventDefault(); boost(); } };
  window.addEventListener('keydown', key);
  if (navigator.webdriver) window.__quickzySky = { state: () => ({ d: me.d, gap, charge, ready, used }), give: () => { ready += 1; drawBar(); } };
  return () => { stop(); ctl.destroy(); view.destroy(); unsubs.forEach((u) => u()); window.removeEventListener('keydown', key); delete window.__quickzySky; };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const view = makeCanvas(el);
  let t = 0;
  const shown = new Map();
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx, w, h: hh } = view;
    view.begin();
    drawSky(ctx, w, hh, t * 200, t, false);
    const list = ref.ranked().slice(0, 10);
    const best = Math.max(200, ...list.map((p) => p.extra.d || 0));
    const lane = (hh - 40) / Math.max(1, list.length);
    list.forEach((p, i) => {
      const target = 90 + ((p.extra.d || 0) / best) * (w - 200);
      const x = lerp(shown.get(p.uid) ?? 90, target, 0.08);
      shown.set(p.uid, x);
      const y = 30 + lane * i + lane / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(w - 40, y); ctx.stroke(); ctx.setLineDash([]);
      const g = p.extra.g ?? START_GAP;
      drawJet(ctx, x - 40 - Math.min(200, (g / START_GAP) * 120), y + 4, Math.min(0.6, lane / 90), t);
      drawPlane(ctx, x, y, Math.min(0.75, lane / 70), { blookId: p.blook, t });
      nameTag(ctx, `${p.name} · ${p.extra.b || 0}/${BOOSTS}`, x, y - Math.min(30, lane / 2), { size: 12, bg: i === 0 ? '#ffcd1f' : 'rgba(23,19,63,.8)', fg: i === 0 ? '#17133f' : '#fff' });
    });
  });
  return () => { stop(); view.destroy(); };
}
