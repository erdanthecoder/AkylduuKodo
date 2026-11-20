// legal.js — the terms and the privacy notice, in plain words.

import { h } from '../ui/dom.js';
import { pageTitle } from './parts.js';

const TERMS = [
  ['Using Quickzy', 'Quickzy lets you make quizzes and play them live with other people. You can play without an account. To make, save or host quizzes you need one.'],
  ['Your quizzes', 'What you write stays yours. When you publish a quiz, anyone can find it, play it and host it, and signed-in people who host it can see its answers. Drafts are private to you.'],
  ['Be decent', 'No hateful, sexual, violent or bullying content, no personal information about other people, and nothing you do not have the right to share. Nicknames and quiz text are checked for rude words, and quizzes that break these rules can be removed.'],
  ['Games', 'Hosts can remove players from their games. Games are deleted from the servers after they end, and never kept for more than a day.'],
  ['Accounts', 'Keep your password to yourself. You can delete your account and everything in it at any time in Settings.'],
  ['No guarantees', 'Quickzy is provided as it is. We work to keep it running and safe, but cannot promise it will never be down.'],
];

const PRIVACY = [
  ['What we keep', 'For an account: your email address, a display name, a username, the blook you picked, and the quizzes and game reports you save. For a guest in a game: only the nickname and blook you pick, which are deleted with the game.'],
  ['What we do not do', 'No ads, no tracking, no selling or sharing of anything about you. Your email is never shown to other people.'],
  ['Where it lives', 'Accounts and data are stored with Google Firebase. Signing in with Google shares your name and email with us and nothing else.'],
  ['Emails', 'We only send emails you ask for: confirming your address and resetting your password.'],
  ['This device', 'Your sound and motion settings are kept in this browser. Nothing else is stored on your device apart from what keeps you signed in.'],
  ['Children', 'Players do not need an account, an email or their real name. Teachers hosting games for a class should use nicknames, not full names.'],
  ['Deleting', 'Settings → Delete account removes your profile, your quizzes and your reports for good.'],
];

export default async function Legal({ path }) {
  const terms = path.startsWith('/terms');
  pageTitle(terms ? 'Terms' : 'Privacy');
  const items = terms ? TERMS : PRIVACY;
  return h('div', { class: 'page narrow' },
    h('h1', {}, terms ? 'Terms of use' : 'Privacy'),
    h('p', { class: 'muted' }, terms ? 'The rules for using Quickzy, short and clear.' : 'What Quickzy knows about you, and what it does with it.'),
    h('div', { class: 'card stack' }, ...items.map(([title, text]) => h('section', {}, h('h3', {}, title), h('p', { style: { margin: '4px 0 0' } }, text)))),
    h('p', { class: 'center small' }, terms ? h('a', { href: '/privacy' }, 'Read the privacy notice') : h('a', { href: '/terms' }, 'Read the terms')));
}
