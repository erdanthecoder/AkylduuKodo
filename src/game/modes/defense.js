// defense.js — Tower Defense: hold the castle against waves of monsters.
//
// Monsters march along a winding road towards your castle. Tap an empty
// square to build a tower there; tap a tower to upgrade it. Towers cost
// coins, and coins come from answering questions (and from monsters you
// stop). A wrong answer earns nothing: try another. Every fifth wave brings
// a boss. If the castle falls, answer a question to rebuild it.
//
// Points: 10 for each monster stopped, 150 for each wave survived.
// Everyone plays the same road (picked from the game), each on their own.

import { makeCanvas, loop, particles, shaker, drawBlook, nameTag, rng, hashString, rr, lerp } from '../arcade/engine.js';
import { preloadBlooks } from '../../ui/blooks.js';
import { h } from '../../ui/dom.js';
import { sfx } from '../sound.js';

const COLS = 16;
const ROWS = 9;
const START_COINS = 130;
const CASTLE = 20;
const MAX_KILL_RATE = 12;          // monsters a second the host will believe
const MAX_WAVE_RATE = 1 / 8;       // waves a second the host will believe

// three roads; each is a list of turning points in grid squares
const ROADS = [
  [[-1, 1], [4, 1], [4, 6], [9, 6], [9, 2], [13, 2], [13, 7], [16, 7]],
  [[-1, 7], [3, 7], [3, 2], [7, 2], [7, 5], [11, 5], [11, 1], [16, 1]],
  [[-1, 4], [2, 4], [2, 1], [6, 1], [6, 7], [10, 7], [10, 3], [14, 3], [14, 6], [16, 6]],
];

export const TOWERS = {
  zap: { name: 'Zapper', cost: 50, colour: '#59f0ff', range: 2.4, dmg: 6, every: 0.32, blurb: 'Fast little zaps' },
  cannon: { name: 'Cannon', cost: 85, colour: '#ff8a2a', range: 2.2, dmg: 20, every: 1.15, splash: 1, blurb: 'Hits a crowd' },
  frost: { name: 'Frost', cost: 70, colour: '#9be7ff', range: 2.0, dmg: 3, every: 0.6, slow: 0.45, blurb: 'Slows them down' },
};
export const upgradeCost = (t) => Math.round(TOWERS[t.kind].cost * 0.8 * t.level);

/** Wave n: how many monsters, how tough, how fast, and the boss. */
export function waveOf(n) {
  const boss = n % 5 === 0;
  return {
    count: boss ? 1 + Math.floor(n / 5) : 6 + n * 2,
    hp: Math.round(18 * 1.22 ** (n - 1) * (boss ? 14 : 1)),
    speed: Math.min(3.2, 1.15 + n * 0.06) * (boss ? 0.6 : 1),
    gap: boss ? 2.4 : Math.max(0.35, 0.9 - n * 0.03),
    boss,
    reward: boss ? 40 : 3,
  };
}

/** Points for what the player has done (the host recounts with caps). */
export const pointsFor = (kills, waves) => kills * 10 + waves * 150;

/* ================================================================== host */

export function createHost({ live, P, players, dirty }) {
  const seen = new Map();
  return {
    watch: ['prog'],
    join(p) { if (p.extra.k === undefined) Object.assign(p.extra, { k: 0, w: 0, b: CASTLE, summary: 'Wave 1' }); },
    // a wrong answer earns nothing: the player answers another one
    grant(p, ok) { return ok ? 45 : 0; },
    data(path, val) {
      const now = live.now();
      for (const [uid, v] of Object.entries(val)) {
        const p = players.get(uid);
        if (!p || !v || typeof v.k !== 'number' || typeof v.w !== 'number') continue;
        const was = seen.get(uid) || { k: p.extra.k || 0, w: p.extra.w || 0, at: now - 1000 };
        const secs = Math.max(0.2, (now - was.at) / 1000);
        const k = Math.max(was.k, Math.min(Math.floor(v.k), was.k + Math.ceil(MAX_KILL_RATE * secs) + 2));
        const w = Math.max(was.w, Math.min(Math.floor(v.w), was.w + Math.ceil(MAX_WAVE_RATE * secs) + 1));
        const gained = pointsFor(k, w) - pointsFor(was.k, was.w);
        seen.set(uid, { k, w, at: now });
        Object.assign(p.extra, { k, w, b: Math.max(0, Math.min(CASTLE, Number(v.b) || 0)), summary: `Wave ${w + 1} · ${k} stopped` });
        if (gained > 0) { p.score += gained; dirty.add(uid); }
      }
    },
    tick() {
      const snap = {};
      for (const p of players.values()) snap[p.uid] = [p.extra.w || 0, p.extra.k || 0, p.extra.b ?? CASTLE];
      live.set(P('snap'), snap).catch(() => {});
    },
  };
}

