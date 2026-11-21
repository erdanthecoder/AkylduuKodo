// achievements.js — goals everyone can reach, worked out from what a
// profile already shows (nothing extra to cheat). Shown on profiles.

import { levelOf } from './progress.js';

// [id, icon colour, title, how, test(stats)]
export const ACHIEVEMENTS = [
  ['first-game', '#6b4cff', 'First game', 'Play your first game.', (s) => s.xp > 0],
  ['level-5', '#2f9bff', 'Getting good', 'Reach level 5.', (s) => s.level >= 5],
  ['level-10', '#12c9a6', 'Quiz pro', 'Reach level 10.', (s) => s.level >= 10],
  ['level-25', '#ffb800', 'Quiz legend', 'Reach level 25.', (s) => s.level >= 25],
  ['collector', '#ff8a2a', 'Collector', 'Collect 10 blooks.', (s) => s.blooks >= 10],
  ['big-collector', '#a560ff', 'Blook hoarder', 'Collect 25 blooks.', (s) => s.blooks >= 25],
  ['rich', '#ffcd1f', 'Coin stash', 'Have 500 coins at once.', (s) => s.coins >= 500],
  ['maker', '#ff4772', 'Quiz maker', 'Publish your first quiz.', (s) => s.quizzes >= 1],
  ['author', '#e8112d', 'Author', 'Publish 5 quizzes.', (s) => s.quizzes >= 5],
  ['popular', '#12a37f', 'Crowd pleaser', 'Your quizzes are played 25 times.', (s) => s.plays >= 25],
  ['famous', '#6b4cff', 'Famous', 'Your quizzes are played 250 times.', (s) => s.plays >= 250],
  ['followed', '#2f9bff', 'Followed', 'Get 5 followers.', (s) => s.followers >= 5],
  ['friend', '#ff8fb1', 'Good friend', 'Invite a friend who joins (the Buddy blook).', (s) => s.buddy],
  ['custom', '#59f0ff', 'Designer', 'Make a custom blook.', (s) => s.customs >= 1],
  ['met-owner', '#ffd34d', 'Played with Erdan', 'Play a game hosted by the owner of Quickzy.', (s) => s.metOwner],
  ['pro', '#ffb800', 'Pro member', 'Become a Quickzy Pro member.', (s) => s.pro],
];

export function statsFor(profile = {}, { quizzes = [], followers = 0, pro = false, owner = false } = {}) {
  const xp = Number(profile.xp) || 0;
  return {
    xp,
    level: levelOf(xp),
    coins: Number(profile.coins) || 0,
    blooks: Object.keys(profile.owned || {}).length + 12,       // the commons everyone has
    customs: (profile.customs || []).length,
    quizzes: quizzes.length,
    plays: quizzes.reduce((n, q) => n + (q.plays || 0), 0),
    followers,
    buddy: Boolean(profile.owned && profile.owned.buddy),
    metOwner: Boolean(profile.metOwner) || owner,
    pro: pro || owner,
  };
}

export const earned = (stats) => ACHIEVEMENTS.map(([id, col, title, how, test]) => ({ id, col, title, how, done: Boolean(test(stats)) }));
