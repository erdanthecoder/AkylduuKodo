// install.js — "Install Quickzy" as an app: the browser's own install prompt
// on Android and computers, and simple steps on iPhone and iPad.

import { h } from './dom.js';
import { modal } from './kit.js';
import { icon, logo } from './icons.js';

let deferred = null;
const listeners = new Set();
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
/** Can we offer an install button right now? */
export const canInstall = () => !installed() && (Boolean(deferred) || isIOS());
export const onInstallChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function setupInstall() {
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
  // the app shell, for opening offline and like an app (not in the tests)
  if ('serviceWorker' in navigator && !navigator.webdriver && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

export async function install() {
  if (deferred) {
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null; listeners.forEach((f) => f());
    return;
  }
  // iPhone and iPad: Safari has no prompt, so show the two taps
  modal((close) => [h('div', { class: 'stack center', style: { gap: '12px', textAlign: 'center' } },
    h('div', { style: { width: '72px', margin: '0 auto' } }, logo()),
    h('h2', {}, 'Put Quickzy on your home screen'),
    h('ol', { class: 'install-steps' },
      h('li', {}, 'Tap the ', h('b', {}, 'Share'), ' button ', icon('up', { size: 16 }), ' at the bottom (or top) of Safari.'),
      h('li', {}, 'Choose ', h('b', {}, 'Add to Home Screen'), '.'),
      h('li', {}, 'Tap ', h('b', {}, 'Add'), '. Quickzy opens like an app!')),
    h('button', { class: 'btn btn-main btn-block', onclick: () => close() }, 'Got it'))]);
}
