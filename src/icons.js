// icons.js — one line-art icon set for the whole app.
//
// Emoji render differently on every device and read as decoration rather than
// interface. These are stroke icons on a 24px grid, drawn in currentColor, so
// they inherit text colour and scale cleanly at any size.

const P = {
  home: '<path d="M3.5 10.6 12 3.8l8.5 6.8"/><path d="M5.8 9.3V20h12.4V9.3"/><path d="M9.8 20v-5.4h4.4V20"/>',
  map: '<path d="M9 4.2 3.5 6.6v13.2L9 17.4l6 2.4 5.5-2.4V4.2L15 6.6Z"/><path d="M9 4.2v13.2M15 6.6v13.2"/>',
  target: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
  flask: '<path d="M9.5 3.2h5M10.4 3.2v6.1L5.3 18a2 2 0 0 0 1.7 3h10a2 2 0 0 0 1.7-3l-5.1-8.7V3.2"/><path d="M7.6 14.4h8.8"/>',
  settings: '<path d="M4 7.5h10M18 7.5h2M4 16.5h2M10 16.5h10"/><circle cx="16" cy="7.5" r="2.2"/><circle cx="8" cy="16.5" r="2.2"/>',
  user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6"/>',
  play: '<path d="M8 5.6 19 12 8 18.4Z"/>',
  check: '<path d="m4.8 12.4 4.6 4.6 9.8-10"/>',
  bulb: '<path d="M9.2 17.2a6 6 0 1 1 5.6 0"/><path d="M9.6 17.2h4.8M10.4 20.4h3.2"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M17.5 12v3.2M20.2 12v2.4"/>',
  reset: '<path d="M4.6 12a7.4 7.4 0 1 0 2.3-5.4"/><path d="M4.2 3.8v4.2h4.2"/>',
  star: '<path d="m12 3.6 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 10l6-.8Z"/>',
  flame: '<path d="M12 3c3.2 3.4 5.6 6 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-1.7.7-3.2 1.9-4.6.3 1.4 1 2.2 2 2.4C10 8.2 10.6 5.6 12 3Z"/>',
  bolt: '<path d="M13.4 2.8 5 13.6h5.4L10 21.2 19 10.4h-5.4Z"/>',
  book: '<path d="M4 5.2c2.6-1 5.3-1 8 .6 2.7-1.6 5.4-1.6 8-.6v13c-2.6-1-5.3-1-8 .6-2.7-1.6-5.4-1.6-8-.6Z"/><path d="M12 5.8v13"/>',
  bug: '<path d="M8.4 8.6a3.6 3.6 0 0 1 7.2 0v4.6a3.6 3.6 0 0 1-7.2 0Z"/><path d="M9.6 6.4 8 4.4M14.4 6.4 16 4.4M8.4 10.4H4.6M15.6 10.4h3.8M8.4 14H5.2M15.6 14h3.2M9 17.2l-2 2.4M15 17.2l2 2.4"/>',
  eye: '<path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  keyboard: '<rect x="2.6" y="6" width="18.8" height="12" rx="2.2"/><path d="M6.4 9.6h.01M10 9.6h.01M13.6 9.6h.01M17.2 9.6h.01M6.4 12.8h.01M10 12.8h.01M13.6 12.8h.01M17.2 12.8h.01M8 15.8h8"/>',
  rover: '<rect x="4.6" y="8" width="14.8" height="9.4" rx="2.6"/><path d="M12 8V4.6M12 4.6h-.01"/><circle cx="12" cy="3.6" r="1.2"/><path d="M9 12.2h.01M15 12.2h.01M9.4 15h5.2"/>',
  apple: '<path d="M12 7.6c-1-1.4-3-2.2-4.6-1.2C5.2 7.8 4.6 11 6 14.6c1 2.6 2.7 4.6 4.3 4.6.7 0 1.2-.3 1.7-.3s1 .3 1.7.3c1.6 0 3.3-2 4.3-4.6 1.4-3.6.8-6.8-1.4-8.2-1.6-1-3.6-.2-4.6 1.2Z"/><path d="M12 7.6V5.2c0-1.1.9-2 2-2"/>',
  yurt: '<path d="M3.4 12.6 12 4.6l8.6 8"/><path d="M5.4 12v8h13.2v-8"/><path d="M10 20v-4.4h4V20"/>',
  lock: '<rect x="5.4" y="10.4" width="13.2" height="9.6" rx="2.2"/><path d="M8.6 10.4V8a3.4 3.4 0 0 1 6.8 0v2.4"/>',
  arrowRight: '<path d="M4.6 12h14.2M13.4 6.6 18.8 12l-5.4 5.4"/>',
  arrowLeft: '<path d="M19.4 12H5.2M10.6 6.6 5.2 12l5.4 5.4"/>',
  close: '<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>',
  puzzle: '<path d="M10.2 4.4h3.6v2a1.8 1.8 0 1 0 3.6 0v-2h2v3.6h-2a1.8 1.8 0 1 0 0 3.6h2v8h-6v-2a1.8 1.8 0 1 0-3.6 0v2h-6v-6h2a1.8 1.8 0 1 0 0-3.6h-2V4.4h6Z"/>',
  code: '<path d="m8.6 7.6-5 4.4 5 4.4M15.4 7.6l5 4.4-5 4.4M13.4 4.6l-2.8 14.8"/>',
  globe: '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.2 2.4 3.4 5.3 3.4 8.4S14.2 18 12 20.4C9.8 18 8.6 15.1 8.6 12s1.2-6 3.4-8.4Z"/>',
  trophy: '<path d="M7.4 4.4h9.2v5a4.6 4.6 0 0 1-9.2 0Z"/><path d="M7.4 6.2H4.8v1.4a2.8 2.8 0 0 0 2.6 2.8M16.6 6.2h2.6v1.4a2.8 2.8 0 0 1-2.6 2.8M10 14v3.4h4V14M8 20h8"/>',
  medal: '<circle cx="12" cy="14.6" r="5.4"/><path d="m8.4 9.4-2.8-6h4l2.2 4M15.6 9.4l2.8-6h-4l-2.2 4"/>',
  calendar: '<rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4"/><path d="M3.6 10h16.8M8.4 3.4v3.6M15.6 3.4v3.6"/>',
  clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.2V12l3.2 2.2"/>',
  sparkle: '<path d="M12 3.4c.7 4.2 1.9 5.5 6.2 6.2-4.3.7-5.5 2-6.2 6.2-.7-4.2-1.9-5.5-6.2-6.2 4.3-.7 5.5-2 6.2-6.2Z"/><path d="M18 16.4c.3 1.8.8 2.3 2.6 2.6-1.8.3-2.3.8-2.6 2.6-.3-1.8-.8-2.3-2.6-2.6 1.8-.3 2.3-.8 2.6-2.6Z"/>',
  pencil: '<path d="M4 20h4l10-10-4-4L4 16Z"/><path d="m14.6 5.4 4 4"/>',
  list: '<path d="M8.4 6.6h12M8.4 12h12M8.4 17.4h12M4 6.6h.01M4 12h.01M4 17.4h.01"/>',
  cloud: '<path d="M7.4 18.6a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.8-1.2 3.8 3.8 0 0 1 .6 7.5"/><path d="M7.4 18.6h10"/>',
  sound: '<path d="M5 9.6h3.4L13 5.6v12.8L8.4 14.4H5Z"/><path d="M16.4 9.4a3.8 3.8 0 0 1 0 5.2M18.8 7a7.2 7.2 0 0 1 0 10"/>',
  mountain: '<path d="M2.6 19.4 9.4 6.6l4 6.6 2.2-3.2 5.8 9.4Z"/><path d="m9.4 6.6 2.4 4.4-2.4 1.6-2.2-1.6Z"/>',
  chevronRight: '<path d="m9.6 5.6 6.4 6.4-6.4 6.4"/>',
  wand: '<path d="m5 19 9.4-9.4M16.6 7.4 19 5M13.6 4.4l.6 2M19.6 10.4l-2-.6M16.2 12.6l1.4 1.8M11 6.2 9.2 7.6"/><path d="m13.4 6.6 4 4"/>',
  scale: '<path d="M12 4.4v15.2M7 19.6h10M5.4 8.4h13.2M5.4 8.4 2.8 14a3 3 0 0 0 5.2 0ZM18.6 8.4 16 14a3 3 0 0 0 5.2 0Z"/>',
  layers: '<path d="m12 3.6 8.4 4.4-8.4 4.4L3.6 8Z"/><path d="m4.6 12 7.4 3.8 7.4-3.8M4.6 16l7.4 3.8L19.4 16"/>',
};

