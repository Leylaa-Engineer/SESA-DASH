import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Hash, MapPin, Trash2, Wrench } from 'lucide-react';
import { mysqlApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const statusConfig = {
  Açık: { color: 'var(--color-status-open)', icon: AlertCircle, description: 'Yeni kayıt; aksiyon bekliyor.' },
  İşlemde: { color: 'var(--color-status-progress)', icon: Wrench, description: 'Ekip tarafından inceleniyor.' },
  Çözüldü: { color: 'var(--color-status-resolved)', icon: CheckCircle2, description: 'Çözüm kayda alındı.' },
};

export default function IssueDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const data = await mysqlApi.issue(id);
        setIssue({ ...data, id });
        setCanDelete(true);
      } catch (error) { console.error('Arıza getirilirken hata:', error); } finally { setLoading(false); }
    };
    load();
  }, [id, currentUser, navigate]);

  const handleDelete = async () => {
    if (!canDelete || !window.confirm('Bu arıza kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try { await mysqlApi.deleteIssue(id); navigate('/issues'); } catch (error) { console.error(error); alert('Arıza kaydı silinemedi.'); }
  };

  const changeStatus = async (newStatus) => {
    if (!issue || issue.durum === newStatus) return;
    setUpdating(true);
    try {
      await mysqlApi.updateIssue(id, { durum: newStatus });
      const refreshed = await mysqlApi.issue(id);
      setIssue({ ...refreshed, id });
    } catch (error) { console.error('Durum güncellenirken hata:', error); alert('Durum güncellenemedi.'); } finally { setUpdating(false); }
  };

  if (loading) return <div className="empty-state">Arıza kaydı yükleniyor…</div>;
  if (!issue) return <div className="empty-state">Arıza kaydı bulunamadı veya kaldırılmış.</div>;

  const current = statusConfig[issue.durum] || statusConfig.Açık;
  const CurrentIcon = current.icon;
  const createdAt = issue.olusturulma_tarihi ? new Date(issue.olusturulma_tarihi).toLocaleString('tr-TR') : 'Tarih bilgisi bekleniyor';

  return (
    <div>
      <button className="back-button" onClick={() => navigate('/issues')}><ArrowLeft size={17} />Arıza kayıtlarına dön</button>
      <header className="page-header"><div><span className="eyebrow"><CurrentIcon size={14} /> Arıza kaydı</span><h1 className="page-title">{issue.makine_ad || 'Makine arızası'}</h1><p className="page-subtitle">{issue.makine_kod || 'Kodsuz kayıt'} · {createdAt}</p></div>{canDelete && <button className="btn btn-secondary danger-button" onClick={handleDelete}><Trash2 size={16} />Kaydı sil</button>}</header>
      <section className="status-overview" style={{ '--status-color': current.color }}><span className="status-overview__icon"><CurrentIcon size={24} /></span><span><span className="eyebrow" style={{ color: current.color }}>Mevcut durum</span><h2>{issue.durum || 'Açık'}</h2><p>{current.description}</p></span></section>
      <section className="status-actions" aria-label="Arıza durumu güncelleme">{Object.entries(statusConfig).map(([label, config]) => { const Icon = config.icon; const selected = issue.durum === label; return <button key={label} className={`status-action ${selected ? 'active' : ''}`} style={{ '--status-color': config.color }} onClick={() => changeStatus(label)} disabled={updating}><Icon size={18} /><span>{label}</span></button>; })}</section>
      <div className="detail-grid"><section className="card"><h2 className="section-heading"><Hash size={18} /> Makine bilgileri</h2><div className="detail-item"><span>Makine</span><strong>{issue.makine_ad || 'Tanımlanmamış'} <em>{issue.makine_kod || '—'}</em></strong></div><div className="detail-item"><span>Bölüm</span><strong><MapPin size={15} /> {issue.bolum_ad || 'Tanımlanmamış'}</strong></div></section><section className="card"><h2 className="section-heading"><AlertCircle size={18} /> Arıza açıklaması</h2><p className="issue-detail-description">{issue.aciklama || 'Açıklama girilmemiş.'}</p>{issue.foto_url && <a className="issue-image" href={issue.foto_url} target="_blank" rel="noopener noreferrer"><img src={issue.foto_url} alt="Arıza bildirimi görseli" /><span>Görseli tam boyutta aç</span></a>}</section></div>
      <section className="card"><h2 className="section-heading"><Clock size={18} /> Durum geçmişi</h2><div className="timeline">{issue.durum_gecmisi?.map((entry, index) => { const config = statusConfig[entry.durum] || statusConfig.Açık; const date = new Date(entry.tarih); return <div key={`${entry.durum}-${index}`} className="timeline-item" style={{ '--status-color': config.color }}><span className="timeline-dot" /><div><span className="timeline-date">{Number.isNaN(date.getTime()) ? 'Tarih bilgisi bekleniyor' : date.toLocaleString('tr-TR')}</span><p><strong>{entry.durum}</strong> durumuna alındı.</p></div></div>; })}</div></section>
    </div>
  );
}
