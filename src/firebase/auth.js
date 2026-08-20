const API_BASE = import.meta.env.VITE_API_BASE || '/api/index.php';
const listeners = new Set();
let cachedUser;
let hydrated = false;

const request = async (action, payload = {}) => {
  const response = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error || 'Kimlik doğrulama isteği başarısız.');
  return body;
};

const notify = (user) => listeners.forEach((listener) => listener(user));
const auth = {};

export function onAuthStateChanged(_auth, listener) {
  listeners.add(listener);
  if (!hydrated) {
    request('session').then((body) => { cachedUser = body.user || null; hydrated = true; listener(cachedUser); notify(cachedUser); }).catch(() => { hydrated = true; cachedUser = null; listener(null); });
  } else listener(cachedUser || null);
  return () => listeners.delete(listener);
}

export async function signInWithEmailAndPassword(_auth, email, password) {
  const body = await request('login', { email, password });
  cachedUser = body.user;
  hydrated = true;
  notify(cachedUser);
  return { user: cachedUser };
}

export async function createUserWithEmailAndPassword(_auth, email, password) {
  const body = await request('register', { email, password });
  cachedUser = body.user;
  hydrated = true;
  notify(cachedUser);
  return { user: cachedUser };
}

export async function signOut(_auth) {
  await request('logout');
  cachedUser = null;
  hydrated = true;
  notify(null);
}

export { auth };
