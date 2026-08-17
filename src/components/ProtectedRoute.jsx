import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, LayoutDashboard, LogOut, Settings, Users, Wrench } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { currentUser, userRole, loading, profileLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || (currentUser && profileLoading)) {
    return <div className="app-container"><main className="main-content route-loading" aria-live="polite">Oturum ve yetkili bilgileri hazırlanıyor…</main></div>;
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: 'Merkez', icon: LayoutDashboard },
    { to: '/issues', label: 'Arızalar', icon: ClipboardList },
    { to: '/machines', label: 'Makineler', icon: Wrench },
    ...(userRole === 'admin' ? [{ to: '/users', label: 'Personel', icon: Users }] : []),
    { to: '/settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/dashboard" className="brand" aria-label="SESA operasyon merkezi">
          <span className="brand-mark"><Wrench size={18} strokeWidth={2.4} /></span>
          <span><span className="header-logo">SESA<span>®</span></span><span className="header-subtitle">Operasyon Merkezi</span></span>
        </Link>
        <nav className="header-nav" aria-label="Yönetim navigasyonu">
          {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`header-nav-item ${location.pathname === to ? 'active' : ''}`}><Icon size={16} />{label}</Link>)}
          <button type="button" className="header-nav-item" onClick={signOut} title="Çıkış yap"><LogOut size={16} />Çıkış</button>
        </nav>
      </header>
      <main className="main-content">{children || <Outlet />}</main>
    </div>
  );
}
