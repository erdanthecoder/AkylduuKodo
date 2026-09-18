// map.js — the route. Every unit is a city, and the course is one long journey
// west to east: London to Bishkek. Finish a unit and the plane actually flies.

import { h } from './ui.js';
import { UNITS } from './data/index.js';
import { createGlobe, webglAvailable } from './globe.js';
import { landPaths, graticule, greatCircle } from './atlas.js';

const SVG = 'http://www.w3.org/2000/svg';

// Equirectangular projection over the slice of the world the route crosses.
const BOX = { lonMin: -12, lonMax: 88, latMin: 33, latMax: 58 };
const W = 1000;
const H = 360;

export function project(lon, lat) {
  const x = ((lon - BOX.lonMin) / (BOX.lonMax - BOX.lonMin)) * W;
  const y = ((BOX.latMax - lat) / (BOX.latMax - BOX.latMin)) * H;
  return { x, y };
}

export const STOPS = UNITS.filter((u) => u.city).map((u, i) => ({
  index: i,
  unit: u,
  ...u.city,
  ...project(u.city.lon, u.city.lat),
}));

/**
 * The real flight path between two cities: the great circle, projected. On a
 * flat map it bows north, which is exactly what an aeroplane does.
 */
function arc(a, b) {
  return greatCircle(a, b, 40)
    .map((p, i) => {
      const q = project(p.lon, p.lat);
      return (i === 0 ? 'M' : 'L') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    })
    .join(' ');
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}


/**
 * Paint the real world into a map: graticule first, then every coastline that
 * reaches this window. The coastlines arrive asynchronously — the map is drawn
 * and usable before they land, and they fade in underneath the route.
 */
function paintGeography(svg, { landFill = 'url(#land)', landStroke = '#39414d', width = 1, labels = true, opacity = 1 } = {}) {
  const grat = el('g', { class: 'graticule', opacity: String(0.5 * opacity) });
  graticule(project, BOX).forEach((line) => {
    grat.append(el('line', {
      x1: line.x1.toFixed(1), y1: line.y1.toFixed(1), x2: line.x2.toFixed(1), y2: line.y2.toFixed(1),
      stroke: '#232932', 'stroke-width': 0.6 * width,
    }));
  });
  const land = el('g', { class: 'land', opacity: String(opacity) });
  svg.append(grat, land);

  landPaths(project, BOX).then((paths) => {
    paths.forEach((d) => {
      land.append(el('path', { d, fill: landFill, stroke: landStroke, 'stroke-width': 0.9 * width, 'stroke-linejoin': 'round' }));
    });
    land.classList.add('is-drawn');
    if (labels) {
      const names = el('g', { class: 'geo-labels' });
      PLACES.forEach((place) => {
        const p = project(place.lon, place.lat);
        const text = el('text', { x: p.x.toFixed(1), y: p.y.toFixed(1), class: 'geo-label', 'text-anchor': 'middle' });
        text.textContent = place.name;
        names.append(text);
      });
      land.after(names);
    }
  });
  return land;
}

/** Quiet context labels, so the map reads as a place and not a diagram. */
const PLACES = [
  { name: 'ATLANTIC', lon: -9.5, lat: 44.5 },
  { name: 'NORTH SEA', lon: 3.5, lat: 56 },
  { name: 'MEDITERRANEAN', lon: 17, lat: 35 },
  { name: 'BLACK SEA', lon: 34.5, lat: 43.4 },
  { name: 'CASPIAN', lon: 51, lat: 42 },
  { name: 'ARAL', lon: 60, lat: 45.2 },
  { name: 'TIAN SHAN', lon: 79, lat: 42.2 },
];

/**
 * Draws the whole route.
 * @param {object} opts
 *  - doneUnits: Set of unit ids already finished
 *  - currentUnitId: the unit the learner is in
 *  - onPick: called with a unit id when a city is clicked
 *  - compact: smaller type, for the dashboard
 */
