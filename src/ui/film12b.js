// film12b.js — "The teacher who wanted more", the Quickzy 1.2 story film.
//
//   1. A classroom. The teacher explains at the chalkboard; the class is
//      bored. He stops: "I'm tired of this. I want presentations and quizzes."
//   2. On a plane, through his eyes: a laptop on the tray table, clouds out
//      of the window. He opens Quickzy, sets up Pro, and Presentation+ and
//      quizzes unlock.
//   3. Back in class: a Presentation+ slide on the projector, a live poll,
//      then a quiz. The whole class claps.
// Real 3D (three.js). If it cannot start, the 1.2 card shows instead.

import { h } from './dom.js';
import { logo, logoSVG } from './icons.js';
import { blookSVG } from './blooks.js';
import { celebrate } from './confetti.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const SEEN = 'quickzy.film12b.seen';
export const storySeen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return true; } };

const KIDS = ['fox', 'panda', 'cat', 'robot', 'unicorn', 'frog', 'tiger', 'owl', 'bunny', 'dragon', 'koala', 'penguin'];

/** A blook as a picture three.js can draw. */
function blookImage(id) {
  const svg = blookSVG(id);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '256'); svg.setAttribute('height', '256');
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
  return img;
}
function logoImage() {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">${logoSVG('f')}</svg>`)}`;
  return img;
}

