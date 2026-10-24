// maths.test.mjs — every question must be answerable, markable and explained.
//
// The generators are random, so this runs each of them many times with many
// seeds. A question that is wrong one time in fifty is a question that will be
// wrong in front of a child.

import { UNITS, SKILLS, TEACHING_ORDER, SKILL_BY_ID } from '../src/maths/topics.js';
import { GENERATORS } from '../src/maths/index.js';
import { buildTask, questionCount, suggestSkills } from '../src/maths/task.js';
import { check, response } from '../src/maths/check.js';
import { rng, words, money, clockWords } from '../src/maths/kit.js';

let pass = 0;
const fails = [];

function ok(cond, what) {
  if (cond === true) pass += 1;
  else fails.push(`${what}: ${cond === false ? 'failed' : cond}`);
}

/* ------------------------------------------------------------ the shape of it */

ok(UNITS.length >= 8 || `only ${UNITS.length} units`, 'units');
SKILLS.forEach((s) => {
  ok(Boolean(GENERATORS[s.id]) || 'no generator', `skill ${s.id} has a generator`);
  ok(s.says.length > 10 || 'no child-facing sentence', `skill ${s.id} says`);
  ok((s.levels >= 1 && s.levels <= 3) || `levels ${s.levels}`, `skill ${s.id} levels`);
});
ok(TEACHING_ORDER.length === SKILLS.length || `${TEACHING_ORDER.length} vs ${SKILLS.length}`, 'teaching order covers every skill');
ok(new Set(TEACHING_ORDER).size === TEACHING_ORDER.length || 'duplicate in order', 'teaching order has no repeats');

/* ------------------------------------------------- every question, many times */

const SEEDS = 60;
for (const skill of SKILLS) {
  const gen = GENERATORS[skill.id];
  for (let level = 1; level <= skill.levels; level++) {
    for (let s = 0; s < SEEDS; s++) {
      const q = gen(rng(s * 7919 + level * 131 + skill.id.length), level);
      const at = `${skill.id} L${level} seed ${s}`;

      ok((typeof q.prompt === 'string' && q.prompt.length > 3) || 'no prompt', `${at} prompt`);
      ok((typeof q.answer === 'string' && q.answer.length > 0) || 'no answer', `${at} answer`);
      ok(Boolean(q.why) || 'no explanation', `${at} why`);
      ok(Boolean(q.hint) || 'no hint', `${at} hint`);

      // the explanation must not be the bare answer with nothing taught
      ok(q.why.length > q.answer.length + 6 || 'explanation says nothing', `${at} why teaches`);

      // its own answer must mark as right
      ok(check(q, q.answer).right || `own answer rejected (${q.answer})`, `${at} marks itself`);

      // a wrong answer must mark as wrong
      const wrong = /^\d+$/.test(q.answer) ? String(Number(q.answer) + 1) : 'banana';
      ok(check(q, wrong).right === false || `accepted "${wrong}"`, `${at} rejects wrong`);
      ok(check(q, '').right === false || 'accepted empty', `${at} rejects empty`);

      if (q.kind === 'choice') {
        ok(Array.isArray(q.choices) && q.choices.length >= 2 || 'needs choices', `${at} choices`);
        ok(q.choices.includes(q.answer) || `answer "${q.answer}" not among choices`, `${at} answer is offered`);
        ok(new Set(q.choices).size === q.choices.length || 'duplicate choices', `${at} choices differ`);
      }
      if (q.kind === 'number') {
        ok(/^-?\d+$/.test(q.answer) || `"${q.answer}" is not a whole number`, `${at} whole-number answer`);
        ok(Number(q.answer) >= 0 || 'negative answer', `${at} not negative`);
      }
      if (q.kind === 'fraction') {
        ok(/^\d+\/\d+$/.test(q.answer) || `"${q.answer}" is not a fraction`, `${at} fraction answer`);
        const [t, b] = q.answer.split('/').map(Number);
        ok(t <= b || `${q.answer} is more than one whole`, `${at} within one whole`);
      }
      // nothing in Year 3 should ask for a number past 1000 as the answer
      // mass and length legitimately run past 1000 in their own units (4500 ml)
      if (q.kind === 'number' && !['mass-capacity', 'length'].includes(skill.id)) {
        ok(Number(q.answer) <= 1000 || `answer ${q.answer} is past 1000`, `${at} stays in range`);
      }
    }
  }
}

/* ----------------------------------------------------------------- the marking */

const sample = { kind: 'number', answer: '42', why: 'because', hint: 'try' };
ok(check(sample, ' 42 ').right === true || 'spaces broke it', 'marking trims spaces');
ok(check(sample, '42.0').right === true || 'decimal form rejected', 'marking reads 42.0 as 42');
ok(check(sample, '41').right === false || 'accepted 41', 'marking rejects a near miss');
ok(check(sample, '41').note === 'one-out' || 'no near-miss note', 'marking spots one out');

