// auth.js — sign in, create an account, reset a password.

import { h, fill } from '../ui/dom.js';
import { icon, logo } from '../ui/icons.js';
import { field, input, passwordInput, busy, toast } from '../ui/kit.js';
import { net, explain } from '../net/index.js';
import { navigate } from '../router.js';
import { signedIn, whenProfile } from '../services/session.js';
import { pageTitle } from './parts.js';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Only ever send people back to a page on this site. */
function safeNext(next) {
  const n = String(next || '');
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/login') && !n.startsWith('/signup') ? n : null;
}

/** 0–4: length, mixed case, digits, symbols; common passwords score 0. */
export function strength(pw) {
  const p = String(pw || '');
  if (p.length < 8) return 0;
  if (/^(password|12345678|qwertyui|11111111|iloveyou|abcdefgh)/i.test(p)) return 0;
  let s = 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return Math.min(4, s);
}

function strengthMeter(pw) {
  const bar = h('i');
  const label = h('small', { class: 'hint' }, 'At least 8 characters.');
  const update = () => {
    const s = strength(pw.value);
    const colours = ['#ff4772', '#ff8a2a', '#ffcd1f', '#12c9a6', '#19c37d'];
    const words = ['Too short or too common', 'Weak', 'Okay', 'Strong', 'Very strong'];
    bar.style.width = `${pw.value ? Math.max(12, s * 25) : 0}%`;
    bar.style.background = colours[s];
    fill(label, pw.value ? words[s] : 'At least 8 characters.');
  };
  pw.addEventListener('input', update);
  return h('div', { class: 'stack', style: { gap: '4px' } }, h('div', { class: 'strength' }, bar), label);
}

async function afterSignIn(next, isNew) {
  await whenProfile();
  if (isNew) navigate('/settings?welcome=1', { replace: true });
  else navigate(safeNext(next) || '/library', { replace: true });
}

function googleButton(next, errorBox) {
  const b = h('button', { class: 'btn btn-block btn-lg google-btn', type: 'button' }, icon('google', { size: 22 }), 'Continue with Google');
  b.addEventListener('click', busy(b, async () => {
    fill(errorBox);
    try {
      const before = Date.now();
      const u = await net.auth.google();
      const profile = await whenProfile();
      const fresh = profile && profile.createdAt && profile.createdAt >= before - 60000;
      await afterSignIn(next, fresh && u);
    } catch (err) {
      fill(errorBox, explain(err));
    }
  }));
  return b;
}

function shell(title, sub, ...body) {
  return h('div', { class: 'page narrow', style: { maxWidth: '460px' } },
    h('div', { class: 'card auth', style: { marginTop: '4vh' } },
      h('div', { style: { display: 'grid', justifyItems: 'center', gap: '10px' } }, logo(), h('h1', {}, title)),
      sub ? h('p', { class: 'muted center', style: { margin: 0 } }, sub) : null,
      ...body));
}

function Login(query) {
  pageTitle('Sign in');
  const errorBox = h('p', { class: 'error-text', role: 'alert' });
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'you@example.com', inputmode: 'email' });
  const pw = passwordInput({ autocomplete: 'current-password', placeholder: 'Your password' });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block', type: 'submit' }, 'Sign in');
  const form = h('form', { class: 'auth', novalidate: true },
    field('Email', email), field('Password', pw),
    h('div', { class: 'row end' }, h('a', { href: `/reset${email.value ? `?email=${encodeURIComponent(email.value)}` : ''}`, class: 'small',
      onclick: (e) => { e.preventDefault(); navigate(`/reset?email=${encodeURIComponent(email.value.trim())}`); } }, 'Forgot your password?')),
    errorBox, go);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  const submit = busy(go, async () => {
    fill(errorBox);
    const e = email.value.trim();
    if (!EMAIL.test(e)) { fill(errorBox, 'Type the email address you signed up with.'); email.focus(); return; }
    if (!pw.input.value) { fill(errorBox, 'Type your password.'); pw.input.focus(); return; }
    try {
      await net.auth.signIn(e, pw.input.value);
      await afterSignIn(query.next, false);
    } catch (err) { fill(errorBox, explain(err)); }
  });
  return shell('Welcome back', null,
    googleButton(query.next, errorBox),
    h('div', { class: 'divider' }, 'or with email'),
    form,
    h('p', { class: 'center small', style: { margin: 0 } }, 'New here? ', h('a', { href: `/signup${query.next ? `?next=${encodeURIComponent(query.next)}` : ''}` }, 'Create an account')),
    h('p', { class: 'center small muted', style: { margin: 0 } }, 'Only playing? You do not need an account. ', h('a', { href: '/join' }, 'Join a game')));
}

