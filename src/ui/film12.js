// film12.js — the Quickzy 1.2 launch film: "Sky Race".
//
// A real 3D film (three.js), shot like a movie:
//   1. Golden hour above a sea of clouds. The Quickzy airliner glides past.
//   2. Radar warning: two fighter jets close in from behind.
//   3. Missiles. The airliner rolls away; one explodes beside it.
//   4. Three right answers charge the boost. The viewer presses BOOST
//      (time slows down until they do).
//   5. BOOST: the camera kicks, the clouds streak, the jets fall away.
//   6. The airliner climbs into the sun: QUICKZY 1.2 · SKY RACE.
//   7. The update card.
// If 3D can't start (old device, no WebGL, offline), the update card shows.

import { h } from './dom.js';
import { logo, icon } from './icons.js';
import { celebrate } from './confetti.js';
import { sfx, playMusic, stopMusic } from '../game/sound.js';
import { NEWS_12 } from './whatsnew.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const SEEN = 'quickzy.film12.seen';
export const film12Seen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return true; } };

/* --------------------------------------------------------------- textures */

function canvasTex(T, w, hh, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = hh;
  draw(c.getContext('2d'), w, hh);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A soft, lumpy puff for clouds and smoke. */
function puffTex(T) {
  return canvasTex(T, 256, 256, (g, w) => {
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + (Math.random() - 0.5) * w * 0.45;
      const y = w / 2 + (Math.random() - 0.5) * w * 0.3;
      const r = w * (0.12 + Math.random() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    }
  });
}

function glowTex(T, inner = 'rgba(255,250,230,1)', mid = 'rgba(255,200,120,0.35)') {
  return canvasTex(T, 128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, inner); gr.addColorStop(0.25, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}

/** The airliner's paint: white top, purple belly, windows and the name. */
function liveryTex(T) {
  // canvas x = along the fuselage (0 = tail, 1 = nose); canvas y = around it:
  // 0.25 is the top, 0.75 the belly, 0.5 the left side, 0 / 1 the right side.
  return canvasTex(T, 1024, 512, (g, w, hh) => {
    g.fillStyle = '#f4f5fb'; g.fillRect(0, 0, w, hh);
    const belly = g.createLinearGradient(0, hh * 0.62, 0, hh * 0.88);
    belly.addColorStop(0, '#6b4cff'); belly.addColorStop(0.5, '#3a2399'); belly.addColorStop(1, '#6b4cff');
    g.fillStyle = belly; g.fillRect(0, hh * 0.62, w, hh * 0.26);
    g.fillStyle = '#ffcd1f'; g.fillRect(0, hh * 0.6, w, hh * 0.02); g.fillRect(0, hh * 0.88, w, hh * 0.02);
    // windows and cockpit, both sides
    for (const f of [0.46, 0.04]) {
      g.fillStyle = '#1b2240';
      for (let x = w * 0.16; x < w * 0.84; x += 22) { g.beginPath(); g.ellipse(x, hh * f, 6, 8, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#10142a';
      for (let i = 0; i < 3; i++) g.fillRect(w * 0.9 + i * 16, hh * f - 9, 13, 16);
    }
    g.fillStyle = '#1b2240';
    for (let x = w * 0.16; x < w * 0.84; x += 22) { g.beginPath(); g.ellipse(x, hh * 0.98, 6, 8, 0, 0, Math.PI * 2); g.fill(); }
    // the name: left side reads nose-first from the left, right side from the right
    g.font = '900 52px "Lilita One", Nunito, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#6b4cff';
    g.save(); g.translate(w * 0.5, hh * 0.535); g.scale(-1, 0.75); g.fillText('QUICKZY', 0, 0); g.restore();
    g.save(); g.translate(w * 0.5, hh * 0.955); g.scale(1, -0.75); g.fillText('QUICKZY', 0, 0); g.restore();
  });
}

/* ----------------------------------------------------------------- models */

function airliner(T, tex) {
  const plane = new T.Group();
  const paint = new T.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.35 });
  const white = new T.MeshStandardMaterial({ color: 0xf2f3fa, metalness: 0.4, roughness: 0.3 });
  const purple = new T.MeshStandardMaterial({ color: 0x6b4cff, metalness: 0.3, roughness: 0.35 });
  const red = new T.MeshStandardMaterial({ color: 0xe8112d, metalness: 0.3, roughness: 0.4 });
  const metal = new T.MeshStandardMaterial({ color: 0xb9bfd3, metalness: 0.85, roughness: 0.25 });

  // fuselage: a smooth lathe profile, nose towards -z
  const prof = [];
  const L = 22;
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    let r = 1.35;
    if (u < 0.26) r = 1.35 * (0.22 + 0.78 * Math.sin((u / 0.26) * Math.PI / 2));
    if (u > 0.88) r = 1.35 * Math.sqrt(Math.max(0, 1 - ((u - 0.88) / 0.12) ** 2));
    prof.push(new T.Vector2(Math.max(0.02, r), u * L - L / 2));
  }
  const bodyGeo = new T.LatheGeometry(prof, 48);
  // lathe UVs: u around, v along. Turn them so the livery runs nose to tail.
  const uv = bodyGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) { const a = uv.getX(i); const b = uv.getY(i); uv.setXY(i, b, a); }
  const body = new T.Mesh(bodyGeo, paint);
  body.rotation.x = -Math.PI / 2;          // lathe axis y -> -z (nose forward)
  body.rotation.y = Math.PI / 2;            // belly down
  plane.add(body);

  const wingShape = new T.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(11, 4.2); wingShape.lineTo(11.6, 5.4); wingShape.lineTo(10.8, 5.6); wingShape.lineTo(0, 4.8); wingShape.lineTo(0, 0);
  const wingGeo = new T.ExtrudeGeometry(wingShape, { depth: 0.28, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
  for (const side of [1, -1]) {
    const wing = new T.Mesh(wingGeo, white);
    wing.rotation.x = Math.PI / 2;
    wing.scale.set(side, 1, 1);
    wing.position.set(side * 1.0, -0.6, -1.8);
    wing.rotation.z = side * 0.06;
    plane.add(wing);
    // winglet
    const tip = new T.Mesh(new T.BoxGeometry(0.12, 1.4, 1.0), purple);
    tip.position.set(side * 12.4, 0.0, 3.6); tip.rotation.x = -0.3;
    plane.add(tip);
    // engine
    const eng = new T.Mesh(new T.CylinderGeometry(0.75, 0.62, 3.4, 28, 1, true), metal);
    eng.rotation.x = Math.PI / 2; eng.position.set(side * 4.6, -1.35, -0.6);
    plane.add(eng);
    const cowl = new T.Mesh(new T.TorusGeometry(0.72, 0.12, 10, 28), purple);
    cowl.position.set(side * 4.6, -1.35, -2.3);
    plane.add(cowl);
    const fan = new T.Mesh(new T.CircleGeometry(0.66, 28), new T.MeshStandardMaterial({ color: 0x1b1d2c, metalness: 0.8, roughness: 0.4 }));
    fan.position.set(side * 4.6, -1.35, -2.1); fan.rotation.y = Math.PI;
    plane.add(fan);
    // navigation light (red left, green right)
    const nav = new T.Mesh(new T.SphereGeometry(0.14, 8, 8), new T.MeshBasicMaterial({ color: side > 0 ? 0x2bff88 : 0xff3355 }));
    nav.position.set(side * 11.6, -0.4, 3.7);
    plane.add(nav);
  }
  // tail fin
  const finShape = new T.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(4.2, 0); finShape.lineTo(5.6, 5.2); finShape.lineTo(3.8, 5.2); finShape.lineTo(0, 0);
  const fin = new T.Mesh(new T.ExtrudeGeometry(finShape, { depth: 0.24, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }), red);
  fin.rotation.y = -Math.PI / 2;
  fin.position.set(0.12, 0.9, 6.0);
  plane.add(fin);
  // tailplanes
  for (const side of [1, -1]) {
    const tp = new T.Mesh(new T.BoxGeometry(4.2, 0.18, 1.6), white);
    tp.position.set(side * 2.4, 0.4, 9.2); tp.rotation.y = side * -0.35;
    plane.add(tp);
  }
  // afterburner-style boost flames behind both engines (hidden until BOOST)
  const flameMat = new T.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flames = [];
  for (const side of [1, -1]) {
    const f = new T.Mesh(new T.ConeGeometry(0.6, 6, 20, 1, true), flameMat);
    f.rotation.x = -Math.PI / 2; f.position.set(side * 4.6, -1.35, 4.2);
    plane.add(f); flames.push(f);
  }
  plane.userData = { flames, flameMat };
  return plane;
}

function fighter(T) {
  const jet = new T.Group();
  const grey = new T.MeshStandardMaterial({ color: 0x9aa3b8, metalness: 0.5, roughness: 0.4 });
  const dark = new T.MeshStandardMaterial({ color: 0x6c7488, metalness: 0.5, roughness: 0.45 });
  const prof = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; prof.push(new T.Vector2(Math.max(0.02, 0.7 * Math.min(1, u * 3.2) * (u > 0.85 ? 0.85 : 1)), u * 12 - 6)); }
  const body = new T.Mesh(new T.LatheGeometry(prof, 24), grey);
  body.rotation.x = -Math.PI / 2;
  jet.add(body);
  const canopy = new T.Mesh(new T.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x8fd8ff, metalness: 0.9, roughness: 0.05 }));
  canopy.scale.set(1, 0.8, 2.6); canopy.position.set(0, 0.45, -2.2);
  jet.add(canopy);
  const wing = new T.Shape();
  wing.moveTo(0, -1.5); wing.lineTo(5.2, 2.8); wing.lineTo(5.2, 3.6); wing.lineTo(0, 3.4);
  const wg = new T.ExtrudeGeometry(wing, { depth: 0.14, bevelEnabled: false });
  for (const side of [1, -1]) {
    const w = new T.Mesh(wg, dark); w.rotation.x = Math.PI / 2; w.scale.set(side, 1, 1); w.position.set(0, 0, 0);
    jet.add(w);
    const tail = new T.Mesh(new T.BoxGeometry(0.1, 1.9, 1.6), dark);
    tail.position.set(side * 0.7, 1.0, 4.6); tail.rotation.z = side * 0.25;
    jet.add(tail);
  }
  const burn = new T.Mesh(new T.ConeGeometry(0.45, 3.2, 16, 1, true), new T.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
  burn.rotation.x = -Math.PI / 2; burn.position.z = 7.4;
  jet.add(burn);
  jet.userData.burn = burn;
  return jet;
}

