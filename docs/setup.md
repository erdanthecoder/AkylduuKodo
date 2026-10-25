# Setting it up

Everything here is done once. The code is already written for all of it.

## 1. The address — malikastudy.web.app

Malika Study is a second Hosting site inside the Firebase project that already
exists (`akylduukodo`), so it shares the database and the sign-in settings.

1. Firebase console → **Hosting** → **Add another site**
2. Name it `malikastudy`

That is the only step that blocks the first deploy. Until the site exists, the
GitHub Action will fail with "site not found".

## 2. Sign-in

Firebase console → **Authentication**:

- **Sign-in method** → turn on **Google** (the dashboard) and **Anonymous**
  (Malika's tablet, which never has an account of its own)
- **Settings → Authorized domains** → add `malikastudy.web.app`

## 3. The database rules

The rules are in `firestore.rules` and ship with the deploy. If you would
rather paste them by hand: Firebase console → **Firestore Database** → **Rules**.

They say, in short: a listed teacher can change the homework; anyone holding
the family code can read it and send results; nobody can touch another family.

## 4. First run

1. Open `malikastudy.web.app/forteachersonly` and sign in with Google.
2. Press **Make a family**. That creates a family code and remembers it.
3. Copy **her link** and open it once on Malika's tablet. That is all her
   device ever needs — no password, no account.

## Google Classroom (optional)

**Read this first.** A submission can only be turned in by the Google Cloud
project that *created* the coursework. So this dashboard can post an assignment
to a course **you** teach and work with it fully — but no app, this one
included, can hand in homework that Malika's school teacher set. That is
Google's rule, not a gap in the code.

What works:

- post today's task to your own course, with a link straight to it
- grade it and hand it back once her result arrives

For homework her school set, the dashboard offers a **share to Classroom** link
instead, which opens Classroom's own attach window.

To turn it on:

1. [Google Cloud console](https://console.cloud.google.com/) → the
   `akylduukodo` project → **APIs & Services** → **Enable APIs** →
   enable **Google Classroom API**
2. **OAuth consent screen** → add these scopes:
   - `classroom.courses.readonly`
   - `classroom.coursework.students`
   - `classroom.rosters.readonly`
3. While the app is unverified, add yourself under **Test users**. That is
   enough for a family; Google only requires verification for public apps.

The dashboard asks for these permissions the first time you press
**Also put in Classroom**, not at sign-in — setting homework should not demand
access to a school account.

## Turning the server off

Set `firebaseConfig` to `null` in `src/firebase-config.js`. Everything still
works and her progress simply stays on the one device.
