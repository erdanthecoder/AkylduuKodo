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
import { TYPES, TYPE_BY_ID, TIMES, POINTS, blankQuestion, retype, problem, cleanPic, cleanVideo, youTubeId, parseTime, fmtTime } from '../game/questions.js';
import { videoClip } from '../ui/video.js';
import { myPlan } from '../services/plan.js';
import { picture } from '../ui/picture.js';
import { BLOOKS, blook } from '../ui/blooks.js';
import { saveQuiz, loadForEditing, publishProblems, COVERS, getQuiz, isLive, inviteEditor, removeEditor } from '../services/quizzes.js';
import { me } from '../services/session.js';
import { net } from '../net/index.js';
import { whenProfile } from '../services/session.js';
import { COVER_BG, pageTitle } from './parts.js';
import { aiPrompt, readAIQuiz, LEVELS } from '../game/import.js';
import { copy } from '../ui/kit.js';

const DRAFT_KEY = 'quickzy.draft';
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };
const writeDraft = (q) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(q)); } catch { /* full or private */ } };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

const SAMPLE = () => ({
  id: null, title: '', description: '', cover: Math.floor(Math.random() * COVERS), public: false,
  questions: [blankQuestion('mc')],
});

export default async function Editor({ params, query = {} }) {
  await whenProfile();
  let quiz;
  if (params.id) {
    quiz = await loadForEditing(params.id).catch(() => null);
    if (!quiz) {
      return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' },
        h('h2', {}, 'This quiz could not be opened'), h('p', { class: 'muted' }, 'It may have been deleted, or it belongs to someone else.'),
        h('a', { class: 'btn btn-main', href: '/library' }, 'My quizzes')));
    }
    quiz = { id: quiz.id, title: quiz.title, description: quiz.description || '', cover: quiz.cover || 0, image: quiz.image || '', public: Boolean(quiz.public), questions: quiz.questions,
      owner: quiz.owner, editors: quiz.editors || [], authorName: quiz.authorName };
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
      if (await doSave(next)) {
        const fresh = next && quiz.id ? await getQuiz(quiz.id).catch(() => null) : null;
        if (fresh && !isLive(fresh)) {
          toast(`Sent for checking. It goes live on ${new Date(fresh.liveAt).toLocaleDateString()}. Pro quizzes go live at once.`, 'ok');
        } else toast(next ? 'Published. Anyone can find and play it now.' : 'Unpublished. Only you can see it.', 'ok');
      }
    }));
    fill(publishBox, b);
  };
  drawPublish();

  // making quizzes together: the owner invites people (free accounts too);
  // collaborators edit and save, the owner publishes
  const mine = !quiz.owner || quiz.owner === me().uid;
  if (!mine) publishBox.hidden = true;
  const together = h('button', { class: 'btn', title: 'Make this quiz together' }, icon('users', { size: 18 }), 'Together');
  together.addEventListener('click', async () => {
    if (!mine) { toast(`You are editing ${quiz.authorName || 'someone'}'s quiz together. They publish it.`); return; }
    const plan = await myPlan();
    if (!plan.pro) { toast('Making quizzes together is for Pro members.', 'bad'); navigate('/pro'); return; }
    if (!quiz.id) { if (!(await doSave())) return; }
    await modal((close) => {
      const list = h('div', { class: 'stack', style: { gap: '8px' } });
      const name = input({ placeholder: 'Their username', autocapitalize: 'off', spellcheck: 'false' });
      const err = h('p', { class: 'error-text' });
      const draw = async () => {
        const fresh = await getQuiz(quiz.id);
        quiz.editors = (fresh && fresh.editors) || [];
        const people = await Promise.all(quiz.editors.map((uid) => net.store.get('users', uid).catch(() => null)));
        fill(list, ...(people.length ? people.map((p, i) => h('div', { class: 'owner-row' },
          blook((p && p.blook) || 'dog', 36), h('div', { class: 'grow owner-row-main' }, h('b', {}, p ? p.displayName : 'Someone'), h('small', { class: 'muted' }, p ? `@${p.username}` : '')),
          h('button', { class: 'btn btn-sm btn-ghost', onclick: async () => { await removeEditor(quiz.id, quiz.editors[i]); draw(); } }, icon('close', { size: 14 }), 'Remove')))
          : [h('p', { class: 'muted', style: { margin: 0 } }, 'Nobody yet. Invite a friend by their username.')]));
      };
      const invite = h('button', { class: 'btn btn-main' }, icon('plus', { size: 16 }), 'Invite');
      invite.addEventListener('click', busy(invite, async () => {
        err.textContent = '';
        try { const p = await inviteEditor(quiz.id, name.value); name.value = ''; toast(`${p ? p.displayName : 'They'} can now edit this quiz`, 'ok'); draw(); } catch (e) { err.textContent = e.code ? explain(e) : e.message; }
      }));
      draw();
      return [h('h2', {}, 'Make it together'),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'People you invite can edit the questions and save. Free accounts can join too. Only you can publish or delete it. Save often: the newest save wins.'),
        h('div', { class: 'row' }, name, invite), err, list,
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Done'))];
    });
  });

  const host = h('button', { class: 'btn btn-dark' }, icon('play', { size: 18 }), 'Host');
  host.addEventListener('click', busy(host, async () => {
    if (dirty || !quiz.id) { if (!(await doSave())) return; }
    navigate(`/host/${quiz.id}`);
  }));

  const details = h('button', { class: 'btn btn-icon', 'aria-label': 'Quiz details', title: 'Description and cover', onclick: () => editDetails() }, icon('gear'));
  const aiBtn = h('button', { class: 'btn btn-violet ai-btn', onclick: () => makeWithAI() }, icon('bolt', { size: 18 }), 'Make with AI');

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

  /* --------------------------------------------------------- pictures */

  function pickPicture(current) {
    return modal((close) => {
      const url = input({ type: 'url', placeholder: 'https://… (a picture address)', value: current && !current.startsWith('blook:') ? current : '', inputmode: 'url' });
      const preview = h('div', { class: 'pic-edit', style: { minHeight: '40px' } });
      const err = h('p', { class: 'error-text' });
      const show = () => { preview.replaceChildren(); const pic = picture(url.value); if (pic) preview.append(pic); };
      url.addEventListener('input', show);
      show();
      const useUrl = () => {
        const v = cleanPic(url.value);
        if (!v || v.startsWith('blook:')) { err.textContent = 'Paste a picture address that starts with https://'; return; }
        close(v);
      };
      return [h('h2', {}, 'Add a picture'),
        h('h3', { style: { margin: 0 } }, 'Quickzy characters'),
        h('div', { class: 'blook-grid', style: { maxHeight: '260px', overflowY: 'auto' } },
          ...BLOOKS.filter((b) => !b.exclusive).map((b) => h('button', { type: 'button', class: 'blook-pick', 'aria-label': b.name, onclick: () => close(`blook:${b.id}`) }, blook(b.id), h('small', {}, b.name)))),
        h('h3', { style: { margin: '8px 0 0' } }, 'Or a picture from the web'),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'Right-click a picture, choose "Copy image address", and paste it here. Keep it friendly: everyone in the game sees it.'),
        url, preview, err,
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'), h('button', { class: 'btn btn-main', onclick: useUrl }, 'Use this picture'))];
    }, { wide: true });
  }

  function pictureRow(q) {
    const row = h('div', { class: 'pic-edit' });
    const draw = () => {
      const pic = picture(q.img);
      row.replaceChildren(...[pic,
        h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => {
          const v = await pickPicture(q.img);
          if (v) { q.img = v; touch(); draw(); }
        } }, icon('plus', { size: 16 }), pic ? 'Change picture' : 'Add a picture'),
        pic ? h('button', { type: 'button', class: 'btn btn-sm btn-ghost', onclick: () => { delete q.img; touch(); draw(); } }, icon('trash', { size: 16 }), 'Remove') : null].filter(Boolean));
    };
    draw();
    return row;
  }

  /* ----------------------------------------------------------- videos */

  // Pro: a YouTube clip plays first, stops by itself, then the question is asked
  function pickVideo(current) {
    return modal((close) => {
      const link = input({ type: 'url', placeholder: 'https://www.youtube.com/watch?v=…', value: current ? `https://youtu.be/${current.id}` : '', inputmode: 'url' });
      const from = input({ placeholder: '0:00', value: current ? fmtTime(current.start) : '0:00', style: { maxWidth: '110px' } });
      const to = input({ placeholder: '0:45', value: current ? fmtTime(current.end) : '0:30', style: { maxWidth: '110px' } });
      const preview = h('div', { class: 'video-edit' });
      const err = h('p', { class: 'error-text' });
      const read = () => cleanVideo({ id: youTubeId(link.value), start: parseTime(from.value), end: parseTime(to.value) });
      const show = () => { const v = read(); preview.replaceChildren(...(v ? [videoClip(v, { autoplay: false })] : [])); };
      [link, from, to].forEach((x) => x.addEventListener('change', show));
      show();
      const use = () => {
        if (!youTubeId(link.value)) { err.textContent = 'Paste a YouTube link.'; return; }
        const v = read();
        if (!v) { err.textContent = 'Check the times: the end must be after the start, and the clip at most 10 minutes.'; return; }
        close(v);
      };
      return [h('h2', {}, 'Add a video clip'),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'The clip plays on the big screen, stops by itself, then the question is asked. Keep it friendly: everyone in the game sees it.'),
        field('YouTube link', link),
        h('div', { class: 'row' }, field('Start (m:ss)', from), field('Stop (m:ss)', to)),
        preview, err,
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'), h('button', { class: 'btn btn-main', onclick: use }, 'Use this clip'))];
    }, { wide: true });
  }

  function videoRow(q) {
    const row = h('div', { class: 'video-edit' });
    const draw = async () => {
      const plan = await myPlan();
      const clip = cleanVideo(q.video);
      row.replaceChildren(...[
        clip ? videoClip(clip, { autoplay: false }) : null,
        h('button', { type: 'button', class: 'btn btn-sm', onclick: async () => {
          if (!plan.pro) { toast('Video clips are for Pro members.', 'bad'); return; }
          const v = await pickVideo(clip);
          if (v) { q.video = v; touch(); draw(); }
        } }, icon('play', { size: 16 }), clip ? 'Change video' : 'Add a video clip', plan.pro ? null : h('span', { class: 'pro-tag', style: { position: 'static' } }, 'PRO')),
        clip ? h('button', { type: 'button', class: 'btn btn-sm btn-ghost', onclick: () => { delete q.video; touch(); draw(); } }, icon('trash', { size: 16 }), 'Remove video') : null,
      ].filter(Boolean));
    };
    draw();
    return row;
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
      h('div', { class: 'row', style: { gap: '18px' } }, pictureRow(q), videoRow(q)),
      ...body,
      h('div', { class: 'row', style: { gap: '18px', marginTop: '6px' } },
        h('label', { class: 'field' }, h('span', {}, 'Time limit'), timeSel),
        pointsSel ? h('div', { class: 'field' }, h('span', {}, 'Points'), pointsSel) : null));
  }

  /* ----------------------------------------------------- make with AI */

  // Quickzy writes the prompt; the person pastes it into any AI chatbot
  // and pastes the reply back. No account or key with any AI company needed.
  function makeWithAI() {
    return modal((close) => {
      const topic = input({ placeholder: 'e.g. Volcanoes, Fractions, The Romans', maxlength: 80, value: quiz.title || '' });
      let count = 10;
      let level = 'kids';
      const promptBox = h('textarea', { class: 'textarea ai-prompt', readonly: true, rows: 6, 'aria-label': 'Prompt for the AI' });
      const drawPrompt = () => { promptBox.value = aiPrompt({ topic: topic.value.trim() || 'a topic of your choice', count, level }); };
      topic.addEventListener('input', drawPrompt);
      drawPrompt();
      const reply = h('textarea', { class: 'textarea', rows: 7, placeholder: 'Paste the AI’s whole reply here' });
      const status = h('div', { class: 'ai-status' });
      const add = h('button', { class: 'btn btn-main', disabled: true }, icon('plus', { size: 18 }), 'Add to my quiz');
      let result = null;
      const read = () => {
        result = null;
        add.disabled = true;
        if (!reply.value.trim()) { fill(status); return; }
        try {
          result = readAIQuiz(reply.value);
          fill(status,
            h('p', { class: 'ai-ok' }, icon('check', { size: 18 }), `${result.questions.length} question${result.questions.length === 1 ? '' : 's'} ready`, result.title ? ` for "${result.title}"` : ''),
            result.skipped.length ? h('details', { class: 'ai-skipped' }, h('summary', {}, `${result.skipped.length} left out because they were not right`), h('ul', {}, ...result.skipped.map((t) => h('li', {}, t)))) : null);
          add.disabled = !result.questions.length;
        } catch (err) {
          fill(status, h('p', { class: 'error-text' }, err.message));
        }
      };
      reply.addEventListener('input', read);
      add.addEventListener('click', () => {
        if (!result) return;
        const onlyBlank = quiz.questions.length === 1 && !quiz.questions[0].text.trim();
        const room = LIMITS.questionsMax - (onlyBlank ? 0 : quiz.questions.length);
        const incoming = result.questions.slice(0, room);
        quiz.questions = onlyBlank ? incoming : [...quiz.questions, ...incoming];
        if (!quiz.title.trim() && result.title) { quiz.title = result.title; title.value = result.title; }
        if (!quiz.description && result.description) quiz.description = result.description;
        at = onlyBlank ? 0 : quiz.questions.length - incoming.length;
        touch(); drawEdit();
        toast(`Added ${incoming.length} questions. Check them, then save.`, 'ok');
        close(true);
      });
      return [
        h('h2', {}, 'Make a quiz with AI'),
        h('p', { class: 'muted', style: { margin: 0 } }, 'Use any AI chatbot. Quickzy writes the request for you; you paste back what it answers.'),
        h('ol', { class: 'ai-steps' },
          h('li', {}, h('b', {}, 'What is it about?'), topic,
            h('div', { class: 'row' },
              segmented([[5, '5'], [10, '10'], [15, '15'], [20, '20']], count, (v) => { count = v; drawPrompt(); }),
              segmented(LEVELS, level, (v) => { level = v; drawPrompt(); }))),
          h('li', {}, h('b', {}, 'Copy this and paste it into an AI chatbot'), promptBox,
            h('div', { class: 'row' },
              h('button', { class: 'btn btn-main btn-sm', onclick: () => copy(promptBox.value, 'Prompt copied') }, icon('copy', { size: 16 }), 'Copy prompt'),
              h('a', { class: 'btn btn-sm', href: 'https://chatgpt.com/', target: '_blank', rel: 'noopener' }, 'ChatGPT'),
              h('a', { class: 'btn btn-sm', href: 'https://claude.ai/new', target: '_blank', rel: 'noopener' }, 'Claude'),
              h('a', { class: 'btn btn-sm', href: 'https://gemini.google.com/', target: '_blank', rel: 'noopener' }, 'Gemini'))),
          h('li', {}, h('b', {}, 'Paste its reply here'), reply, status)),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'AI can make mistakes. Read the questions before you publish.'),
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'), add),
      ];
    }, { wide: true });
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
      const photo = h('input', { class: 'input', type: 'url', placeholder: 'https://… (a link to a real photo)', maxlength: 290, value: quiz.image || '' });
      return [h('h2', {}, 'Quiz details'),
        field('Description', desc, `${LIMITS.quizDescMax} characters at most. Helps people find it in Discover.`),
        h('div', { class: 'field' }, h('span', {}, 'Cover colour'), covers),
        field('Cover photo (optional)', photo, 'Paste a link to a photo (https). Free photo sites like Unsplash work well. It shows on Discover.'),
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close() }, 'Cancel'),
          h('button', { class: 'btn btn-main', onclick: () => {
            const link = photo.value.trim();
            if (link && !/^https:\/\/[^\s"'<>]{8,290}$/.test(link)) { toast('Use a photo link that starts with https://', 'bad'); return; }
            quiz.description = desc.value; quiz.cover = cover; quiz.image = link; touch(); close();
          } }, 'Done'))];
    });
  }

  /* ------------------------------------------------------------ page */

  drawList(); drawEdit(); drawStatus();
  if (query.ai) setTimeout(() => makeWithAI(), 60);

  const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', warn);
  const keys = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save.click(); }
  };
  document.addEventListener('keydown', keys);

  const el = h('div', { class: 'page wide' },
    h('div', { class: 'card row', style: { marginBottom: '18px', position: 'sticky', top: '70px', zIndex: 5, padding: '12px 14px' } },
      title, details, aiBtn,
      h('div', { class: 'row', style: { marginLeft: 'auto' } }, status, save, together, publishBox, host)),
    mine ? null : h('div', { class: 'card together-note' }, icon('users', { size: 18 }), `You are editing ${quiz.authorName || 'a friend'}'s quiz together. Your saves go straight into their quiz; they publish it.`),
    h('div', { class: 'editor' }, list, h('div', { class: 'card' }, edit)));

  // a video quiz: start by picking the first clip
  if (query.video && !quiz.id) {
    setTimeout(async () => {
      const plan = await myPlan();
      if (!plan.pro) { toast('Video clips are for Pro members.', 'bad'); return; }
      const v = await pickVideo(null);
      if (v) { quiz.questions[at].video = v; touch(); drawEdit(); }
    }, 300);
  }

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