export function playStory() {
  try { localStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
  return new Promise((resolve) => {
    const canvas = h('canvas', { class: 'f12-canvas' });
    const caption = h('div', { class: 'f12-caption' });
    const title = h('div', { class: 'f12-title' });
    const skip = h('button', { class: 'btn btn-sm f12-skip' }, 'Skip');
    const root = h('div', { class: 'f12-root is-loading', role: 'dialog', 'aria-label': 'Quickzy 1.2 story' },
      canvas, h('div', { class: 'f12-bars' }), caption, title, skip,
      h('div', { class: 'f12-load' }, logo(), h('span', {}, 'Loading the film…')));
    document.body.append(root);
    let done = false;
    let stopAll = () => {};
    const close = () => {
      if (done) return;
      done = true; stopAll(); stopMusic();
      root.classList.add('f12-out');
      setTimeout(() => { root.remove(); resolve(); }, 400);
    };
    skip.onclick = close;
    if (document.documentElement.dataset.motion === 'calm') { close(); return; }
    import(/* @vite-ignore */ THREE_URL).then((T) => { if (!done) stopAll = run(T); }).catch(() => close());

    function run(T) {
      let renderer;
      try { renderer = new T.WebGLRenderer({ canvas, antialias: true }); } catch { close(); return () => {}; }
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      const cam = new T.PerspectiveCamera(45, 1, 0.05, 200);
      const say = (text, cls = '') => { caption.className = `f12-caption ${cls}`; caption.replaceChildren(text ? h('span', {}, text) : ''); };
      const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...o });
      const box = (w, hh, d, mat, x, y, z, parent) => { const m = new T.Mesh(new T.BoxGeometry(w, hh, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
      const kidImgs = KIDS.map(blookImage);
      const logoImg = logoImage();

      /* ------------------------------------------------ the classroom */
      const room = new T.Scene();
      room.background = new T.Color(0xf4ead8);
      room.add(new T.HemisphereLight(0xfff6e8, 0x8a7458, 1.1));
      const sun = new T.DirectionalLight(0xffe2b8, 2.2);
      sun.position.set(6, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
      room.add(sun);
      box(24, 0.2, 20, std(0xb98a5a, { roughness: 0.6 }), 0, -0.1, 0, room);                    // wooden floor
      box(24, 8, 0.2, std(0xe9e0cf), 0, 4, -6, room);                                          // front wall
      box(0.2, 8, 20, std(0xe3d7c2), -12, 4, 0, room);
      box(0.2, 8, 20, std(0xe3d7c2), 12, 4, 0, room);
      // windows on the side wall with daylight
      for (const z of [-2, 3]) box(0.05, 2.4, 2.6, new T.MeshBasicMaterial({ color: 0xcfe9ff }), 11.85, 4, z, room);
      // the board: chalkboard, later a projector screen in front of it
      const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1024; boardCanvas.height = 512;
      const bctx = boardCanvas.getContext('2d');
      const boardTex = new T.CanvasTexture(boardCanvas); boardTex.colorSpace = T.SRGBColorSpace;
      box(9.4, 4.4, 0.12, std(0x6b4a2a), 0, 3.9, -5.88, room);
      const board = new T.Mesh(new T.PlaneGeometry(9, 4), new T.MeshStandardMaterial({ map: boardTex, roughness: 0.9 }));
      board.position.set(0, 3.9, -5.8); room.add(board);
      // desks with kids (blooks on little stands so they can bounce and clap)
      const kids = [];
      KIDS.slice(0, 9).forEach((id, i) => {
        const row = Math.floor(i / 3); const col = i % 3;
        const x = (col - 1) * 3.4; const z = 1 + row * 2.6;
        box(1.8, 0.1, 1, std(0xd9a066, { roughness: 0.5 }), x, 1.2, z - 0.4, room);
        for (const lx of [-0.8, 0.8]) for (const lz of [-0.85, 0.05]) box(0.08, 1.2, 0.08, std(0x555555), x + lx, 0.6, z + lz - 0.4, room);
        const tex = new T.Texture(kidImgs[i]); tex.colorSpace = T.SRGBColorSpace;
        kidImgs[i].onload = () => { tex.needsUpdate = true; };
        const kid = new T.Sprite(new T.SpriteMaterial({ map: tex }));
        kid.scale.set(1.3, 1.3, 1); kid.position.set(x, 1.95, z + 0.3); room.add(kid);
        kids.push({ s: kid, base: 1.95, phase: i * 0.7 });
      });
      // the teacher: built from simple shapes, with glasses and a tie
      const teacher = new T.Group();
      const skin = std(0xf1c7a1, { roughness: 0.6 }); const shirt = std(0x2f6fdb); const trousers = std(0x2b2f45);
      for (const lx of [-0.18, 0.18]) { const leg = new T.Mesh(new T.CylinderGeometry(0.13, 0.12, 1.1, 12), trousers); leg.position.set(lx, 0.55, 0); leg.castShadow = true; teacher.add(leg); }
      const torso = new T.Mesh(new T.CapsuleGeometry(0.36, 0.7, 6, 16), shirt); torso.position.y = 1.55; torso.castShadow = true; teacher.add(torso);
      const tie = new T.Mesh(new T.BoxGeometry(0.1, 0.5, 0.02), std(0xe8112d)); tie.position.set(0, 1.62, 0.37); teacher.add(tie);
      const head = new T.Mesh(new T.SphereGeometry(0.3, 24, 18), skin); head.position.y = 2.32; head.castShadow = true; teacher.add(head);
      const hair = new T.Mesh(new T.SphereGeometry(0.31, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), std(0x3a2615)); hair.position.y = 2.36; teacher.add(hair);
      for (const gx of [-0.11, 0.11]) { const g = new T.Mesh(new T.TorusGeometry(0.075, 0.015, 8, 20), std(0x111111)); g.position.set(gx, 2.34, 0.28); teacher.add(g); }
      const armL = new T.Group(); const armR = new T.Group();
      for (const [arm, x] of [[armL, -0.46], [armR, 0.46]]) {
        const a = new T.Mesh(new T.CapsuleGeometry(0.09, 0.6, 4, 10), shirt); a.position.y = -0.38; a.castShadow = true; arm.add(a);
        const hand = new T.Mesh(new T.SphereGeometry(0.09, 12, 10), skin); hand.position.y = -0.78; arm.add(hand);
        arm.position.set(x, 1.95, 0); teacher.add(arm);
      }
      teacher.position.set(-2.2, 0, -4.6);
      room.add(teacher);

      const drawBoard = (mode, k = 0) => {
        const g = bctx; const W = 1024; const H = 512;
        if (mode === 'chalk') {
          g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, W, H);
          g.strokeStyle = '#ffffff22'; for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(Math.random() * W, Math.random() * H); g.lineTo(Math.random() * W, Math.random() * H); g.stroke(); }
          g.fillStyle = '#f4f1e8'; g.font = '48px "Comic Sans MS", cursive';
          const lines = ['Photosynthesis', '6CO2 + 6H2O  →  C6H12O6 + 6O2', 'Light energy → chemical energy', 'Chlorophyll absorbs light…'];
          const chars = Math.floor(k * lines.join('').length);
          let used = 0;
          lines.forEach((l, i) => { const show = l.slice(0, Math.max(0, chars - used)); used += l.length; g.fillText(show, 60, 100 + i * 100); });
        } else {
          // the projector: a Presentation+ slide, then a poll, then a quiz
          const grad = g.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, mode === 'quiz' ? '#ff4772' : mode === 'poll' ? '#12c9a6' : '#6b4cff'); grad.addColorStop(1, mode === 'quiz' ? '#ff8a2a' : mode === 'poll' ? '#2f9bff' : '#4a2fd6');
          g.fillStyle = grad; g.fillRect(0, 0, W, H);
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '400 64px "Lilita One", system-ui';
          if (mode === 'slide') {
            g.fillText('How plants make food', W / 2, 150);
            g.font = '700 34px Nunito, system-ui'; g.textAlign = 'left';
            ['Sunlight + water + air', 'Leaves are tiny kitchens', 'Out comes sugar and oxygen'].forEach((l, i) => g.fillText(`•  ${l}`, 200, 250 + i * 64));
            if (logoImg.complete) g.drawImage(logoImg, W - 150, 20, 120, 120);
          } else if (mode === 'poll') {
            g.fillText('What do plants need most?', W / 2, 110);
            const vals = [0.85, 0.45, 0.3, 0.6].map((v) => v * Math.min(1, k * 1.4));
            ['Light', 'Soil', 'Music', 'Water'].forEach((l, i) => {
              const x = 170 + i * 200; const hh = vals[i] * 260;
              g.fillStyle = ['#ff4772', '#ffcd1f', '#a560ff', '#2f9bff'][i]; g.fillRect(x, 430 - hh, 140, hh);
              g.fillStyle = '#fff'; g.font = '800 30px Nunito, system-ui'; g.fillText(l, x + 70, 470); g.fillText(String(Math.round(vals[i] * 24)), x + 70, 420 - hh);
            });
          } else {
            g.fillText('Which gas do plants give out?', W / 2, 110);
            ['Oxygen', 'Smoke', 'Helium', 'Steam'].forEach((l, i) => {
              const x = 110 + (i % 2) * 420; const y = 170 + Math.floor(i / 2) * 150;
              const right = i === 0 && k > 0.6;
              g.fillStyle = ['#ff4772', '#2f9bff', '#ffb21f', '#12c9a6'][i]; g.globalAlpha = k > 0.6 && !right ? 0.35 : 1;
              g.fillRect(x, y, 380, 120); g.globalAlpha = 1;
              g.fillStyle = '#fff'; g.font = '800 44px Nunito, system-ui'; g.fillText(right ? `✓ ${l}` : l, x + 190, y + 76);
            });
          }
        }
        boardTex.needsUpdate = true;
      };

      /* --------------------------------------------------- the plane */
      const plane = new T.Scene();
      plane.background = new T.Color(0x9fc8ff);
      plane.add(new T.HemisphereLight(0xffffff, 0x9b8f80, 1.0));
      const pl = new T.DirectionalLight(0xfff2dd, 1.6); pl.position.set(-3, 4, 2); plane.add(pl);
      const cabin = std(0xe8e6e1, { roughness: 0.7 });
      box(6, 0.1, 6, std(0x5a5f6e), 0, -0.6, 0, plane);                                  // floor
      box(0.1, 3, 6, cabin, -1.6, 0.9, 0, plane);                                        // side wall with the window
      // the window: a rounded hole showing a moving sky
      const skyCanvas = document.createElement('canvas'); skyCanvas.width = 512; skyCanvas.height = 512;
      const sctx = skyCanvas.getContext('2d');
      const skyTex = new T.CanvasTexture(skyCanvas); skyTex.colorSpace = T.SRGBColorSpace;
      const win = new T.Mesh(new T.CircleGeometry(0.42, 32), new T.MeshBasicMaterial({ map: skyTex }));
      win.scale.set(0.8, 1.15, 1); win.rotation.y = Math.PI / 2; win.position.set(-1.54, 1.25, -0.4); plane.add(win);
      const winFrame = new T.Mesh(new T.TorusGeometry(0.43, 0.06, 10, 40), std(0xd6d3cc)); winFrame.scale.set(0.8, 1.15, 1); winFrame.rotation.y = Math.PI / 2; winFrame.position.copy(win.position); plane.add(winFrame);
      // seat in front with its fold-down tray
      box(1.5, 1.6, 0.3, std(0x2c3550), 0, 0.5, -1.5, plane);
      box(1.3, 0.45, 0.25, std(0x2c3550), 0, 1.5, -1.5, plane);
      box(1.2, 0.04, 0.6, std(0x3b3f4a), 0, 0.55, -1.05, plane);
      // the laptop: a screen that shows Quickzy
      const lap = new T.Group(); lap.position.set(0, 0.58, -1.0); plane.add(lap);
      box(0.9, 0.03, 0.6, std(0xbfc3cc, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, lap);
      const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1024; screenCanvas.height = 640;
      const scx = screenCanvas.getContext('2d');
      const screenTex = new T.CanvasTexture(screenCanvas); screenTex.colorSpace = T.SRGBColorSpace;
      const lid = new T.Group(); lid.position.set(0, 0.015, -0.29); lid.rotation.x = -0.25; lap.add(lid);
      box(0.9, 0.58, 0.02, std(0xbfc3cc, { metalness: 0.6, roughness: 0.3 }), 0, 0.29, 0, lid);
      const scr = new T.Mesh(new T.PlaneGeometry(0.84, 0.52), new T.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
      scr.position.set(0, 0.29, 0.012); lid.add(scr);
      // hands on the keyboard
      const handMat = std(0xf1c7a1, { roughness: 0.6 });
      const hands = [-0.22, 0.22].map((x) => { const m = new T.Mesh(new T.CapsuleGeometry(0.05, 0.16, 4, 10), handMat); m.rotation.x = Math.PI / 2; m.position.set(x, 0.62, -0.8); plane.add(m); return m; });

      const drawSky = (t) => {
        const g = sctx; const grad = g.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#4f8fe6'); grad.addColorStop(0.6, '#a8d4ff'); grad.addColorStop(1, '#ffffff');
        g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < 8; i++) { const x = ((i * 140 - t * 160) % 700 + 700) % 700 - 100; const y = 300 + (i % 3) * 50; g.beginPath(); g.ellipse(x, y, 90, 26, 0, 0, Math.PI * 2); g.ellipse(x + 40, y - 18, 50, 22, 0, 0, Math.PI * 2); g.fill(); }
        skyTex.needsUpdate = true;
      };
      const drawScreen = (step, k) => {
        const g = scx; const W = 1024; const H = 640;
        g.fillStyle = '#f3f0ff'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#17133f'; g.fillRect(0, 0, W, 70);
        if (logoImg.complete) g.drawImage(logoImg, 16, 10, 50, 50);
        g.fillStyle = '#fff'; g.font = '400 34px "Lilita One", system-ui'; g.textAlign = 'left'; g.fillText('Quickzy', 76, 47);
        g.fillStyle = '#9b97c4'; g.font = '700 18px Nunito, system-ui'; g.fillText('quickzy.work.gd', 820, 44);
        g.textAlign = 'center';
        if (step === 0) {
          const grad = g.createLinearGradient(0, 90, W, 400); grad.addColorStop(0, '#6b4cff'); grad.addColorStop(1, '#ff4772');
          g.fillStyle = grad; g.fillRect(40, 100, W - 80, 300);
          g.fillStyle = '#fff'; g.font = '400 64px "Lilita One", system-ui'; g.fillText('Make a quiz.', W / 2, 220);
          g.fillStyle = '#ffcd1f'; g.fillText('Play it like a game.', W / 2, 300);
          g.fillStyle = '#ffcd1f'; g.fillRect(380, 460, 260, 70); g.fillStyle = '#17133f'; g.font = '800 30px Nunito, system-ui'; g.fillText('Quickzy Pro', W / 2, 506);
        } else if (step === 1) {
          g.fillStyle = '#17133f'; g.font = '400 48px "Lilita One", system-ui'; g.fillText('Quickzy Pro', W / 2, 150);
          g.fillStyle = '#fff'; g.fillRect(260, 190, 500, 360); g.strokeStyle = '#d9d4f5'; g.lineWidth = 3; g.strokeRect(260, 190, 500, 360);
          g.textAlign = 'left'; g.fillStyle = '#6b6890'; g.font = '700 20px Nunito, system-ui';
          const card = '4242 4242 4242 4242'.slice(0, Math.floor(k * 1.8 * 19));
          g.fillText('Card number', 290, 240); g.fillStyle = '#17133f'; g.font = '800 30px Nunito, system-ui'; g.fillText(card + (Math.sin(performance.now() / 150) > 0 ? '|' : ''), 290, 280);
          g.fillStyle = '#6b6890'; g.font = '700 20px Nunito, system-ui'; g.fillText('7 days free, then $13.49 a year', 290, 340);
          g.fillStyle = k > 0.75 ? '#12c9a6' : '#6b4cff'; g.fillRect(290, 440, 440, 70);
          g.fillStyle = '#fff'; g.font = '800 28px Nunito, system-ui'; g.textAlign = 'center';
          g.fillText(k > 0.75 ? '✓ Welcome to Pro!' : 'Start my free week', 510, 485);
        } else {
          g.fillStyle = '#17133f'; g.font = '400 46px "Lilita One", system-ui'; g.fillText('Unlocked for you', W / 2, 140);
          [['Presentation+', '#6b4cff', 'Slides with live polls and graphs'], ['Quizzes', '#ff4772', 'Ten game modes, homework, reports']].forEach(([t, c, sub], i) => {
            const x = 110 + i * 420; const pop = Math.min(1, Math.max(0, k * 2 - i * 0.5));
            g.save(); g.translate(x + 190, 330); g.scale(0.6 + pop * 0.4, 0.6 + pop * 0.4); g.globalAlpha = pop;
            g.fillStyle = c; g.fillRect(-190, -120, 380, 240);
            g.fillStyle = '#fff'; g.font = '400 44px "Lilita One", system-ui'; g.fillText(t, 0, -10);
            g.font = '700 20px Nunito, system-ui'; g.fillText(sub, 0, 40); g.font = '800 30px Nunito, system-ui'; g.fillText('✓ Unlocked', 0, 95);
            g.restore();
          });
        }
        screenTex.needsUpdate = true;
      };

      /* ------------------------------------------------------ timing */
      root.classList.remove('is-loading');
      playMusic('menu');
      let t = 0; let last = performance.now(); let raf = 0;
      const said = new Set(); const once = (k, fn) => { if (!said.has(k)) { said.add(k); fn(); } };
      const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
      const resize = () => { renderer.setSize(root.clientWidth, root.clientHeight, false); cam.aspect = root.clientWidth / Math.max(1, root.clientHeight); cam.updateProjectionMatrix(); };
      resize(); addEventListener('resize', resize);
      const look = new T.Vector3();
      const shot = (px, py, pz, lx, ly, lz, fov = 45) => { cam.position.set(px, py, pz); look.set(lx, ly, lz); cam.lookAt(look); if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } };
      const T1 = 11; const T2 = 23; const END = 37;

      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        let scene = room;
        if (t < T1) {
          // 1. the boring lesson
          drawBoard('chalk', Math.min(1, t / 6));
          armR.rotation.z = t < 6 ? 2.4 + Math.sin(t * 9) * 0.12 : 0.1;    // writing, then down
          teacher.rotation.y = t < 6 ? Math.PI - 0.3 : 0.15;
          head.rotation.x = t > 7.5 ? 0.25 : 0;
          kids.forEach((k) => { k.s.position.y = k.base - (t > 2 ? 0.25 : 0) + Math.sin(t * 0.8 + k.phase) * 0.02; });
          if (t < 6) { const k = ease(t / 6); shot(6 - k * 2, 3.2, 9 - k * 2, -1, 2.6, -5); } else { const k = ease((t - 6) / 4); shot(-1.2 + k * 0.2, 2.5, -1.2 + k * 0.4, -2.2, 2.3, -4.6, 40 - k * 8); }
          once('a', () => say('“…and that is how photosynthesis works.”'));
          if (t > 3.2) once('b', () => say('(the whole class is asleep)', 'is-alert'));
          if (t > 6.4) once('c', () => { say('“I’m tired of all this.”'); sfx('fall'); });
          if (t > 8.6) once('d', () => say('“I want presentations and quizzes my students actually love.”', 'is-good'));
        } else if (t < T2) {
          // 2. on the plane, through his eyes
          scene = plane;
          const k = (t - T1) / (T2 - T1);
          drawSky(t);
          const step = k < 0.3 ? 0 : k < 0.7 ? 1 : 2;
          drawScreen(step, step === 0 ? k / 0.3 : step === 1 ? (k - 0.3) / 0.4 : (k - 0.7) / 0.3);
          hands.forEach((m, i) => { m.position.y = 0.62 + (step === 1 ? Math.abs(Math.sin(t * 18 + i * 1.7)) * 0.02 : 0); });
          const sway = Math.sin(t * 0.9) * 0.01;
          if (k < 0.12) { const e = ease(k / 0.12); shot(-0.9 + e * 0.9, 1.35, 0.4 - e * 0.1, -1.6 + e * 1.6, 1.25 - e * 0.55, -0.4 - e * 0.6); }
          else shot(0 + sway, 1.42, 0.55, 0, 0.86, -1.2, 46 - Math.min(1, (k - 0.12) * 3) * 8);
          once('e', () => { say('Later, on a plane…'); playMusic('lobby'); });
          if (k > 0.14) once('f', () => say('He opens Quickzy.'));
          if (k > 0.3) once('g', () => say('He sets up Quickzy Pro: 7 days free.'));
          if (k > 0.62) once('h', () => { sfx('checkpoint'); });
          if (k > 0.7) once('i', () => { say('Presentation+ and quizzes: unlocked!', 'is-good'); sfx('win'); });
        } else {
          // 3. back in class: the lesson everyone loves
          const k = t - T2;
          const mode = k < 4 ? 'slide' : k < 8 ? 'poll' : 'quiz';
          drawBoard(mode, mode === 'slide' ? 1 : mode === 'poll' ? (k - 4) / 3 : (k - 8) / 2.5);
          teacher.rotation.y = 0.2; head.rotation.x = 0;
          armL.rotation.z = -0.4 + Math.sin(t * 3) * 0.15; armR.rotation.z = 0.6 + Math.sin(t * 3 + 1) * 0.2;
          const clap = k > 10.5;
          kids.forEach((kd) => { kd.s.position.y = kd.base + (k > 1 ? 0.15 : 0) + (clap ? Math.abs(Math.sin(t * 9 + kd.phase)) * 0.35 : Math.sin(t * 2 + kd.phase) * 0.05); });
          if (k < 4) { const e = ease(k / 4); shot(5 - e * 3, 3, 10 - e * 3, 0, 3.4, -5.5); }
          else if (k < 10.5) shot(0, 3.6, 3.5, 0, 3.8, -5.8, 44);
          else { const e = ease((k - 10.5) / 3); shot(-6 + e * 4, 2.6, -3.5 + e * 2, 0, 1.9, 3, 52); }
          once('j', () => { say('Monday morning: a Presentation+ lesson.'); playMusic('game'); });
          if (k > 4) once('k', () => say('A live poll: everyone votes on their phone.'));
          if (k > 8) once('l', () => say('Then a quiz!'));
          if (k > 10.5) once('m', () => { say('Everybody claps!', 'is-good'); sfx('applause'); setTimeout(() => !done && sfx('applause'), 1300); celebrate(); playMusic('victory'); });
          if (k > 12.8) once('n', () => {
            say('');
            title.replaceChildren(h('small', {}, 'Quickzy 1.2'), h('h1', {}, 'PRESENTATION+'), h('p', {}, 'Slides, live polls, graphs and quizzes. For Quickzy Pro.'));
            title.classList.add('is-on');
          });
          if (t > END) { close(); return; }
        }
        renderer.render(scene, cam);
      };
      raf = requestAnimationFrame(frame);
      if (navigator.webdriver) window.__quickzyStory = { time: () => t, jump: (s) => { t = s; } };
      return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); renderer.dispose(); delete window.__quickzyStory; };
    }
  });
}
