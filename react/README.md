# AkylduuKodoLesson

A step-by-step coding lesson in one React component: chapter sidebar, editable
code, a real runner, a console that types out what your code printed, and
gamified feedback when a step is solved.

Built with **React**, **Tailwind CSS**, **Framer Motion** and **lucide-react**.

```
react/
  AkylduuKodoLesson.jsx   the component (default export)
  course.js               the curriculum — 5 chapters, 13 steps of JavaScript
  sandbox.js              runs learner code and captures console output
  course.test.mjs         checks every solution passes and every starter does not
  preview.jsx             mounts it on a page (used by the build)
  preview.css             Tailwind entry for the preview
```

## Use it

```bash
npm i react framer-motion lucide-react
```

Tailwind v3 or v4 must already be set up in the host app. Then:

```jsx
import AkylduuKodoLesson from './AkylduuKodoLesson';

export default function App() {
  return <AkylduuKodoLesson onFinish={(stats) => console.log(stats)} />;
}
```

### Props

| prop | type | what it does |
| --- | --- | --- |
| `course` | `Chapter[]` | Replaces the built-in curriculum. Shape below. |
| `onFinish` | `({ steps, xp, runs }) => void` | Fired once every step is solved. |
| `className` | `string` | Appended to the root element. |

### Writing your own lessons

```js
{
  id: 'loops',
  title: 'Loops',
  blurb: 'Doing something many times.',
  steps: [
    {
      id: 'for',
      title: 'The counted loop',
      lede: 'One sentence under the heading.',
      body: ['Paragraphs. `code` and **bold** are supported.'],
      goal: 'What the learner has to make happen.',
      starter: 'for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}',
      solution: 'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}',
      hint: 'Shown when the Hint button is pressed.',
      // Return null when it is right, or a sentence saying what is missing.
      check: ({ logs, code }) => (logs.includes('5') ? null : 'Count all the way to 5.'),
    },
  ],
}
```

`check` gets the printed lines as strings and the learner's source. Returning a
**sentence rather than `false`** is the point: the learner is told what is still
missing, not just that they are wrong.

Run `node react/course.test.mjs` after editing a lesson. It runs every
`solution` through its own `check`, and asserts every `starter` still fails —
so a step can never be impossible, or already done before the learner types.

## The runner

`sandbox.js` executes the learner's JavaScript with `new Function`, a captured
`console`, and a tick injected into every loop that aborts after 200,000
iterations or 1.5 seconds. That is right for a teaching sandbox where the
learner is the only author. **Do not point it at code from strangers** — for
untrusted input, run it in a sandboxed iframe or a worker instead.

## Animation

Everything asked of Framer Motion, and nothing that fights a screen reader:

- step changes slide with `AnimatePresence` and a direction-aware `custom`
  prop — forwards slides in from the right, back from the left
- progress bars animate width with `{ duration: 0.5, ease: 'easeOut' }`
- buttons use `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.96 }}`
- console lines arrive one at a time and type themselves in
- the success toast and the completion modal are spring-driven

`useReducedMotion` is respected throughout: with "reduce motion" set, every
animation becomes an instant state change, including the typewriter.

## Keyboard

`←` / `→` move between steps (ignored while typing in the editor), and `Tab`
inserts two spaces in the editor rather than leaving it.
