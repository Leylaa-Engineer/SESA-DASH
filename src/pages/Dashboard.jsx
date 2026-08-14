import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ClipboardList, Mail, ShieldCheck, Users, Wrench } from 'lucide-react';

const actions = [
  { id: 'issues', title: 'Arıza kayıtları', description: 'Açık, işlemde ve çözülen bildirimleri kontrol edin.', hint: 'Operasyon akışı', icon: ClipboardList, tone: 'red' },
  { id: 'machines', title: 'Makine envanteri', description: 'Makine kayıtlarını, kodları ve QR etiketlerini yönetin.', hint: 'Saha varlıkları', icon: Wrench, tone: 'blue' },
  { id: 'settings', title: 'Bildirim ayarları', description: 'Otomatik e-posta bildirim akışını yapılandırın.', hint: 'İletişim merkezi', icon: Mail, tone: 'primary' },
];

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const visibleActions = userRole === 'admin'
    ? [...actions, { id: 'users', title: 'Personel yönetimi', description: 'Sorumlu kullanıcıları ve erişim rollerini yönetin.', hint: 'Yetki & organizasyon', icon: Users, tone: 'green' }]
    : actions;

  return (
    <div>
      <header className="page-header">
        <div>
          <span className="eyebrow"><ShieldCheck size={14} /> Operasyon merkezi</span>
          <h1 className="page-title">SESA arıza yönetimi</h1>
          <p className="page-subtitle">Saha bildirimlerini, makine kayıtlarını ve ekip sorumluluklarını tek merkezden yönetin.</p>
        </div>
        <div className="identity-card"><span className="identity-icon"><ShieldCheck size={17} /></span><span><strong>{userRole === 'admin' ? 'Yönetici erişimi' : 'Bölüm sorumlusu'}</strong><br />{currentUser?.email}</span></div>
      </header>
      <section className="action-grid" aria-label="Operasyon modülleri">
        {visibleActions.map(({ id, title, description, hint, icon: Icon, tone }) => (
          <button key={id} className="action-card" onClick={() => navigate(`/${id}`)}>
            <span className={`action-card__icon ${tone}`}><Icon size={21} /></span>
            <span><h3>{title}</h3><p>{description}</p></span>
            <span className="action-card__footer">{hint}<ArrowRight size={16} /></span>
          </button>
        ))}
      </section>
      <aside className="operational-note"><ShieldCheck size={18} color="var(--color-info)" /><span><strong>Operasyon notu:</strong> Her yeni saha bildirimi, makine ve bölüm bilgisiyle birlikte kayda alınır. Güncel durumları arıza kayıtları modülünden takip edin.</span></aside>
    </div>
  );
}