export function routeMap({ doneUnits = new Set(), currentUnitId = null, onPick = null, compact = false } = {}) {
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'route-svg' + (compact ? ' route-compact' : ''),
    role: 'img',
    'aria-label': 'Your route from London to Bishkek',
  });

  svg.innerHTML = `
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#090b0f"/>
      </linearGradient>
      <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1e232b"/><stop offset="1" stop-color="#171b21"/>
      </linearGradient>
      <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e0973f"/><stop offset="1" stop-color="#e0973f"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#e0973f" stop-opacity="0.32"/>
        <stop offset="1" stop-color="#e0973f" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sea)"/>`;

  paintGeography(svg, { labels: !compact });

  const routes = el('g', { class: 'routes' });
  const markers = el('g', { class: 'markers' });
  svg.append(routes, markers);

  let lastSide = 1;
  STOPS.forEach((stop, i) => {
    if (i > 0) {
      const prev = STOPS[i - 1];
      const flown = doneUnits.has(prev.unit.id);
      const path = el('path', {
        d: arc(prev, stop),
        class: 'leg' + (flown ? ' leg-flown' : ''),
        fill: 'none',
        stroke: flown ? 'url(#trail)' : '#333b46',
        'stroke-width': flown ? 2.4 : 1.6,
        'stroke-dasharray': flown ? 'none' : '5 7',
        'stroke-linecap': 'round',
      });
      routes.append(path);
    }

    const done = doneUnits.has(stop.unit.id);
    const current = stop.unit.id === currentUnitId;
    const g = el('g', {
      class: `stop ${done ? 'stop-done' : ''} ${current ? 'stop-now' : ''}`,
      transform: `translate(${stop.x} ${stop.y})`,
      tabindex: onPick ? '0' : null,
      role: onPick ? 'button' : null,
    });
    if (current) g.append(el('circle', { r: 26, fill: 'url(#glow)', class: 'stop-halo' }));
    g.append(el('circle', { r: current ? 9 : 6.5, class: 'stop-dot' }));
    if (done) {
      const tick = el('path', { d: 'M -3.4 0 l 2.6 2.7 l 5 -5.6', class: 'stop-tick' });
      g.append(tick);
    }
    // Cities bunch up at the eastern end, where Samarkand, Almaty and Bishkek
    // are only a few hundred kilometres apart. When two names would collide the
    // second one takes the other side of its dot, so they interleave.
    const prevStop = STOPS[i - 1];
    const crowded = prevStop && Math.hypot(stop.x - prevStop.x, stop.y - prevStop.y) < 120;
    const side = crowded ? -lastSide : -1;
    lastSide = side;
    const label = el('text', { x: 0, y: side < 0 ? -18 : 28, class: 'stop-label', 'text-anchor': 'middle' });
    label.textContent = stop.name;
    g.append(label);
    if (onPick) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => onPick(stop.unit.id));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') onPick(stop.unit.id);
      });
    }
    markers.append(g);
  });

  return svg;
}

/** The little plane, drawn nose-right so a rotation can aim it along the path. */
function planeNode() {
  const g = el('g', { class: 'plane' });
  g.innerHTML =
    '<path d="M 22 0 L -6 -9 L -2 -2 L -14 -2 L -18 -7 L -21 -6 L -18 0 L -21 6 L -18 7 L -14 2 ' +
    'L -2 2 L -6 9 Z" fill="#fff8ec" stroke="#ffb547" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<circle cx="6" cy="0" r="1.8" fill="#ffb547"/>';
  return g;
}

/**
 * A full-screen flight from one city to the next, played when a unit is
 * finished. Returns a promise that resolves when the plane has landed.
 */
/**
 * The arrival: the planet turns to the new city while the plane flies the arc.
 * Falls back to the flat map when WebGL is unavailable.
 */
export function flightTo(unitId, { onDone } = {}) {
  if (webglAvailable()) return globeFlight(unitId, onDone);
  return flatFlight(unitId, onDone);
}

function globeFlight(unitId, onDone) {
  const index = STOPS.findIndex((s) => s.unit.id === unitId);
  const from = STOPS[Math.max(0, index - 1)];
  const to = STOPS[index];
  if (!to || from === to) {
    onDone?.();
    return null;
  }

  const stage = h('div', { class: 'flight-globe' });
  const card = h('div', { class: 'flight-card' },
    h('span', { class: 'flight-kicker' }, 'Unit complete — next stop'),
    h('h2', {}, to.name),
    h('p', { class: 'flight-country' }, to.country),
    h('p', { class: 'flight-line' }, to.line),
  );
  const skip = h('button', { class: 'btn btn-primary flight-skip', onclick: () => finish() }, 'Continue');
  const overlay = h('div', { class: 'flight-overlay flight-overlay-3d' },
    h('div', { class: 'flight-inner' }, stage, card, skip),
  );
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  let globe = null;
  let done = false;

  createGlobe(stage, {
    stops: STOPS,
    doneUnits: new Set(STOPS.slice(0, index).map((s) => s.unit.id)),
    interactive: true,
  }).then(async (g) => {
    globe = g;
    g.setSpin(0.0004);
    await g.lookAt(from.lon, from.lat, 900);
    g.zoom(2.6, 1200);
    await g.fly(from, to, 3000);
    await g.lookAt(to.lon, to.lat, 1100);
    card.classList.add('is-landed');
  });

  function finish() {
    if (done) return;
    done = true;
    globe?.destroy();
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.remove();
      onDone?.();
    }, 420);
  }

  return { finish };
}

