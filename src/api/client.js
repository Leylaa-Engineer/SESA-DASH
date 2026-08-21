<<<<<<< HEAD
// client.js içindeki makine fonksiyonlarını bu şekilde güncelle veya ekle:
export const mysqlApi = {
  // ... diğer API fonksiyonların burada kalabilir ...

  async machines() {
    // Tarayıcı hafızasından makineleri al, yoksa boş dizi dön
    const saved = localStorage.getItem('sesa_machines_local');
    if (!saved) {
      const initial = [
        { id: 1, ad: "Test Laminasyon Makinesi", kod: "MKN-1234", bolum_id: "1", ekleyen_email: "" }
      ];
      localStorage.setItem('sesa_machines_local', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(saved);
  },

  async createMachine(machineData) {
    const machines = await this.machines();
    const newMachine = {
      id: Date.now(),
      ad: machineData.ad || 'Yeni Makine',
      kod: machineData.kod || `MKN-${Math.floor(1000 + Math.random() * 9000)}`,
      bolum_id: machineData.bolum_id || "1",
      ekleyen_email: machineData.ekleyen_email || ''
    };
    
    machines.push(newMachine);
    localStorage.setItem('sesa_machines_local', JSON.stringify(machines));
    return { success: true, machine: newMachine };
  },

  async deleteMachine(machineId) {
    let machines = await this.machines();
    machines = machines.filter(m => m.id !== machineId);
    localStorage.setItem('sesa_machines_local', JSON.stringify(machines));
    return { success: true };
  },

  async updateMachine(machineId, updateData) {
    let machines = await this.machines();
    machines = machines.map(m => m.id === machineId ? { ...m, ...updateData } : m);
    localStorage.setItem('sesa_machines_local', JSON.stringify(machines));
    return { success: true };
  }
};
=======
const API_BASE = import.meta.env.VITE_API_BASE || '/api/index.php';
const TOKEN_KEY = 'sesa_php_session';

export function getAccessToken() { return localStorage.getItem(TOKEN_KEY); }
export function setAccessToken(token) { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }

export async function apiRequest(action, payload = {}) {
  const response = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(data.error || `API isteği başarısız: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const list = async (collection, filters = []) => (await apiRequest('list', { collection, filters })).items || [];
const get = async (collection, id) => (await apiRequest('get', { collection, id })).item;
const create = async (collection, data) => apiRequest('create', { collection, data });
const update = async (collection, id, data) => apiRequest('update', { collection, id, data });
const remove = async (collection, id) => apiRequest('delete', { collection, id });

export const mysqlApi = {
  health: () => apiRequest('session'),
  login: async (data) => { const result = await apiRequest('login', data); setAccessToken('session'); return { ...result, token: 'session' }; },
  register: async (data) => { const result = await apiRequest('register', data); setAccessToken('session'); return { ...result, token: 'session' }; },
  me: async () => (await apiRequest('session')).user,
  logout: () => apiRequest('logout'),
  createUser: (data) => create('sorumlular', data),
  departments: () => list('bolumler'),
  machines: (code = '') => list('makineler', code ? [{ field: 'kod', operator: '==', value: code }] : []),
  createMachine: (data) => create('makineler', data),
  updateMachine: (id, data) => update('makineler', id, data),
  deleteMachine: (id) => remove('makineler', id),
  issues: (status = '') => list('arizalar', status ? [{ field: 'durum', operator: '==', value: status }] : []),
  createIssue: (data) => create('arizalar', data),
  users: () => list('sorumlular'),
  updateUser: (id, data) => update('sorumlular', id, data),
  deleteUser: (id) => remove('sorumlular', id),
  issue: (id) => get('arizalar', id),
  updateIssue: (id, data) => update('arizalar', id, data),
  deleteIssue: (id) => remove('arizalar', id),
};
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954
