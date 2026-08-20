const API_BASE = import.meta.env.VITE_API_BASE || '/api/index.php';

const request = async (action, payload = {}) => {
  const response = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error || `API isteği başarısız (${response.status})`);
  return body;
};

const revive = (value) => {
  if (Array.isArray(value)) return value.map(revive);
  if (!value || typeof value !== 'object') return value;
  if (value.__date) {
    const date = new Date(value.__date);
    return { toMillis: () => date.getTime(), toDate: () => date, toJSON: () => date.toISOString() };
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
};

const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    if (typeof value.toJSON === 'function') return value.toJSON();
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  }
  return value;
};

export const serverTimestamp = () => new Date().toISOString();
export const collection = (_db, name) => ({ kind: 'collection', name, constraints: [] });
export const doc = (_db, name, id) => ({ kind: 'doc', name, id });
export const where = (field, operator, value) => ({ field, operator, value: clean(value) });
export const query = (ref, ...constraints) => ({ ...ref, constraints });

export async function getDocs(ref) {
  const body = await request('list', { collection: ref.name, filters: ref.constraints || [] });
  const docs = (body.items || []).map((item) => {
    const { id, ...data } = item;
    return { id, data: () => revive(data) };
  });
  return { docs, empty: docs.length === 0, forEach: (callback) => docs.forEach(callback) };
}

export async function getDoc(ref) {
  const body = await request('get', { collection: ref.name, id: ref.id });
  return { exists: () => Boolean(body.item), data: () => revive(body.item || {}) };
}

export async function addDoc(ref, data) {
  const body = await request('create', { collection: ref.name, data: clean(data) });
  return { id: body.id };
}

export async function setDoc(ref, data) {
  await request('set', { collection: ref.name, id: ref.id, data: clean(data) });
}

export async function updateDoc(ref, data) {
  await request('update', { collection: ref.name, id: ref.id, data: clean(data) });
}

export async function deleteDoc(ref) {
  await request('delete', { collection: ref.name, id: ref.id });
}
