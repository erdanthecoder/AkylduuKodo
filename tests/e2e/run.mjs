// run.mjs — the whole thing, end to end, in real browsers against dev/server.mjs.
//
//   node dev/server.mjs &      then      node tests/e2e/run.mjs [classic|arcade|all]
//
// A host signs up, builds a quiz in the editor, publishes it and hosts it;
// two players join with the PIN and play. Fails loudly on any page error.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS || '/tmp/quickzy-shots';
mkdirSync(SHOTS, { recursive: true });
const which = process.argv[2] || 'all';

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];
let step = '';
const watch = (page, who) => {
  page.on('pageerror', (e) => errors.push(`[${who}] ${step}: ${e.message}`));
  page.on('console', (m) => {
    // a refused read or write is a failure even where the app carries on
    // the deliberate wrong password answers 400; that one is expected
    if (step.startsWith('change password') && /status of 400/.test(m.text())) return;
    if (m.type() === 'error' || /permission|refused|denied/i.test(m.text())) errors.push(`[${who}] ${step}: ${m.text().slice(0, 300)}`);
  });
};
const say = (s) => { step = s; console.log(`- ${s}`); };
const fail = (why) => { throw new Error(`${step}: ${why}`); };

await fetch(`${BASE}/__dev/reset-all`, { method: 'POST' });
if (process.env.EMULATOR === '1') {
  // a clean slate in every emulator
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/akylduukodo/accounts', { method: 'DELETE' });
  await fetch('http://127.0.0.1:8080/emulator/v1/projects/akylduukodo/databases/(default)/documents', { method: 'DELETE' });
  await fetch('http://127.0.0.1:9000/.json?ns=akylduukodo-default-rtdb', { method: 'PUT', body: 'null', headers: { Authorization: 'Bearer owner' } });
}

// EMULATOR=1 plays against the Firebase emulators instead: the real SDK and
// the real security rules (firebase emulators:start --only auth,firestore,database)
const EMULATOR = process.env.EMULATOR === '1';

async function newPage(who, viewport = { width: 1280, height: 800 }) {
  const ctx = await browser.newContext({ viewport, hasTouch: who !== 'host' && viewport.width < 600 });
  if (EMULATOR) await ctx.addInitScript(() => sessionStorage.setItem('quickzy.emulator', '1'));
  // the free Pro test is switched off here, so the free plan gets tested too
  await ctx.addInitScript(() => localStorage.setItem('quickzy.test.noTrial', '1'));
  const page = await ctx.newPage();
  watch(page, who);
  return page;
}

/* ---------------------------------------------------------- the host */

const host = await newPage('host');
say('sign up');
await host.goto(`${BASE}/signup`);
await host.fill('input[type=email]', 'host@example.com');
const pw = host.locator('input[type=password]');
await pw.nth(0).fill('Correct-Horse-9');
await pw.nth(1).fill('Correct-Horse-9');
await host.check('input[type=checkbox]');
await host.click('button:has-text("Create account")');
await host.waitForURL(/\/settings\?welcome=1/);
await host.waitForSelector('text=Welcome to Quickzy');

say('pick a username');
const user = host.locator('label.field:has-text("Username") input');
await user.fill('quizmaster');
await host.click('button:has-text("Save profile")');
await host.waitForSelector('text=Profile saved');

say('build a quiz in the editor');
await host.goto(`${BASE}/create`);
await host.fill('input[aria-label="Quiz title"]', 'Space and Science');
await host.fill('textarea.q-text', 'Which planet is the largest?');
const opts = host.locator('.opt input[type=text]');
for (const [i, t] of ['Mars', 'Jupiter', 'Venus', 'Mercury'].entries()) await opts.nth(i).fill(t);
await host.locator('.opt .mark').nth(1).click();

async function addQuestion(label) {
  await host.click('button:has-text("Add question")');
  await host.click(`.modal button:has-text("${label}")`);
}
await addQuestion('True or false');
await host.fill('textarea.q-text', 'The Sun is a star.');
await host.locator('.opt-grid button:has-text("True")').click();

await addQuestion('Type the answer');
await host.fill('textarea.q-text', 'What gas do plants breathe in?');
await host.locator('.q-edit input.input').first().fill('Carbon dioxide');
await host.click('button:has-text("Accept another answer")');
await host.locator('.q-edit input.input').nth(1).fill('CO2');

await addQuestion('Number');
await host.fill('textarea.q-text', 'How many planets are in the Solar System?');
await host.locator('.q-edit input[type=number]').first().fill('8');

await addQuestion('Pick all that apply');
await host.fill('textarea.q-text', 'Which of these are mammals?');
for (const [i, t] of ['Whale', 'Shark', 'Bat', 'Frog'].entries()) await host.locator('.opt input[type=text]').nth(i).fill(t);
await host.locator('.opt .mark').nth(2).click();     // Whale is marked already, add Bat

await addQuestion('Put in order');
await host.fill('textarea.q-text', 'Order from smallest to largest');
for (const [i, t] of ['Atom', 'Cell', 'Mouse'].entries()) await host.locator('.opt input[type=text]').nth(i).fill(t);

