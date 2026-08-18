import { auth } from '../firebase/config';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const authHeaders = await getAuthHeaders();
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `API request failed: ${response.status}`);
  return payload;
}

export const mysqlApi = {
  health: () => apiRequest('/api/health'),
  me: () => apiRequest('/api/users/me'),
  createUser: (data) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  departments: () => apiRequest('/api/departments'),
  machines: (code = '') => apiRequest(`/api/machines${code ? `?code=${encodeURIComponent(code)}` : ''}`),
  createMachine: (data) => apiRequest('/api/machines', { method: 'POST', body: JSON.stringify(data) }),
  updateMachine: (id, data) => apiRequest(`/api/machines/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMachine: (id) => apiRequest(`/api/machines/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  issues: (status = '') => apiRequest(`/api/issues${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  createIssue: (data) => apiRequest('/api/issues', { method: 'POST', body: JSON.stringify(data) }),
  users: () => apiRequest('/api/users/list'),
  updateUser: (id, data) => apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  issue: (id) => apiRequest(`/api/issues/${encodeURIComponent(id)}`),
  updateIssue: (id, data) => apiRequest(`/api/issues/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIssue: (id) => apiRequest(`/api/issues/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
