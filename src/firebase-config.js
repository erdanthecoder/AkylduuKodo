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
// While this is `null`, the app runs in **device mode**: sign-up still works, but
// accounts and progress stay in this browser only.

export const firebaseConfig = null;

// Example of what it looks like once filled in:
//
// export const firebaseConfig = {
//   apiKey: 'AIza…',
//   authDomain: 'akylduukodo.firebaseapp.com',
//   projectId: 'akylduukodo',
//   storageBucket: 'akylduukodo.appspot.com',
//   messagingSenderId: '000000000000',
//   appId: '1:000000000000:web:abcdef123456',
// };

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
