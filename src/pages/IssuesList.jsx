import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Wrench, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function IssuesList() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [sorumlular, setSorumlular] = useState([]);
  const [secilenSorumluEmail, setSecilenSorumluEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Hepsi'); // Hepsi, Açık, İşlemde, Çözüldü

  const isAdmin = userRole === 'admin';

  // Yönetici ise sorumlular listesini çek
  useEffect(() => {
    if (isAdmin) {
      const sorumlulariGetir = async () => {
        try {
          const snapshot = await getDocs(collection(db, "sorumlular"));
          const liste = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSorumlular(liste);
        } catch (err) {
          console.error("Sorumlular getirilirken hata:", err);
        }
      };
      sorumlulariGetir();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchIssues();
  }, [currentUser, filter, secilenSorumluEmail]);

  const fetchIssues = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let issueList = [];

      if (isAdmin) {
        let q;
        if (filter === 'Hepsi') {
          q = query(collection(db, "arizalar"));
        } else {
          q = query(collection(db, "arizalar"), where("durum", "==", filter));
        }
        const querySnapshot = await getDocs(q);
        issueList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Yönetici bir sorumlu seçtiyse
        if (secilenSorumluEmail) {
          const makineQuery = query(collection(db, "makineler"), where("ekleyen_email", "==", secilenSorumluEmail));
          const makineSnapshot = await getDocs(makineQuery);
          const sorumlununMakineKodlari = makineSnapshot.docs.map(doc => doc.data().kod).filter(Boolean);
          const sorumlununMakineIdleri = makineSnapshot.docs.map(doc => doc.id).filter(Boolean);

          issueList = issueList.filter(issue => 
            issue.ekleyen_email === secilenSorumluEmail ||
            issue.sorumlu_email === secilenSorumluEmail ||
            sorumlununMakineKodlari.includes(issue.makine_kod) || 
            sorumlununMakineIdleri.includes(issue.makine_id)
          );
        }
      } else {
        // SORUMLU KULLANICI: Sadece kendi mailine ait makineleri ve arızaları getir
        const makineQuery = query(collection(db, "makineler"), where("ekleyen_email", "==", currentUser.email));
        const makineSnapshot = await getDocs(makineQuery);
        const sorumlununMakineKodlari = makineSnapshot.docs.map(doc => doc.data().kod).filter(Boolean);
        const sorumlununMakineIdleri = makineSnapshot.docs.map(doc => doc.id).filter(Boolean);

        const querySnapshot = await getDocs(collection(db, "arizalar"));
        issueList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        issueList = issueList.filter(issue => {
          const mailEslesmesi = 
            issue.ekleyen_email === currentUser.email || 
            issue.sorumlu_email === currentUser.email || 
            issue.email === currentUser.email;

          const makineEslesmesi = 
            (issue.makine_kod && sorumlununMakineKodlari.includes(issue.makine_kod)) || 
            (issue.makine_id && sorumlununMakineIdleri.includes(issue.makine_id));

          return mailEslesmesi || makineEslesmesi;
        });

        if (filter !== 'Hepsi') {
          issueList = issueList.filter(issue => issue.durum === filter);
        }
      }
      
      issueList.sort((a, b) => (b.olusturulma_tarihi?.toMillis() || 0) - (a.olusturulma_tarihi?.toMillis() || 0));
      setIssues(issueList);
    } catch (err) {
      console.error("Arızalar getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Açık': return 'var(--color-status-open)';
      case 'İşlemde': return 'var(--color-status-progress)';
      case 'Çözüldü': return 'var(--color-status-resolved)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Açık': return <AlertCircle size={24} color={getStatusColor(status)} />;
      case 'İşlemde': return <Wrench size={24} color={getStatusColor(status)} />;
      case 'Çözüldü': return <CheckCircle2 size={24} color={getStatusColor(status)} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', marginRight: '1rem' }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Arıza Kayıtları</h2>
        </div>
      </div>

      {isAdmin && (
        <div className="card mb-3" style={{ padding: '0.8rem 1rem', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
          <div className="flex items-center" style={{ marginBottom: '0.4rem' }}>
            <UserCheck size={18} color="var(--color-primary)" style={{ marginRight: '0.5rem' }} />
            <label htmlFor="sorumluFilter" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>
              Sorumluya Ait Makinelerin Arızaları
            </label>
          </div>
          <select
            id="sorumluFilter"
            value={secilenSorumluEmail}
            onChange={(e) => setSecilenSorumluEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '0.95rem', outline: 'none' }}
          >
            <option value="">Tüm Sorumlular (Genel Görünüm)</option>
            {sorumlular.map(sorumlu => (
              <option key={sorumlu.id} value={sorumlu.email}>
                {sorumlu.ad_soyad} ({sorumlu.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex mb-3" style={{ backgroundColor: '#E0E0E0', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
        {['Hepsi', 'Açık', 'İşlemde', 'Çözüldü'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: filter === f ? 'var(--color-surface)' : 'transparent',
              color: filter === f ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontWeight: filter === f ? 600 : 400,
              boxShadow: filter === f ? 'var(--box-shadow-sm)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div>
        {loading ? (
          <div className="text-center mt-2">Arızalar yükleniyor...</div>
        ) : issues.length === 0 ? (
          <div className="card text-center text-muted mt-2">
            Bu filtreye uygun arıza kaydı bulunamadı.
          </div>
        ) : (
          issues.map(issue => (
            <div 
              key={issue.id} 
              className="card flex justify-between items-center" 
              style={{ padding: '1rem', cursor: 'pointer', borderLeft: `4px solid ${getStatusColor(issue.durum)}` }}
              onClick={() => navigate(`/issues/${issue.id}`)}
            >
              <div className="flex gap-3 items-center">
                <div style={{ backgroundColor: '#F5F5F5', padding: '0.5rem', borderRadius: '50%' }}>
                  {getStatusIcon(issue.durum)}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>{issue.makine_ad}</h4>
                  <div className="flex gap-2 items-center" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>{issue.makine_kod}</span>
                    <span>•</span>
                    <span>{issue.olusturulma_tarihi?.toDate().toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.3rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {issue.aciklama}
                  </p>
                </div>
              </div>
              <ChevronRight size={24} color="var(--color-text-muted)" />
            </div>
          ))
        )}
      </div>

    </div>
  );
}