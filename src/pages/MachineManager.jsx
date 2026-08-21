import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, QrCode as QrIcon, Edit2, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';

export default function MachineManager() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [selectedBolumId, setSelectedBolumId] = useState('1');
  const [adding, setAdding] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [editMachineName, setEditMachineName] = useState('');
  const [selectedSorumlu, setSelectedSorumlu] = useState('ALL');

  const isAdmin = userRole === 'admin';
  const canAddMachine = isAdmin || userRole === 'sorumlu';

  useEffect(() => {
    fetchMachines();
  }, []);

  // Sunucudan gelen veriyi konsola basarak doğrulayan güncellenmiş fonksiyon
 const fetchMachines = async () => {
    setLoading(true);
    try {
      const response = await fetch('api/index.php');
      const data = await response.json();
      
      console.log("Gelen Veri:", data);

      // Gelen veri doğrudan bir dizi ise direkt al
      if (Array.isArray(data)) {
        setMachines(data);
      } 
      // Eğer bir nesne içindeyse ve içinde 'machines' anahtarı varsa onu al
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.machines)) {
          setMachines(data.machines);
        } else {
          // Eğer nesne başka bir yapıda ise diziye çevir
          setMachines(Object.values(data));
        }
      } else {
        setMachines([]);
      }
    } catch (err) {
      console.error("Makine yükleme hatası:", err);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };
  const handleAddMachine = async (e) => {
    e.preventDefault();
    setAdding(true);
    const newMachine = { 
      id: Date.now().toString(), 
      ad: newMachineName, 
      kod: "MKN-" + Math.floor(Math.random()*9000), 
      bolum_id: selectedBolumId, 
      ekleyen_email: currentUser?.email 
    };

    setMachines(prev => [...prev, newMachine]);

    try {
      await fetch('api/index.php', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ action: 'add_machine', ...newMachine }) 
      });
    } catch (err) {
      console.error("Ekleme hatası:", err);
    }

    setNewMachineName(''); 
    setShowAddForm(false); 
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Silinsin mi?")) return;
    setMachines(prev => prev.filter(m => m.id !== id));
    
    try {
      await fetch('api/index.php', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'delete_machine', id }) 
      });
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  const downloadQR = async (m) => {
    const dataUrl = await QRCode.toDataURL(`${window.location.origin}/machine/${m.kod}`);
    const link = document.createElement('a');
    link.download = `QR_${m.ad}.png`;
    link.href = dataUrl;
    link.click();
  };

  const filteredMachines = machines; 
  
    

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/dashboard')}><ArrowLeft size={24} /></button>
        <h2 className="ml-4 text-xl font-bold">Makine Yönetimi</h2>
      </div>

      {canAddMachine && (
        <button onClick={() => setShowAddForm(!showAddForm)} className="w-full btn-primary mb-4 py-2">
          {showAddForm ? 'İptal' : 'Yeni Makine Ekle'}
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMachine} className="card p-4 mb-4">
          <input className="w-full mb-2 p-2 border" placeholder="Makine Adı" value={newMachineName} onChange={(e) => setNewMachineName(e.target.value)} required />
          <button className="w-full btn-primary" disabled={adding}>{adding ? 'Ekleniyor...' : 'Kaydet'}</button>
        </form>
      )}

      {loading ? <Loader2 className="animate-spin mx-auto" /> : filteredMachines.length === 0 ? (
        <div className="text-center p-4 text-gray-500">Henüz kayıtlı makine bulunmuyor.</div>
      ) : (
        filteredMachines.map(m => (
          <div key={m.id || m.kod} className="card p-4 mb-2 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{m.ad}</h3>
              <p className="text-xs text-gray-500">{m.kod}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadQR(m)} className="text-blue-500 p-1" title="QR İndir"><QrIcon size={20} /></button>
              <button onClick={() => handleDelete(m.id)} className="text-red-500 p-1" title="Sil"><Trash2 size={20} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}