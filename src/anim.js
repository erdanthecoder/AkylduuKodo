// anim.js — motion helpers. Everything here checks prefers-reduced-motion first,
// so the app stays usable for people who get motion sick.

// Calm mode (Settings -> Movement) is written onto <html> by prefs.js, and the
// system preference still counts on its own.
export const reduced = () =>
  globalThis.document?.documentElement.dataset.motion === 'calm'
  || (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Stagger the children of a freshly mounted view so the page assembles itself. */
export function animateIn(node) {
  if (reduced()) return;
  const kids = [...node.children];
  kids.forEach((kid, i) => {
    kid.classList.add('rise-in');
    kid.style.animationDelay = Math.min(i * 55, 420) + 'ms';
  });
  revealOnScroll(node);
}

/** Cards further down the page fade in as they come into view. */
function revealOnScroll(node) {
  if (!('IntersectionObserver' in globalThis)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.05 },
  );
  const watched = [...node.querySelectorAll('.badge, .lesson-card, .drill-card, .unit-pill')];
  const viewport = globalThis.innerHeight || 800;
  watched.forEach((el) => {
    el.classList.add('reveal');
    // Anything already on screen appears at once — only content further down
    // gets the reveal-on-scroll treatment.
    if (el.getBoundingClientRect().top < viewport) {
      requestAnimationFrame(() => el.classList.add('revealed'));
      return;
    }
    io.observe(el);
  });
  // Safety net: an observer that never fires must not leave content invisible.
  setTimeout(() => {
    watched.forEach((el) => el.classList.add('revealed'));
    io.disconnect();
  }, 600);
}

/** Roll a number up instead of snapping it — small, but it makes XP feel earned. */
export function countUp(el, from, to, ms = 700) {
  if (!el) return;
  if (reduced() || from === to) {
    el.textContent = String(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(step);
    else el.classList.add('bump');
  };
  requestAnimationFrame(step);
}

/** A quick attention pop on an element (used for correct answers). */
export function pop(el) {
  if (!el || reduced()) return;
  el.classList.remove('pop-now');
  void el.offsetWidth;
  el.classList.add('pop-now');
}

/** Floating shapes behind the app — pure decoration, never interactive. */
export function startBackdrop() {
  if (reduced() || document.querySelector('.backdrop')) return;
  const layer = document.createElement('div');
  layer.className = 'backdrop';
  layer.setAttribute('aria-hidden', 'true');
  const marks = ['{ }', '< >', '( )', ';', '=>', '[ ]', '//', '0 1'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'float-mark';
    s.textContent = marks[i % marks.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = 18 + Math.random() * 22 + 's';
    s.style.animationDelay = -Math.random() * 30 + 's';
    s.style.fontSize = 12 + Math.random() * 26 + 'px';
    layer.append(s);
  }
  document.body.prepend(layer);
}
