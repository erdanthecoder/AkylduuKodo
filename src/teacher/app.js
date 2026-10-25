// app.js — the dashboard at /forteachersonly.
//
// Two jobs, and nothing else: set tomorrow's task, and see how the last one
// went. Everything on this page should lead to one of those.

import { h } from '../ui.js';
import * as auth from './auth.js';
import * as data from './data.js';
import * as classroom from './classroom.js';
import { UNITS, SKILL_BY_ID, TEACHING_ORDER } from '../maths/topics.js';
import { buildTask, questionCount, suggestSkills } from '../maths/task.js';

const root = document.getElementById('app');
let me = null;
let family = null;
let results = [];
let picture = {};

const show = (node) => { root.replaceChildren(node); window.scrollTo(0, 0); };
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ chrome */

function bar() {
  const top = document.getElementById('top');
  top.replaceChildren(...[
    h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, 'M'), 'Teacher dashboard'),
    me ? h('div', { class: 'row' },
      h('span', { class: 'who' }, me.email),
      h('button', { class: 'btn btn-quiet small', onclick: () => auth.signOut().then(() => location.reload()) }, 'Sign out'),
    ) : null,
  ].filter(Boolean));
}

function problem(message) {
  return h('div', { class: 'say say-bad' }, message);
}

/* ---------------------------------------------------------------- sign in */

function signInScreen(err) {
  return h('div', { class: 'wrap narrow' },
    h('div', { class: 'card middle' },
      h('h1', {}, 'For teachers only'),
      h('p', { class: 'muted' }, 'Sign in to set the work and see how it went. Malika never needs an account of her own.'),
      err ? problem(err) : null,
      h('button', {
        class: 'btn btn-go btn-big',
        onclick: async () => {
          try {
            await auth.signIn();
          } catch (e) {
            show(signInScreen(e.message === 'no-firebase'
              ? 'This site has no database set up yet, so the dashboard cannot sign in.'
              : `Sign-in did not finish: ${e.message}`));
          }
        },
      }, 'Sign in with Google'),
    ),
  );
}

/* ------------------------------------------------------- linking a family */

function familyScreen(err) {
  const nameBox = h('input', { class: 'field', value: 'Malika', 'aria-label': 'Her name' });
  const codeBox = h('input', { class: 'field', placeholder: 'paste a family code', 'aria-label': 'Family code' });
  return h('div', { class: 'wrap narrow' },
    h('div', { class: 'card' },
      h('h1', {}, 'Set up'),
      h('p', { class: 'muted' }, 'Make a family the first time. After that this dashboard remembers it.'),
      err ? problem(err) : null,
      h('label', { class: 'label' }, 'Her name', nameBox),
      h('button', {
        class: 'btn btn-go btn-big', onclick: async () => {
          try {
            family = await data.createFamily({ email: me.email, learnerName: nameBox.value.trim() || 'Malika' });
            dashboard();
          } catch (e) { show(familyScreen(e.message)); }
        },
      }, 'Make a family'),
      h('hr', { class: 'rule' }),
      h('label', { class: 'label' }, 'Or open one you already made', codeBox),
      h('button', {
        class: 'btn', onclick: async () => {
          try {
            family = await data.openFamily(codeBox.value.trim().toLowerCase(), me.email);
            dashboard();
          } catch (e) { show(familyScreen(e.message)); }
        },
      }, 'Open it'),
    ),
  );
}

/* ------------------------------------------------------------- dashboard */

let todaysAssignment = null;

async function dashboard() {
  bar();
  show(h('div', { class: 'wrap' }, h('p', { class: 'muted' }, 'Loading…')));
  try {
    results = await data.recentResults(family.id);
    picture = data.skillPicture(results);
    todaysAssignment = await data.getAssignment(family.id, today());
  } catch {
    results = [];
    picture = {};
    todaysAssignment = null;
  }
  show(h('div', { class: 'wrap' },
    h('div', { class: 'row spread head' },
      h('h1', {}, family.learnerName || 'Malika'),
      linkCard(),
    ),
    statusBar(),
    h('div', { class: 'cols' },
      h('div', {}, assignPanel()),
      h('div', {}, reviewPanel()),
    ),
  ));
}

/** Today, in one line: is there work, and has she done it? */
function statusBar() {
  const name = family.learnerName || 'she';
  const doneToday = results.some((r) => r.day === today());
  const set = Boolean(todaysAssignment);
  const state = doneToday ? 'done' : set ? 'waiting' : 'none';
  const says = {
    done: `${name} has finished today's task.`,
    waiting: 'Today is set. Not done yet.',
    none: 'Nothing set for today — she will get a task picked for her.',
  };
  return h('div', { class: `status is-${state}` },
    h('span', { class: 'status-dot' }),
    h('span', {}, says[state]),
    set ? h('span', { class: 'muted small' },
      ` ${todaysAssignment.minutes} min · ${(todaysAssignment.skills || []).length} topic${(todaysAssignment.skills || []).length === 1 ? '' : 's'}`) : null,
  );
}

