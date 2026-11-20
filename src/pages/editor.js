// editor.js — make or change a quiz.
//
// Left: the questions, in order. Right: the one being edited. Every question
// type has its own editor below the question text. Nothing is saved until
// "Save"; an unsaved quiz is kept on this device so a closed tab loses nothing.

import { h, fill, clamp } from '../ui/dom.js';
import { icon, shape } from '../ui/icons.js';
import { field, input, busy, toast, confirm, modal, segmented } from '../ui/kit.js';
import { navigate } from '../router.js';
import { explain } from '../net/index.js';
import { LIMITS } from '../config.js';
import { TYPES, TYPE_BY_ID, TIMES, POINTS, blankQuestion, retype, problem } from '../game/questions.js';
import { saveQuiz, loadForEditing, publishProblems, COVERS } from '../services/quizzes.js';
import { whenProfile } from '../services/session.js';
import { COVER_BG, pageTitle } from './parts.js';

const DRAFT_KEY = 'quickzy.draft';
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };
const writeDraft = (q) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(q)); } catch { /* full or private */ } };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

const SAMPLE = () => ({
  id: null, title: '', description: '', cover: Math.floor(Math.random() * COVERS), public: false,
  questions: [blankQuestion('mc')],
});

export default async function Editor({ params }) {
  await whenProfile();
  let quiz;
  if (params.id) {
    quiz = await loadForEditing(params.id).catch(() => null);
    if (!quiz) {
      return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' },
        h('h2', {}, 'This quiz could not be opened'), h('p', { class: 'muted' }, 'It may have been deleted, or it belongs to someone else.'),
        h('a', { class: 'btn btn-main', href: '/library' }, 'My quizzes')));
    }
    quiz = { id: quiz.id, title: quiz.title, description: quiz.description || '', cover: quiz.cover || 0, public: Boolean(quiz.public), questions: quiz.questions };
    if (!quiz.questions.length) quiz.questions.push(blankQuestion('mc'));
  } else {
    quiz = SAMPLE();
    const draft = readDraft();
    if (draft && draft.questions && (draft.title || draft.questions.some((q) => q.text))) {
      const restore = await confirm({ title: 'Carry on where you left off?', text: `You have an unsaved quiz${draft.title ? ` called "${draft.title}"` : ''} on this device.`, yes: 'Restore it', no: 'Start fresh' });
      if (restore) quiz = { ...SAMPLE(), ...draft, id: null };
      else clearDraft();
    }
  }
  pageTitle(quiz.id ? `Edit ${quiz.title}` : 'New quiz');

  let at = 0;
  let dirty = false;
  let showProblems = false;
  const touch = () => {
    dirty = true;
    if (!quiz.id) writeDraft(quiz);
    drawList();
    drawStatus();
  };

  /* --------------------------------------------------------- top bar */

  const title = input({ value: quiz.title, placeholder: 'Quiz title', maxlength: LIMITS.quizTitleMax, 'aria-label': 'Quiz title',
    style: { fontFamily: 'var(--display)', fontSize: '1.35rem', flex: '1', minWidth: '200px' } });
  title.addEventListener('input', () => { quiz.title = title.value; touch(); });
  const status = h('span', { class: 'small muted' });
  const drawStatus = () => fill(status, dirty ? 'Unsaved changes' : quiz.id ? 'Saved' : 'Not saved yet');

  const save = h('button', { class: 'btn btn-main' }, icon('check', { size: 18 }), 'Save');
  const doSave = async (publish) => {
    // a published quiz must stay playable, so its saves are checked too
    if (publish || (publish === undefined && quiz.public)) {
      const issues = publishProblems(quiz);
      if (issues.length) {
        showProblems = true;
        drawList(); drawEdit();
        await modal((close) => [h('h2', {}, 'Almost ready to publish'),
          h('ul', { class: 'stack', style: { paddingLeft: '20px', gap: '4px' } }, ...issues.slice(0, 8).map((t) => h('li', {}, t))),
          issues.length > 8 ? h('p', { class: 'muted small' }, `and ${issues.length - 8} more`) : null,
          h('div', { class: 'row end' }, h('button', { class: 'btn btn-main', onclick: () => close() }, 'Fix them'))]);
        const bad = quiz.questions.findIndex((q) => problem(q));
        if (bad >= 0) { at = bad; drawList(); drawEdit(); }
        return false;
      }
    }
    try {
      const id = await saveQuiz(quiz, { publish });
      const wasNew = !quiz.id;
      quiz.id = id;
      if (publish !== undefined) quiz.public = publish;
      dirty = false;
      clearDraft();
      drawStatus(); drawPublish();
      if (wasNew) history.replaceState(null, '', `/edit/${id}`);
      return true;
    } catch (err) {
      toast(explain(err), 'bad');
      return false;
    }
  };
  save.addEventListener('click', busy(save, async () => { if (await doSave()) toast('Saved', 'ok'); }));

  const publishBox = h('div');
  const drawPublish = () => {
    const b = h('button', { class: `btn ${quiz.public ? '' : 'btn-violet'}` }, icon(quiz.public ? 'lock' : 'globe', { size: 18 }), quiz.public ? 'Unpublish' : 'Publish');
    b.addEventListener('click', busy(b, async () => {
      const next = !quiz.public;
      if (await doSave(next)) toast(next ? 'Published. Anyone can find and play it now.' : 'Unpublished. Only you can see it.', 'ok');
    }));
    fill(publishBox, b);
  };
  drawPublish();

  const host = h('button', { class: 'btn btn-dark' }, icon('play', { size: 18 }), 'Host');
  host.addEventListener('click', busy(host, async () => {
    if (dirty || !quiz.id) { if (!(await doSave())) return; }
    navigate(`/host/${quiz.id}`);
  }));

  const details = h('button', { class: 'btn btn-icon', 'aria-label': 'Quiz details', title: 'Description and cover', onclick: () => editDetails() }, icon('gear'));

  /* ------------------------------------------------------------ list */

  const list = h('div', { class: 'q-list' });
  const drawList = () => {
    const thumbs = quiz.questions.map((q, i) => {
      const bad = showProblems && problem(q);
      return h('button', {
        class: `q-thumb${i === at ? ' is-on' : ''}${bad ? ' is-bad' : ''}`, title: bad || '',
        onclick: () => { at = i; drawList(); drawEdit(); },
      }, h('span', { class: 'n' }, String(i + 1)),
      h('span', { class: 't' }, q.text || h('i', { class: 'muted' }, TYPE_BY_ID.get(q.type).label)),
      icon(TYPE_BY_ID.get(q.type).icon, { size: 16 }));
    });
    const add = h('button', { class: 'btn btn-block', onclick: addQuestion, disabled: quiz.questions.length >= LIMITS.questionsMax }, icon('plus'), 'Add question');
    fill(list, ...thumbs, add, h('p', { class: 'small muted center', style: { margin: 0 } }, `${quiz.questions.length} of ${LIMITS.questionsMax}`));
  };

  async function addQuestion() {
    const type = await modal((close) => [h('h2', {}, 'Add a question'),
      h('div', { class: 'stack', style: { gap: '8px' } }, ...TYPES.map((t) => h('button', { class: 'btn btn-block', style: { justifyContent: 'flex-start', textAlign: 'left' }, onclick: () => close(t.id) },
        icon(t.icon), h('span', { class: 'grow' }, h('b', {}, t.label), h('br'), h('small', { class: 'muted' }, t.hint)))))], { wide: false });
    if (!type) return;
    const prev = quiz.questions[at];
    const q = blankQuestion(type);
    if (prev && type !== 'poll') { q.time = prev.time; q.points = prev.points === 'none' ? 'standard' : prev.points; }
    quiz.questions.splice(at + 1, 0, q);
    at += 1;
    touch(); drawEdit();
    const t = edit.querySelector('.q-text');
    if (t) t.focus();
  }

  /* ------------------------------------------------------------ edit */

  const edit = h('div', { class: 'q-edit' });

  function optionRow(q, i, { mark, onMark, removable }) {
    const box = h('input', { type: 'text', value: q.options[i], maxlength: LIMITS.optionMax, placeholder: q.type === 'order' ? `Item ${i + 1}` : `Answer ${i + 1}${i >= 2 && q.type !== 'order' ? ' (optional)' : ''}`,
      'aria-label': `Answer ${i + 1}` });
    box.addEventListener('input', () => { q.options[i] = box.value; touch(); });
    const marker = mark === undefined ? null : h('button', {
      type: 'button', class: `mark${mark ? ' is-on' : ''}`, 'aria-label': mark ? 'Right answer' : 'Mark as right', title: mark ? 'Right answer' : 'Mark as right',
      onclick: onMark,
    }, mark ? icon('check', { size: 20, stroke: 3.4 }) : null);
    const x = removable ? h('button', { type: 'button', class: 'x', 'aria-label': 'Remove answer', onclick: () => {
      q.options.splice(i, 1);
      if (q.type === 'mc') q.answer = q.answer === i ? 0 : q.answer > i ? q.answer - 1 : q.answer;
      if (q.type === 'multi') { q.answer = q.answer.filter((a) => a !== i).map((a) => (a > i ? a - 1 : a)); if (!q.answer.length) q.answer = [0]; }
      touch(); drawEdit();
    } }, icon('close', { size: 16 })) : null;
    return h('div', { class: `opt c${i % 6}${i % 6 === 2 ? ' is-dark-text' : ''}` }, shape(i), box, marker, x);
  }

  function choicesEditor(q) {
    const max = q.type === 'order' ? 6 : 6;
    const min = q.type === 'order' ? 3 : 2;
    const rows = q.options.map((_, i) => {
      let mark;
      let onMark;
      if (q.type === 'mc') { mark = q.answer === i; onMark = () => { q.answer = i; touch(); drawEdit(); }; }
      if (q.type === 'multi') {
        mark = q.answer.includes(i);
        onMark = () => {
          q.answer = mark ? q.answer.filter((a) => a !== i) : [...q.answer, i].sort((a, b) => a - b);
          touch(); drawEdit();
        };
      }
      return optionRow(q, i, { mark, onMark, removable: q.options.length > min });
    });
    const add = q.options.length < max ? h('button', { class: 'btn btn-sm', onclick: () => { q.options.push(''); touch(); drawEdit(); } }, icon('plus', { size: 16 }), q.type === 'order' ? 'Add item' : 'Add answer') : null;
    const hint = {
      mc: 'Tap the circle on the right answer.',
      multi: 'Tap the circle on every right answer. Players must pick all of them, and nothing else.',
      poll: 'No right answer: players vote, everyone sees the results.',
      order: 'Write the items in the right order. Players see them shuffled.',
    }[q.type];
    if (q.type === 'order') {
      return [h('p', { class: 'muted small', style: { margin: 0 } }, hint),
        h('div', { class: 'stack', style: { gap: '10px' } }, ...rows.map((r, i) => h('div', { class: 'row', style: { flexWrap: 'nowrap' } },
          h('div', { class: 'stack', style: { gap: '2px' } },
            h('button', { class: 'btn btn-icon btn-sm', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { [q.options[i - 1], q.options[i]] = [q.options[i], q.options[i - 1]]; touch(); drawEdit(); } }, icon('up', { size: 16 })),
            h('button', { class: 'btn btn-icon btn-sm', 'aria-label': 'Move down', disabled: i === q.options.length - 1, onclick: () => { [q.options[i + 1], q.options[i]] = [q.options[i], q.options[i + 1]]; touch(); drawEdit(); } }, icon('down', { size: 16 }))),
          h('div', { class: 'grow' }, r)))),
        add];
    }
    return [h('p', { class: 'muted small', style: { margin: 0 } }, hint), h('div', { class: 'opt-grid' }, ...rows), add];
  }

  function tfEditor(q) {
    return [h('p', { class: 'muted small', style: { margin: 0 } }, 'Tap the right answer.'),
      h('div', { class: 'opt-grid' }, ...[[true, 'True', 1], [false, 'False', 0]].map(([v, label, c]) => h('button', {
        type: 'button', class: `opt c${c}`, style: { justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', border: 0, cursor: 'pointer', outline: q.answer === v ? '5px solid var(--ok)' : 'none', outlineOffset: '3px' },
        onclick: () => { q.answer = v; touch(); drawEdit(); },
      }, shape(c), label, q.answer === v ? h('span', { class: 'mark is-on' }, icon('check', { size: 20, stroke: 3.4 })) : null)))];
  }

  function typeEditor(q) {
    const rows = q.answer.map((a, i) => {
      const box = input({ value: a, maxlength: 60, placeholder: i === 0 ? 'The right answer' : 'Another accepted spelling' });
      box.addEventListener('input', () => { q.answer[i] = box.value; touch(); });
      return h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, box,
        q.answer.length > 1 ? h('button', { class: 'btn btn-icon btn-ghost', 'aria-label': 'Remove', onclick: () => { q.answer.splice(i, 1); touch(); drawEdit(); } }, icon('close')) : null);
    });
    return [h('p', { class: 'muted small', style: { margin: 0 } }, 'Capitals, accents, spaces and punctuation do not matter: "New York", "new york" and "New-York!" all count.'),
      ...rows,
      q.answer.length < 5 ? h('button', { class: 'btn btn-sm', onclick: () => { q.answer.push(''); touch(); drawEdit(); } }, icon('plus', { size: 16 }), 'Accept another answer') : null];
  }

  function numberEditor(q) {
    const val = input({ type: 'number', step: 'any', value: String(q.answer), inputmode: 'decimal' });
    val.addEventListener('input', () => { q.answer = val.value === '' ? NaN : Number(val.value); touch(); });
    const tol = input({ type: 'number', step: 'any', min: 0, value: String(q.tolerance || 0), inputmode: 'decimal' });
    tol.addEventListener('input', () => { q.tolerance = Number(tol.value) || 0; touch(); });
    const unit = input({ value: q.unit || '', maxlength: 12, placeholder: 'e.g. km, kg, years' });
    unit.addEventListener('input', () => { q.unit = unit.value; touch(); });
    return [h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' } },
      field('Right answer', val), field('Leeway (±)', tol, '0 means exactly right.'), field('Unit', unit, 'Optional, shown to players.'))];
  }

  function drawEdit() {
    at = clamp(at, 0, quiz.questions.length - 1);
    const q = quiz.questions[at];
    const typeSel = h('select', { class: 'select', 'aria-label': 'Question type' }, ...TYPES.map((t) => h('option', { value: t.id, selected: t.id === q.type }, t.label)));
    typeSel.addEventListener('change', () => { quiz.questions[at] = retype(q, typeSel.value); touch(); drawEdit(); });
    const timeSel = h('select', { class: 'select', 'aria-label': 'Time limit' }, ...TIMES.map((t) => h('option', { value: t, selected: t === q.time }, t < 60 ? `${t} seconds` : `${t / 60} minute${t === 60 ? '' : 's'}`)));
    timeSel.addEventListener('change', () => { q.time = Number(timeSel.value); touch(); });
    const pointsSel = q.type === 'poll' ? null : segmented(POINTS, q.points, (v) => { q.points = v; touch(); });

    const text = h('textarea', { class: 'q-text', placeholder: 'Type your question', maxlength: LIMITS.questionMax, rows: 2, 'aria-label': 'Question' });
    text.value = q.text;
    text.addEventListener('input', () => { q.text = text.value; touch(); count.textContent = `${text.value.length}/${LIMITS.questionMax}`; });
    const count = h('small', { class: 'muted', style: { justifySelf: 'end', marginTop: '-10px' } }, `${q.text.length}/${LIMITS.questionMax}`);

    let body;
    if (['mc', 'multi', 'poll', 'order'].includes(q.type)) body = choicesEditor(q);
    if (q.type === 'tf') body = tfEditor(q);
    if (q.type === 'type') body = typeEditor(q);
    if (q.type === 'number') body = numberEditor(q);

    const issue = showProblems ? problem(q) : '';
    const tools = h('div', { class: 'row' },
      h('button', { class: 'btn btn-sm', title: 'Move up', disabled: at === 0, onclick: () => { const qs = quiz.questions; [qs[at - 1], qs[at]] = [qs[at], qs[at - 1]]; at -= 1; touch(); drawEdit(); } }, icon('up', { size: 16 })),
      h('button', { class: 'btn btn-sm', title: 'Move down', disabled: at === quiz.questions.length - 1, onclick: () => { const qs = quiz.questions; [qs[at + 1], qs[at]] = [qs[at], qs[at + 1]]; at += 1; touch(); drawEdit(); } }, icon('down', { size: 16 })),
      h('button', { class: 'btn btn-sm', title: 'Duplicate', disabled: quiz.questions.length >= LIMITS.questionsMax, onclick: () => {
        const copy = JSON.parse(JSON.stringify(q));
        copy.id = Math.random().toString(36).slice(2, 10);
        quiz.questions.splice(at + 1, 0, copy); at += 1; touch(); drawEdit();
      } }, icon('copy', { size: 16 }), 'Duplicate'),
      h('button', { class: 'btn btn-sm btn-bad', title: 'Delete', disabled: quiz.questions.length <= 1, onclick: async () => {
        if (q.text && !(await confirm({ title: 'Delete this question?', yes: 'Delete', danger: true }))) return;
        quiz.questions.splice(at, 1); touch(); drawEdit();
      } }, icon('trash', { size: 16 })));

    fill(edit,
      h('div', { class: 'row spread' }, h('div', { class: 'row' }, h('b', {}, `Question ${at + 1}`), typeSel), tools),
      issue ? h('p', { class: 'error-text', role: 'alert', style: { margin: 0 } }, issue) : null,
      text, count,
      ...body,
      h('div', { class: 'row', style: { gap: '18px', marginTop: '6px' } },
        h('label', { class: 'field' }, h('span', {}, 'Time limit'), timeSel),
        pointsSel ? h('div', { class: 'field' }, h('span', {}, 'Points'), pointsSel) : null));
  }

  function editDetails() {
    return modal((close) => {
      const desc = h('textarea', { class: 'textarea', maxlength: LIMITS.quizDescMax, placeholder: 'What is it about? Who is it for?' });
      desc.value = quiz.description || '';
      let cover = quiz.cover;
      const covers = h('div', { class: 'row' });
      const drawCovers = () => fill(covers, ...COVER_BG.map((bg, i) => h('button', { type: 'button', 'aria-label': `Cover ${i + 1}`,
        style: { width: '54px', height: '40px', borderRadius: '12px', background: bg, border: 0, cursor: 'pointer', outline: i === cover ? '4px solid var(--violet)' : 'none', outlineOffset: '2px' },
        onclick: () => { cover = i; drawCovers(); } })));
      drawCovers();
      return [h('h2', {}, 'Quiz details'),
        field('Description', desc, `${LIMITS.quizDescMax} characters at most. Helps people find it in Discover.`),
        h('div', { class: 'field' }, h('span', {}, 'Cover colour'), covers),
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'),
          h('button', { class: 'btn btn-main', onclick: () => { quiz.description = desc.value; quiz.cover = cover; touch(); close(); } }, 'Done'))];
    });
  }

  /* ------------------------------------------------------------ page */

  drawList(); drawEdit(); drawStatus();

  const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', warn);
  const keys = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save.click(); }
  };
  document.addEventListener('keydown', keys);

  const el = h('div', { class: 'page wide' },
    h('div', { class: 'card row', style: { marginBottom: '18px', position: 'sticky', top: '70px', zIndex: 5, padding: '12px 14px' } },
      title, details,
      h('div', { class: 'row', style: { marginLeft: 'auto' } }, status, save, publishBox, host)),
    h('div', { class: 'editor' }, list, h('div', { class: 'card' }, edit)));

  return {
    el,
    destroy() {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('keydown', keys);
      if (dirty && !quiz.id) writeDraft(quiz);
      if (dirty && quiz.id) toast('Your last changes were not saved.', 'bad');
    },
  };
}
