// tools/seed.mjs — publish tools/quizzes.mjs as the official Quickzy account.
//
//   npm install --no-save firebase@10.12.2
//   QUICKZY_PASSWORD=... node tools/seed.mjs            (--dry to only check)
//
// Signs in like any user, so the security rules check every write. Each quiz
// has a fixed id (quickzy-<slug>): running it again updates, never duplicates.

import { QUIZZES } from './quizzes.mjs';
import { split, problem } from '../src/game/questions.js';
import { words } from '../src/services/quizzes.js';
import { firebaseConfig } from '../src/config.js';

const dry = process.argv.includes('--dry');
let bad = 0;
for (const q of QUIZZES) {
  q.questions.forEach((x, i) => { const p = problem(x); if (p) { bad++; console.log(`${q.slug} #${i + 1}: ${p}`); } });
  if (q.questions.length < 5) { bad++; console.log(`${q.slug}: fewer than 5 questions`); }
}
if (bad) process.exit(1);
console.log(`${QUIZZES.length} quizzes, ${QUIZZES.reduce((n, q) => n + q.questions.length, 0)} questions, all valid`);
if (dry) process.exit(0);

const { initializeApp } = await import('firebase/app');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
const { getFirestore, doc, getDoc, writeBatch, serverTimestamp } = await import('firebase/firestore');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fs = getFirestore(app);
const { user } = await signInWithEmailAndPassword(auth, 'official@quickzy.web.app', process.env.QUICKZY_PASSWORD);
const profile = (await getDoc(doc(fs, 'users', user.uid))).data();

for (const q of QUIZZES) {
  const id = `quickzy-${q.slug}`;
  const { pub, key } = split(q.questions);
  const ref = doc(fs, 'quizzes', id);
  // the rules refuse reading a quiz that does not exist yet: that means new
  const exists = await getDoc(ref).then((d) => d.exists(), () => false);
  const data = {
    owner: user.uid, title: q.title, description: q.description, cover: q.cover,
    questions: pub, questionCount: pub.length, big: pub.length >= 5, public: true,
    keywords: words(`${q.title} ${q.description} ${pub.map((x) => x.text).join(' ')}`),
    authorName: profile.displayName, authorUsername: profile.username, authorBlook: profile.blook,
    updatedAt: serverTimestamp(),
  };
  if (!exists) Object.assign(data, { plays: 0, createdAt: serverTimestamp() });
  // the answers first, so the quiz is never public without them
  const b1 = writeBatch(fs);
  b1.set(doc(fs, `quizzes/${id}/private`, 'key'), { owner: user.uid, answers: JSON.stringify(key) });
  await b1.commit();
  const b2 = writeBatch(fs);
  b2.set(ref, data, { merge: exists });
  await b2.commit();
  console.log(`${exists ? 'updated' : 'published'} ${id} (${pub.length} questions)`);
}
process.exit(0);
