// checks.js — small helpers used by lesson `check(ctx)` functions.
// ctx = { logs: string[], value: any, vars: object, code: string }

export const norm = (s) => String(s).trim().replace(/\s+/g, ' ').toLowerCase();

export function saidSomething(ctx) {
  return ctx.logs.length > 0 || 'Nothing was printed. Use console.log(...) to say something.';
}

export function said(ctx, text, msg) {
  const want = norm(text);
  return ctx.logs.some((l) => norm(l) === want) || msg || `I expected a line that says: ${text}`;
}

export function saidAll(ctx, list, msg) {
  const missing = list.filter((w) => !ctx.logs.some((l) => norm(l) === norm(w)));
  return missing.length === 0 || msg || `Still missing: ${missing.join(', ')}`;
}

export function saidContains(ctx, part, msg) {
  return ctx.logs.some((l) => norm(l).includes(norm(part))) || msg || `I expected something containing "${part}".`;
}

export function linesAre(ctx, list, msg) {
  if (ctx.logs.length !== list.length) {
    return msg || `I expected ${list.length} printed line(s), but got ${ctx.logs.length}.`;
  }
  for (let i = 0; i < list.length; i++) {
    if (norm(ctx.logs[i]) !== norm(list[i])) {
      return msg || `Line ${i + 1} should be "${list[i]}" but it is "${ctx.logs[i]}".`;
    }
  }
  return true;
}

export function varIs(ctx, name, want, msg) {
  const got = ctx.vars[name];
  const same = JSON.stringify(got) === JSON.stringify(want);
  return same || msg || `The variable \`${name}\` should be ${JSON.stringify(want)}, but it is ${JSON.stringify(got)}.`;
}

export function uses(ctx, re, msg) {
  return re.test(ctx.code) || msg || 'Your code is missing something the task asked for.';
}

export function avoids(ctx, re, msg) {
  return !re.test(ctx.code) || msg || 'That shortcut is not allowed in this task 😄';
}

/** Runs all checks in order and returns the first failure message, or true. */
export function all(...results) {
  for (const r of results) if (r !== true) return r;
  return true;
}

/**
 * Runs a step's check without ever throwing — learner output can be anything,
 * and a crashing checker must not look like a crashing program.
 */
export function safeCheck(step, ctx) {
  if (typeof step.check !== 'function') return true;
  try {
    const verdict = step.check(ctx);
    return verdict === true ? true : String(verdict || 'Not quite yet.');
  } catch (err) {
    return `The checker could not read your output (${err.message}). Make sure you print what the task asks for.`;
  }
}
