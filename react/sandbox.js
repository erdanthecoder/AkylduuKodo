/**
 * sandbox.js — run a learner's JavaScript and capture what it prints.
 *
 * `new Function` with a captured console and a loop guard injected into every
 * loop. Right for a teaching sandbox where the learner is the only author;
 * never point it at code from strangers.
 */

const MAX_TICKS = 200000;
const MAX_MS = 1500;

/** A loop that never ends would freeze the page, so every loop reports in. */
function guard(source) {
  return source
    .replace(/\b(for|while)\s*\(([\s\S]*?)\)\s*\{/g, (match) => `${match}__tick();`)
    .replace(/\bdo\s*\{/g, (match) => `${match}__tick();`);
}

function display(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function runSandboxed(source) {
  const logs = [];
  const started = Date.now();
  let ticks = 0;

  const tick = () => {
    ticks += 1;
    if (ticks > MAX_TICKS || Date.now() - started > MAX_MS) {
      throw new Error('This loop never finishes — check the condition.');
    }
  };

  const capture = {
    log: (...args) => logs.push({ kind: 'log', text: args.map(display).join(' ') }),
    warn: (...args) => logs.push({ kind: 'warn', text: args.map(display).join(' ') }),
    error: (...args) => logs.push({ kind: 'error', text: args.map(display).join(' ') }),
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', '__tick', `"use strict";\n${guard(source)}`);
    fn(capture, tick);
    return { ok: true, logs, error: null };
  } catch (err) {
    return { ok: false, logs, error: `${err.name === 'Error' ? '' : `${err.name}: `}${err.message}` };
  }
}