/* ================================================================ player */

/** The road as one long line, with its total length, in grid squares. */
function roadOf(points) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({ x0, y0, x1, y1, len, from: total });
    total += len;
  }
  const at = (d) => {
    const s = segs.find((g) => d <= g.from + g.len) || segs[segs.length - 1];
    const k = Math.max(0, Math.min(1, (d - s.from) / s.len));
    return [s.x0 + (s.x1 - s.x0) * k, s.y0 + (s.y1 - s.y0) * k];
  };
  // the squares the road passes through can't be built on
  const busy = new Set();
  for (let d = 0; d <= total; d += 0.25) { const [x, y] = at(d); busy.add(`${Math.round(x)},${Math.round(y)}`); }
  return { at, total, busy };
}

const MONSTERS = ['slime', 'ghost', 'alien', 'frog', 'bot2', 'yeti'];

export function mountPlayer(game) {
  const { stage, meta } = game;
  const view = makeCanvas(stage);
  const fx = particles();
  const shake = shaker();
  const seed = hashString(`${meta.quizId}:${meta.createdAt || 0}`);
  const road = roadOf(ROADS[seed % ROADS.length]);
  preloadBlooks([...MONSTERS, 'dragon', 'unicorn']);

  let coins = START_COINS;
  let castle = CASTLE;
  let wave = 0;                    // waves survived
  let kills = 0;
  let current = null;              // the wave on the road: {n, left, next, spec}
  let breakFor = 4;                // seconds until the next wave
  const towers = new Map();        // "x,y" -> {kind, level, x, y, cool, aim}
  const monsters = [];
  const shots = [];
  let picked = null;               // the square the player tapped
  let t = 0;
  let lastProg = 0;
  let asking = false;
  game.grantText = (g) => `+${g} coins`;

  // the build panel under the board
  const panel = h('div', { class: 'td-panel' });
  const earn = h('button', { class: 'btn btn-main td-earn' }, 'Answer for coins');
  const sendNow = h('button', { class: 'btn btn-sm td-send' }, 'Send next wave');
  stage.append(h('div', { class: 'td-bar' }, earn, sendNow, panel));

  async function getCoins(reason) {
    if (asking || game.asking) return;
    asking = true;
    let tries = 0;
    while (game.timeLeft() > 0) {
      const r = await game.ask({ title: tries ? 'Not quite! Try another for coins' : reason });
      tries += 1;
      if (!r || r.error || r.timeout || r.skip) break;
      if (r.ok || r.poll) { coins += r.g || 45; break; }
    }
    asking = false;
    drawPanel();
  }
  earn.addEventListener('click', () => getCoins('Answer for coins'));
  sendNow.addEventListener('click', () => { if (!current) { breakFor = 0; coins += 10; game.flash('+10 coins for being brave', 'is-ok'); } });

  function drawPanel() {
    panel.replaceChildren();
    if (!picked) { panel.append(h('small', { class: 'td-hint' }, 'Tap a square to build')); return; }
    const key = `${picked[0]},${picked[1]}`;
    const tw = towers.get(key);
    if (tw) {
      const cost = upgradeCost(tw);
      const up = h('button', { class: 'btn btn-sm', disabled: tw.level >= 3 || coins < cost }, tw.level >= 3 ? 'Max level' : `Upgrade · ${cost}`);
      up.addEventListener('click', () => { if (coins >= cost && tw.level < 3) { coins -= cost; tw.level += 1; sfx('checkpoint'); drawPanel(); } });
      const sell = h('button', { class: 'btn btn-sm btn-ghost' }, `Sell · ${Math.round(TOWERS[tw.kind].cost * 0.6)}`);
      sell.addEventListener('click', () => { coins += Math.round(TOWERS[tw.kind].cost * 0.6); towers.delete(key); picked = null; sfx('coin'); drawPanel(); });
      panel.append(h('b', {}, `${TOWERS[tw.kind].name} · level ${tw.level}`), up, sell);
      return;
    }
    for (const [kind, T] of Object.entries(TOWERS)) {
      const b = h('button', { class: 'btn btn-sm td-buy', disabled: coins < T.cost, style: { '--tc': T.colour } }, h('i'), `${T.name} · ${T.cost}`);
      b.title = T.blurb;
      b.addEventListener('click', () => {
        if (coins < T.cost) return;
        coins -= T.cost;
        towers.set(key, { kind, level: 1, x: picked[0], y: picked[1], cool: 0, aim: 0 });
        sfx('land');
        drawPanel();
      });
      panel.append(b);
    }
  }
  drawPanel();

  // board geometry, worked out each frame
  // on a tall phone screen the board turns sideways to fill it
  const geo = { s: 40, ox: 0, oy: 0, rot: false };
  const toScreen = (x, y) => (geo.rot
    ? [geo.ox + (ROWS - 1 - y + 0.5) * geo.s, geo.oy + (x + 0.5) * geo.s]
    : [geo.ox + (x + 0.5) * geo.s, geo.oy + (y + 0.5) * geo.s]);
  view.canvas.addEventListener('pointerdown', (e) => {
    const r = view.canvas.getBoundingClientRect();
    const a = Math.floor((e.clientX - r.left - geo.ox) / geo.s);
    const b = Math.floor((e.clientY - r.top - geo.oy) / geo.s);
    const x = geo.rot ? b : a;
    const y = geo.rot ? ROWS - 1 - a : b;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS || road.busy.has(`${x},${y}`)) { picked = null; drawPanel(); return; }
    picked = [x, y];
    sfx('pick');
    drawPanel();
  });

  function startWave() {
    const n = wave + 1;
    const spec = waveOf(n);
    current = { n, left: spec.count, next: 0, spec };
    game.flash(spec.boss ? `Wave ${n}: BOSS!` : `Wave ${n}`, spec.boss ? 'is-bad' : '');
    sfx(spec.boss ? 'tagged' : 'go');
  }

  const stop = loop((dt) => {
    t += dt;
    fx.update(dt); shake.update(dt);
    if (game.asking) return;
    const over = game.timeLeft() <= 0;
    if (over) return;

    // waves
    if (!current) {
      breakFor -= dt;
      if (breakFor <= 0 && castle > 0) startWave();
    } else if (current.left > 0) {
      current.next -= dt;
      if (current.next <= 0) {
        current.left -= 1;
        current.next = current.spec.gap;
        const id = current.spec.boss ? 'dragon' : MONSTERS[(current.n + current.left) % MONSTERS.length];
        monsters.push({ id, d: 0, hp: current.spec.hp, max: current.spec.hp, speed: current.spec.speed, slow: 0, boss: current.spec.boss, reward: current.spec.reward });
      }
    } else if (!monsters.length) {
      wave = current.n;
      current = null;
      breakFor = 6;
      coins += 20 + wave * 2;
      sfx('checkpoint');
      game.flash(`Wave ${wave} cleared! +${20 + wave * 2} coins`, 'is-ok');
    }

    // monsters walk
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      m.slow = Math.max(0, m.slow - dt);
      m.d += m.speed * (m.slow > 0 ? 0.55 : 1) * dt;
      if (m.d >= road.total) {
        monsters.splice(i, 1);
        castle = Math.max(0, castle - (m.boss ? 6 : 1));
        shake.kick(m.boss ? 12 : 4);
        sfx('bump');
        if (castle === 0) {
          monsters.length = 0;
          current = null;
          game.flash('The castle fell! Answer to rebuild it', 'is-bad');
          getCoins('Rebuild the castle').then(() => { castle = Math.round(CASTLE / 2); breakFor = 4; });
        }
      }
    }

    // towers shoot
    for (const tw of towers.values()) {
      const T = TOWERS[tw.kind];
      tw.cool -= dt;
      if (tw.cool > 0) continue;
      const range = T.range + (tw.level - 1) * 0.3;
      let target = null;
      for (const m of monsters) {
        const [mx, my] = road.at(m.d);
        if (Math.hypot(mx - tw.x, my - tw.y) <= range && (!target || m.d > target.d)) target = m;
      }
      if (!target) continue;
      tw.cool = T.every;
      const [mx, my] = road.at(target.d);
      tw.aim = Math.atan2(my - tw.y, mx - tw.x);
      const dmg = T.dmg * 1.6 ** (tw.level - 1);
      const hit = T.splash ? monsters.filter((m) => { const [x, y] = road.at(m.d); return Math.hypot(x - mx, y - my) <= T.splash; }) : [target];
      for (const m of hit) { m.hp -= dmg; if (T.slow) m.slow = 1.5; }
      shots.push({ x0: tw.x, y0: tw.y, x1: mx, y1: my, life: tw.kind === 'cannon' ? 0.25 : 0.12, colour: T.colour, kind: tw.kind });
      if (tw.kind === 'zap') sfx('shoot'); else if (tw.kind === 'cannon') sfx('boom');
    }
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      if (m.hp > 0) continue;
      monsters.splice(i, 1);
      kills += 1;
      coins += m.reward;
      const [x, y] = toScreen(...road.at(m.d));
      fx.burst(x, y, { n: m.boss ? 40 : 10, color: m.boss ? '#ffcd1f' : '#ff4772', speed: m.boss ? 260 : 140 });
      if (m.boss) { sfx('win'); game.flash('Boss defeated!', 'is-ok'); } else sfx('coin');
    }
    for (let i = shots.length - 1; i >= 0; i--) { shots[i].life -= dt; if (shots[i].life <= 0) shots.splice(i, 1); }

    game.setMeter('Castle', castle / CASTLE, `${castle} ♥ · ${coins} coins`);
    const now = game.now();
    if (now - lastProg > 600) { lastProg = now; game.sendProg({ k: kills, w: wave, b: castle }); }
    // keep the panel's buttons in step with the coins
    if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) panel.querySelectorAll('button').forEach((b) => {
      const m = /· (\d+)/.exec(b.textContent);
      if (m && !b.textContent.startsWith('Sell')) b.disabled = coins < Number(m[1]) || b.textContent === 'Max level';
    });
    sendNow.disabled = Boolean(current);
  }, () => {
    const { ctx, w, h: hh } = view;
    view.begin();
    ctx.save();
    shake.apply(ctx);
    const TOP = 64;                                  // room for the wave and coins
    const avail = hh - 76 - TOP;                     // the build bar sits at the bottom
    const rot = avail > w * 1.1;
    const across = rot ? ROWS : COLS;
    const down = rot ? COLS : ROWS;
    const s = Math.min(w / (across + 0.6), avail / down);
    Object.assign(geo, { s, rot, ox: (w - across * s) / 2, oy: TOP + (avail - down * s) / 2 });
    // grass
    ctx.fillStyle = '#4fa94a';
    ctx.fillRect(0, 0, w, hh);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const [cx0, cy0] = toScreen(x, y);
      ctx.fillStyle = (x + y) % 2 ? '#67c962' : '#5bb956';
      ctx.fillRect(cx0 - s / 2, cy0 - s / 2, s + 0.5, s + 0.5);
    }
    // the road
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#a8703c'; ctx.lineWidth = s * 0.86;
    ctx.beginPath();
    for (let d = 0; d <= road.total + 0.01; d += 0.2) { const [x, y] = toScreen(...road.at(d)); if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = '#d9a466'; ctx.lineWidth = s * 0.62; ctx.stroke();
    // the castle at the end of the road
    const [cx, cy] = toScreen(...road.at(road.total - 1.1));
    ctx.fillStyle = '#e8ecff';
    rr(ctx, cx - s * 0.6, cy - s * 0.9, s * 1.2, s * 1.2, 6); ctx.fill();
    ctx.fillStyle = '#6b4cff';
    for (let k = 0; k < 3; k++) ctx.fillRect(cx - s * 0.6 + k * s * 0.45, cy - s * 1.1, s * 0.3, s * 0.3);
    ctx.fillStyle = castle > CASTLE / 3 ? '#19c37d' : '#ff4772';
    ctx.fillRect(cx - s * 0.6, cy + s * 0.4, s * 1.2 * (castle / CASTLE), s * 0.12);
    // picked square
    if (picked) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      const [qx, qy] = toScreen(picked[0], picked[1]);
      ctx.strokeRect(qx - s / 2 + 2, qy - s / 2 + 2, s - 4, s - 4);
      const tw = towers.get(`${picked[0]},${picked[1]}`);
      const range = tw ? TOWERS[tw.kind].range + (tw.level - 1) * 0.3 : 2.3;
      const [px, py] = toScreen(picked[0], picked[1]);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(px, py, range * s, 0, Math.PI * 2); ctx.fill();
    }
    // towers
    for (const tw of towers.values()) {
      const T = TOWERS[tw.kind];
      const [x, y] = toScreen(tw.x, tw.y);
      ctx.fillStyle = '#4e4a75';
      rr(ctx, x - s * 0.38, y - s * 0.38, s * 0.76, s * 0.76, 8); ctx.fill();
      ctx.fillStyle = T.colour;
      ctx.beginPath(); ctx.arc(x, y, s * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#17133f'; ctx.lineWidth = s * 0.12;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(tw.aim) * s * 0.42, y + Math.sin(tw.aim) * s * 0.42); ctx.stroke();
      for (let k = 0; k < tw.level; k++) { ctx.fillStyle = '#ffcd1f'; ctx.beginPath(); ctx.arc(x - s * 0.22 + k * s * 0.22, y + s * 0.3, s * 0.07, 0, Math.PI * 2); ctx.fill(); }
    }
    // monsters
    for (const m of monsters) {
      const [x, y] = toScreen(...road.at(m.d));
      const size = s * (m.boss ? 1.2 : 0.72);
      drawBlook(ctx, m.id, x, y - size * 0.15 + Math.sin(t * 10 + m.d) * 2, size, { alpha: m.slow > 0 ? 0.75 : 1 });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - size / 2, y - size * 0.75, size, 5);
      ctx.fillStyle = m.boss ? '#ffcd1f' : '#ff4772'; ctx.fillRect(x - size / 2, y - size * 0.75, size * Math.max(0, m.hp / m.max), 5);
      if (m.slow > 0) { ctx.strokeStyle = '#9be7ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, size * 0.55, 0, Math.PI * 2); ctx.stroke(); }
    }
    // shots
    for (const sh of shots) {
      const [x0, y0] = toScreen(sh.x0, sh.y0);
      const [x1, y1] = toScreen(sh.x1, sh.y1);
      ctx.strokeStyle = sh.colour; ctx.lineWidth = sh.kind === 'cannon' ? 6 : 3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      if (sh.kind === 'cannon') { ctx.fillStyle = 'rgba(255,138,42,0.4)'; ctx.beginPath(); ctx.arc(x1, y1, s * TOWERS.cannon.splash, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    fx.draw(ctx);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '400 24px "Lilita One", system-ui';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 6;
    ctx.fillText(current ? `Wave ${current.n}` : `Next wave in ${Math.max(0, Math.ceil(breakFor))}`, 14, 10);
    ctx.fillText(`${coins} coins`, 14, 38);
    ctx.shadowBlur = 0;
  });

  if (navigator.webdriver) window.__quickzyDefense = { addCoins: (n) => { coins += n; drawPanel(); }, state: () => ({ coins, castle, wave, kills, towers: towers.size }) };
  return () => { stop(); view.destroy(); delete window.__quickzyDefense; };
}

/* =========================================================== big screen */

export function mountScreen(el, { ref }) {
  const view = makeCanvas(el);
  let t = 0;
  const stop = loop((dt) => { t += dt; }, () => {
    const { ctx, w, h: hh } = view;
    view.begin();
    const g = ctx.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, '#2e7d32'); g.addColorStop(1, '#17133f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hh);
    const list = ref.ranked().slice(0, 12);
    const cols = Math.min(4, Math.max(1, list.length));
    const rows = Math.ceil(list.length / cols) || 1;
    const cw = w / cols;
    const ch = Math.min(170, hh / rows);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    list.forEach((p, i) => {
      const x = (i % cols) * cw + cw / 2;
      const y = Math.floor(i / cols) * ch + ch / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rr(ctx, x - cw / 2 + 8, y - ch / 2 + 8, cw - 16, ch - 16, 18); ctx.fill();
      drawBlook(ctx, p.blook, x - cw * 0.25, y, Math.min(70, ch * 0.45), { rot: Math.sin(t * 3 + i) * 0.05 });
      ctx.fillStyle = '#fff';
      ctx.font = '400 22px "Lilita One", system-ui';
      ctx.fillText(`Wave ${(p.extra.w || 0) + 1}`, x + cw * 0.12, y - 18);
      ctx.font = '800 14px Nunito, system-ui';
      ctx.fillText(`${p.extra.k || 0} stopped`, x + cw * 0.12, y + 6);
      const b = p.extra.b ?? CASTLE;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + cw * 0.12 - 50, y + 22, 100, 8);
      ctx.fillStyle = b > CASTLE / 3 ? '#19c37d' : '#ff4772'; ctx.fillRect(x + cw * 0.12 - 50, y + 22, 100 * (b / CASTLE), 8);
      nameTag(ctx, p.name, x, y - ch / 2 + 22, { size: 12, bg: i === 0 ? '#ffcd1f' : 'rgba(23,19,63,.8)', fg: i === 0 ? '#17133f' : '#fff' });
    });
  });
  return () => { stop(); view.destroy(); };
}
