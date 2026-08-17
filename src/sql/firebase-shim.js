const API_BASE = import.meta.env.VITE_API_URL || '';
const listeners = new Set();
const key = 'sesa_sql_user';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'İstek başarısız.');
  return payload;
}

export function initializeApp(config) { return { config }; }
export function getAuth() { return {}; }
export function getFirestore() { return {}; }
export function getStorage() { return {}; }
export function serverTimestamp() { return { _serverTimestamp: true }; }

function notify() { const raw = localStorage.getItem(key); const user = raw ? JSON.parse(raw) : null; listeners.forEach((callback) => callback(user)); }
export function onAuthStateChanged(_auth, callback) { listeners.add(callback); callback(JSON.parse(localStorage.getItem(key) || 'null')); return () => listeners.delete(callback); }
export async function signInWithEmailAndPassword(_auth, email, password) { const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem(key, JSON.stringify(result.user)); notify(); return { user: result.user }; }
export async function createUserWithEmailAndPassword(_auth, email, password) { const result = await request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem(key, JSON.stringify(result.user)); notify(); return { user: result.user }; }
export async function signOut() { localStorage.removeItem(key); notify(); }

export function collection(_db, name) { return { type: 'collection', name }; }
export function doc(_db, collectionName, id) { return { type: 'doc', name: collectionName, id }; }
export function where(field, operator, value) { return { field, operator, value }; }
export function query(ref, ...constraints) { return { ...ref, constraints }; }
function refInfo(ref) { return { name: ref.name, id: ref.id, constraints: ref.constraints || [] }; }
function mapQuery(ref) { const { name, id, constraints } = refInfo(ref); const params = new URLSearchParams(); constraints.filter((item) => item.operator === '==').forEach((item) => params.set(item.field, item.value)); return `/api/collections/${name}${id ? `/${id}` : ''}${params.toString() ? `?${params}` : ''}`; }
function snapshot(data, id) { if (Array.isArray(data)) return { empty: data.length === 0, docs: data.map((item) => ({ id: item.id, data: () => item })) }; return { exists: () => Boolean(data), id, data: () => data }; }
export async function getDocs(ref) { return snapshot(await request(mapQuery(ref))); }
export async function getDoc(ref) { return snapshot(await request(mapQuery(ref)), ref.id); }
export async function addDoc(ref, data) { const created = await request(`/api/collections/${ref.name}`, { method: 'POST', body: JSON.stringify(data) }); return { id: created.id, data: () => created }; }
export async function setDoc(ref, data) { const created = await request(`/api/collections/${ref.name}`, { method: 'POST', body: JSON.stringify({ ...data, id: ref.id }) }); return { id: created.id, data: () => created }; }
export async function updateDoc(ref, data) { const updated = await request(`/api/collections/${ref.name}/${ref.id}`, { method: 'PATCH', body: JSON.stringify(data) }); return { id: updated.id, data: () => updated }; }
export async function deleteDoc(ref) { return request(`/api/collections/${ref.name}/${ref.id}`, { method: 'DELETE' }); }
