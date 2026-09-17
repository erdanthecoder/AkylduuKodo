// Turns Natural Earth land polygons (via the world-atlas package) into a small
// JSON the app can draw. Run once when you want to change the resolution:
//   node scripts/build-land.mjs 50m
// The output, assets/land.json, is committed so the app needs no build step.

import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from '/tmp/claude-0/-home-user-AkylduuKodo/d43fd3bb-04d3-5fec-80ae-39173dcf7265/scratchpad/vend/node_modules/topojson-client/src/index.js';

const res = process.argv[2] || '50m';
const src = process.argv[3] || `/tmp/claude-0/-home-user-AkylduuKodo/d43fd3bb-04d3-5fec-80ae-39173dcf7265/scratchpad/vend/node_modules/world-atlas/land-${res}.json`;

const topo = JSON.parse(readFileSync(src, 'utf8'));
const geo = feature(topo, topo.objects.land);

const round = (n) => Math.round(n * 100) / 100;
const rings = [];

for (const f of geo.features ?? [geo]) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      // Drop specks: anything under a few hundred km across adds bytes, not beauty.
      const lons = ring.map((p) => p[0]);
      const lats = ring.map((p) => p[1]);
      const w = Math.max(...lons) - Math.min(...lons);
      const h = Math.max(...lats) - Math.min(...lats);
      if (w < 0.9 && h < 0.9) continue;
      const flat = [];
      let last = null;
      for (const [lon, lat] of ring) {
        const x = round(lon);
        const y = round(lat);
        if (last && last[0] === x && last[1] === y) continue; // collapse duplicates
        flat.push(x, y);
        last = [x, y];
      }
      if (flat.length >= 8) rings.push(flat);
    }
  }
}

const out = { resolution: res, rings };
writeFileSync('assets/land.json', JSON.stringify(out));
const kb = (JSON.stringify(out).length / 1024).toFixed(0);
console.log(`assets/land.json — ${rings.length} rings, ${kb} KB (${res})`);
