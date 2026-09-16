# 🏔️ AkylduuKodo

**Learn to code the fun way.** An interactive, zero-dependency web app that teaches real
JavaScript through tiny lessons, blocks, bug hunts, a robot yak and an arcade.

![no build step](https://img.shields.io/badge/build-none-brightgreen) ![deps](https://img.shields.io/badge/dependencies-0-blue)

## Run it

```bash
npm start          # http://localhost:5173
npm test           # checks every lesson is solvable
```

No installs, no bundler — plain ES modules, one CSS file. (It needs a server because of
ES modules; `npm start` is a 40-line static server.)

## What's inside

**19 lessons across 5 units**, 97 steps — roughly 4 weeks at the default pace of
**5 lessons per week** (changeable to 3, 7, 10 or any number in Settings).

| Unit | What you learn |
| --- | --- |
| 🌱 First Words | `console.log`, strings, variables, numbers, template strings |
| 🔀 Making Choices | booleans, comparisons, `if / else if / else`, `&&` `\|\|` `!` |
| 🔁 Loops & Patterns | `for`, `while`, accumulators, nested loops, FizzBuzz, robot mazes |
| ⚒️ Your Own Commands | functions, parameters, `return`, composing small tools |
| 📦 Lists & Things | arrays, `for...of`, objects, and a final chaihana project |

### Seven kinds of step — so it never gets boring

- 📖 **Teach** — a short idea with a worked example, never a wall of text
- 🔮 **Predict** — what does this code print? (guess before you run)
- ❓ **Quiz** — concept checks with an explanation of *why*
- 🧵 **Order** — drag scrambled lines into a working program
- ⌨️ **Type** — retype a line exactly, character by character, for muscle memory
- 💻 **Code / 🐛 Bug** — write real code, or hunt a real bug, checked by real tests
- 🐃 **Robot** — drive Kodo the yak through a maze with `forward()`, `turnLeft()`, `collect()`
- 🌍 **Unplugged quests** — offline activities away from the screen (the sandwich
  algorithm, human booleans, looping your chores, teaching someone else)

### Blocks *or* typing

Steps that suit it have a **🧩 Blocks** tab: snap blocks together, edit their values, and
watch the real JavaScript appear live. Switch to **⌨️ Code** at any moment and the generated
code is already in the editor — the training wheels come off by themselves. Most of the
course is real typing, by design.

### Motivation that isn't fake

- ⚡ XP and 8 levels, from *Spark* to *Akyl Master*
- 🔥 Daily streak + a weekly goal ring (your pace, your choice)
- ⭐ Stars per lesson — peeking at the solution costs you stars, not progress
- 🏅 8 badges
- 🕹️ **Arcade**: Output Sprint (60s), Bug Hunt Blitz (75s), and 5-level Robot Maze where
  *shorter code scores higher*
- 🧪 **Playground**: a blank editor with example programs, saved in your browser

## How it is built

```
index.html            app shell
styles/main.css       all styling (dark + light, mobile-first)
src/runner.js         sandboxed code execution + friendly errors + infinite-loop guard
src/robot.js          the grid world, as pure logic + animation frames
src/editor.js         code editor (line numbers, auto-indent, Ctrl+Enter)
src/blocks.js         block workspace → JavaScript compiler
src/state.js          XP, streak, weekly goal, badges (localStorage)
src/i18n.js           UI in English + Kyrgyz
src/data/u1..u5.js    the curriculum
src/views/            home, journey, lesson, arcade, playground, settings
tests/                runs every reference solution through its own checker
```

**Safety rails for learners:** an infinite loop throws a friendly error instead of freezing
the tab; error messages get a 💡 hint appended; a checker that crashes on odd output says so
politely instead of pretending the program failed.

## Language

The app chrome speaks **English and Kyrgyz** (🇰🇬 Кыргызча) — switch in Settings. Lesson text
is English for now, but every lesson field accepts `{ en: "...", ky: "..." }` and falls back
to English automatically, so translating is drop-in:

```js
title: { en: 'Make It Talk', ky: 'Компьютерди сүйлөт' },
```

## Adding your own lesson

Add a step to any unit file in `src/data/`, then run `npm test` — it will refuse anything
that isn't solvable:

```js
{
  type: 'code',
  prompt: 'Print your name three times.',
  starter: '',
  hint: 'A loop is shorter than three lines.',
  solution: 'for (let i = 0; i < 3; i++) console.log("Bek");',
  check: (ctx) => ctx.logs.length === 3 || 'I expected three lines.',
}
```

Progress is stored only in the learner's browser — nothing is uploaded anywhere.