await addQuestion('Poll');
await host.fill('textarea.q-text', 'Favourite planet?');
for (const [i, t] of ['Saturn', 'Earth'].entries()) await host.locator('.opt input[type=text]').nth(i).fill(t);
await host.locator('.opt .x').nth(3).click();
await host.locator('.opt .x').nth(2).click();
await host.screenshot({ path: `${SHOTS}/editor.png` });

say('publish (free account): sent for checking, not live yet');
await host.click('button:has-text("Publish")');
await host.waitForSelector('text=Sent for checking', { timeout: 8000 }).catch(async () => {
  const issues = await host.locator('.modal').innerText().catch(() => '');
  fail(`free publish did not go to review ${issues}`);
});
await host.click('button:has-text("Unpublish")');
await host.waitForSelector('text=Unpublished');

say('publish (Pro): live at once');
// the owner would give Pro from the Owner panel; the test sets it directly
await host.evaluate(async () => {
  const { net, session } = window.__quickzy;
  const uid = session.me().uid;
  await net.store.set('members', uid, { plan: 'pro', since: Date.now(), until: Date.now() + 864e8 });
  (await import('/src/services/plan.js')).forget(uid);
});
await host.click('button:has-text("Publish")');
await host.waitForSelector('text=Published. Anyone can find', { timeout: 8000 }).catch(async () => {
  const issues = await host.locator('.modal').innerText().catch(() => '');
  fail(`did not publish ${issues}`);
});
const quizId = host.url().split('/edit/')[1];
if (!quizId) fail('no quiz id in the address');

say('make it together: invite by username');
await host.click('button:has-text("Together")');
await host.waitForSelector('.modal:has-text("Make it together")');
await host.fill('.modal input[placeholder="Their username"]', 'nobody_here_42');
await host.click('.modal button:has-text("Invite")');
await host.waitForSelector('.modal .error-text:has-text("Nobody has that username")');
await host.click('.modal button:has-text("Done")');

say('discover finds it');
await host.goto(`${BASE}/discover?q=planet`);
await host.waitForSelector('.quiz-card:has-text("Space and Science") >> visible=true');

/* ------------------------------------------------------------- games */

async function openLobby(modeName, extra) {
  await host.goto(`${BASE}/host/${quizId}`);
  await host.click(`.mode-opt:has-text("${modeName}")`);
  if (extra) await extra();
  await host.click('button:has-text("Open the lobby")');
  await host.waitForURL(/\/lobby\/\d{6}/);
  await host.waitForSelector('.pin-box');
  return host.url().match(/lobby\/(\d{6})/)[1];
}

async function join(pin, name, viewport) {
  const p = await newPage(name, viewport);
  await p.goto(`${BASE}/join`);
  await p.fill('input[aria-label="Game PIN"]', pin);
  await p.waitForURL(new RegExp(`/join/${pin}`));
  await p.fill('input[aria-label="Nickname"]', name);
  await p.click('button:has-text("Join")');
  await p.waitForURL(new RegExp(`/play/${pin}`));
  await p.waitForSelector('text=You’re in!');
  return p;
}

async function answer(p, right) {
  // whatever the question type, give an answer (right or wrong on purpose)
  const pad = p.locator('.pad').first();
  await pad.waitFor({ timeout: 15000 });
  const cls = await pad.getAttribute('class');
  if (/pad-(mc|poll|tf)/.test(cls)) {
    const text = await p.locator('.q-text-play').innerText();
    const pick = { 'Which planet is the largest?': 'Jupiter', 'The Sun is a star.': 'True' }[text];
    const btn = right && pick ? p.locator(`.pad-btn:has-text("${pick}")`) : p.locator('.pad-btn').last();
    await btn.click();
  } else if (/pad-multi/.test(cls)) {
    if (right) { await p.click('.pad-btn:has-text("Whale")'); await p.click('.pad-btn:has-text("Bat")'); } else await p.click('.pad-btn:has-text("Shark")');
    await p.click('.pad-submit');
  } else if (/pad-order/.test(cls)) {
    for (const t of right ? ['Atom', 'Cell', 'Mouse'] : ['Mouse', 'Cell', 'Atom']) await p.click(`.order-item:has-text("${t}")`);
    await p.click('.pad-submit');
  } else if (/pad-type/.test(cls)) {
    await p.fill('.pad input', right ? 'carbon-dioxide!' : 'oxygen');
    await p.click('.pad-submit');
  } else if (/pad-number/.test(cls)) {
    await p.fill('.pad input', right ? '8' : '9');
    await p.click('.pad-submit');
  }
}