const fr = { kind: 'fraction', answer: '1/2', why: 'because', hint: 'try' };
ok(check(fr, '2/4').right === true || 'equivalent fraction rejected', 'marking accepts 2/4 for 1/2');
ok(check(fr, '1 / 2').right === true || 'spaces broke the fraction', 'marking tidies fractions');
ok(check(fr, '1/3').right === false || 'accepted 1/3', 'marking rejects the wrong fraction');

const mo = { kind: 'money', answer: '0.59', prefix: '£', why: 'because', hint: 'try' };
ok(check(mo, '0.59').right === true || 'pounds rejected', 'money in pounds');
ok(check(mo, '£0.59').right === true || 'pound sign rejected', 'money with a sign');
ok(check(mo, '59').right === true || 'pence rejected', 'money typed as pence');
ok(check(mo, '59p').right === true || 'pence with p rejected', 'money with a p');
ok(check(mo, '58').right === false || 'accepted 58p', 'money rejects the wrong amount');

const od = { kind: 'order', answer: '120,340,560', why: 'because', hint: 'try' };
ok(check(od, '120, 340, 560').right === true || 'spacing broke it', 'order ignores spacing');
ok(check(od, '560,340,120').right === false || 'accepted backwards', 'order must be right way round');

/* -------------------------------------------------------------------- the task */

ok(questionCount(3) >= 4 || 'three minutes is too few', 'a 3 minute task is worth doing');
ok(questionCount(10) <= 18 || 'ten minutes is too many', 'a 10 minute task is not a slog');

const spec = { skills: [{ id: 'table-4', level: 2 }, { id: 'tenths', level: 1 }], minutes: 5, seed: 'test-seed' };
const t1 = buildTask(spec);
const t2 = buildTask(spec);
ok(t1.questions.length === questionCount(5) || `got ${t1.questions.length}`, 'task is the right length');
ok(JSON.stringify(t1.questions) === JSON.stringify(t2.questions) || 'same seed gave a different paper', 'a seed is a paper');
ok(t1.questions.every((q) => q.n && q.skillName) || 'question missing its label', 'questions are numbered and named');
const usedSkills = new Set(t1.questions.map((q) => q.skill));
ok(usedSkills.size === 2 || `used ${usedSkills.size} skills`, 'every chosen skill is used');

// a task of one skill must not repeat itself when there is room not to
const solo = buildTask({ skills: [{ id: 'table-8', level: 3 }], minutes: 5, seed: 'solo' });
const prompts = solo.questions.map((q) => q.prompt);
ok(new Set(prompts).size === prompts.length || 'a question repeated', 'no repeats inside one task');

let threw = false;
try { buildTask({ skills: [], minutes: 5, seed: 'x' }); } catch { threw = true; }
ok(threw || 'built a task with no skills', 'an empty task is refused');

const fresh = suggestSkills({});
ok(fresh.length === 3 || `${fresh.length} suggested`, 'a new learner gets three things');
ok(fresh[0].id === TEACHING_ORDER[0] || `started at ${fresh[0].id}`, 'a new learner starts at the beginning');
const weak = suggestSkills({ 'count-steps': { accuracy: 0.4 }, 'read-write': { accuracy: 0.95 } });
ok(weak.some((s) => s.id === 'count-steps') || 'the weak skill was not revisited', 'the weakest skill comes back');

/* ------------------------------------------------------------------- the words */

ok(words(367) === 'three hundred and sixty-seven' || words(367), 'numbers into words');
ok(words(405) === 'four hundred and five' || words(405), 'words skip an empty tens');
ok(money(7) === '7p' && money(345) === '£3.45' || `${money(7)} ${money(345)}`, 'money reads properly');
ok(clockWords(3, 45) === 'quarter to 4' || clockWords(3, 45), 'quarter to the next hour');
ok(clockWords(12, 50) === '10 minutes to 1' || clockWords(12, 50), 'midnight rolls to one');

/* -------------------------------------------------------------------- feedback */

const q = GENERATORS['table-4'](rng(1), 2);
ok(response(q, '0', true) === q.hint || 'first try did not hint', 'a first miss gets a nudge');
ok(response(q, '0', false) === q.why || 'second try did not explain', 'a second miss gets the reason');

/* ----------------------------------------------------------------------- report */

console.log(`\n${pass} checks passed`);
if (fails.length) {
  console.log(`\n${fails.length} FAILED:`);
  fails.slice(0, 25).forEach((f) => console.log('   - ' + f));
  if (fails.length > 25) console.log(`   ...and ${fails.length - 25} more`);
  process.exit(1);
}
console.log(`${SKILLS.length} skills across ${UNITS.length} units — every question answerable and explained.\n`);
