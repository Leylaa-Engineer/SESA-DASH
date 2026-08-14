import { Outlet, Link, useLocation } from 'react-router-dom';
import { QrCode, ShieldUser, Wrench } from 'lucide-react';

export default function PublicLayout() {
  const location = useLocation();
  const isField = location.pathname === '/' || location.pathname.startsWith('/machine');

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="brand" aria-label="SESA ana sayfa">
          <span className="brand-mark"><Wrench size={18} strokeWidth={2.4} /></span>
          <span>
            <span className="header-logo">SESA<span>®</span></span>
            <span className="header-subtitle">Operasyon Takip Sistemi</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Ana navigasyon">
          <Link to="/" className={`header-nav-item ${isField ? 'active' : ''}`}><QrCode size={17} />Saha bildirimi</Link>
          <Link to="/login" className={`header-nav-item ${!isField ? 'active' : ''}`}><ShieldUser size={17} />Yetkili paneli</Link>
        </nav>
      </header>
      <main className="main-content"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Mobil navigasyon">
        <Link to="/" className={`nav-item ${isField ? 'active' : ''}`}><span className="nav-icon-wrapper"><QrCode size={18} /></span>Saha</Link>
        <Link to="/login" className={`nav-item ${!isField ? 'active' : ''}`}><span className="nav-icon-wrapper"><ShieldUser size={18} /></span>Panel</Link>
      </nav>
    </div>
  );
}
