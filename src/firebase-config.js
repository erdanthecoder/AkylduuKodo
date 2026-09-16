// firebase-config.js
//
// Paste your Firebase web config here to turn on real accounts (Google sign-in,
// email sign-up) and cloud-saved progress.
//
//   1. console.firebase.google.com → your project → ⚙️ Project settings
//   2. "Your apps" → Web app → copy the `firebaseConfig` object
//   3. Replace `null` below with that object
//   4. Authentication → Sign-in method → enable **Google** and **Email/Password**
//   5. Authentication → Settings → Authorized domains → add `akylduukodo.web.app`
//   6. Firestore Database → Create database (production mode) and use the rules
//      in README ("Cloud save") so each learner can only read/write their own row
//
// These values are NOT secrets — a Firebase web config is meant to be public.
// What protects the data is the Firestore rules, not hiding this file.
//
// Set this back to `null` at any time to fall back to device mode (sign-up still
// works, but accounts and progress stay in one browser).

export const firebaseConfig = {
  apiKey: 'AIzaSyDXrMgT80j7-0M-Uwx4MRzKHTfX5LdPRsU',
  authDomain: 'akylduukodo.firebaseapp.com',
  projectId: 'akylduukodo',
  storageBucket: 'akylduukodo.firebasestorage.app',
  messagingSenderId: '482873423827',
  appId: '1:482873423827:web:cc5d3772d1777479da6126',
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
