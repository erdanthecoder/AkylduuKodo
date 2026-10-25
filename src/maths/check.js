// check.js — marking.
//
// Marking has to be generous about how an answer is written and strict about
// whether it is right. "0.5", "½ " and "1/2" are the same thought; 0.51 is not.

function tidy(text) {
  return String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!]$/, '');
}

function asNumber(text) {
  const clean = tidy(text).replace(/,/g, '').replace(/^£/, '').replace(/p$/, '').replace(/\s/g, '');
  if (!/^-?\d*\.?\d+$/.test(clean)) return null;
  return Number(clean);
}

function asFraction(text) {
  const m = tidy(text).replace(/\s/g, '').match(/^(\d+)\s*(?:\/|over)\s*(\d+)$/);
  if (!m) return null;
  const bottom = Number(m[2]);
  if (!bottom) return null;
  return { top: Number(m[1]), bottom };
}

/** Money typed as pence ("59"), pounds ("0.59") or either with its sign. */
function asPence(text) {
  const clean = tidy(text).replace(/\s/g, '');
  if (/^£/.test(clean)) {
    const n = Number(clean.slice(1));
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }
  if (/p$/.test(clean)) {
    const n = Number(clean.slice(0, -1));
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const n = Number(clean);
  if (!Number.isFinite(n)) return null;
  // a decimal point means pounds; a whole number could be either, so allow both
  return clean.includes('.') ? Math.round(n * 100) : Math.round(n);
}

/**
 * Is `given` a right answer to `question`?
 * Returns { right, note } — `note` explains a near miss worth naming.
 */
export function check(question, given) {
  const said = tidy(given);
  if (!said) return { right: false, note: 'empty' };

  const accepted = [question.answer, ...(question.accept || [])].map(tidy);
  if (accepted.includes(said)) return { right: true };

  if (question.kind === 'fraction') {
    const a = asFraction(given);
    const b = asFraction(question.answer);
    if (a && b) {
      // 2/4 is a right answer to 1/2 — Year 3 does not simplify yet
      if (a.top * b.bottom === b.top * a.bottom) return { right: true };
      return { right: false, note: a.bottom !== b.bottom ? 'bottom' : null };
    }
  }

  if (question.kind === 'money') {
    const a = asPence(given);
    const b = asPence(question.answer);
    const alsoB = question.suffix === 'p' ? Number(question.answer) : Math.round(Number(question.answer) * 100);
    if (a !== null && (a === b || a === alsoB)) return { right: true };
    return { right: false, note: a !== null && Math.abs(a - alsoB) < 10 ? 'close' : null };
  }

  if (question.kind === 'order') {
    const want = tidy(question.answer).split(',').map((s) => s.trim()).join(',');
    const got = said.split(/[,\s]+/).filter(Boolean).join(',');
    return { right: want === got };
  }

  const a = asNumber(given);
  const b = asNumber(question.answer);
  if (a !== null && b !== null) {
    if (a === b) return { right: true };
    return { right: false, note: Math.abs(a - b) === 1 ? 'one-out' : null };
  }

  return { right: false };
}

/** What to say when she gets it wrong — the nudge comes before the reason. */
export function response(question, given, firstTry) {
  const { note } = check(question, given);
  if (firstTry) {
    if (note === 'one-out') return 'So close — you are just one out. Have another go.';
    if (note === 'bottom') return 'Check the bottom number: how many equal parts are there?';
    if (note === 'close') return 'Nearly! Check the pence again.';
    return question.hint || 'Not quite — have another go.';
  }
  return question.why;
}
