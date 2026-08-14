import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, QrCode as QrIcon, Edit2, X, Check } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';

export default function MachineManager() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Yönetici kontrolü (admin ise true döner)
  const isAdmin = userRole === 'admin';

  // Add Machine Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit Machine State
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [editMachineName, setEditMachineName] = useState('');

  // Yönetici Filtreleme State'i
  const [selectedSorumlu, setSelectedSorumlu] = useState('ALL');

  useEffect(() => {
    fetchMachines();
  }, [currentUser]);

  const fetchMachines = async () => {
    if (!currentUser) return;

    if (!currentUser.bolum_idler || currentUser.bolum_idler.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const bolumId = currentUser.bolum_idler[0];
      const q = query(collection(db, "makineler"), where("bolum_id", "==", bolumId));
      const querySnapshot = await getDocs(q);
      const machineList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMachines(machineList);
    } catch (err) {
      console.error("Makineler getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateMachineCode = () => {
    const prefix = "MKN";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (isAdmin) return; // Yöneticiler ekleyemez
    if (!newMachineName.trim()) return;

    setAdding(true);
    try {
      const bolumId = currentUser.bolum_idler[0];
      const newCode = generateMachineCode();
      await addDoc(collection(db, "makineler"), {
        kod: newCode,
        ad: newMachineName,
        bolum_id: bolumId,
        bolum_ad: "Bölüm Bilgisi",
        ekleyen_sorumlu_id: currentUser.id,
        ekleyen_email: currentUser.email || 'Bilinmiyor',
        olusturulma_tarihi: serverTimestamp(),
        aktif: true
      });
      setNewMachineName('');
      setShowAddForm(false);
      fetchMachines();
    } catch (err) {
      console.error("Makine eklenirken hata:", err);
      alert('Makine eklenemedi!');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (isAdmin) return; // Yöneticiler silemez
    if (window.confirm("Bu makineyi silmek istediğinize emin misiniz? Arıza kayıtları yetim kalabilir.")) {
      try {
        await deleteDoc(doc(db, "makineler", machineId));
        fetchMachines();
      } catch (err) {
        console.error("Makine silinirken hata:", err);
        alert('Makine silinemedi!');
      }
    }
  };

  const handleEditClick = (machine) => {
    if (isAdmin) return; // Yöneticiler düzenleyemez
    setEditingMachineId(machine.id);
    setEditMachineName(machine.ad);
  };

  const handleSaveEdit = async (machineId) => {
    if (isAdmin) return;
    if (!editMachineName.trim()) return;

    try {
      await updateDoc(doc(db, "makineler", machineId), {
        ad: editMachineName
      });
      setMachines(machines.map(m => m.id === machineId ? { ...m, ad: editMachineName } : m));
      setEditingMachineId(null);
    } catch (err) {
      console.error("Makine güncellenirken hata:", err);
      alert('Makine güncellenemedi!');
    }
  };

  const downloadQR = async (code, name) => {
    try {
      const qrUrl = `${window.location.origin}/machine/${code}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 400, margin: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height + 60;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(code, canvas.width / 2, img.height + 30);
        
        const link = document.createElement('a');
        link.download = `QR_${name}_${code}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.src = qrDataUrl;
    } catch (err) {
      console.error("QR üretilirken hata:", err);
      alert('QR Kod üretilemedi.');
    }
  };

  // Benzersiz sorumluların e-posta listesi (Yöneticiler için filtre menüsü için)
  const uniqueSorumlular = [...new Set(machines.map(m => m.ekleyen_email).filter(Boolean))];

  // Filtreleme Mantığı:
  // - Eğer kullanıcı yönetici (isAdmin) ise: Seçtiği sorumluyu baz alır (ALL ise hepsini gösterir).
  // - Eğer kullanıcı sorumlu ise: Sadece kendi e-postasına ait makineleri gösterir.
  const filteredMachines = machines.filter(machine => {
    if (isAdmin) {
      if (selectedSorumlu === 'ALL') return true;
      return machine.ekleyen_email === selectedSorumlu;
    } else {
      return machine.ekleyen_email === currentUser?.email;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div className="flex items-center mb-3">
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', marginRight: '1rem' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Makine Yönetimi</h2>
      </div>

      {/* Sadece yönetici olmayanlar (sorumlular) makine ekleme butonunu görebilir */}
      {!isAdmin && (
        <>
          {!showAddForm ? (
            <button 
              className="btn btn-primary mb-3" 
              style={{ width: '100%' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} /> Yeni Makine Ekle
            </button>
          ) : (
            <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
              <h3 className="mb-2">Yeni Makine Ekle</h3>
              <form onSubmit={handleAddMachine}>
                <div className="input-group">
                  <label className="input-label">Makine Adı / Modeli</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newMachineName}
                    onChange={(e) => setNewMachineName(e.target.value)}
                    placeholder="Örn: Laminasyon 1"
                    required
                    autoFocus
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Makine kodu sistem tarafından otomatik üretilecektir.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>Vazgeç</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, cursor: adding ? 'not-allowed' : 'pointer' }} disabled={adding}>
                    {adding ? 'Ekleniyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* YÖNETİCİLER İÇİN SORUMLU FİLTRELEME ALANI */}
      {isAdmin && (
        <div className="card mb-3" style={{ padding: '0.8rem 1rem' }}>
          <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
            Sorumluya Göre Filtrele
          </label>
          <select 
            className="input-field"
            value={selectedSorumlu}
            onChange={(e) => setSelectedSorumlu(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="ALL">Tüm Sorumlular (Tüm Makineler)</option>
            {uniqueSorumlular.map((email, index) => (
              <option key={index} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 className="mb-2" style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          {isAdmin ? 'Bölümdeki Makineler (Filtrelenmiş)' : 'Sizin Eklediğiniz Makineler'}
        </h3>
        
        {loading ? (
          <div className="text-center">Makineler yükleniyor...</div>
        ) : filteredMachines.length === 0 ? (
          <div className="card text-center text-muted">
            {isAdmin && selectedSorumlu !== 'ALL' 
              ? 'Bu sorumlunun eklediği makine bulunamadı.' 
              : !isAdmin 
              ? 'Henüz size ait eklenmiş bir makine yok.' 
              : 'Henüz bu bölüme ait makine eklenmemiş.'}
          </div>
        ) : (
          filteredMachines.map(machine => (
            <div key={machine.id} className="card flex justify-between items-center" style={{ padding: '1rem' }}>
              <div style={{ flex: 1 }}>
                {editingMachineId === machine.id && !isAdmin ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="text" 
                      value={editMachineName} 
                      onChange={(e) => setEditMachineName(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.3rem', fontSize: '1rem' }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{machine.ad}</h4>
                )}
                
                <div className="flex items-center gap-2" style={{ marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', background: '#eee', display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                    {machine.kod}
                  </div>
                  
                  {/* Ekleyen kişinin mail adresi */}
                  {machine.ekleyen_email && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Ekleyen: <span style={{ fontWeight: '500' }}>{machine.ekleyen_email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2" style={{ marginLeft: '1rem' }}>
                {editingMachineId === machine.id && !isAdmin ? (
                  <>
                    <button onClick={() => handleSaveEdit(machine.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-resolved)', padding: '0.5rem' }}>
                      <Check size={20} />
                    </button>
                    <button onClick={() => setEditingMachineId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.5rem' }}>
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    {/* QR İndirme butonu hem yönetici hem sorumlularda görünür */}
                    <button 
                      onClick={() => downloadQR(machine.kod, machine.ad)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '0.5rem' }}
                      title="QR Kodu İndir"
                    >
                      <QrIcon size={20} />
                    </button>
   
                    {/* Düzenleme ve Silme butonları SADECE yönetici olmayanlar (sorumlular) için görünür */}
                    {!isAdmin && (
                      <>
                        <button 
                          onClick={() => handleEditClick(machine)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '0.5rem' }}
                          title="Makineyi Düzenle"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMachine(machine.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-open)', padding: '0.5rem' }}
                          title="Makineyi Sil"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}