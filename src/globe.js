// globe.js — a real 3D Earth.
//
// Geometry is a lit sphere in Three.js (vendored, no CDN). The surface is
// painted from Natural Earth coastlines shipped in assets/land.json, so the
// continents are the real ones rather than decorative blobs. Drop a satellite
// photo at assets/earth-day.jpg and it is used instead, which makes the planet
// photographic without touching this file.

import * as THREE from '../vendor/three.module.min.js';

const R = 1;
const TEX_W = 4096;
const TEX_H = 2048;

let landPromise = null;
function loadLand() {
  landPromise = landPromise || fetch('assets/land.json').then((r) => r.json()).catch(() => ({ rings: [] }));
  return landPromise;
}

/** Latitude decides the biome band, which is what makes a drawn Earth read as Earth. */
function landColour(lat) {
  const a = Math.abs(lat);
  if (a > 72) return '#e8eef7';
  if (a > 60) return '#7d8f7a';
  if (a > 45) return '#4e6b45';
  if (a > 33) return '#5d7440';
  if (a > 23) return '#9a8b52';
  if (a > 14) return '#7d8a44';
  return '#3f6b39';
}

/** Paint the equirectangular surface: ocean, shelves, land bands, ice. */
async function surfaceTexture() {
  const { rings } = await loadLand();
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext('2d');

  const ocean = ctx.createLinearGradient(0, 0, 0, TEX_H);
  ocean.addColorStop(0, '#0b2a4a');
  ocean.addColorStop(0.3, '#0d3b66');
  ocean.addColorStop(0.5, '#10508c');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ocean.addColorStop(0.7, '#0d3b66');
  ocean.addColorStop(1, '#0b2a4a');

  const toXY = (lon, lat) => [((lon + 180) / 360) * TEX_W, ((90 - lat) / 180) * TEX_H];

  const drawRings = (style, lineWidth, blur, colour) => {
    ctx.save();
    if (blur) {
      ctx.shadowBlur = blur;
      ctx.shadowColor = colour;
    }
    for (const ring of rings) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i += 2) {
        const [x, y] = toXY(ring[i], ring[i + 1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (style === 'fill') {
        const midLat = ring[1];
        ctx.fillStyle = landColour(midLat);
        ctx.fill();
      } else {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colour;
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // continental shelf haze, then the land itself, then a soft coast line
  drawRings('stroke', 26, 26, 'rgba(90,170,220,0.5)');
  drawRings('fill');
  drawRings('stroke', 2, 0, 'rgba(228,240,255,0.35)');

  // ice caps
  const cap = (fromLat, toLat, alpha) => {
    const [, y1] = toXY(0, fromLat);
    const [, y2] = toXY(0, toLat);
    const g = ctx.createLinearGradient(0, y1, 0, y2);
    g.addColorStop(0, `rgba(245,250,255,${alpha})`);
    g.addColorStop(1, 'rgba(245,250,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.min(y1, y2), TEX_W, Math.abs(y2 - y1));
  };
  cap(90, 63, 0.95);
  cap(-90, -60, 0.95);

  // a little grain so the surface is not flat colour
  const grain = ctx.getImageData(0, 0, TEX_W, TEX_H);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Cloud band: soft fractal blobs, heavier near the equator and the storm belts. */
function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < 900; i++) {
    const lat = (Math.random() - 0.5) * 180;
    const band = Math.exp(-((Math.abs(lat) - 8) ** 2) / 420) + Math.exp(-((Math.abs(lat) - 55) ** 2) / 300);
    if (Math.random() > band) continue;
    const x = Math.random() * c.width;
    const y = ((90 - lat) / 180) * c.height;
    const r = 18 + Math.random() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.22 + Math.random() * 0.3})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (1.6 + Math.random()), r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Lat/lon to a point on the sphere, matching how Three maps an equirectangular image. */
export function toVec(lon, lat, radius = R) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** A flight path: a great circle lifted off the surface, higher for longer hops. */
function arcCurve(a, b, lift = 0.28) {
  const start = toVec(a.lon, a.lat);
  const end = toVec(b.lon, b.lat);
  const angle = start.angleTo(end);
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(R + angle * lift + 0.04);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

let photoChecked = null;
async function photoTexture() {
  if (photoChecked === null) {
    photoChecked = fetch('assets/earth-day.jpg', { method: 'HEAD' })
      .then((r) => r.ok)
      .catch(() => false);
  }
  if (!(await photoChecked)) return null;
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      'assets/earth-day.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

/**
 * Builds the planet inside `container`.
 * Returns handles for spinning it, flying between cities and tearing it down.
 */
export async function createGlobe(container, { stops = [], doneUnits = new Set(), interactive = true, quality = 1, offsetY = 0, distance = 3.2, cameraY = 0.5 } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  // Lifting the camera and looking straight ahead drops the planet low in the
  // frame — an earthrise. cameraY 0 centres it instead.
  camera.position.set(0, cameraY, distance);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6 * quality));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  renderer.domElement.classList.add('globe-canvas');

  // --- the planet ------------------------------------------------------
  const earth = new THREE.Group();
  earth.position.y = offsetY;
  scene.add(earth);

  // A real satellite photo wins if the project has one. Ask for it once, with a
  // HEAD request, so a missing file costs one quiet 404 rather than a loud one
  // on every globe.
  const map = (await photoTexture()) || (await surfaceTexture());

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(R, 128, 96),
    new THREE.MeshPhongMaterial({ map, shininess: 14, specular: new THREE.Color(0x2a4766) }),
  );
  earth.add(globe);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 96, 64),
    new THREE.MeshLambertMaterial({ map: cloudTexture(), transparent: true, opacity: 0.55, depthWrite: false }),
  );
  earth.add(clouds);

  // atmosphere: a back-facing shell whose edge lights up — the blue halo
  // the halo travels with the planet
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.09, 96, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0x4a7fae) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        void main() {
          float rim = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
          gl_FragColor = vec4(uColor, 1.0) * rim;
        }`,
    }),
  );
  atmosphere.position.y = offsetY;
  scene.add(atmosphere);

  // --- light: one sun, so there is a real terminator --------------------
  const sun = new THREE.DirectionalLight(0xfff2e0, 2.1);
  sun.position.set(-1.6, 0.7, 2.4);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x3d4653, 0.5));

  // --- stars ------------------------------------------------------------
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1400;
  const pos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(22 + Math.random() * 20);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdbe6ff, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.6 })));

  // --- the route --------------------------------------------------------
  const routeGroup = new THREE.Group();
  earth.add(routeGroup);

  const cityMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const doneMat = new THREE.MeshBasicMaterial({ color: 0x3ddc97 });
  stops.forEach((stop) => {
    const at = toVec(stop.lon, stop.lat, R * 1.004);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 16), doneUnits.has(stop.unit?.id) ? doneMat : cityMat);
    dot.position.copy(at);
    routeGroup.add(dot);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.022, 0.032, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    halo.position.copy(at);
    halo.lookAt(new THREE.Vector3(0, 0, 0));
    routeGroup.add(halo);
  });

  stops.slice(1).forEach((stop, i) => {
    const prev = stops[i];
    const flown = doneUnits.has(prev.unit?.id);
    const curve = arcCurve(prev, stop);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, flown ? 0.006 : 0.003, 8, false),
      new THREE.MeshBasicMaterial({ color: flown ? 0x10b981 : 0x2c3a52 }),
    );
    routeGroup.add(tube);
  });

  // --- interaction ------------------------------------------------------
  // Calm mode (Settings -> Movement) leaves the planet where you put it.
  let spin = globalThis.document?.documentElement.dataset.motion === 'calm' ? 0 : 0.0012;
  let dragging = false;
  let last = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };

  const onDown = (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    renderer.domElement.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    velocity.x = (e.clientX - last.x) * 0.005;
    velocity.y = (e.clientY - last.y) * 0.005;
    earth.rotation.y += velocity.x;
    earth.rotation.x = Math.max(-0.9, Math.min(0.9, earth.rotation.x + velocity.y));
    last = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    dragging = false;
    renderer.domElement.releasePointerCapture?.(e.pointerId);
  };
  if (interactive) {
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    renderer.domElement.style.cursor = 'grab';
  }

  // --- loop -------------------------------------------------------------
  let raf = 0;
  let running = true;
  const resize = () => {
    const w = container.clientWidth || 800;
    const hgt = container.clientHeight || 500;
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const tick = () => {
    if (!running) return;
    if (!dragging) {
      earth.rotation.y += spin;
      velocity.x *= 0.94;
      earth.rotation.y += velocity.x * 0.3;
    }
    clouds.rotation.y += 0.0004;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    scene,
    camera,
    earth,
    renderer,
    /** Turn the planet so a given place faces the camera. */
    lookAt(lon, lat, ms = 1400) {
      // Rotate about Y until the point's angle around that axis is zero (facing
      // +Z, the camera), then tilt X by its latitude.
      const v = toVec(lon, lat);
      const targetY = -Math.atan2(v.x, v.z);
      const targetX = Math.asin(Math.max(-1, Math.min(1, v.y / R))) * 0.75;
      const fromY = earth.rotation.y;
      const fromX = earth.rotation.x;
      const t0 = performance.now();
      return new Promise((resolve) => {
        const step = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = 1 - Math.pow(1 - p, 3);
          earth.rotation.y = fromY + (targetY - fromY) * e;
          earth.rotation.x = fromX + (targetX - fromX) * e;
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    },
    setSpin(v) {
      spin = v;
    },
    zoom(distance, ms = 1200) {
      const from = camera.position.z;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        const e = 1 - Math.pow(1 - p, 3);
        camera.position.z = from + (distance - from) * e;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    /** Draw a plane travelling the arc between two cities. */
    fly(from, to, ms = 3200) {
      const curve = arcCurve(from, to, 0.34);
      const trail = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 96, 0.007, 10, false),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95 }),
      );
      trail.geometry.setDrawRange(0, 0);
      routeGroup.add(trail);

      const plane = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.055, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff6e6 }),
      );
      routeGroup.add(plane);

      const total = trail.geometry.index ? trail.geometry.index.count : 0;
      const t0 = performance.now();
      return new Promise((resolve) => {
        const step = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const at = curve.getPointAt(e);
          const ahead = curve.getPointAt(Math.min(1, e + 0.01));
          plane.position.copy(at);
          plane.lookAt(ahead);
          plane.rotateX(Math.PI / 2);
          trail.geometry.setDrawRange(0, Math.floor(total * e));
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