/** The link that puts her tablet on this family. No typing, no password. */
function linkCard() {
  const url = `${location.origin}/?family=${family.id}`;
  return h('div', { class: 'linkcard' },
    h('small', {}, 'Her link — open this once on her tablet'),
    h('div', { class: 'row' },
      h('code', { class: 'code' }, url),
      h('button', {
        class: 'btn btn-quiet small',
        onclick: (e) => {
          navigator.clipboard?.writeText(url);
          e.target.textContent = 'Copied';
          setTimeout(() => { e.target.textContent = 'Copy'; }, 1400);
        },
      }, 'Copy'),
    ),
  );
}

/* ----------------------------------------------------------- setting work */

function assignPanel() {
  let chosen = suggestSkills(Object.fromEntries(
    Object.entries(picture).map(([id, row]) => [id, { accuracy: row.accuracy }]),
  ));
  let minutes = 5;
  let when = addDays(1);
  const note = h('textarea', { class: 'field', rows: 2, placeholder: 'A note for her (optional)' });
  const preview = h('div', { class: 'preview' });
  const chips = h('div', { class: 'chips' });
  const status = h('div', {});

  function drawChips() {
    chips.replaceChildren(...chosen.map((s) =>
      h('button', {
        class: 'chip chip-on',
        title: 'Take this one off',
        onclick: () => { chosen = chosen.filter((x) => x.id !== s.id); drawChips(); drawPreview(); },
      }, SKILL_BY_ID.get(s.id)?.name || s.id, ' ×'),
    ));
    if (!chosen.length) chips.append(h('span', { class: 'muted small' }, 'Pick at least one thing below.'));
  }

  function drawPreview() {
    if (!chosen.length) return preview.replaceChildren();
    const task = buildTask({ skills: chosen, minutes, seed: when });
    preview.replaceChildren(
      h('p', { class: 'label' }, `What she will get — ${task.questions.length} questions`),
      h('ol', { class: 'qlist' },
        ...task.questions.slice(0, 6).map((q) =>
          h('li', {}, q.prompt, h('span', { class: 'ans' }, ` ${q.answer}`)),
        ),
        task.questions.length > 6 ? h('li', { class: 'muted' }, `…and ${task.questions.length - 6} more`) : null,
      ),
    );
  }

  const picker = h('div', { class: 'picker' },
    ...UNITS.map((unit) =>
      h('details', {},
        h('summary', {}, unit.name),
        h('div', { class: 'chips' },
          ...unit.skills.map((skill) => {
            const row = picture[skill.id];
            return h('button', {
              class: 'chip',
              onclick: () => {
                if (chosen.some((x) => x.id === skill.id)) return;
                chosen = [...chosen, { id: skill.id, level: row && row.accuracy > 0.85 ? 3 : row ? 2 : 1 }];
                drawChips(); drawPreview();
              },
            },
            skill.name,
            row ? h('span', { class: 'pct' }, ` ${Math.round(row.accuracy * 100)}%`) : null);
          }),
        ),
      ),
    ),
  );

  const minuteRow = h('div', { class: 'row' },
    ...[3, 5, 10].map((m) =>
      h('button', {
        class: 'chip' + (m === minutes ? ' chip-on' : ''),
        onclick: (e) => {
          minutes = m;
          [...minuteRow.children].forEach((c, i) => c.className = 'chip' + ([3, 5, 10][i] === m ? ' chip-on' : ''));
          drawPreview();
        },
      }, `${m} min`),
    ),
  );

  const dayBox = h('input', { class: 'field', type: 'date', value: when, onchange: (e) => { when = e.target.value; drawPreview(); } });

  drawChips();
  drawPreview();

  return h('section', { class: 'card' },
    h('h2', {}, 'Set a task'),
    h('label', { class: 'label' }, 'For which day', dayBox),
    h('p', { class: 'label' }, 'How long'),
    minuteRow,
    h('p', { class: 'label' }, 'What to practise'),
    chips,
    picker,
    note,
    preview,
    status,
    h('div', { class: 'row' },
      h('button', {
        class: 'btn btn-go', onclick: async () => {
          if (!chosen.length) return status.replaceChildren(problem('Pick at least one thing to practise.'));
          try {
            await data.setAssignment(family.id, when, {
              skills: chosen, minutes, note: note.value.trim() || null, by: me.email,
            });
            status.replaceChildren(h('div', { class: 'say say-yes' }, `Set for ${when}.`));
          } catch (e) {
            status.replaceChildren(problem(`Could not save it: ${e.message}`));
          }
        },
      }, 'Set it'),
      h('button', {
        class: 'btn btn-quiet', onclick: () => classroomPanel({ when, minutes, chosen, status }),
      }, 'Also put in Classroom'),
    ),
  );
}

