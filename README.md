# Malika Study

A maths lesson a day, for a seven-year-old. **malikastudy.web.app**

Sixteen lessons in order, each about five minutes. Built on the England
Year 3 programme of study (ages 7–8).

No account, no sign-in, no server. Everything lives in the browser on her
device, which is the whole of the privacy story: nothing about a child leaves
her tablet.

```
npm start     # http://localhost:5173
npm test      # every question, every level, 60 seeds each
```

## How a lesson works

Every lesson is the same three parts, and that order *is* the teaching:

1. **Learn** — the idea, said plainly, with a picture. Nothing to answer.
2. **Watch** — one worked example, uncovered a step at a time, so she sees
   somebody do it before she is asked to do it.
3. **Try** — a few questions of her own.

Being asked a question nobody showed you how to answer is a test, not a lesson.
The Learn and Watch parts are what make this teaching rather than quizzing.

In the Try part, a first wrong answer gets a nudge and another go. A second
shows the working and moves on. Nothing is marked wrong and left unexplained,
and anything she got wrong is shown again at the end with the reason.

Marking is generous about how an answer is written and strict about whether it
is right: `2/4` counts for `1/2`, `59p` for `£0.59`, `42.0` for `42` — and `41`
never counts for `42`.

## The path

There is always exactly one lesson that is next, and it is the biggest thing on
the screen with the only button on it. Finished lessons sit behind it with a
tick; the rest wait their turn. "Where do I start" has one answer.

## Reading it out

A speaker on every screen reads it aloud, with the maths rewritten for the ear:
`3/4` is read "three quarters", not "three slash four". There is a setting to
read everything automatically. A seven-year-old can do the maths in a word
problem long before she can read the words of it.

## How it is put together

```
src/lessons/index.js    the sixteen lessons: what to teach, and how
src/maths/topics.js     the curriculum behind them: 9 units, 39 skills
src/maths/gen/          a generator per skill — question, hint, explanation
src/maths/check.js      marking
src/visuals.js          the pictures: arrays, number lines, place value,
                        fraction bars, clocks, coins, charts
src/views/path.js       where she is and what is next
src/views/lesson.js     learn → watch → try
tests/maths.test.mjs    66k checks, run before every deploy
```

No build step and no dependencies. Plain ES modules, served as they are.
