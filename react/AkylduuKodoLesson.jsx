/**
 * AkylduuKodoLesson — a step-by-step coding lesson, in one component.
 *
 *   npm i react framer-motion lucide-react
 *   Tailwind CSS v3 or v4 must be set up in the host app.
 *
 *   import AkylduuKodoLesson from './AkylduuKodoLesson';
 *   <AkylduuKodoLesson onFinish={(stats) => console.log(stats)} />
 *
 * Everything is local state — drop it anywhere, no provider, no router, no
 * store. Pass your own `course` to replace the curriculum; the shape is
 * documented in course.js.
 *
 * A note on the runner: learner code is executed in the page with `new
 * Function`, with console captured and a loop guard injected. That is right for
 * a teaching sandbox where the learner is the only author. Do not point it at
 * code from strangers.
 */

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Check, ChevronLeft, ChevronRight, Circle, Flame, Lightbulb, Lock, Mountain,
  Play, RotateCcw, Sparkles, Terminal, Trophy, X, Zap,
} from 'lucide-react';

import { COURSE as DEFAULT_COURSE } from './course.js';
import { runSandboxed } from './sandbox.js';

/* ------------------------------------------------------------------ theme */

const C = {
  bg: '#090D16',
  surface: '#0E131F',
  raised: '#131A29',
  border: '#1E293B',
  emerald: '#10B981',
  indigo: '#6366F1',
};

const XP_PER_STEP = 40;

/* -------------------------------------------------------- highlighting */

