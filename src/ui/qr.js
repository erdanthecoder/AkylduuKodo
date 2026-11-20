// qr.js — QR codes: drawing one, and reading one through the camera.

import { h, svg, fill } from './dom.js';
import { icon } from './icons.js';
import { modal, toast } from './kit.js';

const scripts = new Map();

/** Load one of the vendored libraries as a plain script, once. */
function loadScript(src) {
  if (scripts.has(src)) return scripts.get(src);
  const p = new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = src;
    tag.async = true;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.append(tag);
  });
  scripts.set(src, p);
  return p;
}

/** An <svg> QR code for `text`, crisp at any size. */
export async function qrSVG(text, { dark = '#17133f', light = '#ffffff', margin = 2 } = {}) {
  await loadScript('/vendor/qrcode.js');
  const code = window.qrcode(0, 'M');
  code.addData(text);
  code.make();
  const n = code.getModuleCount();
  const size = n + margin * 2;
  const s = svg('svg', { viewBox: `0 0 ${size} ${size}`, 'shape-rendering': 'crispEdges', role: 'img', 'aria-label': 'QR code to join' });
  s.append(svg('rect', { width: size, height: size, fill: light }));
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (code.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
    }
  }
  s.append(svg('path', { d, fill: dark }));
  return s;
}

/* ---------------------------------------------------------------- scanning */

/** The 6-digit PIN inside a scanned code, whether it is a link or bare digits. */
export function pinFrom(text) {
  const t = String(text || '').trim();
  const link = t.match(/\/join\/(\d{6})(?:\b|$)/) || t.match(/[?&]pin=(\d{6})\b/);
  if (link) return link[1];
  if (/^\d{6}$/.test(t)) return t;
  return null;
}

/**
 * Open the camera and resolve with the PIN found in a QR code, or null if the
 * person closes the scanner. Uses the browser's own barcode reader where there
 * is one and jsQR everywhere else.
 */
export function scanForPin() {
  // kept out here so the camera is released however the scanner is closed:
  // the close button, Escape, or a tap on the backdrop
  let stream = null;
  let stopped = false;
  const release = () => {
    stopped = true;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };
  return modal((close) => {
    const video = h('video', { playsinline: true, muted: true, autoplay: true,
      style: { width: '100%', borderRadius: '16px', background: '#000', aspectRatio: '1 / 1', objectFit: 'cover' } });
    const status = h('p', { class: 'muted center small' }, 'Point the camera at the code on the big screen.');
    const frame = h('div', { style: { position: 'relative' } }, video,
      h('div', { style: { position: 'absolute', inset: '14%', border: '4px solid #ffcd1f', borderRadius: '18px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)' } }));

    const stop = (value) => { release(); close(value); };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch (err) {
        fill(status, err && err.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow the camera for this site, or type the PIN instead.'
          : 'No camera could be opened here. Type the PIN instead.');
        status.className = 'error-text center';
        return;
      }
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = stream;
      await video.play().catch(() => {});

      let detector = null;
      if ('BarcodeDetector' in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch { detector = null; }
      }
      if (!detector) await loadScript('/vendor/jsqr.min.js');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2 && video.videoWidth) {
          let text = null;
          if (detector) {
            try { const found = await detector.detect(video); text = found[0] && found[0].rawValue; } catch { /* next frame */ }
          } else {
            const w = Math.min(640, video.videoWidth);
            const hgt = Math.round((video.videoHeight / video.videoWidth) * w);
            canvas.width = w; canvas.height = hgt;
            ctx.drawImage(video, 0, 0, w, hgt);
            const img = ctx.getImageData(0, 0, w, hgt);
            const res = window.jsQR(img.data, w, hgt, { inversionAttempts: 'dontInvert' });
            text = res && res.data;
          }
          if (text) {
            const pin = pinFrom(text);
            if (pin) { if (navigator.vibrate) navigator.vibrate(60); stop(pin); return; }
            fill(status, 'That code is not a Quickzy game.');
          }
        }
        setTimeout(tick, detector ? 120 : 200);
      };
      tick();
    })();

    return [
      h('div', { class: 'row spread' }, h('h2', {}, 'Scan to join'),
        h('button', { class: 'btn btn-ghost btn-icon', 'aria-label': 'Close', onclick: () => stop(null) }, icon('close'))),
      frame,
      status,
    ];
  }).then((pin) => {
    release();
    if (!pin) return null;
    toast(`Found game ${pin}`, 'ok');
    return pin;
  });
}