if (which === 'classic' || which === 'all') {
  say('classic: open the lobby');
  const pin = await openLobby('Classic', () => host.click('.set-row:has-text("Speed scoring") button:has-text("Faster = more")'));
  const ana = await join(pin, 'Ana', { width: 390, height: 780 });
  const ben = await join(pin, 'Ben', { width: 390, height: 780 });
  await host.waitForSelector('.player-chip:has-text("Ana")');
  await host.waitForSelector('.player-chip:has-text("Ben")');
  await host.screenshot({ path: `${SHOTS}/lobby.png` });

  say('classic: a rude nickname is refused');
  const rude = await newPage('rude', { width: 390, height: 780 });
  await rude.goto(`${BASE}/join/${pin}`);
  await rude.fill('input[aria-label="Nickname"]', 'Sh1t');
  await rude.click('button:has-text("Join")');
  await rude.waitForSelector('text=Pick a different nickname.');
  await rude.close();

  say('classic: start');
  await host.click('button:has-text("Start")');
  for (let q = 0; q < 7; q++) {
    say(`classic: question ${q + 1}`);
    await ana.waitForSelector('.pad', { timeout: 15000 }).catch(async (e) => {
      await host.screenshot({ path: `${SHOTS}/fail-host.png` });
      await ana.screenshot({ path: `${SHOTS}/fail-ana.png` });
      console.log('host:', (await host.locator('body').innerText()).slice(0, 300));
      console.log('ana:', (await ana.locator('body').innerText()).slice(0, 300));
      console.log(errors.join('\n'));
      throw e;
    });
    if (q === 0) await host.screenshot({ path: `${SHOTS}/question.png` });
    if (q === 0) await ana.screenshot({ path: `${SHOTS}/player-question.png` });
    await answer(ana, true);
    await answer(ben, false);
    await host.waitForSelector('.reveal-sum', { timeout: 15000 });
    await ana.waitForSelector('.verdict');
    const v = await ana.locator('.verdict h2').innerText();
    const isPoll = q === 6;
    if (!isPoll && v !== 'Correct') fail(`Ana should be right, saw "${v}"`);
    if (!isPoll && (await ben.locator('.verdict h2').innerText()) !== 'Not quite') fail('Ben should be wrong');
    if (q === 0) { await host.screenshot({ path: `${SHOTS}/reveal.png` }); await ana.screenshot({ path: `${SHOTS}/player-right.png` }); await ben.screenshot({ path: `${SHOTS}/player-wrong.png` }); }
    await host.click('.host-foot button.btn-main');
    await host.waitForSelector('.board');
    if (q === 0) await host.screenshot({ path: `${SHOTS}/board.png` });
    await host.click('.host-foot button.btn-main');
  }
  say('classic: podium');
  await host.waitForSelector('.podium');
  await host.waitForTimeout(1600);
  await host.screenshot({ path: `${SHOTS}/podium.png` });
  const first = await host.locator('.step.s1 .name').innerText();
  if (first !== 'Ana') fail(`Ana should win, ${first} did`);
  await ana.waitForSelector('.play-screen.is-end');
  await ana.screenshot({ path: `${SHOTS}/player-end.png` });
  const anaScore = await host.locator('.results tbody tr:first-child td:nth-child(3)').innerText();
  console.log(`  Ana scored ${anaScore}`);
  await ana.context().close();
  await ben.context().close();
}

if (which === 'teams' || which === 'classic' || which === 'all') {
  say('teams: two teams in the lobby');
  const pin = await openLobby('Robot Run', async () => {
    await host.click('.set-row:has-text("Team mode") button:has-text("2 teams")');
    await host.click('.set-row:has-text("Game length") button:has-text("3 min")');
  });
  const cara = await join(pin, 'Cara', { width: 390, height: 780 });
  const dan = await join(pin, 'Dan', { width: 390, height: 780 });
  await host.waitForFunction(() => document.querySelectorAll('.team-col').length === 2
    && [...document.querySelectorAll('.team-col')].every((c) => c.querySelectorAll('.team-chip').length === 1));
  await cara.waitForSelector('.lobby-team .team-badge');
  await host.screenshot({ path: `${SHOTS}/teams-lobby.png` });
  await cara.screenshot({ path: `${SHOTS}/teams-player.png` });

  say('teams: the race shows team scores, and a team wins');
  await host.click('button:has-text("Start")');
  await host.waitForFunction(() => document.querySelectorAll('.side-teams .team-bar').length === 2, null, { timeout: 15000 });
  await host.click('button:has-text("End now")');
  await host.click('.modal button:has-text("End game")');
  await host.waitForSelector('.team-win');
  await cara.waitForSelector('.play-screen.is-end .team-badge');
  await host.waitForTimeout(1500);
  await host.screenshot({ path: `${SHOTS}/teams-end.png` });
  await cara.context().close();
  await dan.context().close();
}

