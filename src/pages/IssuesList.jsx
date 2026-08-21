<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
import { useEffect, useState } from 'react';
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, SlidersHorizontal, UserCheck, Wrench } from 'lucide-react';
import { mysqlApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const filters = ['Hepsi', 'Açık', 'İşlemde', 'Çözüldü'];
const statusPriority = { Çözüldü: 1, İşlemde: 2, Açık: 3 };

function groupIssuesByMachine(issueList) {
  const grouped = new Map();

  issueList.forEach((issue) => {
    const machineKey = issue.makine_id || issue.makine_kod || issue.makine_ad || issue.id;
    const existing = grouped.get(machineKey);
    const existingStatus = existing?.durum || 'Çözüldü';
    const issueStatus = issue.durum || 'Açık';
    const latestTime = issue.olusturulma_tarihi ? new Date(issue.olusturulma_tarihi).getTime() : 0;
    const existingTime = existing?.olusturulma_tarihi ? new Date(existing.olusturulma_tarihi).getTime() : 0;
    const shouldUseIssue = !existing || latestTime >= existingTime;
    const aggregateStatus = (statusPriority[issueStatus] || 0) >= (statusPriority[existingStatus] || 0) ? issueStatus : existingStatus;

    if (!existing) {
      grouped.set(machineKey, { ...issue, durum: aggregateStatus, issueCount: 1, latestIssueId: issue.id });
    } else {
      grouped.set(machineKey, {
        ...existing,
        ...(shouldUseIssue ? issue : {}),
        durum: aggregateStatus,
        issueCount: existing.issueCount + 1,
        latestIssueId: shouldUseIssue ? issue.id : existing.latestIssueId,
      });
    }
  });

  return [...grouped.values()].sort((a, b) => (new Date(b.olusturulma_tarihi || 0).getTime()) - (new Date(a.olusturulma_tarihi || 0).getTime()));
}

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
    mysqlApi.users()
      .then((users) => setSorumlular(users.filter((user) => user.rol === 'admin' || user.rol === 'sorumlu')))
      .catch(console.error);
  }, [isAdmin]);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const list = await mysqlApi.issues(filter === 'Hepsi' ? '' : filter);
        const filteredList = secilenSorumluEmail
          ? list.filter((issue) => issue.ekleyen_email === secilenSorumluEmail)
          : list;
        const machineIssues = groupIssuesByMachine(filteredList);
        setIssues(filter === 'Hepsi' ? machineIssues : machineIssues.filter((issue) => issue.durum === filter));
      } catch (error) { console.error('Arızalar getirilirken hata:', error); } finally { setLoading(false); }
    };
    fetchIssues();
  }, [currentUser, filter, secilenSorumluEmail, isAdmin]);

  const status = (value) => ({ Açık: { color: 'var(--color-status-open)', icon: AlertCircle }, İşlemde: { color: 'var(--color-status-progress)', icon: Wrench }, Çözüldü: { color: 'var(--color-status-resolved)', icon: CheckCircle2 } }[value] || { color: 'var(--color-text-muted)', icon: AlertCircle });

  return (
    <div>
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={17} />Operasyon merkezine dön</button>
      <header className="page-header"><div><span className="eyebrow"><ClipboardList size={14} /> Arıza yönetimi</span><h1 className="page-title">Arıza kayıtları</h1><p className="page-subtitle">Her makine yalnızca tek bir güncel durumla listelenir.</p></div></header>
      {isAdmin && <section className="filter-panel" style={{ marginBottom: '0.8rem' }}><label className="input-label" htmlFor="sorumlu-filter"><UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Sorumlu görünümü</label><select id="sorumlu-filter" className="input-field" value={secilenSorumluEmail} onChange={(event) => setSecilenSorumluEmail(event.target.value)}><option value="">Tüm sorumlular ve makineler</option>{sorumlular.map((sorumlu) => <option key={sorumlu.id} value={sorumlu.email}>{sorumlu.ad_soyad} ({sorumlu.email})</option>)}</select></section>}
      <section className="filter-tabs" aria-label="Arıza durumu filtresi">{filters.map((item) => <button key={item} className={`filter-tab ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}</section>
      <section className="issue-list">{loading ? <div className="empty-state">Kayıtlar yükleniyor…</div> : issues.length === 0 ? <div className="empty-state"><SlidersHorizontal size={22} style={{ marginBottom: 8 }} /><br />Bu filtreye uygun makine bulunamadı.</div> : issues.map((issue) => { const { color, icon: Icon } = status(issue.durum); const date = issue.olusturulma_tarihi ? new Date(issue.olusturulma_tarihi).toLocaleDateString('tr-TR') : 'Tarih bekleniyor'; return <button key={issue.makine_id || issue.makine_kod || issue.id} className="issue-row" style={{ '--status-color': color }} onClick={() => navigate(`/issues/${issue.latestIssueId || issue.id}`)}><span className="issue-icon"><Icon size={20} /></span><span className="issue-main"><h3>{issue.makine_ad || 'Adı tanımlanmamış makine'}</h3><span className="issue-meta"><span>{issue.makine_kod || 'Kodsuz'}</span><span>•</span><span>{date}</span><span className="status-pill" style={{ color, padding: '0.16rem 0.38rem' }}>{issue.durum || 'Durum yok'}</span>{issue.issueCount > 1 && <span>{issue.issueCount} kayıt</span>}</span><span className="issue-description">{issue.aciklama || 'Açıklama girilmemiş.'}</span></span><ChevronRight size={18} color="var(--color-text-muted)" /></button>; })}</section>
    </div>
  );
}