# Malika Study

A short maths task every day, and a dashboard for whoever sets it.

- **malikastudy.web.app** — Malika's side. One task a day, three to ten minutes.
- **malikastudy.web.app/forteachersonly** — set the work, see how it went.

Built on the England Year 3 programme of study (ages 7–8): place value to 1000,
column addition and subtraction, the 3, 4 and 8 times tables, fractions to
tenths, measuring, perimeter, money, clocks, Roman numerals, shapes and charts.

No build step, no dependencies. Plain ES modules, served as they are.

```
npm start     # http://localhost:5173
npm test      # every generator, every level, 60 seeds each
```

## How a question goes

She answers. A first miss gets a nudge and another go. A second miss shows how
it works and moves on, because dwelling on it helps nobody. Nothing is marked
wrong and left unexplained, and the review at the end shows every question
again with the reason underneath.

Marking is generous about how an answer is written and strict about whether it
is right: `2/4` counts for `1/2`, `59p` counts for `£0.59`, `42.0` counts for
`42`, and `41` does not count for `42`.

## How it is put together

```
src/maths/topics.js     the curriculum: 9 units, 39 skills
src/maths/gen/          a generator per skill — question, hint, explanation
src/maths/task.js       turns "10 minutes on tenths" into a paper
src/maths/check.js      marking
src/views/              her three screens: today, the task, the review
src/teacher/            the dashboard, Google sign-in, Classroom
tests/maths.test.mjs    66k checks, run before every deploy
```

**A seed is a paper.** A task is generated from a seed, not stored question by
question, so the same assignment produces the same questions on every device —
which is how the dashboard can show exactly what she was given.

## Accounts

Malika has no Google account and does not need one. Her tablet signs in
anonymously and is tied to a family by a long random code that lives in the
link she opens once. Whoever sets the work signs in with Google, and their
email must already be on the family.

That makes the family code the one secret. Anyone holding it can read the
homework and send results — the right trade for a seven-year-old who should not
have to remember a password. What it cannot do is change the homework, so she
cannot set herself an easier task.

## Setting it up

See [docs/setup.md](docs/setup.md). Three things need doing once in the Firebase
console, and Google Classroom needs a little more.
