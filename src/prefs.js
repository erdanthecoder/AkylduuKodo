// prefs.js — the settings that change how the app looks and moves.
//
// Everything here is written onto <html> as a data attribute, and the
// stylesheet reads those attributes. That keeps the preferences in one place
// and means a change repaints instantly, with no re-render.

import * as store from './state.js';

export const THEMES = [
  { id: 'auto', label: 'Match my device' },
  { id: 'dark', label: 'Night' },
  { id: 'light', label: 'Daylight' },
];

export const MOTION = [
  { id: 'full', label: 'Full', note: 'Flights, parallax and confetti.' },
  { id: 'calm', label: 'Calm', note: 'Stills instead of movement.' },
];

export const TEXT_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Large' },
  { id: 'xl', label: 'Largest' },
];

export const CODE_SIZES = [
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
];

const root = () => globalThis.document?.documentElement;

/** Push the stored preferences onto <html>. Safe to call as often as you like. */
export function applyPrefs() {
  const el = root();
  if (!el) return;
  const s = store.get();
  const theme = THEMES.some((t) => t.id === s.theme) ? s.theme : 'auto';
  if (theme === 'auto') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme);
  el.setAttribute('data-motion', s.motion === 'calm' ? 'calm' : 'full');
  el.setAttribute('data-text', TEXT_SIZES.some((t) => t.id === s.textSize) ? s.textSize : 'normal');
  el.setAttribute('data-code', CODE_SIZES.some((c) => c.id === s.codeSize) ? s.codeSize : 'md');
}

/** True when the learner (or their system) has asked for less movement. */
export function calmMotion() {
  return store.get().motion === 'calm'
    || (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** Everything worth keeping, as a file the learner can download. */
export function exportProgress() {
  const s = store.get();
  const payload = {
    app: 'AkylduuKodo',
    exported: new Date().toISOString(),
    progress: {
      name: s.name, xp: s.xp, done: s.done, log: s.log,
      badges: s.badges, arcade: s.arcade, goalPerWeek: s.goalPerWeek, created: s.created,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `akylduukodo-progress-${store.today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Read a downloaded file back in. Nothing is lost: the better value wins. */
export async function importProgress(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  const p = data?.progress || data;
  if (!p || typeof p !== 'object') throw new Error('That file is not an AkylduuKodo export.');
  store.mergeRemote(p);
  return Object.keys(p.done || {}).length;
}

applyPrefs();
store.subscribe(applyPrefs);
