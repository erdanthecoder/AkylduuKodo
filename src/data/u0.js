import { hasTag, tagSays, tagHasText, tagCountAtLeast, tagCountIs, hasAttr, styleHas, closesTags, includesText, attrValue } from './webchecks.js';
import { all } from './checks.js';

// The very first unit: one new idea per step, and every step shows the real
// page next to the code. Nothing here needs JavaScript — you type a tag and a
// web page appears, which is the fastest way to feel like a maker.

export default {
  id: 'u0',
  icon: 'globe',
  level: 'beginner',
  title: { en: 'Your First Web Page', ky: 'Биринчи веб барагың' },
  blurb: 'Type a line, watch a real page appear. No experience needed.',
  lessons: [
    {
      id: 'u0l1',
      icon: 'pencil',
      title: { en: 'Say Something Big', ky: 'Чоң сөз жаз' },
      minutes: 6,
      xp: 30,
      blurb: 'One tag. One line. A real web page.',
      steps: [
        {
          type: 'teach',
          title: 'A web page is just text with labels',
          text:
            'Web pages are written in **HTML**. You write your words, and put a small label around them so the browser knows what they are.\n\n' +
            'A label is called a **tag**. It has an opening and a closing part, and your text sits between them.',
          web: '<h1>Salam!</h1>',
          tip: 'The `/` in `</h1>` means "this is where it ends".',
        },
        {
          type: 'web',
          prompt: 'Change the words. Make the big title say **My page** instead of Salam.',
          starter: '<h1>Salam!</h1>',
          hint: 'Only change the words between <h1> and </h1>. Leave the tags alone.',
          solution: '<h1>My page</h1>',
          check: (ctx) => tagSays(ctx, 'h1', 'My page'),
        },
        {
          type: 'teach',
          title: 'h1 is the biggest title',
          text:
            'There are six title sizes: `h1` is the biggest and `h6` is the smallest. Most pages use `h1` once, at the top.',
          web: '<h1>Biggest</h1>\n<h2>Smaller</h2>\n<h3>Smaller still</h3>',
        },
        {
          type: 'web',
          prompt: 'Add a **second** title under the first one, using `h2`. Write anything you like in it.',
          starter: '<h1>My page</h1>\n',
          hint: 'On a new line, write: <h2>anything</h2>',
          solution: '<h1>My page</h1>\n<h2>Welcome</h2>',
          check: (ctx) => all(hasTag(ctx, 'h1'), hasTag(ctx, 'h2'), tagHasText(ctx, 'h2')),
        },
        {
          type: 'web',
          prompt:
            'Fix the broken page. One tag is not closed properly — the browser gets confused and shows everything as a giant title.',
          starter: '<h1>My shop\n<h2>Open today</h2>',
          hint: 'The first line opens <h1> but never closes it. Add </h1> at the end of that line.',
          solution: '<h1>My shop</h1>\n<h2>Open today</h2>',
          check: (ctx) => closesTags(ctx, ['h1', 'h2']),
        },
      ],
    },
    {
      id: 'u0l2',
      icon: 'book',
      title: { en: 'Words, Lists and Links', ky: 'Сөз, тизме, шилтеме' },
      minutes: 9,
      xp: 40,
      blurb: 'The three tags every page in the world uses.',
      steps: [
        {
          type: 'teach',
          title: 'p is for paragraph',
          text: 'Normal sentences go inside `p` tags. Each `p` starts on its own line.',
          web: '<h1>About me</h1>\n<p>I am learning to build web pages.</p>\n<p>This is my second sentence.</p>',
        },
        {
          type: 'web',
          prompt: 'Add a paragraph under the title. Write one sentence about yourself.',
          starter: '<h1>About me</h1>\n',
          hint: 'Write: <p>your sentence here</p>',
          solution: '<h1>About me</h1>\n<p>I am learning to code.</p>',
          check: (ctx) => all(hasTag(ctx, 'p'), tagHasText(ctx, 'p')),
        },
        {
          type: 'teach',
          title: 'A list needs two kinds of tag',
          text:
            '`ul` means "unordered list" — it draws the bullets. Each item inside goes in its own `li` tag.\n\n' +
            'Tags can live inside other tags. That is the whole idea behind HTML.',
          web: '<h2>My favourites</h2>\n<ul>\n  <li>Chai</li>\n  <li>Mountains</li>\n  <li>Code</li>\n</ul>',
          tip: 'Use `ol` instead of `ul` and you get 1, 2, 3 instead of bullets.',
        },
        {
          type: 'web',
          prompt: 'Make a list with **three** things you like. The `ul` is ready — add three `li` items inside it.',
          starter: '<h2>Things I like</h2>\n<ul>\n\n</ul>',
          hint: 'Between <ul> and </ul>, write three lines like: <li>Football</li>',
          solution: '<h2>Things I like</h2>\n<ul>\n  <li>Football</li>\n  <li>Music</li>\n  <li>Samsa</li>\n</ul>',
          check: (ctx) => all(hasTag(ctx, 'ul'), tagCountAtLeast(ctx, 'li', 3, 'Add three <li> items inside the list.')),
        },
        {
          type: 'teach',
          title: 'A link needs an address',
          text:
            'The `a` tag makes a link. The words between the tags are what people see; the `href` says where it goes.',
          web: '<p>Made in <a href="https://wikipedia.org/wiki/Kyrgyzstan">Kyrgyzstan</a></p>',
        },
        {
          type: 'web',
          prompt: 'Add a link to any website you like. Use `href` for the address.',
          starter: '<h2>My favourite site</h2>\n',
          hint: '<a href="https://example.com">Click here</a>',
          solution: '<h2>My favourite site</h2>\n<a href="https://wikipedia.org">Wikipedia</a>',
          check: (ctx) =>
            all(
              hasTag(ctx, 'a'),
              hasAttr(ctx, 'a', 'href'),
              (attrValue(ctx.html, 'a', 'href') || '').length > 3 || 'Put a real address inside href="...".',
              tagHasText(ctx, 'a'),
            ),
        },
      ],
    },
    {
      id: 'u0l3',
      icon: 'sparkle',
      title: { en: 'Colours and Style', ky: 'Түс жана стиль' },
      minutes: 10,
      xp: 45,
      blurb: 'Make it yours: colours, sizes, backgrounds.',
      steps: [
        {
          type: 'teach',
          title: 'CSS decides how things look',
          text:
            'HTML says *what* is on the page. **CSS** says how it looks. You write CSS inside a `style` tag.\n\n' +
            'You name the tag you want to change, then give it rules inside `{ }`.',
          web:
            '<style>\n  h1 { color: orange; }\n  p { color: gray; }\n</style>\n\n<h1>Orange title</h1>\n<p>Grey words under it.</p>',
          tip: 'Every rule ends with a semicolon, exactly like a line of JavaScript.',
        },
        {
          type: 'web',
          prompt: 'Make the title **blue**. The style block is ready — fill in the colour.',
          starter: '<style>\n  h1 { color: ; }\n</style>\n\n<h1>My page</h1>',
          hint: 'Write the colour name between the colon and the semicolon: color: blue;',
          solution: '<style>\n  h1 { color: blue; }\n</style>\n\n<h1>My page</h1>',
          check: (ctx) => all(styleHas(ctx, 'color'), includesText(ctx, 'blue', 'Use the colour blue for this one.')),
        },
        {
          type: 'teach',
          title: 'Backgrounds and sizes',
          text:
            '`background` paints behind an element, `font-size` changes how big the text is, and `text-align: center` puts it in the middle.\n\n' +
            '`body` means the whole page.',
          web:
            '<style>\n  body { background: #10152e; text-align: center; }\n  h1 { color: #ffd166; font-size: 44px; }\n</style>\n\n<h1>Big and centred</h1>',
          tip: 'Colours can be names like `orange`, or codes like `#ffd166`. The code lets you pick any shade.',
        },
        {
          type: 'web',
          prompt:
            'Style your own page. Give the `body` a background colour **and** centre the text.',
          starter: '<style>\n  body {\n    \n  }\n</style>\n\n<h1>My page</h1>\n<p>Welcome.</p>',
          hint: 'Inside body { }: background: pink; and on the next line text-align: center;',
          solution:
            '<style>\n  body {\n    background: pink;\n    text-align: center;\n  }\n</style>\n\n<h1>My page</h1>\n<p>Welcome.</p>',
          check: (ctx) => all(styleHas(ctx, 'background'), styleHas(ctx, 'text-align')),
        },
        {
          type: 'web',
          prompt:
            'One more: make the paragraph text bigger than normal, using `font-size`.',
          starter: '<style>\n  p { }\n</style>\n\n<p>Read me from across the room.</p>',
          hint: 'p { font-size: 30px; }',
          solution: '<style>\n  p { font-size: 30px; }\n</style>\n\n<p>Read me from across the room.</p>',
          check: (ctx) => styleHas(ctx, 'font-size'),
        },
      ],
    },
    {
      id: 'u0l4',
      icon: 'play',
      title: { en: 'A Button That Does Something', ky: 'Иштеген баскыч' },
      minutes: 11,
      xp: 55,
      blurb: 'Your page starts reacting to people.',
      steps: [
        {
          type: 'teach',
          title: 'A button on its own does nothing',
          text:
            'The `button` tag draws a button. Pressing it does nothing at all — until you give it something to do.\n\n' +
            'That is where JavaScript starts, and it is why the rest of this course exists.',
          web: '<button>Press me</button>',
        },
        {
          type: 'web',
          prompt: 'Put a button on the page. Write anything you like on it.',
          starter: '<h1>My page</h1>\n',
          hint: '<button>Press me</button>',
          solution: '<h1>My page</h1>\n<button>Press me</button>',
          check: (ctx) => all(hasTag(ctx, 'button'), tagHasText(ctx, 'button')),
        },
        {
          type: 'teach',
          title: 'onclick: what happens when it is pressed',
          text:
            '`onclick` holds one line of JavaScript. `alert("...")` pops up a message.\n\n' +
            'Press the button in the preview — it really works.',
          web: '<button onclick="alert(\'Salam!\')">Say hello</button>',
          tip: 'Notice the single quotes inside the double quotes. Two kinds of quote, so they do not collide.',
        },
        {
          type: 'web',
          prompt: 'Make your button show a message when it is pressed. Use `onclick` and `alert`.',
          starter: '<button>Press me</button>',
          hint: '<button onclick="alert(\'Hello!\')">Press me</button>',
          solution: '<button onclick="alert(\'Hello!\')">Press me</button>',
          check: (ctx) => all(hasTag(ctx, 'button'), hasAttr(ctx, 'button', 'onclick'), includesText(ctx, 'alert')),
        },
        {
          type: 'teach',
          title: 'Changing the page itself',
          text:
            'Every element can carry an `id`, which is a name. Once something has a name, JavaScript can find it and change it.\n\n' +
            'Read this slowly: find the thing called `title`, and set its text to "Changed!".',
          web:
            '<h1 id="title">Press the button</h1>\n<button onclick="document.getElementById(\'title\').textContent = \'Changed!\'">Change it</button>',
        },
        {
          type: 'web',
          prompt:
            'Final one. The heading has the id `title`. Make the button change its words when pressed.',
          starter:
            '<h1 id="title">Nothing yet</h1>\n<button onclick="">Change the title</button>',
          hint: 'Inside onclick=" ": document.getElementById(\'title\').textContent = \'It works!\'',
          solution:
            '<h1 id="title">Nothing yet</h1>\n<button onclick="document.getElementById(\'title\').textContent = \'It works!\'">Change the title</button>',
          check: (ctx) =>
            all(
              hasAttr(ctx, 'button', 'onclick'),
              includesText(ctx, 'getElementById', 'Use document.getElementById to find the heading.'),
              includesText(ctx, 'textContent', 'Set its textContent to the new words.'),
            ),
        },
      ],
    },
    {
      id: 'u0l5',
      icon: 'medal',
      title: { en: 'Project: Your Own Page', ky: 'Долбоор: Өз барагың' },
      minutes: 14,
      xp: 70,
      blurb: 'Everything so far, on one page you can show people.',
      steps: [
        {
          type: 'teach',
          title: 'Put the pieces together',
          text:
            'You now know six tags: `h1`, `h2`, `p`, `ul`/`li`, `a`, `button` — plus `style` for colours.\n\n' +
            'That is enough to build a real page about anything you like.',
          web:
            '<style>\n  body { background: #101a33; color: white; font-family: sans-serif; text-align: center; }\n  h1 { color: #ffd166; }\n  li { list-style: none; }\n</style>\n\n<h1>Aisuluu</h1>\n<p>Learning to build things.</p>\n<ul>\n  <li>Mountains</li>\n  <li>Music</li>\n</ul>\n<button onclick="alert(\'Salam!\')">Say hi</button>',
        },
        {
          type: 'web',
          prompt:
            'Build your page, step by step. Start with the top: a title with your name, and a sentence about you.',
          starter: '<h1></h1>\n<p></p>',
          hint: 'Write your name between <h1> and </h1>, and a sentence between <p> and </p>.',
          solution: '<h1>Aisuluu</h1>\n<p>I am learning to build web pages.</p>',
          check: (ctx) => all(tagHasText(ctx, 'h1'), tagHasText(ctx, 'p')),
        },
        {
          type: 'web',
          prompt: 'Now add a list of at least two things you like, under the sentence.',
          starter: '<h1>Aisuluu</h1>\n<p>I am learning to build web pages.</p>\n',
          hint: 'A <ul> with <li> items inside it.',
          solution:
            '<h1>Aisuluu</h1>\n<p>I am learning to build web pages.</p>\n<ul>\n  <li>Mountains</li>\n  <li>Music</li>\n</ul>',
          check: (ctx) => all(tagHasText(ctx, 'h1'), hasTag(ctx, 'ul'), tagCountAtLeast(ctx, 'li', 2)),
        },
        {
          type: 'web',
          prompt:
            'Finish it: add colours with a `style` block, and a button that says hello when pressed.\n\nThis is your page — make it look how you want.',
          starter:
            '<style>\n  body { }\n</style>\n\n<h1>Aisuluu</h1>\n<p>I am learning to build web pages.</p>\n<ul>\n  <li>Mountains</li>\n  <li>Music</li>\n</ul>\n',
          hint: 'Add background and color inside body { }, then a <button onclick="alert(\'hi\')">Say hi</button>',
          solution:
            '<style>\n  body { background: #101a33; color: white; text-align: center; }\n  h1 { color: #ffd166; }\n</style>\n\n<h1>Aisuluu</h1>\n<p>I am learning to build web pages.</p>\n<ul>\n  <li>Mountains</li>\n  <li>Music</li>\n</ul>\n<button onclick="alert(\'Salam!\')">Say hi</button>',
          check: (ctx) =>
            all(
              styleHas(ctx, 'background'),
              hasTag(ctx, 'button'),
              hasAttr(ctx, 'button', 'onclick'),
              tagCountAtLeast(ctx, 'li', 2),
            ),
        },
        {
          type: 'unplugged',
          title: 'Show someone',
          text:
            'Turn the screen around and show your page to somebody in the room. Ask them what they would add.\n\n' +
            'Then add it. Building for a real person, even one, is what turns practice into a habit.',
        },
      ],
    },
  ],
};
