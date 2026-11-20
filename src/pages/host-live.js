// host-live.js — the big screen: lobby, questions, leaderboards, podium.
//
// The host's browser runs the referee (game/referee.js); this page only draws
// what the referee knows and gives the host the controls.

import { listen } from '../ui/abuse.js';
import { picture } from '../ui/picture.js';
import { h, fill, plural } from '../ui/dom.js';
import { icon, shape, logo, wordmark } from '../ui/icons.js';
import { blook, preloadBlooks } from '../ui/blooks.js';
import { toast, confirm, busy, copy } from '../ui/kit.js';
import { qrSVG } from '../ui/qr.js';
import { navigate } from '../router.js';
import { net, explain } from '../net/index.js';
import { me, prefs, setPrefs } from '../services/session.js';
import { getQuiz, getKey, saveReport, countPlay } from '../services/quizzes.js';
import { getMeta, gamePath, endAndRemove } from '../services/games.js';
import { createReferee } from '../game/referee.js';
import { modeOf } from '../game/modes/index.js';
import { TYPE_BY_ID } from '../game/questions.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';
import { downloadCSV } from '../game/report.js';
import { celebrate } from '../ui/confetti.js';
import { LIMITS } from '../config.js';
import { pageTitle } from './parts.js';

function problemScreen(title, text) {
  return h('div', { class: 'host pattern' }, h('div', { class: 'card center stack', style: { maxWidth: '460px', margin: '14vh auto' } },
    h('h2', {}, title), h('p', { class: 'muted' }, text), h('a', { class: 'btn btn-main', href: '/library' }, 'My quizzes')));
}

const fmt = (n) => Number(n || 0).toLocaleString();

