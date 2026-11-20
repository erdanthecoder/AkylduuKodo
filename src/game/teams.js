// teams.js — Team mode: players split into 2–4 teams that win together.
//
// The host's referee puts each new player on the smallest team, and a team's
// score is the average of its players' scores, so a team of three can beat a
// team of five fairly.

export const TEAMS = [
  { name: 'Red Foxes', colour: '#ff4772', dark: '#c92651', blook: 'fox' },
  { name: 'Blue Penguins', colour: '#2f9bff', dark: '#1a6fcc', blook: 'penguin' },
  { name: 'Gold Lions', colour: '#ffb21f', dark: '#d98c00', blook: 'lion' },
  { name: 'Green Frogs', colour: '#19c37d', dark: '#0f8f59', blook: 'frog' },
];

export const teamCount = (settings) => {
  const n = Number(settings && settings.teams) || 0;
  return n >= 2 && n <= 4 ? n : 0;
};

/** The team with the fewest players (the lowest number on a tie). */
export function smallestTeam(of, n) {
  const sizes = Array(n).fill(0);
  for (const t of Object.values(of)) if (t >= 0 && t < n) sizes[t] += 1;
  return sizes.indexOf(Math.min(...sizes));
}

/** [{i, name, colour, score, members}] best first. players: [{uid, score}] */
export function standings(of, n, players) {
  const rows = Array.from({ length: n }, (_, i) => ({ i, ...TEAMS[i], total: 0, members: [] }));
  for (const p of players) { const t = of[p.uid]; if (rows[t]) { rows[t].members.push(p); rows[t].total += p.score || 0; } }
  for (const r of rows) r.score = r.members.length ? Math.round(r.total / r.members.length) : 0;
  return rows.sort((a, b) => b.score - a.score || a.i - b.i);
}
