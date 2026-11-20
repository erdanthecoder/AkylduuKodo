// settings.js — profile, account and this device's preferences.

import { h, fill, debounce } from '../ui/dom.js';
import { icon, verifiedBadge } from '../ui/icons.js';
import { blook, blookName, rarityOf } from '../ui/blooks.js';
import { usableBlooks, me as wallet, levelInfo } from '../services/progress.js';
import { field, input, passwordInput, toggle, busy, toast, confirm, modal } from '../ui/kit.js';
import { net, explain } from '../net/index.js';
import { navigate } from '../router.js';
import * as session from '../services/session.js';
import { myQuizzes, deleteQuiz, myReports, deleteReport, verifiedProgress, syncAuthor } from '../services/quizzes.js';
import { strength } from './auth.js';
import { pageTitle } from './parts.js';
import { LIMITS, BADGES } from '../config.js';
import { sfx } from '../game/sound.js';
import { nameBadges } from '../ui/badges.js';
import * as siteSvc from '../services/site.js';
import { unfollowAll } from '../services/channels.js';

export function blookPicker(current, onPick) {
  const grid = h('div', { class: 'blook-grid', role: 'radiogroup', 'aria-label': 'Blook' });
  // only blooks this person owns; the rest come from boxes on the Blooks page
  const draw = () => fill(grid, ...usableBlooks().map((id) => h('button', {
    type: 'button', class: `blook-pick${id === current ? ' is-on' : ''}`, role: 'radio', 'aria-checked': String(id === current),
    'aria-label': blookName(id), style: { '--rc': rarityOf(id).colour },
    onclick: () => { current = id; draw(); onPick(id); },
  }, blook(id), h('small', {}, blookName(id)))));
  draw();
  return h('div', { class: 'stack', style: { gap: '8px' } }, grid,
    h('a', { href: '/blooks', class: 'small' }, 'Get more blooks from boxes'));
}