if (which === 'arcade' || which === 'all') {
  for (const [mode, name] of (process.env.ONLY ? process.env.ONLY.split(',').map((m, i) => [m, process.env.ONLY_NAME.split(',')[i]]) : null) || [['lasertag', 'Laser Tag'], ['robotrun', 'Robot Run'], ['spacecraft', 'Spacecraft'], ['obby', 'Sky Climb'], ['defense', 'Tower Defense'], ['skyrace', 'Sky Race'], ['treasure', 'Treasure Hunt'], ['fishing', 'Fishing Frenzy'], ['candy', 'Candy Factory']]) {
    say(`${mode}: open the lobby`);
    if (mode === 'skyrace') await host.evaluate(() => localStorage.setItem('quickzy.test.early', '1'));
    const pin = await openLobby(name, () => (mode === 'skyrace' ? host.waitForSelector('.set-row:has-text("Game length") .pill:has-text("3 min")') : host.click('.set-row:has-text("Game length") button:has-text("3 min")')));
    const cara = await join(pin, 'Cara', { width: 390, height: 780 });
    const dev = await join(pin, 'Dev', { width: 900, height: 600 });
    await host.click('button:has-text("Start")');
    say(`${mode}: countdown and play`);
    await cara.waitForSelector('.hud', { timeout: 15000 });
    await dev.waitForSelector('.hud', { timeout: 15000 });
    await cara.waitForTimeout(800);
    // play a little: move, act, and answer a question through the overlay
    await dev.keyboard.down('ArrowRight');
    for (let i = 0; i < 6; i++) { await dev.keyboard.press('Space'); await dev.waitForTimeout(250); }
    await dev.keyboard.up('ArrowRight');
    await dev.mouse.click(700, 300);
    await dev.waitForTimeout(600);
    // open questions directly rather than playing until a meter runs out.
    // Each player gets their own random order, and a poll scores nothing by
    // design, so keep going until one scoring question has been answered.
    const ask = async (p) => {
      await p.waitForSelector('.q-overlay[hidden]', { state: 'attached', timeout: 10000 });
      await p.evaluate(() => { if (window.__quickzyAsk) window.__quickzyAsk(); });
      await p.waitForSelector('.q-overlay:not([hidden]) .pad', { timeout: 5000 });
      await answer(p, true);
      await p.waitForSelector('.verdict', { timeout: 10000 });
      return p.locator('.verdict h2').innerText();
    };
    await ask(dev);
    let verdictText = '';
    for (let tries = 0; tries < 4 && verdictText !== 'Correct'; tries++) {
      verdictText = await ask(cara);
      if (tries === 0) await cara.screenshot({ path: `${SHOTS}/${mode}-player-answer.png` });
    }
    if (verdictText !== 'Correct') fail(`Cara answered right but saw "${verdictText}"`);
    await cara.waitForSelector('.q-overlay[hidden]', { state: 'attached', timeout: 10000 });
    // the score arrives with the host's next update, once a second
    await cara.waitForFunction(() => Number(document.querySelectorAll('.hud-cell')[2].innerText.replace(/\D/g, '')) > 0, null, { timeout: 8000 })
      .catch(() => fail('Cara should have points after a right answer'));
    await cara.screenshot({ path: `${SHOTS}/${mode}-player.png` });
    await dev.screenshot({ path: `${SHOTS}/${mode}-player-wide.png` });
    if (mode === 'obby') {
      say('obby: every world draws, up to the summit');
      for (const n of [20, 37, 52, 67, 82, 90]) {
        await dev.evaluate((k) => window.__quickzyClimb(k), n);
        await dev.waitForTimeout(400);
        await dev.screenshot({ path: `${SHOTS}/obby-level-${n}.png` });
      }
    }
    if (mode === 'skyrace') {
      say('skyrace: charge and press BOOST');
      await dev.evaluate(() => window.__quickzySky.give());
      await dev.click('.sr-boost.is-ready', { force: true });
      await dev.waitForTimeout(1500);
      const st = await dev.evaluate(() => window.__quickzySky.state());
      if (st.used !== 1) fail(`boost not used: ${JSON.stringify(st)}`);
      await dev.screenshot({ path: `${SHOTS}/skyrace-boost.png` });
      await cara.waitForTimeout(6000);
      await cara.screenshot({ path: `${SHOTS}/skyrace-jets.png` });
    }
    if (mode === 'treasure') {
      say('treasure: open a chest');
      await cara.evaluate(() => window.__quickzyTreasure.give());
      await cara.click('.th-chest >> nth=1');
      await cara.waitForSelector('.th-prize, .th-pick:not([hidden])', { timeout: 10000 });
      await cara.screenshot({ path: `${SHOTS}/treasure-chest.png` });
    }
    if (mode === 'fishing') {
      say('fishing: cast and reel in');
      await cara.evaluate(() => window.__quickzyFishing.give());
      await cara.click('.fi-btn');
      await cara.waitForFunction(() => window.__quickzyFishing.state() === 'bite', null, { timeout: 8000 });
      await cara.screenshot({ path: `${SHOTS}/fishing-bite.png` });
      await cara.click('.fi-btn');
      await cara.waitForFunction(() => window.__quickzyFishing.state() === 'idle', null, { timeout: 8000 });
      await cara.waitForTimeout(400);
      await cara.screenshot({ path: `${SHOTS}/fishing-catch.png` });
    }
    if (mode === 'candy') {
      say('candy: buy a machine and make candy');
      await cara.waitForSelector('.cf-machine:not([disabled])', { timeout: 10000 });
      await cara.click('.cf-machine:not([disabled]) >> nth=0');
      await cara.waitForFunction(() => /[1-9]\d* candy a second/.test(document.querySelector('.cf-top').innerText), null, { timeout: 8000 })
        .catch(() => fail('candy: buying a machine did not raise the rate'));
      await cara.screenshot({ path: `${SHOTS}/candy.png` });
    }
    await host.screenshot({ path: `${SHOTS}/${mode}-host.png` });
    say(`${mode}: end`);
    await host.click('button:has-text("End now")');
    await host.click('.modal button:has-text("End game")');
    await host.waitForSelector('.podium');
    await cara.waitForSelector('.play-screen.is-end', { timeout: 10000 });
    await host.screenshot({ path: `${SHOTS}/${mode}-podium.png` });
    await cara.context().close();
    await dev.context().close();
  }
}

