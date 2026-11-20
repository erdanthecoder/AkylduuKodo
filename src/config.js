// config.js — where Quickzy's data lives.
//
// These Firebase values are NOT secrets. A web config is meant to be public;
// what protects the data is rules/firestore.rules and rules/database.rules.json.
//
// databaseURL is the Realtime Database that runs live games. When it is
// created in the Firebase console, choose "United States (us-central1)" and
// this address is already right. Any other region shows a different address on
// the Realtime Database page: paste that here instead.

export const firebaseConfig = {
  apiKey: 'AIzaSyDXrMgT80j7-0M-Uwx4MRzKHTfX5LdPRsU',
  authDomain: 'akylduukodo.firebaseapp.com',
  databaseURL: 'https://akylduukodo-default-rtdb.firebaseio.com',
  projectId: 'akylduukodo',
  storageBucket: 'akylduukodo.firebasestorage.app',
  messagingSenderId: '482873423827',
  appId: '1:482873423827:web:cc5d3772d1777479da6126',
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

/** The public address people are sent to when they scan a join code. */
export const PUBLIC_URL = 'https://quickzy.web.app';

export const LIMITS = {
  nameMax: 16,
  usernameMin: 3,
  usernameMax: 20,
  quizTitleMax: 80,
  quizDescMax: 280,
  questionMax: 240,
  optionMax: 90,
  questionsMax: 100,
  publishMinQuestions: 3,
  verifyMinQuestions: 5,     // a quiz has to be this long to count towards the badge
  verifyMinQuizzes: 3,       // and an author needs this many of them
  playersMax: 60,
};

/**
 * Special badges, fixed here in the code so nobody can give one to
 * themselves: they are not stored anywhere a user can write.
 *   official — the Quickzy account itself (black check)
 *   owner    — the person who runs Quickzy (green check)
 * Everyone else can earn the blue "verified creator" check by publishing.
 */
export const BADGES = {
  XH9Z5D7tLmRHStlxumgaJyTo1BP2: 'official',
  KWIRRSUM2VQVWnr1nUDbPP9bqMk2: 'owner',
};
export const OFFICIAL_UID = 'XH9Z5D7tLmRHStlxumgaJyTo1BP2';
export const OWNER_UID = 'KWIRRSUM2VQVWnr1nUDbPP9bqMk2';

/** Quickzy 1.2 arrives by itself on this moment (11 December 2026, 16:00 UTC).
 *  Until then the site counts down to it; the owner can try 1.2 early. */
export const RELEASE_1_2 = Date.UTC(2026, 11, 11, 16, 0, 0);
export const released12 = (now = Date.now()) => now >= RELEASE_1_2;

/** Shown in the sidebar and the What's new popup. */
export const VERSION = released12() ? '1.2' : '1.1';

/** Pro for free, given by the owner: ugemnomads. (The rules hold the same list.) */
export const PRO_FREE = ['f4BZrMpjQnV2B7n3iKq68J8poJ63'];

/** Payments (Stripe). Not secret: a payment link and the manage-subscription page. */
export const STRIPE = {
  payLink: 'https://buy.stripe.com/test_14A4gy5Mz0ma3Ga2b62oE00',
  manage: 'https://billing.stripe.com/p/login/test_14A4gy5Mz0ma3Ga2b62oE00',
  test: true,
};
/** Supabase (public URL and publishable key). Paid members are listed in pro_members. */
export const SUPABASE = {
  url: 'https://shzujparccfpnunfnhhk.supabase.co',
  key: 'sb_publishable_zLodYYp009iw0xnFb-6uyg_Rm-lOXgv',
};