export default async function HostLive({ params }) {
  const pin = params.pin;
  const meta = await getMeta(pin).catch(() => null);
  if (!meta) return problemScreen('This game is over', 'It has ended or never existed. Host a new one from your quizzes.');
  if (meta.host !== me().uid) return problemScreen('Not your game', 'Only the person who opened this game can run it.');
  const quiz = await getQuiz(meta.quizId).catch(() => null);
  const key = quiz ? await getKey(quiz.id) : null;
  if (!quiz || !key) return problemScreen('The quiz could not be loaded', 'It may have been deleted while the game was open.');
  pageTitle(`Game ${pin}`);

  const live = net.live;
  const mode = modeOf(meta.mode);
  const root = h('div', { class: 'host' });
  const joinURL = `${location.origin}/join/${pin}`;
  let view = null;                  // { key, el, update(), destroy() }
  let reportSaved = false;
  let ref;

  // tell players when the host's screen goes away
  live.set(gamePath(pin, 'meta/hostOn'), true).catch(() => {});
  const cancelOff = live.onDisconnect(gamePath(pin, 'meta/hostOn'), { set: false });

  // closing removes the game: stop listening and stop writing first
  let closed = false;
  async function closeGame() {
    closed = true;
    ref.destroy();
    cancelOff();
    await endAndRemove(pin);
  }

  /* ------------------------------------------------------ shared bits */

  const pinText = (big) => h('div', { class: `pin-box${big ? ' is-big' : ''}` },
    h('small', {}, 'Game PIN'),
    h('b', { 'aria-label': `Game PIN ${pin.split('').join(' ')}` }, `${pin.slice(0, 3)} ${pin.slice(3)}`));

  const musicBtn = () => {
    const b = h('button', { class: 'btn btn-dark btn-icon', title: 'Music', 'aria-label': 'Music on or off' }, icon(prefs().music ? 'volume' : 'mute'));
    b.addEventListener('click', () => {
      const on = !prefs().music;
      setPrefs({ music: on });
      fill(b, icon(on ? 'volume' : 'mute'));
      if (on) playMusic(ref.meta.status === 'lobby' ? 'lobby' : 'game'); else stopMusic();
    });
    return b;
  };
  const fullBtn = () => h('button', { class: 'btn btn-dark btn-icon', title: 'Full screen', 'aria-label': 'Full screen',
    onclick: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); } }, maximise());

  function maximise() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '22'); s.setAttribute('height', '22');
    s.innerHTML = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  const bar = (...right) => h('header', { class: 'host-bar' },
    h('a', { class: 'logo', href: '/library', title: 'Leave (the game keeps going)' }, logo(), wordmark()),
    h('div', { class: 'host-bar-mid' }, h('span', { class: 'pill pill-dark' }, mode.name), h('span', { class: 'muted-light' }, quiz.title)),
    h('div', { class: 'row' }, ...right, musicBtn(), fullBtn()));

  /* ------------------------------------------------------------ lobby */

  function lobbyView() {
    const grid = h('div', { class: 'lobby-players' });
    const count = h('b', {}, '0');
    const start = h('button', { class: 'btn btn-main btn-xl' }, icon('play'), 'Start');
    const lock = h('button', { class: 'btn btn-dark' });
    const qrBox = h('div', { class: 'qr-box' });
    qrSVG(joinURL).then((s) => qrBox.append(s)).catch(() => {});
    const shown = new Set();
    start.addEventListener('click', busy(start, async () => {
      try { await ref.start(); sfx('go'); } catch (err) { toast(err.message || explain(err), 'bad'); }
    }));
    lock.addEventListener('click', busy(lock, async () => { await ref.setSetting('locked', !ref.meta.settings.locked); }));
    const cancel = h('button', { class: 'btn btn-dark btn-sm' }, 'Cancel game');
    cancel.addEventListener('click', async () => {
      if (!(await confirm({ title: 'Cancel this game?', text: 'Everyone in the lobby is sent home.', yes: 'Cancel game', danger: true }))) return;
      await closeGame();
      navigate('/library', { replace: true });
    });

    const el = h('div', { class: 'host-screen lobby pattern' },
      bar(cancel),
      h('section', { class: 'lobby-top' },
        h('div', { class: 'lobby-join' },
          h('p', {}, 'Join at ', h('b', {}, `${location.host}/join`), ' or scan the code'),
          pinText(true),
          h('button', { class: 'btn btn-ghost btn-sm', style: { color: '#fff' }, onclick: () => copy(joinURL, 'Join link copied') }, icon('copy', { size: 16 }), 'Copy join link')),
        qrBox),
      h('section', { class: 'lobby-mid' },
        h('div', { class: 'row' }, icon('users'), count, h('span', {}, 'players'), lock),
        start),
      grid);

    const update = () => {
      const players = [...ref.players.values()].sort((a, b) => a.at - b.at);
      count.textContent = String(players.length);
      start.disabled = !players.length;
      fill(lock, icon(ref.meta.settings.locked ? 'lock' : 'globe', { size: 18 }), ref.meta.settings.locked ? 'Locked' : 'Open');
      preloadBlooks(players.map((p) => p.blook));
      if (!players.length) {
        fill(grid, h('p', { class: 'lobby-wait' }, 'Waiting for players…'));
        return;
      }
      const chips = players.map((p) => {
        const chip = h('button', { class: `player-chip${shown.has(p.uid) ? '' : ' is-new'}`, title: `Remove ${p.name}`,
          onclick: async () => {
            if (await confirm({ title: `Remove ${p.name}?`, text: 'They cannot rejoin this game.', yes: 'Remove', danger: true })) ref.kick(p.uid);
          } }, blook(p.blook), h('span', {}, p.name), h('i', { class: 'x' }, icon('close', { size: 14 })));
        if (!shown.has(p.uid)) { shown.add(p.uid); sfx('join'); }
        return chip;
      });
      fill(grid, ...chips);
    };
    playMusic('lobby');
    return { key: 'lobby', el, update };
  }

  /* ---------------------------------------------------------- classic */

  function timerRing() {
    const el = h('div', { class: 'timer-ring' }, h('b', {}, ''));
    let int = 0;
    const set = (endsAt, total) => {
      clearInterval(int);
      let lastSec = -1;
      const tick = () => {
        const left = Math.max(0, endsAt - live.now());
        const s = Math.ceil(left / 1000);
        el.firstChild.textContent = String(s);
        el.style.setProperty('--p', String(left / (total * 1000)));
        el.classList.toggle('is-low', s <= 5);
        if (s !== lastSec && s <= 5 && s > 0) sfx('tick');
        lastSec = s;
      };
      tick();
      int = setInterval(tick, 100);
    };
    return { el, set, stop: () => clearInterval(int) };
  }

  function tiles(q, reveal) {
    if (q.type === 'type' || q.type === 'number') {
      return h('div', { class: 'type-wait' }, icon(q.type === 'number' ? 'hash' : 'type', { size: 40 }),
        reveal ? h('div', {}, h('small', {}, 'The answer'), h('b', {}, reveal.display)) : h('b', {}, q.type === 'number' ? 'Players are typing a number' : 'Players are typing their answers'));
    }
    if (q.type === 'order') {
      const correct = reveal ? reveal.display.split(' → ') : null;
      return h('div', { class: 'order-show' }, ...(correct || q.options).map((o, i) => h('div', { class: `tile c${i % 6}` },
        reveal ? h('span', { class: 'order-n' }, String(i + 1)) : shape(i, 40), h('span', {}, o))));
    }
    const labels = q.type === 'tf' ? ['True', 'False'] : q.options;
    const colour = (i) => (q.type === 'tf' ? (i === 0 ? 1 : 0) : i);
    const max = reveal ? Math.max(1, ...reveal.counts) : 1;
    return h('div', { class: `tiles n${labels.length}` }, ...labels.map((o, i) => {
      const right = reveal && reveal.correct && reveal.correct.includes(i);
      const bar = reveal ? h('i', { class: 'count-bar' }) : null;
      if (bar) bar.style.setProperty('--w', String((reveal.counts[i] || 0) / max));
      return h('div', { class: `tile c${colour(i) % 6}${reveal && reveal.correct && !right ? ' is-dim' : ''}` },
        bar, shape(colour(i), 40), h('span', { class: 'grow' }, o),
        reveal ? h('b', { class: 'count' }, String(reveal.counts[i] || 0)) : null,
        right ? h('span', { class: 'tick' }, icon('check', { size: 30, stroke: 3.6 })) : null);
    }));
  }

  function classicView(cur) {
    const q = cur.q;
    const progress = `Question ${cur.n + 1} of ${cur.total}`;
    const typeLabel = TYPE_BY_ID.get(q.type)?.label || '';
    const nextBtn = h('button', { class: 'btn btn-main btn-lg' });
    nextBtn.addEventListener('click', busy(nextBtn, async () => { await ref.next(); }));

    if (cur.phase === 'intro') {
      playMusic('game');
      const bar2 = h('div', { class: 'intro-bar' }, h('i'));
      const el = h('div', { class: 'host-screen q-screen' },
        bar(h('span', { class: 'pill pill-dark' }, progress)),
        h('div', { class: 'q-intro' },
          h('p', { class: 'q-type' }, typeLabel),
          h('h1', {}, q.text),
          picture(q.img),
          bar2),
        h('div', { class: 'host-foot' }, pinText(false), h('button', { class: 'btn btn-dark', onclick: () => ref.next() }, 'Show answers now')));
      requestAnimationFrame(() => { bar2.firstChild.style.transitionDuration = `${Math.max(0, cur.introEnds - live.now())}ms`; bar2.firstChild.style.width = '100%'; });
      sfx('reveal');
      return { key: `intro${cur.n}`, el, update() {} };
    }

    if (cur.phase === 'open') {
      const ring = timerRing();
      ring.set(cur.endsAt, q.time);
      const answered = h('div', { class: 'answered' }, h('b', {}, '0'), h('small', {}, 'answers'));
      fill(nextBtn, 'Skip', icon('skip', { size: 18 }));
      const el = h('div', { class: 'host-screen q-screen' },
        bar(h('span', { class: 'pill pill-dark' }, progress)),
        h('h1', { class: 'q-head' }, q.text),
        h('div', { class: 'q-mid' },
          h('div', { class: 'q-mid-left' }, picture(q.img, { cls: 'q-pic-host' }) || blook(ref.ranked()[0]?.blook || 'robot')),
          h('div', { class: 'q-mid-centre' }, ring.el, h('div', { class: 'q-mid-note' }, h('span', { class: 'pill pill-dark' }, typeLabel),
            q.points === 'double' ? h('span', { class: 'pill pill-zing' }, 'Double points') : null,
            q.points === 'none' ? h('span', { class: 'pill pill-dark' }, 'No points') : null)),
          answered),
        tiles(q, null),
        h('div', { class: 'host-foot' }, pinText(false), nextBtn));
      return {
        key: `open${cur.n}`, el,
        update() { answered.firstChild.textContent = String(ref.answeredCount); },
        destroy() { ring.stop(); },
      };
    }

    if (cur.phase === 'reveal') {
      const r = cur.reveal;
      sfx('reveal');
      fill(nextBtn, 'Leaderboard', icon('arrowRight', { size: 18 }));
      const summary = q.type === 'poll'
        ? `${plural(r.answered, 'vote')}`
        : `${r.right} of ${ref.players.size} got it right`;
      const el = h('div', { class: 'host-screen q-screen' },
        bar(h('span', { class: 'pill pill-dark' }, progress)),
        h('h1', { class: 'q-head' }, q.text),
        picture(q.img, { cls: 'q-pic-small' }),
        h('div', { class: 'reveal-sum' }, q.type === 'poll' ? icon('chart', { size: 26 }) : icon('check', { size: 26 }), summary),
        tiles(q, r),
        h('div', { class: 'host-foot' }, pinText(false), nextBtn));
      return { key: `reveal${cur.n}`, el, update() {} };
    }

    // leaderboard between questions
    const last = cur.n + 1 >= cur.total;
    fill(nextBtn, last ? 'See the podium' : 'Next question', icon('arrowRight', { size: 18 }));
    // rows start where they stood before this question and slide to where
    // they stand now, while the scores count up: who overtook whom is the show
    const ranked = ref.ranked();
    const list = ranked.slice(0, 5);
    const ROW = 78;
    const startIdx = (p) => Math.min(5, (p.prevRank || ranked.indexOf(p) + 1) - 1);
    const rows = list.map((p, i) => {
      const pts = h('b', { class: 'pts' }, fmt(p.prevScore ?? p.score));
      const moved = (p.prevRank || i + 1) - (i + 1);
      const li = h('li', { class: i === 0 ? 'is-first' : '' },
        h('span', { class: 'rank' }, String(i + 1)), blook(p.blook), h('span', { class: 'grow name' }, p.name),
        moved > 0 ? h('span', { class: 'moved' }, icon('up', { size: 16 }), String(moved)) : null,
        p.streak > 1 ? h('span', { class: 'pill pill-zing' }, icon('bolt', { size: 14 }), String(p.streak)) : null,
        pts);
      li.style.transform = `translateY(${(startIdx(p) - i) * ROW}px)`;
      if (startIdx(p) >= 5) li.style.opacity = '0';
      return { li, pts, p };
    });
    const board = h('ol', { class: 'board is-flip', style: { height: `${Math.max(1, list.length) * ROW}px` } }, ...rows.map((r) => r.li));
    const el = h('div', { class: 'host-screen board-screen pattern' },
      bar(h('span', { class: 'pill pill-dark' }, progress)),
      h('h1', { class: 'center' }, 'Leaderboard'),
      board,
      list.length ? null : h('p', { class: 'center muted-light' }, 'No players yet.'),
      h('div', { class: 'host-foot' }, pinText(false), nextBtn));
    // let the old order show for a beat, then move
    setTimeout(() => {
      rows.forEach(({ li }) => { li.style.transform = 'translateY(0)'; li.style.opacity = '1'; });
      if (rows.some(({ p }, i) => (p.prevRank || i + 1) !== i + 1)) sfx('boost');
      const from = rows.map(({ p }) => p.prevScore ?? p.score);
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1100);
        const e = 1 - (1 - k) ** 3;
        rows.forEach(({ pts, p }, i) => { pts.textContent = fmt(Math.round(from[i] + (p.score - from[i]) * e)); });
        if (k < 1 && el.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 900);
    return { key: `board${cur.n}`, el, update() {} };
  }

  /* ----------------------------------------------------------- arcade */

  function arcadeView() {
    playMusic('game');
    const time = h('b', { class: 'arcade-time' }, '');
    const side = h('ol', { class: 'side-board' });
    const stageEl = h('div', { class: 'host-stage' });
    const count = h('div', { class: 'count-in', hidden: true });
    const endBtn = h('button', { class: 'btn btn-dark btn-sm' }, icon('stop', { size: 16 }), 'End now');
    endBtn.addEventListener('click', async () => {
      if (await confirm({ title: 'End the game now?', text: 'Scores so far are final.', yes: 'End game' })) ref.finish();
    });
    const el = h('div', { class: 'host-screen arcade-host' },
      bar(endBtn),
      h('div', { class: 'arcade-body' },
        h('div', { class: 'host-stage-wrap' }, stageEl, count),
        h('aside', { class: 'side' },
          h('div', { class: 'side-time' }, icon('clock'), time),
          side,
          h('div', { class: 'side-join' }, h('small', {}, `Join at ${location.host}`), pinText(false)))));
    let screenStop = null;
    import(`../game/modes/${mode.id}.js`).then((m) => {
      if (!el.isConnected && !document.body.contains(root)) return;
      screenStop = m.mountScreen(stageEl, { ref, live });
    });
    let lastCount = -1;
    const clock = setInterval(() => {
      const now = live.now();
      const m = ref.meta;
      if (now < m.startAt) {
        const c = Math.ceil((m.startAt - now) / 1000);
        count.hidden = false;
        if (c !== lastCount) { count.textContent = String(c); sfx('countdown'); lastCount = c; }
      } else if (!count.hidden) { count.hidden = true; sfx('go'); }
      const left = Math.max(0, Math.min(m.endsAt, m.endsAt) - Math.max(now, m.startAt || now));
      const s = Math.ceil(left / 1000);
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      time.classList.toggle('is-low', s <= 30);
    }, 200);
    const update = () => {
      const list = ref.ranked().slice(0, 10);
      fill(side, ...list.map((p, i) => h('li', {}, h('span', { class: 'rank' }, String(i + 1)), blook(p.blook),
        h('span', { class: 'grow' }, h('b', {}, p.name), h('small', {}, p.extra.summary || '')), h('b', {}, fmt(p.score)))),
      list.length ? null : h('li', { class: 'muted-light' }, 'No players'));
    };
    return { key: 'arcade', el, update, destroy() { clearInterval(clock); if (screenStop) screenStop(); } };
  }

  /* -------------------------------------------------------------- end */

  function endView() {
    stopMusic();
    const list = ref.ranked();
    // third, then second, then a drumroll for the winner
    const timers = [
      setTimeout(() => sfx('reveal'), 400),
      setTimeout(() => sfx('reveal'), 1700),
      ...[2400, 2600, 2800, 3000, 3200].map((t) => setTimeout(() => sfx('drum'), t)),
      setTimeout(() => { sfx('win'); celebrate(); }, 3400),
    ];
    const podium = [list[1], list[0], list[2]];
    const report = {
      quizId: quiz.id, quizTitle: quiz.title, mode: mode.id, pin,
      players: list.slice(0, LIMITS.playersMax).map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, correct: p.correct, answered: p.answered, notes: p.extra.summary || '' })),
    };
    if (!reportSaved && !ref.meta.reported) {
      reportSaved = true;
      live.set(gamePath(pin, 'meta/reported'), true).catch(() => {});
      saveReport(report).catch(() => {});
      countPlay(quiz.id);
    }
    const close = h('button', { class: 'btn btn-dark' }, 'Close game');
    close.addEventListener('click', busy(close, async () => { await closeGame(); navigate('/library?tab=reports', { replace: true }); }));
    const el = h('div', { class: 'host-screen end-screen pattern' },
      bar(),
      h('h1', { class: 'center' }, 'Podium'),
      h('div', { class: 'podium' }, ...podium.map((p, k) => {
        const place = [2, 1, 3][k];
        if (!p) return h('div', { class: `step s${place} is-empty` });
        return h('div', { class: `step s${place}`, style: { animationDelay: `${[1700, 3400, 400][k]}ms` } },
          blook(p.blook), h('b', { class: 'name' }, p.name), h('span', { class: 'pts' }, fmt(p.score)),
          h('div', { class: 'block' }, h('span', {}, String(place))));
      })),
      h('div', { class: 'card results' },
        h('div', { class: 'row spread' }, h('h2', {}, 'Results'),
          h('div', { class: 'row' },
            h('button', { class: 'btn', onclick: () => downloadCSV({ ...report, at: Date.now() }) }, icon('download', { size: 18 }), 'Download CSV'),
            h('a', { class: 'btn btn-main', href: `/host/${quiz.id}` }, icon('play', { size: 18 }), 'Play again'),
            close)),
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Player'), h('th', {}, 'Score'), h('th', {}, 'Correct'), h('th', {}, mode.kind === 'arcade' ? 'Game' : 'Accuracy'))),
          h('tbody', {}, ...list.map((p, i) => h('tr', {},
            h('td', {}, String(i + 1)),
            h('td', {}, h('span', { class: 'row', style: { gap: '8px', flexWrap: 'nowrap' } }, blook(p.blook), p.name)),
            h('td', {}, h('b', {}, fmt(p.score))),
            h('td', {}, `${p.correct}/${p.answered}`),
            h('td', {}, mode.kind === 'arcade' ? (p.extra.summary || '') : p.answered ? `${Math.round((p.correct / p.answered) * 100)}%` : '–')))))));
    return { key: 'end', el, update() {}, destroy() { timers.forEach(clearTimeout); } };
  }

  /* ------------------------------------------------------------- draw */

  let queued = false;
  function draw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const m = ref.meta;
      let want;
      if (m.status === 'lobby') want = 'lobby';
      else if (m.status === 'end') want = 'end';
      else if (ref.arcade) want = 'arcade';
      else if (ref.cur) want = `${ref.cur.phase}${ref.cur.n}`;
      else want = 'lobby';
      if (!view || view.key !== want) {
        if (view && view.destroy) view.destroy();
        if (want === 'lobby') view = lobbyView();
        else if (want === 'end') view = endView();
        else if (want === 'arcade') view = arcadeView();
        else view = classicView(ref.cur);
        fill(root, view.el);
      }
      view.update();
    });
  }

  try {
    ref = await createReferee({ pin, meta, quiz: { questions: quiz.questions }, key, onChange: draw });
  } catch (err) {
    console.error(err);
    return problemScreen('The game could not start', explain(err));
  }
  draw();
  const stopAbuse = listen(live, gamePath(pin, 'abuse'));

  const keys = (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if ((e.code === 'Space' || e.code === 'ArrowRight') && !ref.arcade && ref.meta.status === 'play') { e.preventDefault(); ref.next(); }
  };
  document.addEventListener('keydown', keys);

  return {
    el: root,
    destroy() {
      document.removeEventListener('keydown', keys);
      stopAbuse();
      if (view && view.destroy) view.destroy();
      stopMusic();
      if (closed) return;
      ref.destroy();
      cancelOff();
      live.set(gamePath(pin, 'meta/hostOn'), false).catch(() => {});
    },
  };
}
