// account.js — sign in, sign up, or see who is signed in.

import { h, toast, confetti, sfx } from '../ui.js';
import { ui } from '../i18n.js';
import * as auth from '../auth.js';
import * as store from '../state.js';

export function AccountView(go, rerender) {
  return auth.user() ? profileCard(go, rerender) : signInCard(go, rerender);
}

// ------------------------------------------------------------- signed out

function signInCard(go, rerender) {
  let mode = 'in'; // 'in' | 'up'
  const form = h('div', { class: 'auth-form' });
  const error = h('div', { class: 'feedback bad auth-error' });
  const card = h('section', { class: 'card auth-card pop-in' });

  const nameInput = h('input', { class: 'text-input', placeholder: 'Aisuluu', autocomplete: 'name' });
  const emailInput = h('input', { class: 'text-input', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' });
  const passInput = h('input', { class: 'text-input', type: 'password', placeholder: '••••••', autocomplete: 'current-password' });

  const submit = h('button', { class: 'btn btn-primary btn-big', onclick: run });

  async function run() {
    error.textContent = '';
    submit.disabled = true;
    submit.classList.add('is-busy');
    try {
      if (mode === 'up') await auth.signUpEmail(nameInput.value.trim(), emailInput.value, passInput.value);
      else await auth.signInEmail(emailInput.value, passInput.value);
      welcome(go, rerender);
    } catch (err) {
      error.textContent = auth.friendlyAuthError(err);
      sfx('bad', store.get().sound);
      card.classList.remove('shake-it');
      void card.offsetWidth;
      card.classList.add('shake-it');
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-busy');
    }
  }

  const googleBtn = h(
    'button',
    {
      class: 'btn btn-google',
      onclick: async () => {
        error.textContent = '';
        googleBtn.classList.add('is-busy');
        try {
          const u = await auth.signInGoogle();
          if (u) welcome(go, rerender);
        } catch (err) {
          error.textContent = auth.friendlyAuthError(err);
        } finally {
          googleBtn.classList.remove('is-busy');
        }
      },
    },
    googleMark(),
    h('span', {}, 'Continue with Google'),
  );

  function draw() {
    submit.textContent = mode === 'up' ? 'Create my account' : 'Sign in';
    passInput.autocomplete = mode === 'up' ? 'new-password' : 'current-password';
    form.replaceChildren(
      ...(mode === 'up' ? [label('Your name', nameInput)] : []),
      label('Email', emailInput),
      label('Password', passInput),
      submit,
      error,
    );
    [...tabs.children].forEach((b) => b.classList.toggle('tab-on', b.dataset.mode === mode));
  }

  const tabs = h(
    'div',
    { class: 'tabs auth-tabs' },
    h('button', { class: 'tab', dataset: { mode: 'in' }, onclick: () => { mode = 'in'; draw(); } }, 'Sign in'),
    h('button', { class: 'tab', dataset: { mode: 'up' }, onclick: () => { mode = 'up'; draw(); } }, 'Sign up'),
  );

  [emailInput, passInput, nameInput].forEach((i) =>
    i.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') run();
    }),
  );

  card.append(
    h('div', { class: 'auth-head' },
      h('div', { class: 'auth-mark float-y' }, '🏔️'),
      h('h1', {}, 'Save your progress'),
      h('p', { class: 'muted' }, 'One account keeps your lessons, streak and XP in sync — school computer, home laptop, phone.'),
    ),
    googleBtn,
    h('div', { class: 'auth-or' }, h('span', {}, 'or')),
    tabs,
    form,
    auth.MODE === 'device'
      ? h('p', { class: 'muted small auth-note' },
          '⚠️ This copy is running in device mode: accounts stay in this browser only. Add your Firebase config in ' +
          'src/firebase-config.js to turn on Google sign-in and cloud sync.')
      : null,
    h('button', { class: 'btn btn-ghost', onclick: () => go('#/home') }, 'Keep going without an account'),
  );

  draw();
  return h('div', { class: 'view auth-view' }, card);
}

function label(text, input) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, text), input);
}

function welcome(go, rerender) {
  const u = auth.user();
  confetti(22);
  sfx('great', store.get().sound);
  toast(`Welcome, ${u?.name || 'coder'}! Progress is being saved.`, 'ok');
  go('#/home');
  rerender();
}

/** Google's mark, inline so there is no external request. */
function googleMark() {
  const svg =
    '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.6 7l7.1 5.5c4.2-3.8 6.6-9.5 6.6-17z"/>' +
    '<path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.8-6.1C1 16.8 0 20.3 0 24s1 7.2 2.6 10.4l7.8-5.7z"/>' +
    '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.4 0-11.7-3.7-13.6-8.8l-7.8 5.7C6.5 42.6 14.6 48 24 48z"/>' +
    '</svg>';
  return h('span', { class: 'g-mark', html: svg });
}

// -------------------------------------------------------------- signed in

function profileCard(go, rerender) {
  const u = auth.user();
  const s = store.get();
  const lvl = store.level();
  const done = Object.keys(s.done).length;

  return h(
    'div',
    { class: 'view' },
    h('section', { class: 'card profile-card pop-in' },
      h('div', { class: 'avatar-wrap' },
        u.photo
          ? h('img', { class: 'avatar', src: u.photo, alt: '', referrerpolicy: 'no-referrer' })
          : h('div', { class: 'avatar avatar-letter' }, (u.name || u.email || '?').slice(0, 1).toUpperCase()),
        h('span', { class: 'avatar-ring' }),
      ),
      h('h1', {}, u.name || 'Coder'),
      h('p', { class: 'muted' }, u.email || 'device account'),
      h('div', { class: 'chips center' },
        h('span', { class: 'chip' }, `${lvl.emoji} ${lvl.name}`),
        h('span', { class: 'chip' }, `⚡ ${s.xp} XP`),
        h('span', { class: 'chip' }, `📚 ${done} lessons`),
        h('span', { class: 'chip' }, `🔥 ${store.streak()} day streak`),
      ),
      h('p', { class: 'muted small sync-note' },
        auth.MODE === 'cloud'
          ? `☁️ Progress syncs to your account (${u.provider === 'google' ? 'Google' : 'email'} sign-in).`
          : '💾 Saved in this browser. Add the Firebase config to sync across devices.'),
      h('div', { class: 'row gap center' },
        h('button', { class: 'btn btn-primary', onclick: () => go('#/home') }, 'Back to learning'),
        h('button', {
          class: 'btn btn-ghost',
          onclick: async () => {
            await auth.signOut();
            toast('Signed out. Your progress is safe.', 'ok');
            go('#/home');
            rerender();
          },
        }, 'Sign out'),
      ),
    ),
  );
}
