import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Hash, MapPin, Trash2, Wrench } from 'lucide-react';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const statusConfig = {
  Açık: { color: 'var(--color-status-open)', icon: AlertCircle, description: 'Yeni kayıt; aksiyon bekliyor.' },
  İşlemde: { color: 'var(--color-status-progress)', icon: Wrench, description: 'Ekip tarafından inceleniyor.' },
  Çözüldü: { color: 'var(--color-status-resolved)', icon: CheckCircle2, description: 'Çözüm kayda alındı.' },
};

export default function IssueDetail() {
  const { id } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const snapshot = await getDoc(doc(db, 'arizalar', id));
        if (!snapshot.exists()) return;
        const data = { id: snapshot.id, ...snapshot.data() };
        if (userRole !== 'admin') {
          const machines = (await getDocs(query(collection(db, 'makineler'), where('ekleyen_email', '==', currentUser.email)))).docs.map((item) => ({ id: item.id, ...item.data() }));
          const codes = machines.map((machine) => machine.kod).filter(Boolean);
          const ids = machines.map((machine) => machine.id);
          const permitted = data.ekleyen_email === currentUser.email || data.sorumlu_email === currentUser.email || data.email === currentUser.email || codes.includes(data.makine_kod) || ids.includes(data.makine_id);
          if (!permitted) { alert('Bu arıza kaydını görüntüleme yetkiniz yok.'); navigate('/issues'); return; }
        }
        setIssue(data);
        setCanDelete(true);
      } catch (error) { console.error('Arıza getirilirken hata:', error); } finally { setLoading(false); }
    };
    load();
  }, [id, currentUser, userRole, navigate]);

  const handleDelete = async () => {
    if (!canDelete || !window.confirm('Bu arıza kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try { await deleteDoc(doc(db, 'arizalar', id)); navigate('/issues'); } catch (error) { console.error(error); alert('Arıza kaydı silinemedi.'); }
  };

  const changeStatus = async (newStatus) => {
    if (!issue || issue.durum === newStatus) return;
    setUpdating(true);
    try {
      const update = { durum: newStatus, durum_gecmisi: [...(issue.durum_gecmisi || []), { durum: newStatus, tarih: new Date(), sorumlu_id: currentUser.uid || currentUser.id }] };
      if (newStatus === 'Çözüldü') { update.cozulme_tarihi = serverTimestamp(); update.cozen_sorumlu_id = currentUser.uid || currentUser.id; }
      if (issue.durum === 'Çözüldü' && newStatus !== 'Çözüldü') { update.cozulme_tarihi = null; update.cozen_sorumlu_id = null; }
      await updateDoc(doc(db, 'arizalar', id), update);
      setIssue((previous) => ({ ...previous, ...update, cozulme_tarihi: newStatus === 'Çözüldü' ? new Date() : update.cozulme_tarihi ?? previous.cozulme_tarihi }));
    } catch (error) { console.error('Durum güncellenirken hata:', error); alert('Durum güncellenemedi.'); } finally { setUpdating(false); }
  };

  if (loading) return <div className="empty-state">Arıza kaydı yükleniyor…</div>;
  if (!issue) return <div className="empty-state">Arıza kaydı bulunamadı veya kaldırılmış.</div>;

  const current = statusConfig[issue.durum] || statusConfig.Açık;
  const CurrentIcon = current.icon;
  const createdAt = issue.olusturulma_tarihi?.toDate?.().toLocaleString('tr-TR') || 'Tarih bilgisi bekleniyor';

  return (
    <div>
      <button className="back-button" onClick={() => navigate('/issues')}><ArrowLeft size={17} />Arıza kayıtlarına dön</button>
      <header className="page-header"><div><span className="eyebrow"><CurrentIcon size={14} /> Arıza kaydı</span><h1 className="page-title">{issue.makine_ad || 'Makine arızası'}</h1><p className="page-subtitle">{issue.makine_kod || 'Kodsuz kayıt'} · {createdAt}</p></div>{canDelete && <button className="btn btn-secondary danger-button" onClick={handleDelete}><Trash2 size={16} />Kaydı sil</button>}</header>
      <section className="status-overview" style={{ '--status-color': current.color }}><span className="status-overview__icon"><CurrentIcon size={24} /></span><span><span className="eyebrow" style={{ color: current.color }}>Mevcut durum</span><h2>{issue.durum || 'Açık'}</h2><p>{current.description}</p></span></section>
      <section className="status-actions" aria-label="Arıza durumu güncelleme">{Object.entries(statusConfig).map(([label, config]) => { const Icon = config.icon; const selected = issue.durum === label; return <button key={label} className={`status-action ${selected ? 'active' : ''}`} style={{ '--status-color': config.color }} onClick={() => changeStatus(label)} disabled={updating}><Icon size={18} /><span>{label}</span></button>; })}</section>
      <div className="detail-grid"><section className="card"><h2 className="section-heading"><Hash size={18} /> Makine bilgileri</h2><div className="detail-item"><span>Makine</span><strong>{issue.makine_ad || 'Tanımlanmamış'} <em>{issue.makine_kod || '—'}</em></strong></div><div className="detail-item"><span>Bölüm</span><strong><MapPin size={15} /> {issue.bolum_ad || 'Tanımlanmamış'}</strong></div></section><section className="card"><h2 className="section-heading"><AlertCircle size={18} /> Arıza açıklaması</h2><p className="issue-detail-description">{issue.aciklama || 'Açıklama girilmemiş.'}</p>{issue.foto_url && <a className="issue-image" href={issue.foto_url} target="_blank" rel="noopener noreferrer"><img src={issue.foto_url} alt="Arıza bildirimi görseli" /><span>Görseli tam boyutta aç</span></a>}</section></div>
      <section className="card"><h2 className="section-heading"><Clock size={18} /> Durum geçmişi</h2><div className="timeline">{issue.durum_gecmisi?.map((entry, index) => { const config = statusConfig[entry.durum] || statusConfig.Açık; const date = entry.tarih?.toDate ? entry.tarih.toDate() : new Date(entry.tarih); return <div key={`${entry.durum}-${index}`} className="timeline-item" style={{ '--status-color': config.color }}><span className="timeline-dot" /><div><span className="timeline-date">{Number.isNaN(date.getTime()) ? 'Tarih bilgisi bekleniyor' : date.toLocaleString('tr-TR')}</span><p><strong>{entry.durum}</strong> durumuna alındı.</p></div></div>; })}</div></section>
    </div>
  );
}