if (['all', 'classic', 'arcade'].includes(which)) {
  say('the quiz counts its plays');
  await host.goto(`${BASE}/quiz/${quizId}`);
  await host.waitForSelector('text=/[1-9]\\d* plays?/');

  say('library has the reports');
  await host.goto(`${BASE}/library?tab=reports`);
  await host.waitForSelector('.lib-row');
}

if ((which === 'owner' || which === 'all') && !EMULATOR) {
  say('owner: sign up with the owner account');
  const own = await newPage('owner');
  await own.goto(`${BASE}/`);
  const made = await own.evaluate(async () => {
    const r = await fetch('/__dev/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.com', password: 'Owner-pass-42', uid: 'KWIRRSUM2VQVWnr1nUDbPP9bqMk2' }) });
    const d = await r.json();
    localStorage.setItem('quickzy.dev.token', d.token);
    return d.user && d.user.uid;
  });
  if (made !== 'KWIRRSUM2VQVWnr1nUDbPP9bqMk2') fail(`owner account not created: ${made}`);
  await own.goto(`${BASE}/settings`);
  await own.waitForSelector('text=Your badges');

  say('owner: choose which badges to wear');
  for (const name of ['Kyrgyzstan', 'Trusted quiz maker']) {
    await own.locator('.set-row', { hasText: name }).locator('.switch').click();
  }
  await own.waitForSelector('text=Badges saved');
  await own.goto(`${BASE}/settings`);
  await own.waitForFunction(() => document.querySelectorAll('.set-hero .badge-set .verified').length === 3);
  await own.screenshot({ path: `${SHOTS}/owner-badges.png` });

  say('owner: the Owner link and panel');
  await own.click('.nav-owner');
  await own.waitForSelector('.owner-stat b:not(:text("…"))');
  await own.waitForSelector('.owner-row:has-text("Space and Science")').catch(() => {});

  say('owner: feature a quiz, it shows on Discover');
  const quizRow = own.locator('.owner-row').first();
  const title = await quizRow.locator('b').first().innerText();
  await quizRow.locator('button:has-text("Feature")').click();
  await own.waitForSelector('.owner-row button:has-text("Featured")');
  await own.goto(`${BASE}/discover`);
  await own.waitForSelector(`text=Picked by the owner`);
  await own.waitForSelector(`.shelf .quiz-title:has-text("${title}")`);

  say('owner: announcement shows for everyone');
  await own.goto(`${BASE}/owner`);
  await own.click('.seg button:has-text("Announcement")');
  await own.fill('textarea', 'Quiz night on Friday!');
  await own.click('button:has-text("Show to everyone")');
  await own.waitForSelector('text=Announcement saved');
  const visitor = await newPage('visitor');
  await visitor.goto(`${BASE}/`);
  await visitor.waitForSelector('.announce:has-text("Quiz night on Friday!")');
  await visitor.click('.announce-x');
  await visitor.reload();
  await visitor.waitForTimeout(800);
  if (await visitor.locator('.announce:not([hidden])').count()) fail('dismissed announcement came back');

  say('owner: a countdown ticks on every page, then celebrates');
  await own.fill('input[placeholder^="e.g. Quickzy 1.2"]', 'Quickzy 1.2 lands in');
  await own.evaluate(() => {
    const d = new Date(Date.now() + 3 * 60000);
    const p = (n) => String(n).padStart(2, '0');
    const el = document.querySelector('input[type="datetime-local"]');
    el.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  });
  await own.click('button:has-text("Start countdown")');
  await own.waitForSelector('text=Countdown started for everyone');
  await visitor.reload();
  await visitor.waitForSelector('.count-bar:has-text("Quickzy 1.2 lands in")');
  await visitor.screenshot({ path: `${SHOTS}/countdown.png` });
  await own.click('button:has-text("Remove countdown")');
  await own.waitForSelector('text=Countdown removed');
  await visitor.context().close();

  say('owner: players tab, give coins and a blue check');
  await own.click('.seg button:has-text("Players")');
  await own.waitForSelector('.owner-row');
  await own.screenshot({ path: `${SHOTS}/owner-players.png` });
  // the owner's own row has no blue-check or ban buttons
  await own.waitForSelector('.owner-row:has-text("@owner")');
  if (await own.locator('.owner-row:has-text("@owner") button:has-text("blue check"):visible').count()) fail('owner row offers a blue check');
  const other = own.locator('.owner-row').filter({ hasText: '@quizmaster' }).first();
  {
    await other.locator('button:has-text("Give coins")').click();
    await own.fill('.modal input[type=number]', '250');
    await own.click('.modal button:has-text("Give")');
    await own.waitForSelector('text=Gave host 250 coins');
    await other.locator('button:has-text("Give blue check")').click();
    await other.locator('button:has-text("Remove blue check")').waitFor();
    // and take it back, so the earned-badge test later starts clean
    await other.locator('button:has-text("Remove blue check")').click();
    await other.locator('button:has-text("Give blue check")').waitFor();
  }
  await own.click('.seg button:has-text("Quizzes")');
  await own.waitForSelector('.owner-row');
  await own.screenshot({ path: `${SHOTS}/owner-panel.png`, fullPage: true });

  say('owner: nobody else can open the panel');
  const stranger = await newPage('stranger');
  await stranger.goto(`${BASE}/owner`);
  await stranger.waitForURL(/\/login/);
  await stranger.context().close();

  say('channels: follow a creator, see the count and the feed');
  await host.goto(`${BASE}/`);
  const hostChannel = await host.locator('.me-chip').getAttribute('href');
  await own.goto(`${BASE}${hostChannel}`);
  await own.waitForSelector('.profile .follow-btn:has-text("Follow")');
  const before = Number(await own.locator('.profile-stats b[data-n]').first().getAttribute('data-n'));
  await own.click('.follow-btn');
  await own.waitForSelector('.follow-btn:has-text("Following")');
  await own.reload();
  await own.waitForSelector('.follow-btn:has-text("Following")');
  const after = Number(await own.locator('.profile-stats b[data-n]').first().getAttribute('data-n'));
  if (after !== before + 1) fail(`followers ${before} -> ${after}`);
  await own.goto(`${BASE}/channels`);
  await own.waitForSelector('text=New from channels you follow');
  await own.waitForSelector(`.channel-card[href="${hostChannel}"]`);
  await own.screenshot({ path: `${SHOTS}/channels.png`, fullPage: true });
  await own.goto(`${BASE}${hostChannel}`);
  await own.click('.follow-btn');
  await own.waitForSelector('.follow-btn:has-text("Follow"):not(:has-text("Following"))');

  say('owner: a special event shows for everyone');
  await own.goto(`${BASE}/owner`);
  await own.click('.seg button:has-text("Events")');
  await own.click('.event-pick:has-text("Double Coins")');
  await own.click('button:has-text("Start event")');
  await own.waitForSelector('.event-bar:has-text("Double Coins")');
  await host.goto(`${BASE}/`);
  await host.waitForSelector('.event-bar:has-text("left")');
  await host.screenshot({ path: `${SHOTS}/event-bar.png` });

  say('owner: admin abuse lands on another screen');
  await own.goto(`${BASE}/owner`);
  await own.click('.seg button:has-text("Admin abuse")');
  await own.fill('input[placeholder^="Message"]', 'Hello from the owner');
  await own.click('.abuse-btn.is-message');
  await host.waitForSelector('.abuse-msg:has-text("Hello from the owner")');
  await host.screenshot({ path: `${SHOTS}/abuse-message.png` });
  const coinsBefore = await host.evaluate(async () => (await import('/src/services/progress.js')).me().coins);
  await own.click('.abuse-btn.is-coins');
  await host.waitForFunction(async (b) => (await import('/src/services/progress.js')).me().coins === b + 50, coinsBefore, { timeout: 8000 });

  await own.click('.seg button:has-text("Events")');
  await own.click('button:has-text("Stop event")');
  await own.waitForSelector('.event-bar', { state: 'hidden' });
  await own.click('.seg button:has-text("Events")');
  await own.waitForSelector('text=No event running');

  say('channels: a creator can turn their channel off');
  await host.goto(`${BASE}/settings`);
  await host.locator('.set-row', { hasText: 'Have a channel' }).locator('.switch').click();
  await host.waitForSelector('text=Your channel is off');
  await own.goto(`${BASE}${hostChannel}`);
  await own.waitForSelector('.profile h1');
  if (await own.locator('.follow-btn').count()) fail('follow button shown for a profile with no channel');
  await host.goto(`${BASE}/settings`);
  await host.locator('.set-row', { hasText: 'Have a channel' }).locator('.switch').click();
  await host.waitForSelector('text=Your channel is on');
  await own.context().close();
}

