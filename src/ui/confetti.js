// confetti.js — a burst of confetti over the whole screen, for the moments
// that deserve it: a right answer, the podium, a level up, a legendary blook.
//
// One shared canvas, created on first use, removed when the last piece lands.
// Respects the "Animations" setting: with motion off there is no confetti.

const COLOURS = ['#ffcd1f', '#ff4772', '#2f9bff', '#12c9a6', '#a560ff', '#ff8a2a', '#ffffff'];
let canvas = null;
let ctx = null;
let pieces = [];
let raf = 0;

function calm() {
  return document.documentElement.dataset.motion === 'calm'
    || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function ensure() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '200' });
  document.body.append(canvas);
  ctx = canvas.getContext('2d');
}

function size() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    p.vy += 900 * (1 / 60);
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.x += p.vx / 60;
    p.y += p.vy / 60;
    p.rot += p.spin / 60;
    p.life -= 1 / 60;
    if (p.y > innerHeight + 40 || p.life <= 0) { pieces.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.rot * 2.3));      // the flutter
    ctx.fillStyle = p.c;
    if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  if (pieces.length) raf = requestAnimationFrame(frame);
  else { canvas.remove(); canvas = null; raf = 0; }
}

/**
 * confetti({ x, y, count, spread, power, colours })
 * x and y are fractions of the screen (0.5, 0.6 is just below the middle).
 */
export function confetti({ x = 0.5, y = 0.6, count = 120, spread = 70, power = 900, angle = -90, colours = COLOURS } = {}) {
  if (calm()) return;
  ensure();
  size();
  const ox = x * innerWidth;
  const oy = y * innerHeight;
  for (let i = 0; i < count; i++) {
    const a = (angle + (Math.random() - 0.5) * spread) * (Math.PI / 180);
    const v = power * (0.5 + Math.random() * 0.6);
    pieces.push({
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 7 + Math.random() * 6, h: 4 + Math.random() * 5, round: Math.random() < 0.25,
      rot: Math.random() * 6.3, spin: (Math.random() - 0.5) * 14,
      c: colours[(Math.random() * colours.length) | 0], life: 3 + Math.random() * 1.5,
    });
  }
  if (pieces.length > 900) pieces = pieces.slice(-900);
  if (!raf) raf = requestAnimationFrame(frame);
}

/** Two cannons from the bottom corners, for the big moments. */
export function celebrate(colours) {
  confetti({ x: 0.04, y: 1, count: 110, spread: 30, power: 1350, angle: -68, colours });
  setTimeout(() => confetti({ x: 0.96, y: 1, count: 110, spread: 30, power: 1350, angle: -112, colours }), 140);
}
