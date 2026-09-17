// runner.js — runs learner code in a guarded sandbox.
// No DOM access here on purpose: the test suite imports this file in Node.

const LOOP_RE = /\b(for|while)\s*\(/g;

/**
 * Injects a guard call into every loop body so an infinite loop throws
 * instead of freezing the tab. Works by matching the loop header's
 * parentheses, then wrapping whatever body follows.
 */
export function addLoopGuards(code) {
  let out = '';
  let i = 0;
  LOOP_RE.lastIndex = 0;
  let m;
  while ((m = LOOP_RE.exec(code)) !== null) {
    const headStart = m.index;
    const parenStart = m.index + m[0].length - 1;
    const parenEnd = matchParen(code, parenStart);
    if (parenEnd === -1) break;
    let j = parenEnd + 1;
    while (j < code.length && /\s/.test(code[j])) j++;
    out += code.slice(i, parenEnd + 1);
    if (code[j] === '{') {
      out += code.slice(parenEnd + 1, j + 1) + '__guard();';
      i = j + 1;
    } else {
      // single-statement body: wrap it in a block
      const end = statementEnd(code, j);
      out += ' { __guard(); ' + code.slice(j, end) + ' }';
      i = end;
    }
    LOOP_RE.lastIndex = i;
    void headStart;
  }
  return out + code.slice(i);
}

function matchParen(code, start) {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function statementEnd(code, start) {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    const c = code[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) {
      if (depth === 0) return i;
      depth--;
    } else if (c === ';' && depth === 0) return i + 1;
    else if (c === '\n' && depth === 0) return i;
  }
  return code.length;
}

export function formatValue(v, seen = new Set()) {
  if (typeof v === 'string') return v;
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'function') return `function ${v.name || 'anonymous'}()`;
  if (seen.has(v)) return '[circular]';
  seen.add(v);
  if (Array.isArray(v)) return '[' + v.map((x) => quoted(x, seen)).join(', ') + ']';
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  return '{' + Object.keys(v).map((k) => `${k}: ${quoted(v[k], seen)}`).join(', ') + '}';
}

function quoted(v, seen) {
  return typeof v === 'string' ? JSON.stringify(v) : formatValue(v, seen);
}

/**
 * Runs learner code.
 * @returns {{logs: string[], error: string|null, value: any, vars: object}}
 */
export function runCode(code, options = {}) {
  const { globals = {}, capture = [], maxSteps = 300000, maxLogs = 300 } = options;
  const logs = [];
  let truncated = false;

  const push = (args) => {
    if (logs.length >= maxLogs) {
      truncated = true;
      return;
    }
    logs.push(args.map((a) => formatValue(a)).join(' '));
  };

  const sandboxConsole = {
    log: (...a) => push(a),
    info: (...a) => push(a),
    warn: (...a) => push(a),
    error: (...a) => push(a),
  };

  let steps = 0;
  const __guard = () => {
    if (++steps > maxSteps) {
      throw new Error('Your loop ran forever — check the condition so it can stop.');
    }
  };

  const names = ['console', 'print', '__guard', ...Object.keys(globals)];
  const values = [sandboxConsole, (...a) => push(a), __guard, ...Object.values(globals)];

  // Captured variables are read right after the learner's code, inside the same
  // scope, so `let`/`const` declarations are visible. (A top-level `return` in
  // the learner's code skips this — those steps are checked by return value.)
  const captureSrc = capture.length
    ? '\n;__outer.ok = true; ' +
      capture
        .map((n) => `__outer[${JSON.stringify(n)}] = (typeof ${n} === 'undefined' ? undefined : ${n});`)
        .join(' ')
    : '';

  const body = [
    '"use strict";',
    'const __value = (() => {',
    addLoopGuards(code),
    captureSrc,
    '})();',
    'return { value: __value, vars: __outer };',
  ].join('\n');

  // `__outer` collects captured variables from inside the wrapper closure.
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...names, '__outer', body);
    const result = fn(...values, {});
    return {
      logs: truncated ? [...logs, `… (only the first ${maxLogs} lines are shown)`] : logs,
      error: null,
      value: result.value,
      vars: result.vars || {},
    };
  } catch (err) {
    return {
      logs,
      error: friendlyError(err),
      value: undefined,
      vars: {},
    };
  }
}

const ERROR_HINTS = [
  [/is not defined/, 'Did you spell the name the same way everywhere? JavaScript is picky about capital letters.'],
  [/Unexpected token|Unexpected end of input/, 'Something is missing or extra — check your ( ) { } and quotes.'],
  [/is not a function/, 'That name exists, but it is not a function. Check the spelling or the dot before it.'],
  [/Assignment to constant/, 'A `const` cannot change. Use `let` if the value needs to change.'],
  [/Cannot read propert/, 'You are reading something from an empty (undefined) value.'],
  [/ran forever/, 'Make sure something inside the loop moves it toward the stop condition.'],
];

export function friendlyError(err) {
  const msg = err && err.message ? err.message : String(err);
  const hit = ERROR_HINTS.find(([re]) => re.test(msg));
  return hit ? `${msg}\nHint: ${hit[1]}` : msg;
}
