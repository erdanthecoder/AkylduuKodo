# 🏔️ AkylduuKodo

**Learn programming, one clear step at a time.** An interactive, zero-dependency web app
that teaches real JavaScript through short lessons, guided practice and a weekly study goal.

Live at **[akylduukodo.web.app](https://akylduukodo.web.app)**

> **Named and worded for school networks.** There is no "game", "arcade" or "play" wording
> anywhere in the app, its URLs or its metadata — the timed exercises are *Practice Drills*
> and the sandbox is the *Code Lab*. It presents as what it is: a programming course.

![no build step](https://img.shields.io/badge/build-none-brightgreen) ![deps](https://img.shields.io/badge/dependencies-0-blue)

## Run it

```bash
npm start          # http://localhost:5173
npm test           # checks every lesson is solvable
```

No installs, no bundler — plain ES modules, one CSS file. (It needs a server because of
ES modules; `npm start` is a 40-line static server.)

## Deploying

The site is static — **no build step, nothing to compile**.

### Automatic (GitHub Actions)

`.github/workflows/deploy.yml` publishes to `akylduukodo.web.app` on every push to
`main` — so merging a pull request ships the site. It runs `npm test` first and refuses to
deploy if any lesson has become unsolvable.

It needs one repository secret, `FIREBASE_SERVICE_ACCOUNT_AKYLDUUKODO`, holding the JSON
key from Firebase → Project settings → Service accounts → Generate new private key. Unlike
the web config, **that JSON is a real secret** — it goes in GitHub Secrets, never in the repo.

### By hand (Firebase CLI)

```bash
npm i -g firebase-tools     # once
firebase login
firebase deploy             # uses firebase.json + .firebaserc in this repo
```

`firebase.json` is already set up: it serves the repo root, skips `tests/`, `server.mjs`
and the tooling files, and caches assets sensibly. `.firebaserc` points at the
`akylduukodo` project, so the deploy lands on `akylduukodo.web.app`.

### GitHub Pages (alternative)

Every asset path is relative and routing is hash-based (`#/lesson/u1l1`), so deep links
survive a reload with no rewrites. Publish the repo root — the artifact path is just `.`,
no build job. `.nojekyll` and `404.html` are already in place.

## Accounts and cloud save

Learners can work signed-out forever; signing in just makes progress follow them between
the school computer and home.

**To switch real accounts on**, paste your Firebase web config into `src/firebase-config.js`
(that file explains each step). Then in the Firebase console:

1. **Authentication → Sign-in method** → enable **Google** and **Email/Password**
2. **Authentication → Settings → Authorized domains** → add `akylduukodo.web.app`
3. **Firestore Database** → create it; the rules in `firestore.rules` (deployed with
   `firebase deploy`) let each learner read and write only their own row:

```
match /learners/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

A Firebase web config is **not a secret** — it is meant to be public. What protects the
data is those rules.

**Until the config is added**, the app runs in *device mode*: sign-up and sign-in work, but
accounts stay in that browser, and the sign-in screen says so plainly. Passwords in device
mode are never stored — only a salted SHA-256 hash.

Progress handling is built for shared computers: the first account created on a device
adopts whatever the signed-out learner had already done, and it is claimed exactly once, so
the next person to sign up starts from zero instead of inheriting a classmate's streak.
When a cloud account has progress on two devices, the two are merged and the further-along
value wins.

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
- 🎯 **Practice Drills**: Output Sprint (60s), Bug Hunt (75s), and 5-level Maze Logic where
  *shorter, smarter code scores higher*
- 🧪 **Code Lab**: a blank editor with example programs, saved in your browser

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
src/auth.js           accounts: Firebase (Google + email) or device fallback
src/anim.js           motion helpers, all reduced-motion aware
src/firebase-config.js  paste your Firebase config here to enable cloud accounts
src/views/            home, journey, lesson, practice, lab, account, settings
styles/animations.css the motion layer
tests/                runs every reference solution through its own checker
```

**Motion:** the interface animates throughout — an aurora background with drifting code
marks, staggered card entrances, scroll reveals, XP that counts up, a flickering streak
flame, springy buttons and nav, a breathing yak. All of it is switched off in one block for
anyone with `prefers-reduced-motion` set.

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
