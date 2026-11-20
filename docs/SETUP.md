# Setting up Quickzy

Quickzy is a static web app. Its servers are Google Firebase:

| Part | What it does | Free plan limit |
| --- | --- | --- |
| Firebase Authentication | Google sign-in, email + password, guest players, password-reset and confirm-your-email emails | 3,000 sign-ins a day |
| Cloud Firestore | Profiles, quizzes, answers, game reports | 50,000 reads and 20,000 writes a day |
| Realtime Database | Live games (lobby, questions, scores, arcade positions) | **100 people connected at once**, 10 GB downloaded a month |
| Firebase Hosting | Serves the app at `https://quickzy.web.app` | 10 GB a month |

The app is published at https://quickzy.web.app by GitHub Actions on every
change to `main`. Emails (password reset, confirm your address) are sent by
Firebase itself, which is free and needs no mail server.

## One-time steps in the Firebase console

Open <https://console.firebase.google.com/project/akylduukodo>.

1. **Realtime Database** → *Create database* → location **United States
   (us-central1)** → *Start in locked mode*. (Another location changes the
   database address; then `databaseURL` in `src/config.js` must change too.)
2. **Authentication** → *Sign-in method* → enable **Email/Password**,
   **Google** and **Anonymous** (Anonymous is how players join without an
   account).
3. **Authentication** → *Settings* → *Authorized domains* → *Add domain* →
   `quickzy.web.app` if it is not listed.
4. **Security rules**, if the deploy could not publish them (the Actions log
   says so):
   - Firestore Database → *Rules* → paste `rules/firestore.rules` → *Publish*.
   - Realtime Database → *Rules* → paste `rules/database.rules.json` → *Publish*.
5. Optional, nicer emails: Authentication → *Templates* → set the sender name
   to "Quickzy" and the action URL to `https://quickzy.web.app` if you like.

## Running it on your own computer

```
node dev/server.mjs        # http://localhost:5173, a complete fake backend
npm test                   # unit tests and import checks
node tests/e2e/run.mjs     # plays every game mode in real browsers
```

The dev server needs no internet and no Firebase. Open several browser windows
to play a game against yourself.

## Limits worth knowing

- 100 people connected at once on the free plan, across all games. A class of
  30 is fine; three classes at once is the ceiling. The Blaze plan raises it to
  200,000 and stays free under the same usage.
- Players in a game: 60 at most.
- Games are removed from the database a day after they start.
