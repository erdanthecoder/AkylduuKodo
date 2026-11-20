// play.js — the player's own screen, from the lobby to the podium.

import { listen } from '../ui/abuse.js';
import { TEAMS } from '../game/teams.js';
import { picture } from '../ui/picture.js';
import { h, fill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { blook, preloadBlooks } from '../ui/blooks.js';
import { navigate } from '../router.js';
import { net } from '../net/index.js';
import { me, signedIn } from '../services/session.js';
import { claimGame, levelInfo, me as progressMe } from '../services/progress.js';
import { gamePath } from '../services/games.js';
import { modeOf } from '../game/modes/index.js';
import { answerPad, verdict } from '../game/answer-ui.js';
import { createHarness } from '../game/arcade/harness.js';
import { sfx } from '../game/sound.js';
import { confetti, celebrate } from '../ui/confetti.js';
import { pageTitle } from './parts.js';

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export default async function Play({ params }) {
  const pin = params.pin;
  const user = me();
  if (!user) { queueMicrotask(() => navigate(`/join/${pin}`, { replace: true })); return h('div'); }
  const uid = user.uid;
  const live = net.live;
  const P = (sub) => gamePath(pin, sub);
  const mine = await live.get(P(`players/${uid}`)).catch(() => null);
  if (!mine) { queueMicrotask(() => navigate(`/join/${pin}`, { replace: true })); return h('div'); }
  pageTitle(`Game ${pin}`);

  const root = h('div', { class: 'play' });
  const banner = h('div', { class: 'host-gone', hidden: true }, icon('alert', { size: 18 }), 'The host’s screen disconnected. Hang on…');
  const body = h('div', { class: 'play-body' });
  const teamTag = h('span', { class: 'foot-team', hidden: true });
  const foot = h('div', { class: 'play-foot' }, blook(mine.blook), h('b', {}, mine.name), teamTag, h('span', { class: 'grow' }), h('b', { class: 'foot-score' }, '0'));
  root.append(banner, body, foot);

  let meta = null;
  let cur = null;
  let mineScore = null;
  let state = '';
  let answeredFor = -1;
  let arcadeStop = null;
  let harness = null;
  let final = null;
  const unsubs = [];

  // team mode: which team am I on, and how is it doing?
  let teams = null;
  const myTeam = () => (teams && teams.of && teams.of[uid] !== undefined ? TEAMS[teams.of[uid]] : null);
  const teamRank = () => {
    if (!teams || !Array.isArray(teams.s) || teams.of[uid] === undefined) return 0;
    const mineS = teams.s[teams.of[uid]] || 0;
    return 1 + teams.s.filter((x) => x > mineS).length;
  };
  function drawTeam() {
    const t = myTeam();
    teamTag.hidden = !t;
    if (!t) return;
    fill(teamTag, blook(t.blook, 22), t.name);
    teamTag.style.background = t.colour;
    root.style.setProperty('--team', t.colour);
    root.classList.add('has-team');
    const slot = body.querySelector('.lobby-team');
    if (slot) fill(slot, teamBadge(t));
  }
  const teamBadge = (t) => h('div', { class: 'team-badge', style: { background: t.colour } }, blook(t.blook, 44), h('div', {}, h('small', {}, 'Your team'), h('b', {}, t.name)));

  const screen = (cls, ...kids) => fill(body, h('div', { class: `play-screen ${cls}` }, ...kids));

  function lobby() {
    const b = blook(mine.blook);
    b.classList.add('bob');
    screen('is-lobby', b, h('h1', {}, 'You’re in!'), h('div', { class: 'lobby-team' }, myTeam() ? teamBadge(myTeam()) : null), h('p', {}, 'See your name on the big screen?'),
      h('p', { class: 'muted-light small' }, 'The game starts when the host is ready.'),
      h('div', { class: 'dots' }, h('i'), h('i'), h('i')));
  }

  function kicked(text) {
    cleanup();
    fill(root, h('div', { class: 'play-screen is-lobby' }, h('h1', {}, 'Removed'), h('p', {}, text), h('a', { class: 'btn btn-main', href: '/join' }, 'Join another game')));
  }

  /* ---------------------------------------------------------- classic */

  function classic() {
    if (!cur) { lobby(); return; }
    const key = `${cur.phase}:${cur.n}`;
    const n = `Question ${cur.n + 1} of ${cur.total}`;
    if (cur.phase === 'intro') {
      if (state === key) return;
      state = key;
      const barI = h('i');
      screen('is-intro', h('p', { class: 'muted-light' }, n), h('h1', {}, cur.q.text), h('div', { class: 'intro-bar' }, barI), h('p', {}, 'Get ready…'));
      requestAnimationFrame(() => { barI.style.transitionDuration = `${Math.max(0, cur.introEnds - live.now())}ms`; barI.style.width = '100%'; });
      return;
    }
    if (cur.phase === 'open') {
      if (state === key) return;
      state = key;
      if (answeredFor === cur.n) { waiting(); return; }
      const left = h('b', { class: 'mini-timer' });
      const t = setInterval(() => {
        const s = Math.max(0, Math.ceil((cur.endsAt - live.now()) / 1000));
        left.textContent = String(s);
        if (s <= 0) clearInterval(t);
      }, 200);
      unsubs.push(() => clearInterval(t));
      const q = cur.q;
      const qi = cur.i;
      const qn = cur.n;
      const pad = answerPad(q, {
        showText: meta.settings.showText !== false,
        onSubmit: (choice) => {
          answeredFor = qn;
          clearInterval(t);
          live.push(P('ans'), { u: uid, q: qi, c: choice, t: live.TIMESTAMP }).catch(() => {});
          if (navigator.vibrate) navigator.vibrate(30);
          waiting();
        },
      });
      screen('is-answer', h('div', { class: 'row spread play-top' }, h('span', {}, n), left), h('h2', { class: 'q-text-play' }, q.text), picture(q.img, { cls: 'q-pic-small' }), pad);
      return;
    }
    if (cur.phase === 'reveal') {
      const r = mineScore && mineScore.q === cur.n ? mineScore : null;
      if (!r) { if (state !== `${key}:wait`) { state = `${key}:wait`; waiting(); } return; }
      if (state === key) return;
      state = key;
      if (r.poll) sfx('pick'); else sfx(r.ok ? 'right' : 'wrong');
      const v = r.none
        ? h('div', { class: 'verdict is-bad' }, h('div', { class: 'verdict-icon' }, icon('clock', { size: 56 })), h('h2', {}, 'Too slow'), h('p', {}, 'No answer this time.'))
        : verdict({ ok: r.ok, poll: r.poll, pts: r.pts, display: cur.reveal && cur.reveal.display, streak: r.st });
      const moved = r.pr ? r.pr - r.r : 0;
      screen(`is-verdict ${r.poll ? 'is-poll' : r.ok ? 'is-ok' : 'is-bad'}`, v,
        r.ok && r.ms ? h('p', { class: 'answer-time' }, `Answered in ${(r.ms / 1000).toFixed(1)} s`) : null,
        h('p', { class: 'rank-line' }, `You’re in ${ordinal(r.r)} place`),
        moved > 0 ? h('span', { class: 'pill pill-zing rank-move' }, `Up ${moved} place${moved === 1 ? '' : 's'}`) : null,
        moved < 0 ? h('span', { class: 'pill rank-move is-down' }, `Down ${-moved}`) : null);
      if (r.ok) confetti({ y: 0.45, count: r.st >= 3 ? 160 : 80, power: 800 });
      return;
    }
    if (cur.phase === 'board') {
      if (state === key) return;
      state = key;
      const r = mineScore || { s: 0, r: '–' };
      screen('is-board', h('p', { class: 'muted-light' }, 'Leaderboard'),
        h('div', { class: 'big-rank' }, typeof r.r === 'number' ? ordinal(r.r) : '–'),
        h('p', {}, `${Number(r.s || 0).toLocaleString()} points`),
        r.r === 1 ? h('p', { class: 'pill pill-zing' }, 'You’re in the lead') : h('p', { class: 'muted-light' }, 'Keep going!'),
        myTeam() ? h('p', { class: 'team-line', style: { background: myTeam().colour } }, `${myTeam().name}: ${ordinal(teamRank())} of ${teams.s.length} teams`) : null);
    }
  }

  function waiting() {
    screen('is-wait', h('div', { class: 'spinner light' }), h('h2', {}, 'Answer locked in'), h('p', { class: 'muted-light' }, 'Waiting for everyone else…'));
  }

  /* ----------------------------------------------------------- arcade */

  async function arcade() {
    if (arcadeStop || state === 'arcade-loading') return;
    state = 'arcade-loading';
    const qs = await live.get(P('qs'));
    const mod = await import(`../game/modes/${meta.mode}.js`);
    const wait = async () => {
      const ms = (meta.startAt || 0) - live.now();
      if (ms > 0) {
        const c = h('div', { class: 'big-rank' }, String(Math.ceil(ms / 1000)));
        screen('is-intro', h('p', { class: 'muted-light' }, modeOf(meta.mode).name), c, h('p', {}, modeOf(meta.mode).tagline));
        let last = -1;
        await new Promise((res) => {
          const t = setInterval(() => {
            const left = (meta.startAt || 0) - live.now();
            const s = Math.ceil(left / 1000);
            if (s !== last) { last = s; c.textContent = String(Math.max(1, s)); if (s > 0) sfx('countdown'); }
            if (left <= 0) { clearInterval(t); res(); }
          }, 100);
        });
        sfx('go');
      }
    };
    await wait();
    if (meta.status !== 'play') return;
    root.classList.add('is-arcade');
    fill(body);
    preloadBlooks([mine.blook]);
    harness = createHarness(body, { live, P, uid, meta, qs: qs || [], name: mine.name, blook: mine.blook });
    const stopGame = mod.mountPlayer(harness);
    arcadeStop = () => { stopGame(); harness.destroy(); harness = null; root.classList.remove('is-arcade'); };
    state = 'arcade';
  }

  /* -------------------------------------------------------------- end */

  function ended() {
    if (state === 'end') return;
    state = 'end';
    if (arcadeStop) { arcadeStop(); arcadeStop = null; }
    const list = final || [];
    const mineRow = list.find((r) => r.u === uid);
    const top = list.slice(0, 3);
    const teamWon = myTeam() && teamRank() === 1;
    if ((mineRow && mineRow.r <= 3) || teamWon) { sfx('win'); celebrate(teamWon ? [myTeam().colour, '#ffffff', '#ffcd1f'] : undefined); } else sfx('reveal');
    // accounts earn XP and coins; guests are invited to keep theirs next time
    const reward = h('div', { class: 'reward' });
    if (signedIn() && mineRow) {
      claimGame(`${pin}:${meta.startAt || meta.createdAt || ''}`, mineRow, list.length).then((r) => {
        if (!r) return;
        const info = levelInfo(progressMe().xp);
        fill(reward,
          h('div', { class: 'row', style: { justifyContent: 'center', gap: '10px' } },
            h('span', { class: 'pill pill-zing' }, `+${r.xp} XP`), h('span', { class: 'pill pill-zing' }, `+${r.coins} coins`)),
          r.levelUp ? h('h2', { class: 'level-up' }, `Level ${r.levelUp}!`) : null,
          h('div', { class: 'xp-bar' }, h('i', { style: { width: `${Math.round(info.frac * 100)}%` } })),
          h('a', { class: 'btn btn-sm', href: '/blooks' }, 'Open boxes'));
        if (r.levelUp) { sfx('checkpoint'); celebrate(['#6b4cff', '#a560ff', '#ffcd1f', '#ffffff']); }
      }).catch(() => {});
    } else if (mineRow) {
      fill(reward, h('p', { class: 'muted-light small' }, 'Sign up to earn XP and coins, open boxes and collect blooks.'));
    }
    screen('is-end',
      h('p', { class: 'muted-light' }, 'Game over'),
      myTeam() ? h('div', { class: 'team-badge', style: { background: myTeam().colour } }, blook(myTeam().blook, 44),
        h('div', {}, h('small', {}, teamWon ? 'Your team won!' : `Your team came ${ordinal(teamRank())}`), h('b', {}, myTeam().name))) : null,
      mineRow ? h('div', { class: 'big-rank' }, ordinal(mineRow.r)) : null,
      mineRow ? h('p', {}, `${mineRow.s.toLocaleString()} points · ${mineRow.c} right of ${mineRow.a}`) : h('p', {}, 'Thanks for playing!'),
      mineRow && mineRow.x ? h('p', { class: 'muted-light' }, mineRow.x) : null,
      h('ol', { class: 'mini-podium' }, ...top.map((r) => h('li', { class: r.u === uid ? 'is-me' : '' }, blook(r.b), h('b', {}, r.n), h('span', {}, r.s.toLocaleString())))),
      reward,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('a', { class: 'btn btn-main', href: '/join' }, 'Join another game'),
        h('a', { class: 'btn btn-dark', href: '/signup' }, 'Make your own quiz')));
  }

  /* ---------------------------------------------------------- routing */

  function render() {
    if (!meta) return;
    if (meta.status === 'lobby') { if (state !== 'lobby') { state = 'lobby'; lobby(); } return; }
    if (meta.status === 'end') { if (final) ended(); return; }
    if (modeOf(meta.mode).kind === 'arcade') arcade(); else classic();
  }

  function cleanup() {
    unsubs.forEach((u) => u());
    unsubs.length = 0;
    if (arcadeStop) { arcadeStop(); arcadeStop = null; }
  }

  unsubs.push(listen(live, P('abuse')));
  unsubs.push(live.on(P('teams'), (v) => { teams = v; drawTeam(); }));
  unsubs.push(live.on(P('meta'), (m) => {
    if (!m) { if (state !== 'end') kicked('The host closed this game.'); return; }
    meta = m;
    banner.hidden = m.hostOn !== false || m.status === 'end';
    render();
  }));
  unsubs.push(live.on(P(`players/${uid}`), (p) => { if (p === null && meta && state !== 'end') kicked('The host removed you from this game.'); }));
  unsubs.push(live.on(P('cur'), (c) => { cur = c; if (meta && meta.status === 'play') render(); }));
  unsubs.push(live.on(P(`me/${uid}`), (m) => {
    if (!m) return;
    mineScore = m;
    foot.querySelector('.foot-score').textContent = Number(m.s || 0).toLocaleString();
    if (meta && meta.status === 'play') render();
  }));
  unsubs.push(live.on(P('final'), (f) => { if (f) { final = f; render(); } }));

  // keep the screen awake during a game where the browser allows it
  let wake = null;
  try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; }

  return { el: root, destroy() { cleanup(); try { wake && wake.release(); } catch { /* ignore */ } } };
}