export const ICON_NAMES = Object.keys(P);

const SVG_NS = 'http://www.w3.org/2000/svg';

/** An icon as a DOM node. */
export function icon(name, { size = 20, cls = '' } = {}) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', '1.7');
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('class', 'icon ' + cls);
  el.innerHTML = P[name] || P.code;
  return el;
}

/** The same icon as a string, for places that build HTML. */
export function iconHtml(name, size = 20) {
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon">` +
    `${P[name] || P.code}</svg>`
  );
}

/**
 * Kodo, the rover the learner drives through the grid. Drawn facing east so a
 * CSS rotation matches the compass directions the code uses.
 */
export function rover(size = 30) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 32 32');
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('class', 'rover');
  el.innerHTML = `
    <rect x="6" y="9" width="17" height="14" rx="4" fill="currentColor"/>
    <circle cx="12" cy="16" r="2.4" fill="#0a0c1b"/>
    <circle cx="19" cy="16" r="2.4" fill="#0a0c1b"/>
    <circle cx="12.8" cy="15.4" r="0.9" fill="#fff"/>
    <circle cx="19.8" cy="15.4" r="0.9" fill="#fff"/>
    <path d="M14.5 9V5.5M17.5 9V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="14.5" cy="4.6" r="1.3" fill="currentColor"/>
    <circle cx="17.5" cy="4.6" r="1.3" fill="currentColor"/>
    <path d="M23 13h3.6l1.8 3-1.8 3H23z" fill="currentColor" opacity=".85"/>
    <rect x="8" y="23" width="4" height="3" rx="1.4" fill="currentColor" opacity=".7"/>
    <rect x="17" y="23" width="4" height="3" rx="1.4" fill="currentColor" opacity=".7"/>`;
  return el;
}
