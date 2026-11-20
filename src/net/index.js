// net/index.js — the one door between the app and its data.
//
// Everything else in Quickzy talks to `net` and never to Firebase directly.
// That is what lets the same code run on the real servers in production and on
// dev/server.mjs during development, where a dozen browser tabs can play one
// game against each other with no internet at all.
//
// The interface (both adapters implement exactly this):
//
//   net.auth   current() onChange(cb) anon() google() signUp(email, pass)
//              signIn(email, pass) signOut() sendReset(email) sendVerify()
//              setDisplayName(name) changePassword(current, next)
//              reauth(password?) deleteAccount() reload()
//
//   net.store  get(col, id) set(col, id, data, {merge}) update(col, id, data)
//              del(col, id) add(col, data) query(col, {where, orderBy, limit})
//              count(col, {where}) batch(steps) serverTime() increment(n)
//
//   net.live   get(path) set(path, v) update(path, values) remove(path)
//              push(path, v) on(path, cb) onChild(path, cb) query(path, opts)
//              transaction(path, fn) onDisconnect(path, {remove}|{set})
//              now() TIMESTAMP

let chosen = null;

const LOCAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname);

/**
 * On localhost only: ?emulator=1 runs against the Firebase emulators (real
 * SDK, real security rules), and stays on for this tab until ?emulator=0.
 */
export function useEmulator() {
  if (!LOCAL) return false;
  const q = new URLSearchParams(location.search).get('emulator');
  try {
    if (q === '1') sessionStorage.setItem('quickzy.emulator', '1');
    if (q === '0') sessionStorage.removeItem('quickzy.emulator');
    return sessionStorage.getItem('quickzy.emulator') === '1';
  } catch { return q === '1'; }
}

async function isDevServer() {
  if (!LOCAL || useEmulator()) return false;
  if (new URLSearchParams(location.search).get('backend') === 'firebase') return false;
  try {
    const res = await fetch('/__dev/ping', { cache: 'no-store' });
    return res.ok && (await res.json()).dev === true;
  } catch {
    return false;
  }
}

export async function connect() {
  if (chosen) return chosen;
  chosen = (async () => {
    const mod = (await isDevServer())
      ? await import('./dev.js')
      : await import('./firebase.js');
    const adapter = await mod.create();
    Object.assign(net, adapter);
    return net;
  })();
  return chosen;
}

/** Filled in by connect(). Import this, then await connect() once at boot. */
export const net = { kind: 'pending' };

/** A readable sentence for any error the backend throws. */
export function explain(err) {
  const code = (err && (err.code || err.message)) || '';
  const map = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/email-already-in-use': 'There is already an account with that email. Try signing in instead.',
    'auth/weak-password': 'Use at least 8 characters for your password.',
    'auth/invalid-credential': 'That email or password is not right.',
    'auth/wrong-password': 'That email or password is not right.',
    'auth/user-not-found': 'That email or password is not right.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/popup-closed-by-user': 'The Google window was closed before signing in finished.',
    'auth/cancelled-popup-request': 'The Google window was closed before signing in finished.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'Could not reach the server. Check your connection.',
    'auth/requires-recent-login': 'For your safety, sign in again before doing that.',
    'auth/unauthorized-domain': 'This web address is not allowed to sign in yet. The site owner needs to add it in Firebase.',
    'auth/operation-not-allowed': 'That way of signing in is not switched on yet. The site owner needs to enable it in Firebase.',
    'auth/admin-restricted-operation': 'Playing as a guest is not switched on yet. The site owner needs to enable Anonymous sign-in in Firebase.',
    'auth/unauthorized-continue-uri': 'This web address is not allowed yet. The site owner needs to add it to the authorized domains in Firebase.',
    'auth/missing-password': 'Type your password.',
    'auth/invalid-login-credentials': 'That email or password is not right.',
    'auth/user-mismatch': 'That is a different account from the one signed in.',
    'auth/credential-already-in-use': 'That account is already in use.',
    'permission-denied': 'You are not allowed to do that.',
    PERMISSION_DENIED: 'You are not allowed to do that.',
    unavailable: 'The server could not be reached. Check your connection.',
  };
  for (const [key, text] of Object.entries(map)) if (String(code).includes(key)) return text;
  return 'Something went wrong. Try again in a moment.';
}
