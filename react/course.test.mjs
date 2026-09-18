// Every step's reference solution must run cleanly and pass its own check, and
// every starter must fail — otherwise a step is either impossible or already
// done before the learner types anything.

import { ALL_STEPS } from './course.js';
import { runSandboxed } from './sandbox.js';

let failures = 0;
const fail = (id, message) => {
  failures += 1;
  console.error(`  ✗ ${id}: ${message}`);
};

for (const step of ALL_STEPS) {
  const solved = runSandboxed(step.solution);
  if (!solved.ok) {
    fail(step.id, `the solution threw — ${solved.error}`);
    continue;
  }
  const problem = step.check({ logs: solved.logs.map((l) => l.text), code: step.solution });
  if (problem) fail(step.id, `the solution does not satisfy the check — "${problem}"`);

  const started = runSandboxed(step.starter);
  const starterProblem = started.ok
    ? step.check({ logs: started.logs.map((l) => l.text), code: step.starter })
    : 'starter threw';
  if (!starterProblem) fail(step.id, 'the starter already passes — there is nothing to do');

  if (!step.hint || !step.goal) fail(step.id, 'missing a hint or a goal');
}

// the loop guard has to actually stop a runaway
const runaway = runSandboxed('let n = 0;\nwhile (true) { n++; }');
if (runaway.ok) fail('sandbox', 'an infinite loop was not stopped');

if (failures) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log(`${ALL_STEPS.length} steps checked — every solution passes, every starter still needs work.`);