/* ------------------------------------------------------------------- film */

/** Play the film. Resolves when it closes. */
export function playFilm12({ pilot = 'fox' } = {}) {
  try { localStorage.setItem(SEEN, '1'); } catch { /* private mode */ }
  return new Promise((resolve) => {
    const canvas = h('canvas', { class: 'f12-canvas' });
    const caption = h('div', { class: 'f12-caption' });
    const hud = h('div', { class: 'f12-hud' });
    const title = h('div', { class: 'f12-title' });
    const flash = h('div', { class: 'f12-flash' });
    const skip = h('button', { class: 'btn btn-sm f12-skip' }, 'Skip');
    const root = h('div', { class: 'f12-root is-loading', role: 'dialog', 'aria-label': 'Quickzy 1.2' },
      canvas, h('div', { class: 'f12-bars' }), flash, hud, caption, title, skip,
      h('div', { class: 'f12-load' }, logo(), h('span', {}, 'Loading the film…')));
    document.body.append(root);
    let done = false;
    let stopAll = () => {};
    const close = () => {
      if (done) return;
      done = true;
      stopAll(); stopMusic();
      root.classList.add('f12-out');
      setTimeout(() => { root.remove(); resolve(); }, 400);
    };
    const showCard = () => {
      stopAll();
      root.classList.remove('is-loading');
      skip.textContent = 'Close';
      skip.onclick = close;
      playMusic('victory');
      root.append(h('div', { class: 'fl-card f12-card' },
        h('div', { class: 'fl-card-head' }, logo(), h('div', {}, h('small', {}, 'Now boarding'), h('h1', {}, 'Quickzy 1.2'))),
        h('ul', { class: 'wn-list' }, ...NEWS_12.map(([ic, col, t, text], i) => h('li', { style: { animationDelay: `${0.2 + i * 0.12}s` } },
          h('span', { class: 'wn-ic', style: { background: col } }, icon(ic, { size: 18 })), h('div', {}, h('b', {}, t), h('small', {}, text))))),
        h('button', { class: 'btn btn-main btn-lg btn-block', onclick: close }, "Let's race")));
    };
    skip.onclick = () => showCard();

    const calm = document.documentElement.dataset.motion === 'calm';
    if (calm) { showCard(); return; }
    import(/* @vite-ignore */ THREE_URL)
      .then((T) => { if (!done) stopAll = run(T); })
      .catch(() => showCard());

    function run(T) {
      let renderer;
      try {
        renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      } catch { showCard(); return () => {}; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = T.SRGBColorSpace;
      const scene = new T.Scene();
      scene.fog = new T.Fog(0xf4c79a, 140, 900);
      const cam = new T.PerspectiveCamera(42, 1, 0.1, 3000);

      // sky dome: a warm golden-hour gradient around a low sun
      const sunDir = new T.Vector3(0.35, 0.16, -1).normalize();
      const sky = new T.Mesh(new T.SphereGeometry(2000, 32, 16), new T.ShaderMaterial({
        side: T.BackSide, depthWrite: false, fog: false,
        uniforms: { sun: { value: sunDir } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `varying vec3 vDir; uniform vec3 sun;
          void main(){
            float y = vDir.y;
            vec3 top = vec3(0.13,0.30,0.70);
            vec3 mid = vec3(0.55,0.70,0.95);
            vec3 hor = vec3(1.0,0.78,0.55);
            vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, y));
            c = mix(c, top, smoothstep(0.18, 0.75, y));
            float s = max(dot(vDir, sun), 0.0);
            c += vec3(1.0,0.75,0.45) * pow(s, 8.0) * 0.55 + vec3(1.0,0.95,0.85) * pow(s, 600.0) * 3.0;
            c = mix(c, vec3(0.95,0.72,0.55), smoothstep(0.0, -0.25, y));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }));
      scene.add(sky);

      // light: a warm low sun and a cool sky fill
      scene.add(new T.HemisphereLight(0xbcd6ff, 0xf3b27a, 1.1));
      const sunLight = new T.DirectionalLight(0xffd9a8, 2.6);
      sunLight.position.copy(sunDir).multiplyScalar(100);
      scene.add(sunLight);

      // clouds: a deep floor of soft puffs below, and some drifting past
      const puff = puffTex(T);
      const clouds = [];
      const cloudMat = (o) => new T.SpriteMaterial({ map: puff, color: 0xffffff, transparent: true, opacity: o, depthWrite: false, fog: true });
      for (let i = 0; i < 260; i++) {
        const floor = i < 190;
        const s = new T.Sprite(cloudMat(floor ? 0.85 : 0.55));
        const size = floor ? 90 + Math.random() * 120 : 30 + Math.random() * 50;
        s.scale.set(size, size * 0.55, 1);
        s.position.set((Math.random() - 0.5) * 900, floor ? -38 - Math.random() * 30 : -14 + Math.random() * 46, -Math.random() * 1200 + 300);
        s.material.color.setHSL(0.08, 0.6, floor ? 0.9 + Math.random() * 0.08 : 0.96);
        scene.add(s); clouds.push(s);
      }
      // sun glare
      const glare = new T.Sprite(new T.SpriteMaterial({ map: glowTex(T), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      glare.scale.set(420, 420, 1);
      glare.position.copy(sunDir).multiplyScalar(1500);
      scene.add(glare);

      const plane = airliner(T, liveryTex(T));
      scene.add(plane);
      const jets = [fighter(T), fighter(T)];
      jets.forEach((j) => { j.position.set(0, 0, 900); scene.add(j); });

      // missiles with smoke, and explosions
      const smokeMat = new T.SpriteMaterial({ map: puff, color: 0xdedede, transparent: true, opacity: 0.6, depthWrite: false });
      const fireMat = new T.SpriteMaterial({ map: glowTex(T, 'rgba(255,255,220,1)', 'rgba(255,120,30,0.6)'), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      const missiles = [];
      const puffs = [];
      const missileGeo = new T.CylinderGeometry(0.16, 0.16, 2.2, 10);
      missileGeo.rotateX(Math.PI / 2);
      const missileMat = new T.MeshStandardMaterial({ color: 0xe6e8ef, metalness: 0.7, roughness: 0.3 });
      const fireMissile = (from, aim) => {
        const m = new T.Mesh(missileGeo, missileMat);
        m.position.copy(from);
        m.userData = { aim: aim.clone(), life: 0 };
        scene.add(m); missiles.push(m);
        sfx('shoot');
      };
      const spawnPuff = (pos, mat, size, life, grow = 3) => {
        const s = new T.Sprite(mat.clone());
        s.position.copy(pos); s.scale.set(size, size, 1);
        s.userData = { life, max: life, grow, size };
        scene.add(s); puffs.push(s);
      };
      const explode = (pos) => {
        for (let i = 0; i < 6; i++) spawnPuff(pos.clone().add(new T.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)), fireMat, 6 + Math.random() * 6, 0.7, 10);
        for (let i = 0; i < 10; i++) spawnPuff(pos.clone().add(new T.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)), smokeMat, 5, 2.2, 6);
        sfx('boom');
        shakeAmt = 1.2;
      };

      // the story
      let t = 0;
      let speed = 60;            // how fast the world streams past
      let timeScale = 1;
      let shakeAmt = 0;
      let boosted = -1;          // when the viewer pressed BOOST
      let waitingBoost = false;
      const said = new Set();
      const once = (key, fn) => { if (!said.has(key)) { said.add(key); fn(); } };
      const say = (text, cls = '') => { caption.className = `f12-caption ${cls}`; caption.replaceChildren(text ? h('span', {}, text) : ''); };
      const pips = () => h('div', { class: 'f12-pips' }, ...[0, 1, 2].map((i) => h('i', { class: i < charge ? 'is-on' : '' })));
      let charge = 0;
      const boostBtn = h('button', { class: 'f12-boost' }, 'BOOST');
      const doBoost = () => {
        if (!waitingBoost) return;
        waitingBoost = false; boosted = t; timeScale = 1;
        boostBtn.remove();
        sfx('boost'); shakeAmt = 1.6;
        flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on');
        say('BOOST!', 'is-boost');
      };
      boostBtn.addEventListener('click', doBoost);
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); doBoost(); } };
      window.addEventListener('keydown', key);

      root.classList.remove('is-loading');
      playMusic('tense');
      const look = new T.Vector3();
      const v = (x, y, z) => new T.Vector3(x, y, z);
      const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
      const camAt = (pos, target, fov) => { cam.position.copy(pos); look.copy(target); cam.lookAt(look); if (fov && Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); } };

      let last = performance.now();
      let raf = 0;
      const resize = () => {
        const w = root.clientWidth; const hh = root.clientHeight;
        renderer.setSize(w, hh, false);
        cam.aspect = w / Math.max(1, hh); cam.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);
      let ended = false;

      const frame = (nowMs) => {
        raf = requestAnimationFrame(frame);
        const realDt = Math.min(0.05, (nowMs - last) / 1000);
        last = nowMs;
        const dt = realDt * timeScale;
        t += dt;
        const B = boosted >= 0 ? t - boosted : -1;    // seconds since BOOST

        // the airliner: gentle bob and bank, a barrel-roll dodge, then the climb
        let roll = Math.sin(t * 0.6) * 0.06;
        let pitch = Math.sin(t * 0.8) * 0.015;
        plane.position.y = Math.sin(t * 0.9) * 0.6;
        plane.position.x = Math.sin(t * 0.35) * 1.5;
        if (t > 11.4 && t < 13.2) { const k = (t - 11.4) / 1.8; roll += ease(k) * Math.PI * 2; plane.position.x += Math.sin(k * Math.PI) * 6; }
        if (B > 3) { const k = ease((B - 3) / 3); pitch -= k * 0.35; plane.position.y += k * k * 26; plane.position.z -= k * k * 70; }
        plane.rotation.set(pitch, 0, roll);
        const fl = plane.userData;
        const flameOn = B >= 0 ? Math.min(1, B * 4) : 0;
        fl.flameMat.opacity = flameOn * (0.75 + Math.random() * 0.25);
        fl.flames.forEach((f) => { f.scale.set(1, 0.8 + flameOn * (1 + Math.random() * 0.5), 1); });

        // the world streams past
        const target = B >= 0 ? (B < 3 ? 380 : 220) : 60;
        speed += (target - speed) * Math.min(1, realDt * (B >= 0 ? 4 : 1.5));
        for (const c of clouds) {
          c.position.z += speed * dt;
          if (c.position.z > 320) { c.position.z -= 1500; c.position.x = (Math.random() - 0.5) * 900; }
        }

        // the jets: far behind, then closing in, then left behind by the boost
        let jz = 900;
        if (t > 4.2) jz = 900 - ease((t - 4.2) / 5.5) * 840;        // to z = 60
        if (B >= 0) jz = 60 + B * B * 140;
        jets.forEach((j, i) => {
          j.position.set((i ? 1 : -1) * (9 + Math.sin(t * 0.7 + i) * 2), 3 + Math.sin(t * 0.9 + i * 2) * 1.5 + (i ? -2 : 2), jz + i * 10);
          j.rotation.set(0, 0, Math.sin(t * 1.3 + i) * 0.25);
          j.userData.burn.scale.set(1, 0.9 + Math.random() * 0.3, 1);
        });

        // story beats
        if (t > 0.3) once('a', () => say('Above the clouds, 11 December 2026…'));
        if (t > 4.2) once('b', () => { say('WARNING: fighter jets behind you!', 'is-alert'); sfx('tagged'); root.classList.add('is-alert'); });
        if (t > 7.6) once('b2', () => root.classList.remove('is-alert'));
        if (t > 9.8) once('c', () => {
          say('Missiles!', 'is-alert');
          fireMissile(jets[0].position.clone().add(v(0, -0.6, -6)), v(-4, 0, -40));
          setTimeout(() => !done && fireMissile(jets[1].position.clone().add(v(0, -0.6, -6)), v(6, 2, -40)), 380);
        });
        if (t > 11.4) once('d', () => say('Barrel roll!', 'is-good'));
        if (t > 13.4) once('e', () => { say('Answer 3 questions to charge your BOOST'); hud.replaceChildren(pips()); });
        for (const [k, at] of [[1, 14.3], [2, 15.0], [3, 15.7]]) {
          if (t > at) once(`q${k}`, () => { charge = k; hud.replaceChildren(pips(), h('b', { class: 'f12-right' }, 'Correct!')); sfx('right'); });
        }
        if (t > 16.4) once('f', () => {
          hud.replaceChildren(pips());
          say('BOOST READY! Press it!', 'is-good');
          sfx('checkpoint');
          waitingBoost = true; timeScale = 0.18;
          root.append(boostBtn);
          // nobody pressed? the pilot does it
          setTimeout(() => { if (!done) doBoost(); }, 5000);
        });
        if (B > 1.6) once('g', () => { say('The jets can\'t keep up!', 'is-good'); hud.replaceChildren(); playMusic('victory'); });
        if (B > 4.2) once('h', () => {
          say('');
          title.replaceChildren(h('small', {}, 'Quickzy 1.2'), h('h1', {}, 'SKY RACE'), h('p', {}, 'Fly. Answer. Boost. Outrun the jets.'));
          title.classList.add('is-on');
          sfx('win');
          celebrate(['#ffcd1f', '#ff8a2a', '#ffffff', '#6b4cff']);
        });
        if (B > 9.5 && !ended) { ended = true; title.classList.remove('is-on'); showCard(); return; }

        // missiles home in on where the airliner was, then miss
        for (let i = missiles.length - 1; i >= 0; i--) {
          const m = missiles[i];
          m.userData.life += dt;
          const dir = m.userData.aim.clone().sub(m.position);
          const dist = dir.length();
          dir.normalize();
          m.position.addScaledVector(dir, 70 * dt);
          m.lookAt(m.userData.aim);
          if (Math.random() < 0.9) spawnPuff(m.position.clone().add(v(0, 0, 1.4)), smokeMat, 1.4, 1.6, 4);
          if (dist < 3 || m.userData.life > 3) { explode(m.position.clone()); scene.remove(m); missiles.splice(i, 1); }
        }
        for (let i = puffs.length - 1; i >= 0; i--) {
          const p = puffs[i];
          p.userData.life -= dt;
          const k = 1 - p.userData.life / p.userData.max;
          const s = p.userData.size + k * p.userData.grow;
          p.scale.set(s, s, 1);
          p.material.opacity = Math.max(0, (1 - k) * 0.7);
          p.position.z += speed * dt * 0.9;
          if (p.userData.life <= 0) { scene.remove(p); p.material.dispose(); puffs.splice(i, 1); }
        }

        // the camera, shot by shot
        const P = plane.position;
        if (t < 4.2) {
          const k = ease(t / 4.2);
          camAt(v(26 - k * 12, 6 - k * 3, -58 + k * 26), P.clone().add(v(0, 0, 2)), 40);
        } else if (t < 9.6) {
          const k = ease((t - 4.2) / 5.4);
          camAt(v(-16 + k * 4, 5 + k * 2, 30 + k * 6), P.clone().add(v(0, 0, -6 + k * 20)), 46);
        } else if (t < 13.4) {
          const j = jets[0].position;
          camAt(v(j.x - 4, j.y + 3, j.z + 18), P.clone(), 38);
        } else if (B < 0) {
          const k = ease((t - 13.4) / 3);
          camAt(v(-11 - k * 2, 1.5, 3 - k * 6), P.clone().add(v(0, 0, -2)), 50);
        } else if (B < 3.2) {
          const k = ease(B / 0.6);
          camAt(v(-6, 3.5, 24 - k * 4), P.clone().add(v(0, 0, -30)), 50 + k * 34);
        } else {
          const k = ease((B - 3.2) / 2.5);
          camAt(v(-8, 1, 40), P.clone(), 84 - k * 40);
        }
        if (shakeAmt > 0) {
          cam.position.x += (Math.random() - 0.5) * shakeAmt;
          cam.position.y += (Math.random() - 0.5) * shakeAmt;
          shakeAmt = Math.max(0, shakeAmt - realDt * 1.6);
        }
        renderer.render(scene, cam);
      };
      raf = requestAnimationFrame(frame);
      if (navigator.webdriver) window.__quickzyFilm12 = { time: () => t, boost: doBoost };

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', key);
        boostBtn.remove(); hud.replaceChildren(); say(''); title.classList.remove('is-on');
        renderer.dispose();
        canvas.remove();
        delete window.__quickzyFilm12;
      };
    }
  });
}