function Signup(query) {
  pageTitle('Create an account');
  const errorBox = h('p', { class: 'error-text', role: 'alert' });
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'you@example.com', inputmode: 'email' });
  const pw = passwordInput({ autocomplete: 'new-password', placeholder: 'At least 8 characters' });
  const pw2 = passwordInput({ autocomplete: 'new-password', placeholder: 'Type it again' });
  const agree = h('input', { type: 'checkbox' });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block', type: 'submit' }, 'Create account');
  const form = h('form', { class: 'auth', novalidate: true },
    field('Email', email),
    field('Password', pw), strengthMeter(pw.input),
    field('Confirm password', pw2),
    h('label', { class: 'check' }, agree, h('span', {}, 'I agree to the ', h('a', { href: '/terms', target: '_blank' }, 'terms'), ' and have read the ', h('a', { href: '/privacy', target: '_blank' }, 'privacy notice'), '.')),
    errorBox, go);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  const submit = busy(go, async () => {
    fill(errorBox);
    const e = email.value.trim();
    if (!EMAIL.test(e)) { fill(errorBox, 'That email address does not look right.'); email.focus(); return; }
    if (strength(pw.input.value) < 1) { fill(errorBox, 'Pick a longer, less common password: at least 8 characters.'); pw.input.focus(); return; }
    if (pw.input.value !== pw2.input.value) { fill(errorBox, 'The two passwords are different.'); pw2.input.focus(); return; }
    if (!agree.checked) { fill(errorBox, 'Tick the box to agree to the terms.'); return; }
    try {
      await net.auth.signUp(e, pw.input.value);
      net.auth.sendVerify().catch(() => {});
      toast('Account created. We sent you an email to confirm your address.', 'ok');
      await afterSignIn(query.next, true);
    } catch (err) { fill(errorBox, explain(err)); }
  });
  return shell('Create your account', 'Make quizzes, publish them and host live games.',
    googleButton(query.next, errorBox),
    h('div', { class: 'divider' }, 'or with email'),
    form,
    h('p', { class: 'center small', style: { margin: 0 } }, 'Already have an account? ', h('a', { href: '/login' }, 'Sign in')));
}

function Reset(query) {
  pageTitle('Reset password');
  const errorBox = h('p', { class: 'error-text', role: 'alert' });
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'you@example.com', value: query.email || '' });
  const go = h('button', { class: 'btn btn-main btn-lg btn-block', type: 'submit' }, 'Send reset link');
  const box = h('div', { class: 'auth' });
  const form = h('form', { class: 'auth', novalidate: true }, field('Email', email), errorBox, go);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  const submit = busy(go, async () => {
    fill(errorBox);
    const e = email.value.trim();
    if (!EMAIL.test(e)) { fill(errorBox, 'That email address does not look right.'); return; }
    try {
      await net.auth.sendReset(e);
    } catch (err) {
      // never reveal whether an address has an account
      if (!String(err.code || '').includes('user-not-found')) { fill(errorBox, explain(err)); return; }
    }
    fill(box, h('div', { class: 'card flat center stack', style: { background: '#e9fbf3', borderColor: '#b7eed6' } },
      icon('mail', { size: 40 }),
      h('h3', {}, 'Check your inbox'),
      h('p', { style: { margin: 0 } }, `If ${e} has a Quickzy account, a link to choose a new password is on its way. It can take a minute, and may land in spam.`)),
    h('a', { class: 'btn btn-block', href: '/login' }, 'Back to sign in'));
  });
  fill(box, form, h('p', { class: 'center small', style: { margin: 0 } }, h('a', { href: '/login' }, 'Back to sign in')));
  return shell('Forgot your password?', 'Type your email and we will send you a link to choose a new one.', box);
}

export default async function Auth({ path, query }) {
  if (signedIn() && !path.startsWith('/reset')) {
    queueMicrotask(() => navigate(safeNext(query.next) || '/library', { replace: true }));
    return h('div');
  }
  if (path.startsWith('/signup')) return Signup(query);
  if (path.startsWith('/reset')) return Reset(query);
  return Login(query);
}