const TOKENS = [
  [/^\/\/[^\n]*/, 'text-slate-500 italic'],
  [/^\/\*[\s\S]*?\*\//, 'text-slate-500 italic'],
  [/^`(?:\\.|\$\{[^}]*\}|[^`\\])*`/, 'text-emerald-300'],
  [/^"(?:\\.|[^"\\])*"/, 'text-emerald-300'],
  [/^'(?:\\.|[^'\\])*'/, 'text-emerald-300'],
  [/^\b(const|let|var|function|return|if|else|for|while|do|of|in|new|class|this|typeof|break|continue|=>)\b/, 'text-indigo-400'],
  [/^\b(true|false|null|undefined)\b/, 'text-sky-400'],
  [/^\b\d+(?:\.\d+)?\b/, 'text-amber-300'],
  [/^\b(console|log|push|map|filter|join|length|Math)\b/, 'text-sky-300'],
  [/^[A-Za-z_$][\w$]*/, 'text-slate-200'],
  [/^\s+/, ''],
  [/^[^\s]/, 'text-slate-400'],
];

/** Tokenise into spans. No dangerouslySetInnerHTML anywhere near learner text. */
function highlight(code) {
  const out = [];
  let rest = code;
  let key = 0;
  let guardCount = 0;

  while (rest && guardCount++ < 20000) {
    let matched = false;
    for (const [pattern, className] of TOKENS) {
      const found = rest.match(pattern);
      if (!found) continue;
      const text = found[0];
      out.push(className ? <span key={key++} className={className}>{text}</span> : text);
      rest = rest.slice(text.length);
      matched = true;
      break;
    }
    if (!matched) {
      out.push(rest[0]);
      rest = rest.slice(1);
    }
  }
  return out;
}

/* ------------------------------------------------------------- reducer */

const initial = (course) => ({
  index: 0,
  direction: 1,
  done: {},
  code: Object.fromEntries(course.flatMap((c) => c.steps.map((s) => [s.id, s.starter]))),
  xp: 0,
  toast: null,
  finished: false,
});

function reducer(state, action) {
  switch (action.type) {
    case 'go':
      return { ...state, index: action.index, direction: action.index > state.index ? 1 : -1 };
    case 'edit':
      return { ...state, code: { ...state.code, [action.id]: action.value } };
    case 'reset-code':
      return { ...state, code: { ...state.code, [action.id]: action.starter } };
    case 'solve': {
      if (state.done[action.id]) return { ...state, toast: action.toast };
      return {
        ...state,
        done: { ...state.done, [action.id]: true },
        xp: state.xp + XP_PER_STEP,
        toast: action.toast,
      };
    }
    case 'toast':
      return { ...state, toast: action.toast };
    case 'finish':
      return { ...state, finished: true, toast: null };
    case 'restart':
      return { ...initial(action.course), code: state.code };
    default:
      return state;
  }
}

/* --------------------------------------------------------- small pieces */

function ProgressBar({ value, reduced }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
      <motion.div
        className="h-full rounded-full bg-emerald-500"
        initial={false}
        animate={{ width: `${value}%` }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

function StepDot({ state }) {
  if (state === 'done') {
    return (
      <motion.span
        key="done"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
      >
        <Check size={13} strokeWidth={3} />
      </motion.span>
    );
  }
  if (state === 'active') {
    return (
      <span className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/50">
        <motion.span
          className="absolute inset-0 rounded-full ring-2 ring-indigo-500/40"
          animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
        <Circle size={7} className="fill-current" />
      </span>
    );
  }
  if (state === 'open') {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-800/70 text-slate-500 ring-1 ring-slate-700">
        <Circle size={7} />
      </span>
    );
  }
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-800/40 text-slate-600 ring-1 ring-slate-800">
      <Lock size={11} />
    </span>
  );
}

function Editor({ value, onChange, fileName }) {
  const areaRef = useRef(null);
  const layerRef = useRef(null);
  const gutterRef = useRef(null);
  const lineCount = value.split('\n').length;

  // The highlighted layer sits under a transparent textarea; scrolling has to
  // be mirrored or the two drift apart.
  const sync = () => {
    const area = areaRef.current;
    if (!area) return;
    if (layerRef.current) {
      layerRef.current.scrollTop = area.scrollTop;
      layerRef.current.scrollLeft = area.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const area = areaRef.current;
    const { selectionStart: start, selectionEnd: end } = area;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => area.setSelectionRange(start + 2, start + 2));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0B0F18]">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 font-mono text-xs text-slate-500">{fileName}</span>
      </div>

      <div className="flex max-h-[340px] text-[13px] leading-[22px]">
        <pre
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden border-r border-slate-800/80 bg-slate-900/20 px-3 py-4 text-right font-mono text-slate-600"
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
        </pre>

        <div className="relative min-w-0 flex-1">
          <pre
            ref={layerRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-4 py-4 font-mono"
          >
            {highlight(value)}
            {value.endsWith('\n') ? ' ' : null}
          </pre>
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={sync}
            onKeyDown={onKeyDown}
            spellCheck="false"
            aria-label="Code editor"
            className="relative block h-full min-h-[200px] w-full resize-none overflow-auto whitespace-pre bg-transparent px-4 py-4 font-mono text-transparent caret-emerald-400 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function ConsolePanel({ result, running, reduced }) {
  const [shown, setShown] = useState([]);
  const token = useRef(0);

  // Lines arrive one at a time, and each one types itself in. Cancelled by
  // bumping the token, so a second Run never interleaves with the first.
  useEffect(() => {
    const mine = ++token.current;
    if (!result) {
      setShown([]);
      return undefined;
    }
    const lines = [...result.logs, ...(result.error ? [{ kind: 'error', text: result.error }] : [])];
    if (reduced) {
      setShown(lines.map((l) => ({ ...l, text: l.text })));
      return undefined;
    }
    setShown([]);
    let cancelled = false;
    const timers = [];

    const typeLine = (i) => {
      if (cancelled || mine !== token.current || i >= lines.length) return;
      const line = lines[i];
      setShown((prev) => [...prev, { ...line, text: '' }]);
      let char = 0;
      const step = () => {
        if (cancelled || mine !== token.current) return;
        char += Math.max(1, Math.round(line.text.length / 18));
        setShown((prev) => {
          const next = [...prev];
          next[i] = { ...line, text: line.text.slice(0, char) };
          return next;
        });
        if (char < line.text.length) timers.push(setTimeout(step, 16));
        else timers.push(setTimeout(() => typeLine(i + 1), 90));
      };
      timers.push(setTimeout(step, 40));
    };
    typeLine(0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [result, reduced]);

  const empty = !result || (result.logs.length === 0 && !result.error);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#070A11]">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/40 px-4 py-2.5">
        <Terminal size={13} className="text-slate-500" />
        <span className="font-mono text-xs text-slate-500">console</span>
        {running ? (
          <motion.span
            className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        ) : null}
      </div>

      <div className="max-h-[200px] min-h-[104px] overflow-auto px-4 py-3 font-mono text-[13px] leading-6">
        {empty ? (
          <p className="text-slate-600">Press Run to see what your code prints.</p>
        ) : (
          <AnimatePresence initial={false}>
            {shown.map((line, i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className={
                  line.kind === 'error'
                    ? 'flex gap-2 text-rose-400'
                    : line.kind === 'warn'
                      ? 'flex gap-2 text-amber-300'
                      : 'flex gap-2 text-slate-300'
                }
              >
                <span className="select-none text-slate-700">{'>'}</span>
                <span className="whitespace-pre-wrap break-words">{line.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function Toast({ toast, onClose, reduced }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, toast.kind === 'success' ? 2600 : 4200);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
          transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 420, damping: 26 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2"
          role="status"
        >
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${
              toast.kind === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10'
            }`}
          >
            <span className={toast.kind === 'success' ? 'mt-0.5 text-emerald-400' : 'mt-0.5 text-amber-300'}>
              {toast.kind === 'success' ? <Sparkles size={16} /> : <Lightbulb size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
              <p className="mt-0.5 text-sm text-slate-300">{toast.text}</p>
            </div>
            <button onClick={onClose} aria-label="Dismiss" className="text-slate-500 transition hover:text-slate-300">
              <X size={15} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FinishedModal({ open, stats, onRestart, reduced }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 26 }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0E131F] p-8 text-center shadow-2xl"
          >
            <motion.span
              initial={reduced ? false : { scale: 0.4, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
              className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
            >
              <Trophy size={28} />
            </motion.span>
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">Course complete</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every step finished. That is variables, loops, functions, arrays and objects — the whole
              foundation.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ['Steps', stats.steps],
                ['XP', stats.xp],
                ['Runs', stats.runs],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/40 py-3">
                  <p className="font-mono text-lg font-semibold text-slate-100 tabular-nums">{value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onRestart}
              className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:brightness-110"
            >
              Start again
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------ the whole */

export default function AkylduuKodoLesson({ course = DEFAULT_COURSE, onFinish, className = '' }) {
  const reduced = useReducedMotion();
  const steps = useMemo(
    () => course.flatMap((c) => c.steps.map((s) => ({ ...s, chapterId: c.id, chapterTitle: c.title }))),
    [course],
  );

  const [state, dispatch] = useReducer(reducer, course, initial);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(0);
  // On a phone the chapter list would fill the first screen, so it folds away
  // and the lesson comes first. On a wide screen it is simply always open.
  const [navOpen, setNavOpen] = useState(false);

  const step = steps[state.index];
  const doneCount = Object.keys(state.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const isDone = Boolean(state.done[step.id]);

  // A fresh step starts with a clean console.
  useEffect(() => {
    setResult(null);
  }, [state.index]);

  const run = useCallback(() => {
    const source = state.code[step.id] ?? step.starter;
    setRunning(true);
    setRuns((n) => n + 1);

    // One frame of "running" makes the button feel like it did something even
    // when the code takes no time at all.
    window.setTimeout(() => {
      const outcome = runSandboxed(source);
      setResult(outcome);
      setRunning(false);

      if (!outcome.ok) {
        dispatch({ type: 'toast', toast: { kind: 'hint', title: 'That did not run', text: outcome.error } });
        return;
      }
      const problem = step.check({ logs: outcome.logs.map((l) => l.text), code: source });
      if (problem) {
        dispatch({ type: 'toast', toast: { kind: 'hint', title: 'Almost', text: problem } });
        return;
      }
      dispatch({
        type: 'solve',
        id: step.id,
        toast: {
          kind: 'success',
          title: state.done[step.id] ? 'Still correct' : `Step complete · +${XP_PER_STEP} XP`,
          text: step.title,
        },
      });
    }, 220);
  }, [state.code, state.done, step]);

  const goTo = useCallback(
    (index) => {
      if (index < 0 || index >= steps.length) return;
      dispatch({ type: 'go', index });
    },
    [steps.length],
  );

  const next = useCallback(() => {
    if (state.index === steps.length - 1) {
      if (doneCount === steps.length) dispatch({ type: 'finish' });
      return;
    }
    goTo(state.index + 1);
  }, [state.index, steps.length, doneCount, goTo]);

  useEffect(() => {
    if (doneCount === steps.length && !state.finished) {
      const t = setTimeout(() => dispatch({ type: 'finish' }), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [doneCount, steps.length, state.finished]);

  useEffect(() => {
    if (state.finished) onFinish?.({ steps: doneCount, xp: state.xp, runs });
  }, [state.finished, doneCount, state.xp, runs, onFinish]);

  // Arrow keys move between steps, unless the learner is typing.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') goTo(state.index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, goTo, state.index]);

  const stepStateFor = (s, absoluteIndex) => {
    if (state.done[s.id]) return 'done';
    if (absoluteIndex === state.index) return 'active';
    const firstUndone = steps.findIndex((x) => !state.done[x.id]);
    return absoluteIndex <= Math.max(firstUndone, state.index) ? 'open' : 'locked';
  };

  const slide = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (d) => ({ opacity: 0, x: d > 0 ? 20 : -20 }),
        animate: { opacity: 1, x: 0 },
        exit: (d) => ({ opacity: 0, x: d > 0 ? -20 : 20 }),
      };

  return (
    <div className={`min-h-screen bg-[#090D16] text-slate-200 antialiased ${className}`}>
      {/* one quiet glow, far behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[380px] opacity-60"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${C.indigo}22, transparent 70%)` }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
        {/* ------------------------------------------------------- top bar */}
        <header className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <Mountain size={18} />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-slate-50">
                Akyldu<span className="text-emerald-400">u</span>Kodo
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">JavaScript foundations</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300">
              <Zap size={12} className="text-emerald-400" />
              <motion.span key={state.xp} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="tabular-nums">
                {state.xp}
              </motion.span>
              XP
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300">
              <Flame size={12} className="text-amber-400" />
              <span className="tabular-nums">{doneCount}</span>
              <span className="text-slate-500">/ {steps.length}</span>
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
          {/* ----------------------------------------------------- sidebar */}
          <aside className="order-2 lg:order-1 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-slate-800 bg-[#0E131F] p-4">
              <button
                onClick={() => setNavOpen((open) => !open)}
                aria-expanded={navOpen}
                className="mb-1 flex w-full items-center gap-3 text-left lg:hidden"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  All chapters
                </span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {doneCount}/{steps.length}
                </span>
                <motion.span
                  animate={{ rotate: navOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-auto text-slate-500"
                >
                  <ChevronRight size={16} />
                </motion.span>
              </button>

              <div className={navOpen ? 'block' : 'hidden lg:block'}>
              <div className="mb-4 mt-3 flex items-baseline justify-between lg:mt-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Chapters</p>
                <p className="font-mono text-xs text-slate-400 tabular-nums">{percent}%</p>
              </div>
              <ProgressBar value={percent} reduced={reduced} />

              <nav className="mt-5 space-y-5">
                {course.map((chapter, ci) => {
                  const chapterSteps = chapter.steps;
                  const chapterDone = chapterSteps.filter((s) => state.done[s.id]).length;
                  const complete = chapterDone === chapterSteps.length;
                  return (
                    <div key={chapter.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`font-mono text-[11px] ${complete ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {String(ci + 1).padStart(2, '0')}
                        </span>
                        <span className={`text-sm font-semibold ${complete ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {chapter.title}
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-slate-600 tabular-nums">
                          {chapterDone}/{chapterSteps.length}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {chapterSteps.map((s) => {
                          const absolute = steps.findIndex((x) => x.id === s.id);
                          const kind = stepStateFor(s, absolute);
                          const current = absolute === state.index;
                          return (
                            <li key={s.id}>
                              <button
                                onClick={() => {
                                  goTo(absolute);
                                  setNavOpen(false);
                                }}
                                disabled={kind === 'locked'}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition ${
                                  current
                                    ? 'bg-indigo-500/10 text-slate-100 ring-1 ring-indigo-500/30'
                                    : kind === 'locked'
                                      ? 'cursor-not-allowed text-slate-600'
                                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                }`}
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  <StepDot key={kind} state={kind} />
                                </AnimatePresence>
                                <span className="truncate">{s.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </nav>
              </div>
            </div>
          </aside>

          {/* -------------------------------------------------------- main */}
          <main className="order-1 min-w-0 lg:order-2">
            <div className="mb-5 flex items-center gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                {step.chapterTitle} · step {state.index + 1} of {steps.length}
              </p>
              <div className="flex-1">
                <ProgressBar value={((state.index + 1) / steps.length) * 100} reduced={reduced} />
              </div>
            </div>

            <AnimatePresence mode="wait" custom={state.direction} initial={false}>
              <motion.article
                key={step.id}
                custom={state.direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{step.title}</h1>
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30"
                      >
                        <Check size={11} strokeWidth={3} /> Done
                      </motion.span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[15px] text-slate-400">{step.lede}</p>
                </div>

                <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">
                  {step.body.map((paragraph, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: inlineMarkup(paragraph) }} />
                  ))}
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.07] px-4 py-3">
                  <span className="mt-0.5 text-indigo-300">
                    <Sparkles size={15} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">Your turn</p>
                    <p
                      className="mt-0.5 text-[15px] text-slate-200"
                      dangerouslySetInnerHTML={{ __html: inlineMarkup(step.goal) }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Editor
                    value={state.code[step.id] ?? step.starter}
                    onChange={(value) => dispatch({ type: 'edit', id: step.id, value })}
                    fileName={`${step.id}.js`}
                  />
                  <ConsolePanel result={result} running={running} reduced={reduced} />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.button
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    onClick={run}
                    disabled={running}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-[0_0_0_0_rgba(16,185,129,0.4)] transition hover:brightness-110 hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)] disabled:opacity-60"
                  >
                    <Play size={14} className="fill-current" />
                    {running ? 'Running…' : 'Run code'}
                  </motion.button>

                  <motion.button
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    onClick={() => {
                      dispatch({ type: 'reset-code', id: step.id, starter: step.starter });
                      setResult(null);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </motion.button>

                  <motion.button
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    onClick={() =>
                      dispatch({ type: 'toast', toast: { kind: 'hint', title: 'Hint', text: step.hint } })
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
                  >
                    <Lightbulb size={14} />
                    Hint
                  </motion.button>

                  <div className="ml-auto flex items-center gap-2">
                    <motion.button
                      whileHover={reduced ? undefined : { scale: 1.02 }}
                      whileTap={reduced ? undefined : { scale: 0.96 }}
                      onClick={() => goTo(state.index - 1)}
                      disabled={state.index === 0}
                      aria-label="Previous step"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 transition hover:border-slate-700 hover:text-slate-100 disabled:opacity-35"
                    >
                      <ChevronLeft size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={reduced ? undefined : { scale: 1.02 }}
                      whileTap={reduced ? undefined : { scale: 0.96 }}
                      onClick={next}
                      disabled={state.index === steps.length - 1 && doneCount < steps.length}
                      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-35 ${
                        isDone
                          ? 'bg-indigo-500 text-white hover:brightness-110'
                          : 'border border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                      }`}
                    >
                      {state.index === steps.length - 1 ? 'Finish' : 'Next step'}
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Toast toast={state.toast} reduced={reduced} onClose={() => dispatch({ type: 'toast', toast: null })} />
      <FinishedModal
        open={state.finished}
        stats={{ steps: doneCount, xp: state.xp, runs }}
        reduced={reduced}
        onRestart={() => {
          dispatch({ type: 'restart', course });
          setResult(null);
          setRuns(0);
        }}
      />
    </div>
  );
}

/** `code` and **bold** in lesson prose — the only markup the body text needs. */
function inlineMarkup(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[13px] text-emerald-300">$1</code>',
    );
}