function section(title, ...rows) {
  const ic = { Profile: 'user', Account: 'key', 'Sound & screen': 'volume', 'Trusted quiz maker': 'check', 'Your badge': 'shield', 'Your badges': 'shield' }[title] || 'gear';
  const id = `set-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return h('section', { class: 'card stack set-card', id },
    h('h2', { class: 'set-title' }, h('span', { class: 'set-ic' }, icon(ic, { size: 18 })), title), ...rows);
}

/** The big card at the top: who you are, your level and coins. */
function hero() {
  const p = session.myProfile();
  const u = session.me();
  const m = wallet();
  const info = levelInfo(m.xp);
  const special = BADGES[u.uid];
  const big = blook(p.blook, 112);
  return h('section', { class: 'set-hero' },
    h('div', { class: 'set-hero-blook' }, big),
    h('div', { class: 'grow stack', style: { gap: '6px', minWidth: '200px' } },
      h('h1', { class: 'row', style: { gap: '8px', margin: 0 } }, p.displayName, special ? nameBadges(special) : null),
      h('div', { class: 'set-hero-sub' }, `@${p.username}`),
      h('div', { class: 'row', style: { gap: '8px' } },
        h('span', { class: 'set-chip' }, icon('star', { size: 14 }), `Level ${info.level}`),
        h('span', { class: 'set-chip set-chip-gold' }, icon('bolt', { size: 14 }), `${m.coins.toLocaleString()} coins`),
        h('span', { class: 'set-chip' }, icon('trophy', { size: 14 }), `${usableBlooks().length} blooks`)),
      h('div', { class: 'set-xp' }, h('i', { style: { width: `${Math.round(info.frac * 100)}%` } })),
      h('small', { style: { opacity: 0.8 } }, info.need ? `${info.into} / ${info.need} XP to level ${info.level + 1}` : 'Top level!')));
}

function jumpTabs(list) {
  return h('nav', { class: 'set-tabs', 'aria-label': 'Settings sections' }, ...list.map(([label, ic]) => h('a', {
    href: `#set-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`, class: 'set-tab',
    onclick: (e) => { e.preventDefault(); document.getElementById(`set-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  }, icon(ic, { size: 16 }), label)));
}

function row(title, text, control) {
  return h('div', { class: 'set-row' },
    h('div', { class: 'grow' }, h('b', {}, title), text ? h('p', { class: 'muted small' }, text) : null),
    control);
}

function profileSection() {
  const p = session.myProfile();
  let chosen = p.blook;
  const preview = h('div', {}, blook(chosen));
  preview.firstChild.style.width = '96px'; preview.firstChild.style.height = '96px';
  const name = input({ value: p.displayName, maxlength: 30 });
  const user = input({ value: p.username, maxlength: LIMITS.usernameMax, autocapitalize: 'off', spellcheck: 'false' });
  const userHint = h('small', { class: 'hint' }, `quickzy.web.app/u/${p.username}`);
  const errorBox = h('p', { class: 'error-text', role: 'alert' });
  const save = h('button', { class: 'btn btn-main' }, 'Save profile');

  const checkName = debounce(async () => {
    const v = user.value.trim().toLowerCase();
    const bad = session.validUsername(v);
    if (bad) { fill(userHint, bad); userHint.className = 'error-text'; return; }
    if (v === session.myProfile().username) { fill(userHint, `quickzy.web.app/u/${v}`); userHint.className = 'hint'; return; }
    const taken = await net.store.get('usernames', v).catch(() => null);
    if (user.value.trim().toLowerCase() !== v) return;
    fill(userHint, taken ? 'That username is taken.' : `Available: quickzy.web.app/u/${v}`);
    userHint.className = taken ? 'error-text' : 'hint';
  }, 350);
  user.addEventListener('input', () => { user.value = user.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); checkName(); });

  save.addEventListener('click', busy(save, async () => {
    fill(errorBox);
    try {
      const before = session.myProfile();
      await session.updateProfile({ displayName: name.value, blook: chosen });
      if (user.value.trim() !== before.username) await session.changeUsername(user.value.trim());
      const after = session.myProfile();
      if (after.displayName !== before.displayName || after.username !== before.username || after.blook !== before.blook) {
        syncAuthor().catch(() => {});
      }
      net.auth.setDisplayName(after.displayName).catch(() => {});
      toast('Profile saved', 'ok');
      fill(userHint, `quickzy.web.app/u/${after.username}`); userHint.className = 'hint';
    } catch (err) {
      fill(errorBox, err.message && !err.code ? err.message : explain(err));
    }
  }));

  return section('Profile',
    h('div', { class: 'profile-head' }, preview,
      h('div', { class: 'grow stack', style: { minWidth: '220px' } },
        field('Display name', name, 'Shown on your quizzes and profile.'),
        h('label', { class: 'field' }, h('span', {}, 'Username'), user, userHint))),
    h('h3', {}, 'Your blook'),
    blookPicker(chosen, (id) => { chosen = id; fill(preview, blook(id)); preview.firstChild.style.width = '96px'; preview.firstChild.style.height = '96px'; sfx('pick'); }),
    errorBox,
    h('div', { class: 'row end' }, save));
}

/** The owner picks which badges to wear next to their name. */
function ownerBadgeSection() {
  const info = {
    owner: ['Owner', 'Green: the Quickzy owner. Only you have it.'],
    kg: ['Kyrgyzstan', 'The Kyrgyz flag.'],
    official: ['Official Quickzy', 'Black: made by Quickzy itself.'],
    verified: ['Trusted quiz maker', 'Blue: for trusted quiz makers.'],
  };
  const preview = h('span', { class: 'badge-set', style: { transform: 'scale(1.5)', transformOrigin: 'left center', marginLeft: '6px' } });
  const box = h('div', { class: 'stack', style: { gap: '0' } });
  let wear = ['owner'];
  const save = debounce(async () => {
    try { wear = await siteSvc.setOwnerWear(wear); toast('Badges saved', 'ok'); draw(); } catch (err) { toast(explain(err), 'bad'); }
  }, 500);
  const draw = () => {
    fill(preview, ...wear.map((k) => verifiedBadge(null, k)));
    fill(box, ...siteSvc.OWNER_BADGES.map((k) => row(h('span', { class: 'row', style: { gap: '8px' } }, verifiedBadge(null, k), info[k][0]), info[k][1],
      toggle(wear.includes(k), (on) => {
        const next = on ? [...wear, k] : wear.filter((x) => x !== k);
        if (!next.length) { toast('Wear at least one badge', 'bad'); draw(); return; }
        wear = siteSvc.OWNER_BADGES.filter((x) => next.includes(x));
        fill(preview, ...wear.map((x) => verifiedBadge(null, x)));
        sfx('pick');
        save();
      }))));
  };
  siteSvc.ownerWear().then((w) => { wear = w; draw(); });
  draw();
  return section('Your badges',
    h('div', { class: 'row', style: { gap: '10px' } }, h('b', {}, session.myProfile().displayName), preview),
    h('p', { class: 'small muted', style: { margin: 0 } }, 'Choose which badges show next to your name everywhere. Wear all of them or just some.'),
    box);
}

function verifiedSection() {
  const p = session.myProfile();
  const special = BADGES[session.me().uid];
  if (special === 'owner') return ownerBadgeSection();
  if (special) {
    return section('Your badge', h('div', { class: 'row', style: { flexWrap: 'nowrap' } },
      h('span', { style: { transform: 'scale(1.6)', margin: '0 8px 0 4px' } }, verifiedBadge(null, special)),
      h('div', {}, h('b', {}, special === 'owner' ? 'Quickzy owner' : 'Official Quickzy'),
        h('p', { class: 'small muted', style: { margin: '2px 0 0' } }, special === 'owner'
          ? 'The green check shows next to your name everywhere. Only the owner has it.'
          : 'The black check marks quizzes made by Quickzy itself.'))));
  }
  const body = h('div', { class: 'muted' }, 'Checking…');
  verifiedProgress(session.me().uid).then(({ have, need, minQuestions }) => {
    const done = have >= need;
    fill(body, h('div', { class: 'row', style: { alignItems: 'flex-start', flexWrap: 'nowrap' } },
      h('span', { style: { transform: 'scale(1.6)', margin: '6px 8px 0 4px' } }, verifiedBadge()),
      h('div', { class: 'grow' },
        h('b', { style: { color: 'var(--ink)' } }, done ? `${p.displayName} is a trusted quiz maker` : 'Get the blue badge: trusted quiz maker'),
        h('p', { class: 'small', style: { margin: '4px 0 8px' } }, done
          ? 'The blue check shows next to your name on every quiz and on your profile.'
          : `Publish ${need} quizzes with at least ${minQuestions} questions each. You have ${have} of ${need}.`),
        h('div', { class: 'strength', style: { height: '10px' } }, h('i', { style: { width: `${Math.min(100, (have / need) * 100)}%`, background: 'var(--a1)' } })))));
  });
  return section('Trusted quiz maker', body);
}

function accountSection() {
  const u = session.me();
  const hasPassword = (u.providers || []).includes('password');
  const hasGoogle = (u.providers || []).includes('google.com');
  const verifyRow = h('div');
  const drawVerify = () => {
    const me = session.me();
    fill(verifyRow, row('Email address', me.email || 'No email on this account',
      me.emailVerified
        ? h('span', { class: 'pill pill-ok' }, icon('check', { size: 14 }), 'Confirmed')
        : (() => {
          const send = h('button', { class: 'btn btn-sm' }, 'Send confirmation');
          send.addEventListener('click', busy(send, async () => {
            try { await net.auth.sendVerify(); toast(`Email sent to ${me.email}. Open the link, then come back.`, 'ok'); } catch (err) { toast(explain(err), 'bad'); }
          }));
          const check = h('button', { class: 'btn btn-sm btn-ghost' }, 'I confirmed it');
          check.addEventListener('click', busy(check, async () => {
            await session.refresh();
            if (session.me().emailVerified) toast('Email confirmed', 'ok'); else toast('Not confirmed yet. Open the link in the email first.', 'bad');
            drawVerify();
          }));
          return h('div', { class: 'row' }, send, check);
        })()));
  };
  drawVerify();

  const resetBtn = h('button', { class: 'btn btn-sm' }, icon('mail', { size: 16 }), 'Email me a link');
  resetBtn.addEventListener('click', busy(resetBtn, async () => {
    try { await net.auth.sendReset(u.email); toast(`Reset link sent to ${u.email}. Check spam too.`, 'ok'); } catch (err) { toast(explain(err), 'bad'); }
  }));
  const passRow = hasPassword
    ? h('div', {},
      row('Password', 'Change the password you sign in with.', h('button', { class: 'btn btn-sm', onclick: changePassword }, icon('key', { size: 16 }), 'Change')),
      row('Forgot your password?', 'We email you a link to choose a new one.', resetBtn))
    : row('Password', hasGoogle ? 'You sign in with Google, so there is no password to manage here.' : '', null);

  const out = h('button', { class: 'btn btn-sm' }, icon('logout', { size: 16 }), 'Sign out');
  out.addEventListener('click', busy(out, async () => { await net.auth.signOut(); toast('Signed out'); navigate('/', { replace: true }); }));

  return section('Account',
    verifyRow,
    row('Signed in with', [hasGoogle && 'Google', hasPassword && 'email and password'].filter(Boolean).join(' and ') || 'email', null),
    passRow,
    row('Sign out', 'Sign out on this device.', out),
    row('Delete account', 'Removes your profile, quizzes and reports for good.', h('button', { class: 'btn btn-sm btn-bad', onclick: deleteAccount }, icon('trash', { size: 16 }), 'Delete')));
}

function changePassword() {
  return modal((close) => {
    const current = passwordInput({ autocomplete: 'current-password' });
    const next = passwordInput({ autocomplete: 'new-password' });
    const errorBox = h('p', { class: 'error-text', role: 'alert' });
    const go = h('button', { class: 'btn btn-main' }, 'Change password');
    go.addEventListener('click', busy(go, async () => {
      fill(errorBox);
      if (strength(next.input.value) < 1) { fill(errorBox, 'Pick a longer, less common password: at least 8 characters.'); return; }
      try {
        await net.auth.changePassword(current.input.value, next.input.value);
        toast('Password changed', 'ok');
        close(true);
      } catch (err) { fill(errorBox, explain(err)); }
    }));
    return [h('h2', {}, 'Change password'), field('Current password', current), field('New password', next), errorBox,
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close(false) }, 'Cancel'), go)];
  });
}

async function deleteAccount() {
  const u = session.me();
  const hasPassword = (u.providers || []).includes('password');
  const ok = await modal((close) => {
    const pw = hasPassword ? passwordInput({ autocomplete: 'current-password' }) : null;
    const typed = input({ placeholder: 'DELETE' });
    const errorBox = h('p', { class: 'error-text', role: 'alert' });
    const go = h('button', { class: 'btn btn-bad' }, 'Delete everything');
    go.addEventListener('click', busy(go, async () => {
      fill(errorBox);
      if (typed.value.trim() !== 'DELETE') { fill(errorBox, 'Type DELETE in capitals to confirm.'); return; }
      try {
        // prove it is really them first, so nothing is removed if this fails
        await net.auth.reauth(hasPassword ? pw.input.value : undefined);
        const p = session.myProfile();
        for (const q of await myQuizzes()) await deleteQuiz(q.id);
        for (const r of await myReports()) await deleteReport(r.id);
        await unfollowAll();
        const steps = [{ op: 'del', col: 'users', id: u.uid }];
        if (p && p.username) steps.unshift({ op: 'del', col: 'usernames', id: p.username });
        await net.store.batch(steps);
        await net.auth.deleteAccount();
        close(true);
      } catch (err) { fill(errorBox, explain(err)); }
    }));
    return [h('h2', {}, 'Delete your account?'),
      h('p', { class: 'muted' }, 'Your profile, every quiz you made and all your game reports are removed. This cannot be undone.'),
      pw ? field('Your password', pw) : h('p', { class: 'small muted' }, 'Google will ask you to confirm it is you.'),
      field('Type DELETE to confirm', typed), errorBox,
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => close(false) }, 'Keep my account'), go)];
  });
  if (ok) { toast('Your account was deleted'); navigate('/', { replace: true }); }
}

function deviceSection() {
  const p = session.prefs();
  const intro = h('button', { class: 'btn btn-sm', onclick: () => import('../ui/cutscene.js').then((m) => m.playIntro()) }, icon('play', { size: 16 }), 'Play');
  return section('Sound & screen',
    row('Quickzy intro', 'Watch the intro cutscene again.', intro),
    row('Sound effects', 'Clicks, chimes and game sounds.', toggle(p.sound, (v) => { session.setPrefs({ sound: v }); if (v) sfx('pick'); })),
    row('Music', 'Background music in the lobby and in games.', toggle(p.music, (v) => session.setPrefs({ music: v }))),
    row('Animations', 'Turn off for calmer screens with less movement.', toggle(p.motion, (v) => session.setPrefs({ motion: v }))));
}

export default async function Settings({ query }) {
  pageTitle('Settings');
  if (!session.signedIn()) {
    return h('div', { class: 'page mid stack', style: { gap: '18px' } },
      h('section', { class: 'set-hero' },
        h('div', { class: 'set-hero-blook' }, blook('dog', 112)),
        h('div', { class: 'grow stack', style: { gap: '8px', minWidth: '200px' } },
          h('h1', { style: { margin: 0 } }, 'Settings'),
          h('p', { style: { margin: 0, opacity: 0.85 } }, 'Sign in to keep your coins, blooks and quizzes.'),
          h('div', { class: 'row' }, h('a', { class: 'btn btn-main', href: '/login' }, 'Sign in'), h('a', { class: 'btn', href: '/signup' }, 'Create account'),
            h('a', { class: 'btn btn-ghost set-ghost', href: '/reset' }, 'Forgot password?')))),
      deviceSection());
  }
  await session.whenProfile();
  if (!session.myProfile()) {
    return h('div', { class: 'page narrow' }, h('div', { class: 'card center stack' },
      h('h2', {}, 'Your profile did not load'),
      h('p', { class: 'muted' }, 'Check your connection and try again.'),
      h('button', { class: 'btn btn-main', onclick: () => location.reload() }, 'Try again')));
  }
  const welcome = query.welcome ? h('div', { class: 'card', style: { background: 'var(--night)', color: '#fff' } },
    h('h2', { style: { color: '#fff' } }, 'Welcome to Quickzy'),
    h('p', { style: { margin: '6px 0 14px', opacity: 0.9 } }, 'Pick a name and a blook, then make your first quiz.'),
    h('a', { class: 'btn btn-main', href: '/create' }, icon('plus'), 'Make a quiz')) : null;
  return h('div', { class: 'page mid stack', style: { gap: '18px' } },
    hero(),
    jumpTabs([['Profile', 'user'], ['Account', 'key'], ['Sound & screen', 'volume']]),
    welcome,
    profileSection(),
    verifiedSection(),
    accountSection(),
    deviceSection());
}
