import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, SlidersHorizontal, UserCheck, Wrench } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const filters = ['Hepsi', 'Açık', 'İşlemde', 'Çözüldü'];

export default function IssuesList() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [sorumlular, setSorumlular] = useState([]);
  const [secilenSorumluEmail, setSecilenSorumluEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Hepsi');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, 'sorumlular')).then((snapshot) => setSorumlular(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))).catch(console.error);
  }, [isAdmin]);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        let list;
        if (isAdmin) {
          const issueQuery = filter === 'Hepsi' ? query(collection(db, 'arizalar')) : query(collection(db, 'arizalar'), where('durum', '==', filter));
          list = (await getDocs(issueQuery)).docs.map((item) => ({ id: item.id, ...item.data() }));
          if (secilenSorumluEmail) {
            const machines = (await getDocs(query(collection(db, 'makineler'), where('ekleyen_email', '==', secilenSorumluEmail)))).docs.map((item) => ({ id: item.id, ...item.data() }));
            const codes = machines.map((machine) => machine.kod).filter(Boolean);
            const ids = machines.map((machine) => machine.id);
            list = list.filter((issue) => issue.ekleyen_email === secilenSorumluEmail || issue.sorumlu_email === secilenSorumluEmail || codes.includes(issue.makine_kod) || ids.includes(issue.makine_id));
          }
        } else {
          const machines = (await getDocs(query(collection(db, 'makineler'), where('ekleyen_email', '==', currentUser.email)))).docs.map((item) => ({ id: item.id, ...item.data() }));
          const codes = machines.map((machine) => machine.kod).filter(Boolean);
          const ids = machines.map((machine) => machine.id);
          list = (await getDocs(collection(db, 'arizalar'))).docs.map((item) => ({ id: item.id, ...item.data() })).filter((issue) => issue.ekleyen_email === currentUser.email || issue.sorumlu_email === currentUser.email || issue.email === currentUser.email || codes.includes(issue.makine_kod) || ids.includes(issue.makine_id));
          if (filter !== 'Hepsi') list = list.filter((issue) => issue.durum === filter);
        }
        list.sort((a, b) => (b.olusturulma_tarihi?.toMillis?.() || 0) - (a.olusturulma_tarihi?.toMillis?.() || 0));
        setIssues(list);
      } catch (error) { console.error('Arızalar getirilirken hata:', error); } finally { setLoading(false); }
    };
    fetchIssues();
  }, [currentUser, filter, secilenSorumluEmail, isAdmin]);

  const status = (value) => ({ Açık: { color: 'var(--color-status-open)', icon: AlertCircle }, İşlemde: { color: 'var(--color-status-progress)', icon: Wrench }, Çözüldü: { color: 'var(--color-status-resolved)', icon: CheckCircle2 } }[value] || { color: 'var(--color-text-muted)', icon: AlertCircle });

  return (
    <div>
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={17} />Operasyon merkezine dön</button>
      <header className="page-header"><div><span className="eyebrow"><ClipboardList size={14} /> Arıza yönetimi</span><h1 className="page-title">Arıza kayıtları</h1><p className="page-subtitle">Kayıtları durumuna ve ekip sorumlusuna göre filtreleyin.</p></div></header>
      {isAdmin && <section className="filter-panel" style={{ marginBottom: '0.8rem' }}><label className="input-label" htmlFor="sorumlu-filter"><UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Sorumlu görünümü</label><select id="sorumlu-filter" className="input-field" value={secilenSorumluEmail} onChange={(event) => setSecilenSorumluEmail(event.target.value)}><option value="">Tüm sorumlular ve makineler</option>{sorumlular.map((sorumlu) => <option key={sorumlu.id} value={sorumlu.email}>{sorumlu.ad_soyad} ({sorumlu.email})</option>)}</select></section>}
      <section className="filter-tabs" aria-label="Arıza durumu filtresi">{filters.map((item) => <button key={item} className={`filter-tab ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}</section>
      <section className="issue-list">{loading ? <div className="empty-state">Kayıtlar yükleniyor…</div> : issues.length === 0 ? <div className="empty-state"><SlidersHorizontal size={22} style={{ marginBottom: 8 }} /><br />Bu filtreye uygun arıza kaydı bulunamadı.</div> : issues.map((issue) => { const { color, icon: Icon } = status(issue.durum); const date = issue.olusturulma_tarihi?.toDate?.().toLocaleDateString('tr-TR') || 'Tarih bekleniyor'; return <button key={issue.id} className="issue-row" style={{ '--status-color': color }} onClick={() => navigate(`/issues/${issue.id}`)}><span className="issue-icon"><Icon size={20} /></span><span className="issue-main"><h3>{issue.makine_ad || 'Adı tanımlanmamış makine'}</h3><span className="issue-meta"><span>{issue.makine_kod || 'Kodsuz'}</span><span>•</span><span>{date}</span><span className="status-pill" style={{ color, padding: '0.16rem 0.38rem' }}>{issue.durum || 'Durum yok'}</span></span><span className="issue-description">{issue.aciklama || 'Açıklama girilmemiş.'}</span></span><ChevronRight size={18} color="var(--color-text-muted)" /></button>; })}</section>
    </div>
  );
}