function flatFlight(unitId, onDone) {
  const index = STOPS.findIndex((s) => s.unit.id === unitId);
  const from = STOPS[Math.max(0, index - 1)];
  const to = STOPS[index];
  if (!to || from === to) {
    onDone?.();
    return null;
  }

  // Frame just the two cities, with room around them, so a short hop does not
  // play out as a dot crossing an empty continent.
  const padX = Math.max(150, Math.abs(to.x - from.x) * 0.55);
  const padY = Math.max(90, Math.abs(to.y - from.y) * 0.9);
  const vx = Math.max(0, Math.min(from.x, to.x) - padX);
  const vy = Math.max(0, Math.min(from.y, to.y) - padY - 30);
  const vw = Math.min(W - vx, Math.abs(to.x - from.x) + padX * 2);
  const vh = Math.min(H - vy, Math.max(vw * (H / W), Math.abs(to.y - from.y) + padY * 2));
  const zoom = vw / W;

  const svg = el('svg', { viewBox: `${vx} ${vy} ${vw} ${vh}`, class: 'route-svg flight-svg' });
  svg.innerHTML = `
    <defs>
      <linearGradient id="fsea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#090b0f"/>
      </linearGradient>
      <linearGradient id="ftrail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e0973f"/><stop offset="1" stop-color="#e0973f"/>
      </linearGradient>
    </defs>
    <rect x="${0}" y="${0}" width="${W}" height="${H}" fill="url(#fsea)"/>`;

  paintGeography(svg, { landFill: '#1e232b', landStroke: '#39414d', width: zoom, labels: false, opacity: 0.85 });

  const d = arc(from, to);
  const track = el('path', { d, fill: 'none', stroke: '#2b3d63', 'stroke-width': 1.6 * zoom, 'stroke-dasharray': `${4 * zoom} ${8 * zoom}` });
  const trail = el('path', { d, fill: 'none', stroke: 'url(#ftrail)', 'stroke-width': 3 * zoom, 'stroke-linecap': 'round' });
  const plane = planeNode();
  svg.append(track, trail, plane);

  [from, to].forEach((stop, i) => {
    const g = el('g', {
      transform: `translate(${stop.x} ${stop.y}) scale(${zoom})`,
      class: 'stop ' + (i ? 'stop-now' : 'stop-done'),
    });
    g.append(el('circle', { r: i ? 8 : 6, class: 'stop-dot' }));
    const label = el('text', { y: -16, class: 'stop-label', 'text-anchor': 'middle' });
    label.textContent = stop.name;
    g.append(label);
    svg.append(g);
  });

  const card = h('div', { class: 'flight-card' },
    h('span', { class: 'flight-kicker' }, 'Unit complete — next stop'),
    h('h2', {}, to.name),
    h('p', { class: 'flight-country' }, to.country),
    h('p', { class: 'flight-line' }, to.line),
  );

  const overlay = h('div', { class: 'flight-overlay' },
    h('div', { class: 'flight-inner' },
      h('div', { class: 'flight-map' }, svg),
      card,
      h('button', { class: 'btn btn-primary flight-skip', onclick: () => finish() }, 'Continue'),
    ),
  );
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  const total = trail.getTotalLength();
  trail.style.strokeDasharray = String(total);
  trail.style.strokeDashoffset = String(total);

  const reduced = globalThis.document?.documentElement.dataset.motion === 'calm'
    || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 10 : 2600;
  const start = performance.now();
  let raf = 0;
  let finished = false;

  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const at = trail.getPointAtLength(eased * total);
    const ahead = trail.getPointAtLength(Math.min(total, eased * total + 6));
    const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
    plane.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle}) scale(${0.9 * zoom})`);
    trail.style.strokeDashoffset = String(total * (1 - eased));
    if (p < 1) raf = requestAnimationFrame(frame);
    else card.classList.add('is-landed');
  }
  raf = requestAnimationFrame(frame);

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.remove();
      onDone?.();
    }, 420);
  }

  // Land, admire the city for a moment, then let the learner carry on.
  setTimeout(() => card.classList.add('is-landed'), duration);
  return { finish };
}
