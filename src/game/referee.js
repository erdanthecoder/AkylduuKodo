// referee.js — the host's side of a live game: it alone knows the answers.
//
// Runs in the host's browser. It listens to the players and their answers,
// marks every answer against the key, keeps the scores and publishes only
// what players are allowed to see. If the host reloads the page, it picks the
// scores back up from the database and carries on.

import { net } from '../net/index.js';
import { gamePath } from '../services/games.js';
import { check, validChoice, points } from './questions.js';
import { modeOf } from './modes/index.js';

const INTRO_MS = (q) => Math.min(5000, 2500 + q.text.length * 25);
const GRACE_MS = 600;               // network leeway after the timer hits zero

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function createReferee({ pin, meta: initialMeta, quiz, key, onChange = () => {} }) {
  const P = (sub) => gamePath(pin, sub);
  const live = net.live;
  let meta = initialMeta;
  const mode = modeOf(meta.mode);
  const arcade = mode.kind === 'arcade';
  const pub = quiz.questions;
  const players = new Map();      // uid -> player record
  const unsubs = [];
  let order = pub.map((_, i) => i);
  let cur = null;                 // classic: the current question
  let answers = new Map();        // classic: uid -> {c, t} for the current question
  let timer = 0;
  let closed = false;
  let modeHost = null;            // arcade: the mode's own rules
  const dirty = new Set();        // players whose `me` needs writing

  // answers from before a reload were already marked and scored
  const bornAt = live.now();
  const resumed = initialMeta.status === 'play';
  const emit = () => { try { onChange(api); } catch (e) { console.error(e); } };

  const record = (uid, p) => ({
    uid, name: p.name, blook: p.blook, at: p.at || 0,
    score: 0, correct: 0, answered: 0, streak: 0, best: 0, lastAnsAt: 0, extra: {},
  });

  /* ------------------------------------------------------ resume */

  // after a reload, earlier scores are still in `me`
  const saved = (await live.get(P('me'))) || {};
  const savedCur = await live.get(P('cur'));
  const savedOrder = await live.get(P('order'));
  if (Array.isArray(savedOrder) && savedOrder.length === pub.length) order = savedOrder;

  /* ------------------------------------------------------ players */

  unsubs.push(live.on(P('players'), (val) => {
    const now = val || {};
    for (const [uid, p] of Object.entries(now)) {
      if (!players.has(uid)) {
        const r = record(uid, p);
        const s = saved[uid];
        if (s) Object.assign(r, { score: s.s || 0, correct: s.c || 0, answered: s.n || 0, streak: s.st || 0, best: s.b || 0 });
        players.set(uid, r);
        if (modeHost && modeHost.join) modeHost.join(r);
      } else {
        const r = players.get(uid);
        r.name = p.name; r.blook = p.blook;
      }
    }
    for (const uid of [...players.keys()]) if (!now[uid]) players.delete(uid);
    emit();
  }));

  unsubs.push(live.on(P('meta'), (m) => { if (m) { meta = m; emit(); } }));

  /* ------------------------------------------------------ ranking */

  const ranked = () => [...players.values()].sort((a, b) => b.score - a.score || b.correct - a.correct || a.at - b.at);

  function writeScores(extraUpdates = {}) {
    const list = ranked();
    const updates = { ...extraUpdates };
    list.forEach((p, i) => {
      if (!dirty.has(p.uid) && p.rank === i + 1) return;
      p.rank = i + 1;
      updates[`me/${p.uid}`] = { s: p.score, r: i + 1, of: list.length, c: p.correct, n: p.answered, st: p.streak, b: p.best, ...(p.meExtra || {}) };
    });
    dirty.clear();
    updates.top = list.slice(0, 5).map((p) => ({ u: p.uid, n: p.name, b: p.blook, s: p.score }));
    return live.update(P(''), updates);
  }

  function mark(p, qIndex, choice, elapsedMs, limitS, scale = 1) {
    const q = pub[qIndex];
    const res = check(q, key[qIndex], choice);
    p.answered += 1;
    let pts = 0;
    if (res.poll) {
      // a poll neither breaks nor builds a streak
    } else if (res.correct) {
      p.streak += 1;
      p.best = Math.max(p.best, p.streak);
      p.correct += 1;
      pts = Math.round(points({ correct: true, elapsedMs, limitS, kind: q.points, speed: meta.settings.speed !== false, streak: p.streak }) * scale);
    } else {
      p.streak = 0;
    }
    p.score += pts;
    dirty.add(p.uid);
    return { ...res, pts };
  }

  /* ================================================== classic mode */

  function publishQuestion(n) {
    const i = order[n];
    const q = pub[i];
    answers = new Map();
    closed = false;
    const now = live.now();
    const intro = INTRO_MS(q);
    cur = { n, i, total: order.length, phase: 'intro', q, introEnds: now + intro };
    live.set(P('cur'), cur);
    emit();
    clearTimeout(timer);
    timer = setTimeout(() => openQuestion(), intro);
  }

  function openQuestion() {
    const now = live.now();
    cur = { ...cur, phase: 'open', startAt: now, endsAt: now + cur.q.time * 1000 };
    live.set(P('cur'), cur);
    emit();
    tick();
  }

  function tick() {
    clearTimeout(timer);
    if (!cur || cur.phase !== 'open') return;
    const left = cur.endsAt - live.now();
    const everyone = players.size > 0 && [...players.keys()].every((uid) => answers.has(uid));
    if (left <= 0 || everyone) { closeQuestion(); return; }
    timer = setTimeout(tick, Math.min(250, left));
  }

  function onClassicAnswer(a) {
    if (!cur || cur.phase !== 'open' || a.q !== cur.i || closed) return;
    const p = players.get(a.u);
    if (!p || answers.has(a.u)) return;
    if (!validChoice(cur.q, a.c)) return;
    if (typeof a.t !== 'number' || a.t > cur.endsAt + GRACE_MS || a.t < cur.startAt - GRACE_MS) return;
    answers.set(a.u, { c: a.c, t: a.t });
    emit();
    tick();
  }

  async function closeQuestion() {
    if (closed || !cur) return;
    closed = true;
    clearTimeout(timer);
    const q = cur.q;
    const k = key[cur.i];
    const counts = (q.options || (q.type === 'tf' ? [0, 0] : [])).map(() => 0);
    let right = 0;
    const results = {};
    // remember where everyone stood, so the leaderboard can show who moved
    const before = ranked();
    before.forEach((p, i) => { p.prevRank = i + 1; p.prevScore = p.score; });
    for (const p of players.values()) {
      const a = answers.get(p.uid);
      if (!a) {
        if (q.type !== 'poll') { p.streak = 0; dirty.add(p.uid); }
        results[p.uid] = { ok: false, none: true, pts: 0 };
        continue;
      }
      const res = mark(p, cur.i, a.c, Math.max(0, a.t - cur.startAt), q.time);
      results[p.uid] = { ok: res.correct, poll: Boolean(res.poll), pts: res.pts, ms: Math.max(0, a.t - cur.startAt) };
      if (res.correct) right += 1;
      if (q.type === 'mc' || q.type === 'poll') counts[a.c] += 1;
      if (q.type === 'tf') counts[a.c ? 0 : 1] += 1;
      if (q.type === 'multi') a.c.forEach((c) => { counts[c] += 1; });
    }
    const reveal = { display: check(q, k, null).display, right, answered: answers.size, counts };
    if (q.type === 'mc') reveal.correct = [k];
    if (q.type === 'multi') reveal.correct = k;
    if (q.type === 'tf') reveal.correct = [k ? 0 : 1];
    cur = { ...cur, phase: 'reveal', reveal };
    const extra = { cur };
    for (const p of players.values()) {
      const r = results[p.uid];
      p.meExtra = { q: cur.n, ok: r.ok, pts: r.pts, none: Boolean(r.none), poll: Boolean(r.poll), ms: r.ms || 0, pr: p.prevRank || 0 };
      dirty.add(p.uid);
    }
    await writeScores(extra);
    emit();
  }

  function showBoard() {
    if (!cur) return;
    cur = { ...cur, phase: 'board' };
    live.set(P('cur'), cur);
    emit();
  }

  /* =================================================== arcade modes */

  async function startArcade() {
    const m = await import(`./modes/${meta.mode}.js`);
    modeHost = m.createHost({ live, P, players, pub, meta, dirty, emit });
    for (const p of players.values()) if (modeHost.join) modeHost.join(p);
    unsubs.push(live.onChild(P('act'), (_, act) => {
      if (resumed && act && act.t < bornAt) return;
      const p = act && players.get(act.u);
      if (p && meta.status === 'play' && live.now() < meta.endsAt && modeHost.act) modeHost.act(p, act);
    }));
    if (modeHost.watch) for (const path of modeHost.watch) {
      unsubs.push(live.on(P(path), (val) => modeHost.data(path, val || {})));
    }
  }

  function onArcadeAnswer(id, a) {
    const p = players.get(a.u);
    if (!p || meta.status !== 'play') return;
    const now = live.now();
    if (now > meta.endsAt + GRACE_MS) return;
    if (now - p.lastAnsAt < 700) { live.set(P(`res/${a.u}/${id}`), { ok: false, skip: true }); return; }
    p.lastAnsAt = now;
    const qi = a.q;
    if (!Number.isInteger(qi) || !pub[qi] || !validChoice(pub[qi], a.c)) return;
    const shown = typeof a.s === 'number' ? a.s : a.t;
    const elapsed = Math.max(0, Math.min(a.t - shown, pub[qi].time * 1000));
    // arcade answers are worth a tenth of a classic one: the game itself earns the rest
    const res = mark(p, qi, a.c, elapsed, pub[qi].time, 0.1);
    const grant = modeHost && modeHost.grant ? modeHost.grant(p, res.correct || res.poll) : 0;
    live.set(P(`res/${a.u}/${id}`), { ok: res.correct, poll: Boolean(res.poll), pts: res.pts, st: p.streak, d: res.correct ? '' : res.display, g: grant });
    emit();
  }

  let pump = 0;
  function startPump() {
    clearInterval(pump);
    pump = setInterval(() => {
      if (meta.status !== 'play') return;
      if (modeHost && modeHost.tick) modeHost.tick(live.now());
      if (live.now() >= meta.endsAt) { finish(); return; }
      writeScores().catch(() => {});
      emit();
    }, 1000);
  }

  /* ======================================================= answers */

  unsubs.push(live.onChild(P('ans'), (id, a) => {
    if (!a || typeof a !== 'object') return;
    if (resumed && typeof a.t === 'number' && a.t < bornAt) return;
    if (arcade) onArcadeAnswer(id, a); else onClassicAnswer(a);
  }));

  /* ======================================================= control */

  async function start() {
    if (!players.size) throw new Error('Wait for at least one player to join.');
    if (arcade) {
      await startArcade();
      const now = live.now();
      const startAt = now + 4000;
      const endsAt = startAt + meta.settings.minutes * 60 * 1000;
      await live.set(P('qs'), pub);
      await live.update(P('meta'), { status: 'play', startAt, endsAt });
      meta = { ...meta, status: 'play', startAt, endsAt };
      await writeScores();
      startPump();
    } else {
      if (meta.settings.shuffle) order = shuffle(order);
      await live.set(P('order'), order);
      await live.update(P('meta'), { status: 'play', startAt: live.now() });
      meta = { ...meta, status: 'play' };
      await writeScores();
      publishQuestion(0);
    }
    emit();
  }

  /** Classic: move on from wherever we are. */
  function next() {
    if (!cur) return;
    if (cur.phase === 'intro') { clearTimeout(timer); openQuestion(); return; }
    if (cur.phase === 'open') { closeQuestion(); return; }
    if (cur.phase === 'reveal') { showBoard(); return; }
    if (cur.n + 1 < order.length) publishQuestion(cur.n + 1); else finish();
  }

  let finished = null;
  async function finish() {
    if (finished) return finished;
    clearTimeout(timer);
    clearInterval(pump);
    finished = (async () => {
      if (modeHost && modeHost.stop) modeHost.stop();
      for (const p of players.values()) dirty.add(p.uid);
      const list = ranked();
      const final = list.map((p, i) => ({ u: p.uid, n: p.name, b: p.blook, s: p.score, c: p.correct, a: p.answered, r: i + 1, x: p.extra.summary || '' }));
      await writeScores({ final, 'meta/status': 'end', 'meta/endedAt': live.now() });
      meta = { ...meta, status: 'end' };
      emit();
      return final;
    })();
    return finished;
  }

  async function kick(uid) {
    await live.update(P(''), { [`kicked/${uid}`]: true, [`players/${uid}`]: null, [`me/${uid}`]: null });
  }

  const setSetting = (k, v) => live.update(P('meta/settings'), { [k]: v });

  // a reload in the middle of a game carries on from where it was
  if (meta.status === 'play') {
    if (arcade) { await startArcade(); startPump(); } else if (savedCur) {
      cur = savedCur;
      if (cur.phase === 'intro' || cur.phase === 'open') publishQuestion(cur.n);
    }
  }

  const api = {
    get meta() { return meta; },
    get players() { return players; },
    get cur() { return cur; },
    get answeredCount() { return answers.size; },
    get modeHost() { return modeHost; },
    arcade, mode, pub, key, ranked, start, next, finish, kick, setSetting,
    destroy() { clearTimeout(timer); clearInterval(pump); unsubs.forEach((u) => u()); if (modeHost && modeHost.stop) modeHost.stop(); },
  };
  return api;
}