/* ------------------------------------------------------------- classroom */

async function classroomPanel({ when, status }) {
  status.replaceChildren(h('p', { class: 'muted' }, 'Connecting to Classroom…'));
  try {
    if (!auth.hasClassroom()) await auth.signIn({ withClassroom: true });
    const list = await classroom.courses();
    if (!list.length) {
      return status.replaceChildren(problem('No active courses where you are the teacher.'));
    }
    const pick = h('select', { class: 'field' }, ...list.map((c) => h('option', { value: c.id }, c.name)));
    status.replaceChildren(
      h('div', { class: 'card inner' },
        h('p', { class: 'label' }, 'Which course'),
        pick,
        h('button', {
          class: 'btn btn-go', onclick: async () => {
            try {
              const work = await classroom.postAssignment({
                courseId: pick.value,
                day: when,
                title: `Maths — ${when}`,
                description: 'Open the link and finish today\'s maths.',
                link: `${location.origin}/?family=${family.id}`,
                dueAt: when,
              });
              await data.setAssignment(family.id, when, {
                classroom: { courseId: pick.value, courseWorkId: work.id },
              });
              status.replaceChildren(h('div', { class: 'say say-yes' }, 'Posted to Classroom.'));
            } catch (e) {
              status.replaceChildren(problem(`Classroom said no: ${e.message}`));
            }
          },
        }, 'Post it'),
        h('p', { class: 'muted small' },
          'Only works for a course you teach. Homework set by her school cannot be handed in by any app — ',
          h('a', { href: classroom.shareLink(`${location.origin}/?family=${family.id}`, 'Maths task'), target: '_blank', rel: 'noopener' }, 'share the link instead'),
          '.'),
      ),
    );
  } catch (e) {
    status.replaceChildren(problem(`Classroom is not connected: ${e.message}`));
  }
}

/* ------------------------------------------------------------- how she did */

function reviewPanel() {
  if (!results.length) {
    return h('section', { class: 'card' },
      h('h2', {}, 'How she is doing'),
      h('p', { class: 'muted' }, 'Nothing yet. Once she finishes a task it shows up here, question by question.'),
    );
  }

  const weakest = Object.entries(picture)
    .filter(([, row]) => row.asked >= 3)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 4);

  return h('section', { class: 'card' },
    h('h2', {}, 'How she is doing'),

    weakest.length ? h('div', {},
      h('p', { class: 'label' }, 'Worth another look'),
      h('div', { class: 'bars' },
        ...weakest.map(([id, row]) =>
          h('div', { class: 'barrow' },
            h('span', { class: 'barname' }, SKILL_BY_ID.get(id)?.name || id),
            h('span', { class: 'bartrack' },
              (() => {
                // under 60% needs work now; 60-80% is on its way
                const fill = h('span', { class: 'barfill' + (row.accuracy < 0.6 ? ' is-low' : row.accuracy < 0.8 ? ' is-fair' : '') });
                fill.style.width = `${Math.round(row.accuracy * 100)}%`;
                return fill;
              })(),
            ),
            h('span', { class: 'barpct' }, `${Math.round(row.accuracy * 100)}%`),
          ),
        ),
      ),
    ) : null,

    h('p', { class: 'label' }, 'Last few days'),
    ...results.slice(0, 6).map((result) => {
      const wrong = (result.answers || []).filter((a) => !a.right);
      return h('details', { class: 'day' },
        h('summary', {},
          h('strong', {}, result.day),
          h('span', { class: 'muted' }, ` ${result.right}/${result.asked}`),
          wrong.length ? h('span', { class: 'flag' }, `${wrong.length} to look at`) : h('span', { class: 'tick' }, 'all right'),
        ),
        h('ul', { class: 'qlist' },
          ...(result.answers || []).map((a) =>
            h('li', { class: a.right ? '' : 'is-wrong' },
              a.prompt,
              !a.right ? h('span', { class: 'ans' }, ` she put ${a.given}`) : null,
              a.right && a.tries > 1 ? h('span', { class: 'muted' }, ' (second go)') : null,
            ),
          ),
        ),
      );
    }),
  );
}

/* ------------------------------------------------------------------ start */

async function boot() {
  bar();
  try {
    await auth.onUser(async (user) => {
      me = user;
      bar();
      if (!user) return show(signInScreen());
      try {
        family = await data.findFamilyFor(user.email);
      } catch {
        family = null;
      }
      if (!family) return show(familyScreen());
      dashboard();
    });
  } catch (e) {
    show(signInScreen(e.message === 'no-firebase'
      ? 'This site has no database set up yet.'
      : e.message));
  }
}

boot();
