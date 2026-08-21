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