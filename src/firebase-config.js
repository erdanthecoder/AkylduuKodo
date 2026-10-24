// firebase-config.js
//
// The same Firebase project the old site used, because Malika Study is a second
// Hosting site inside it: one project, one database, one sign-in setup.
//
// These values are not secrets. A Firebase web config is meant to be public —
// what protects the data is firestore.rules, not hiding this file.
//
// Still to do in the console, once:
//   1. Hosting → Add another site → `malikastudy`
//   2. Authentication → Settings → Authorized domains → add `malikastudy.web.app`
//   3. Authentication → Sign-in method → turn on **Google** and **Anonymous**
//      (Google is for the dashboard; anonymous is how Malika's tablet saves)
//
// Set this to `null` to run with no server at all: everything still works, and
// her progress simply stays on the one device.

export const firebaseConfig = {
  apiKey: 'AIzaSyDXrMgT80j7-0M-Uwx4MRzKHTfX5LdPRsU',
  authDomain: 'akylduukodo.firebaseapp.com',
  projectId: 'akylduukodo',
  storageBucket: 'akylduukodo.firebasestorage.app',
  messagingSenderId: '482873423827',
  appId: '1:482873423827:web:cc5d3772d1777479da6126',
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
