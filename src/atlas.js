// atlas.js — the real world, as line work.
//
// The same Natural Earth coastlines the globe is built from, flattened into
// whatever projection the caller hands over. Nothing here is drawn by hand:
// every coast, island and inland sea is where it actually is.

let landPromise = null;

export function loadLand() {
  landPromise = landPromise || fetch('assets/land.json').then((r) => r.json()).catch(() => ({ rings: [] }));
  return landPromise;
}

/**
 * Longitudes run -180..180, so a landmass that crosses the antimeridian —
 * Eurasia does, out at Chukotka — comes back as a ring that appears to leap the
 * whole globe. Unwrapping keeps each step small by letting longitude run past
 * 180, which makes the ring continuous again. Points far outside the window
 * simply project off-canvas.
 */
function unwrap(ring) {
  const out = new Array(ring.length);
  let prev = ring[0];
  out[0] = ring[0];
  out[1] = ring[1];
  let shift = 0;
  for (let i = 2; i < ring.length; i += 2) {
    const lon = ring[i];
    const step = lon - prev;
    if (step > 180) shift -= 360;
    else if (step < -180) shift += 360;
    prev = lon;
    out[i] = lon + shift;
    out[i + 1] = ring[i + 1];
  }
  return out;
}

/** Longitude/latitude bounds of one flat ring, for cheap culling. */
function ringBounds(ring) {
  let lonMin = 180, lonMax = -180, latMin = 90, latMax = -90;
  for (let i = 0; i < ring.length; i += 2) {
    const lon = ring[i];
    const lat = ring[i + 1];
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
  }
  return { lonMin, lonMax, latMin, latMax };
}

/**
 * Coastline rings as SVG path data.
 *
 * @param {(lon:number, lat:number) => {x:number, y:number}} project
 * @param {object} box   the lon/lat window to keep, with a margin so shapes
 *                       that only clip the edge still close correctly
 * @param {object} opts  minPoints drops specks too small to read
 */
export async function landPaths(project, box, { margin = 25, minPoints = 8 } = {}) {
  const { rings } = await loadLand();
  const lonMin = box.lonMin - margin;
  const lonMax = box.lonMax + margin;
  const latMin = box.latMin - margin;
  const latMax = box.latMax + margin;

  const out = [];
  for (const raw of rings) {
    if (raw.length < minPoints * 2) continue;
    const ring = unwrap(raw);
    const b = ringBounds(ring);
    if (b.latMax < latMin || b.latMin > latMax) continue;
    // Unwrapping leaves a ring on whichever turn of the globe it started on, so
    // slide it by whole turns until it lines up with the window.
    let turn = 0;
    while (b.lonMax + turn < lonMin && turn < 1080) turn += 360;
    while (b.lonMin + turn > lonMax && turn > -1080) turn -= 360;
    if (b.lonMax + turn < lonMin || b.lonMin + turn > lonMax) continue;

    let d = '';
    for (let i = 0; i < ring.length; i += 2) {
      const p = project(ring[i] + turn, ring[i + 1]);
      d += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      if (i + 2 < ring.length) d += ' ';
    }
    out.push(d + ' Z');
  }
  return out;
}

/** Meridians and parallels on whole-number degrees, for scale and context. */
export function graticule(project, box, { lonStep = 10, latStep = 5 } = {}) {
  const lines = [];
  const first = (v, step) => Math.ceil(v / step) * step;
  for (let lon = first(box.lonMin, lonStep); lon <= box.lonMax; lon += lonStep) {
    const a = project(lon, box.latMin);
    const b = project(lon, box.latMax);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, label: `${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`, at: b });
  }
  for (let lat = first(box.latMin, latStep); lat <= box.latMax; lat += latStep) {
    const a = project(box.lonMin, lat);
    const b = project(box.lonMax, lat);
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, label: `${lat}°N`, at: a });
  }
  return lines;
}

/**
 * Points along the great circle between two places — the path an aeroplane
 * actually takes, which on a flat map bows north.
 */
export function greatCircle(a, b, steps = 48) {
  const rad = Math.PI / 180;
  const φ1 = a.lat * rad, λ1 = a.lon * rad;
  const φ2 = b.lat * rad, λ2 = b.lon * rad;
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));
  const points = [];
  if (!d) return [{ lon: a.lon, lat: a.lat }];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    points.push({
      lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / rad,
      lon: Math.atan2(y, x) / rad,
    });
  }
  return points;
}