if (which === 'invite' || which === 'all') {
  say('teachers: the classroom page');
  await host.goto(`${BASE}/teachers`);
  await host.waitForSelector('text=Your first game in two minutes');
  await host.screenshot({ path: `${SHOTS}/teachers.png`, fullPage: true });

  say('invite: a friend joins with my link, we both get rewards');
  const inviter = await host.evaluate(() => window.__quickzy.session.me().uid);
  const coins0 = await host.evaluate(async () => (await window.__quickzy.session.reloadProfile()).coins || 0);
  const pal = await newPage('pal', { width: 390, height: 800 });
  await pal.goto(`${BASE}/?ref=${inviter}`);
  await pal.goto(`${BASE}/signup`);
  await pal.fill('input[type=email]', 'pal@example.com');
  const ppw = pal.locator('input[type=password]');
  await ppw.nth(0).fill('Friendly-Pass-7');
  await ppw.nth(1).fill('Friendly-Pass-7');
  await pal.check('input[type=checkbox]');
  await pal.click('button:has-text("Create account")');
  await pal.waitForSelector('text=A gift from your friend!', { timeout: 15000 });
  await pal.screenshot({ path: `${SHOTS}/invite-friend.png` });
  await host.goto(`${BASE}/`);
  await host.waitForSelector('.modal >> text=joined!', { timeout: 15000 });
  await host.screenshot({ path: `${SHOTS}/invite-inviter.png` });
  const after = await host.evaluate(async () => { const p = await window.__quickzy.session.reloadProfile(); return { coins: p.coins || 0, buddy: Boolean(p.owned && p.owned.buddy) }; });
  if (after.coins < coins0 + 150 || !after.buddy) fail(`inviter reward missing: ${JSON.stringify(after)} from ${coins0}`);
  await pal.context().close();

  say('homework: set a quiz as homework and see the results page');
  await host.goto(`${BASE}/quiz/${quizId}`);
  await host.click('button:has-text("Set as homework")');
  await host.click('.modal button:has-text("1 week")');
  await host.click('.modal button:has-text("Set homework")');
  await host.waitForURL(/\/hw\//);
  await host.waitForSelector('text=Copy link for students');
  await host.waitForSelector('text=Nobody has handed it in yet');
  await host.screenshot({ path: `${SHOTS}/homework.png` });
  await host.goto(`${BASE}/homework`);
  await host.waitForSelector('.hw-row');
}

if (which === 'account' || which === 'all') {
  say('kick a player from the lobby');
  const pin = await openLobby('Classic');
  const eve = await join(pin, 'Eve', { width: 390, height: 780 });
  await host.click('.player-chip:has-text("Eve")');
  await host.click('.modal button:has-text("Remove")');
  await eve.waitForSelector('text=The host removed you from this game.');
  await eve.goto(`${BASE}/join/${pin}`);
  await eve.waitForSelector('text=The host removed you from this game.');
  await eve.context().close();
  await host.click('button:has-text("Cancel game")');
  await host.click('.modal button:has-text("Cancel game")');
  await host.waitForURL(/\/library/);

  say('rename: quizzes follow the new name');
  await host.goto(`${BASE}/settings`);
  const name = host.locator('label.field:has-text("Display name") input');
  await name.fill('Professor Q');
  await host.click('.blook-pick[aria-label="Kit"]');
  await host.click('button:has-text("Save profile")');
  await host.waitForSelector('text=Profile saved');
  await host.waitForTimeout(1500);
  await host.goto(`${BASE}/quiz/${quizId}`);
  await host.waitForSelector('.author:has-text("Professor Q")');

  say('Pro members wear the gold PRO badge');
  await host.goto(`${BASE}/u/quizmaster`);
  await host.waitForSelector('.profile-name .verified.is-pro');
  await host.evaluate(async () => {
    const { net, session } = window.__quickzy;
    await net.store.del('members', session.me().uid);
    (await import('/src/services/plan.js')).forget(session.me().uid);
  });

  say('verified badge after three full published quizzes');
  await host.goto(`${BASE}/u/quizmaster`);
  await host.waitForSelector('h1:has-text("Professor Q")');
  if (await host.locator('.profile-name .verified').count()) fail('verified too early');
  await host.evaluate(async (id) => {
    const q = await import('/src/services/quizzes.js');
    const full = await q.loadForEditing(id);
    for (const t of ['Copy one', 'Copy two']) await q.saveQuiz({ ...full, id: null, title: t }, { publish: true });
  }, quizId);
  await host.goto(`${BASE}/u/quizmaster`);
  await host.waitForSelector('.profile-name .verified');
  await host.waitForSelector('.quiz-card .verified');

  say('make with AI: paste a chatbot reply, get a quiz');
  await host.goto(`${BASE}/library`);
  await host.click('a:has-text("Make with AI")');
  await host.waitForSelector('.modal .ai-prompt');
  await host.fill('.modal input', 'Volcanoes');
  if (!(await host.locator('.modal .ai-prompt').inputValue()).includes('Volcanoes')) fail('prompt does not name the topic');
  const reply = 'Sure! Here is your quiz:\n```json\n' + JSON.stringify({
    title: 'Volcano Facts', description: 'Hot stuff.',
    questions: [
      { type: 'mc', question: 'What comes out of a volcano?', options: ['Lava', 'Snow', 'Sand', 'Milk'], answer: 'A' },
      { type: 'tf', question: 'Mount Fuji is in Japan.', answer: true },
      { type: 'multi', question: 'Which are volcanoes?', options: ['Etna', 'Everest', 'Vesuvius', 'K2'], answers: [0, 2] },
      { type: 'type', question: 'Molten rock underground is called?', accept: ['magma'] },
      { type: 'order', question: 'Order by size, smallest first', items: ['Pebble', 'Boulder', 'Mountain'] },
      { type: 'number', question: 'How many continents are there?', answer: 7 },
      { type: 'mc', question: 'Broken one', options: ['a', 'b'], answer: 9 },
    ],
  }, null, 2) + '\n```\nHope you enjoy it!';
  await host.fill('.modal textarea:not([readonly])', reply);
  await host.waitForSelector('.modal .ai-ok:has-text("6 questions ready")');
  await host.waitForSelector('.modal .ai-skipped:has-text("1 left out")');
  await host.screenshot({ path: `${SHOTS}/make-with-ai.png` });
  await host.click('.modal button:has-text("Add to my quiz")');
  await host.waitForSelector('text=Added 6 questions');
  if ((await host.locator('.q-thumb').count()) !== 6) fail('expected 6 questions in the editor');
  if ((await host.inputValue('input[aria-label="Quiz title"]')) !== 'Volcano Facts') fail('title not filled in');
  await host.click('button:has-text("Publish")');
  // the account is free again by now: its quiz goes to the 3-5 day check
  await host.waitForSelector('text=Sent for checking');

  say('solo practice: play a whole quiz alone');
  await host.goto(`${BASE}/practice/${quizId}`);
  await host.click('button:has-text("Start")');
  for (let i = 0; i < 12; i++) {
    const next = await Promise.race([
      host.waitForSelector('.solo-q .pad', { timeout: 15000 }).then(() => 'q'),
      host.waitForSelector('.big-score', { timeout: 15000 }).then(() => 'end'),
    ]);
    if (next === 'end') break;
    if (i === 0) await host.screenshot({ path: `${SHOTS}/solo-question.png` });
    await answer(host, true);
    await host.waitForSelector('.play-screen.is-verdict');
    await host.click('.play-screen button:has-text("Next")');
  }
  await host.waitForSelector('.big-score');
  await host.waitForSelector('.review li');
  await host.screenshot({ path: `${SHOTS}/solo-end.png`, fullPage: true });

  say('blooks: open boxes with starting coins');
  await host.goto(`${BASE}/blooks`);
  await host.waitForSelector('.level-badge');
  // starting coins plus the solo reward: open boxes until the coins run out
  const boxBtn = host.locator('.box-card:has-text("Quickzy Box") button');
  let opened = 0;
  while (!(await boxBtn.isDisabled()) && opened < 40) {
    await boxBtn.click();
    for (let t = 0; t < 3; t++) { await host.click('.ub-stage'); await host.waitForTimeout(120); }
    await host.waitForSelector('.ub-card', { timeout: 15000 });
    if (opened === 0) await host.screenshot({ path: `${SHOTS}/box-reveal.png` });
    await host.click('.ub-result button:has-text("Done")');
    await host.waitForSelector('.ub-root', { state: 'detached' });
    opened++;
  }
  if (opened < 2) fail(`only ${opened} boxes opened`);
  if (!(await boxBtn.isDisabled())) fail('should be out of coins');

  say('blooks: a game reward levels you up and opens a custom slot');
  await host.evaluate(async () => {
    const p = await import('/src/services/progress.js');
    await p.claimGame('test:1', { s: 20000, c: 10, r: 1 }, 5);
  });
  await host.goto(`${BASE}/blooks`);
  // solo play above earned XP too, so the level is at least 3
  await host.waitForFunction(() => Number(document.querySelector('.level-badge b')?.textContent) >= 3);
  await host.click('button.bcard.is-slot');
  await host.click('.modal .part-btn:has-text("happy")');
  await host.locator('.modal .part-btn').first().click();
  await host.click('.modal button:has-text("Save blook")');
  await host.waitForSelector('text=Custom blook saved');
  await host.screenshot({ path: `${SHOTS}/blooks-page.png`, fullPage: true });
  await host.click('.card-grid .stack button:has-text("Use")');
  await host.waitForSelector('text=is now your blook');

  say('change password, sign out, sign back in');
  await host.goto(`${BASE}/settings`);
  await host.click('button:has-text("Change")');
  const pws = host.locator('.modal input[type=password]');
  await pws.nth(0).fill('Correct-Horse-9');
  await pws.nth(1).fill('Battery-Staple-42');
  await host.click('.modal button:has-text("Change password")');
  await host.waitForSelector('text=Password changed');
  await host.click('button:has-text("Sign out")');
  await host.waitForURL(`${BASE}/`);
  await host.goto(`${BASE}/login`);
  await host.fill('input[type=email]', 'host@example.com');
  await host.fill('input[type=password]', 'Correct-Horse-9');
  await host.click('form button[type=submit]');
  await host.waitForSelector('text=That email or password is not right.');
  await host.fill('input[type=password]', 'Battery-Staple-42');
  await host.click('form button[type=submit]');
  await host.waitForURL(/\/library/);

  say('password reset email');
  const other = await newPage('reset');
  await other.goto(`${BASE}/reset`);
  await other.fill('input[type=email]', 'host@example.com');
  await other.click('button:has-text("Send reset link")');
  await other.waitForSelector('text=Check your inbox');
  await other.context().close();

  say('delete the account and everything in it');
  await host.goto(`${BASE}/settings`);
  await host.click('button:has-text("Delete")');
  await host.locator('.modal input[type=password]').fill('Battery-Staple-42');
  await host.locator('.modal input[placeholder="DELETE"]').fill('DELETE');
  await host.click('.modal button:has-text("Delete everything")');
  await host.waitForSelector('text=Your account was deleted');
  await host.goto(`${BASE}/u/quizmaster`);
  await host.waitForSelector('text=Nothing here');
  await host.goto(`${BASE}/discover`);
  await host.waitForSelector('text=No quizzes yet');
}

await browser.close();
if (errors.length) {
  console.log(`\n${errors.length} page error(s):\n${[...new Set(errors)].join('\n')}`);
  process.exit(1);
}
console.log('\nall good');
