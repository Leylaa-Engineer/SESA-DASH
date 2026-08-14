import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  useEffect(() => { if (currentUser) navigate('/dashboard'); }, [currentUser, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try { await login(email, password); }
    catch (err) { console.error(err); setError('Giriş başarısız. E-posta adresinizi ve şifrenizi kontrol edin.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <span className="auth-icon"><ShieldCheck size={23} /></span>
        <span className="eyebrow">Yetkili erişimi</span>
        <h1 className="page-title">Operasyon merkezine giriş</h1>
        <p className="page-subtitle">Arıza kayıtları ve makine envanteri yalnızca yetkili kullanıcıların erişimine açıktır.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group"><label className="input-label" htmlFor="email">E-posta adresi</label><div className="auth-control"><User size={18} /><input id="email" type="email" placeholder="ad.soyad@firma.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
          <div className="input-group"><label className="input-label" htmlFor="password">Şifre</label><div className="auth-control"><LockKeyhole size={18} /><input id="password" type="password" placeholder="Şifrenizi girin" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Kimlik doğrulanıyor…' : <>Güvenli giriş <ArrowRight size={18} /></>}</button>
        </form>
        <button className="auth-link" onClick={() => navigate('/register')}>Yetkili hesabın yok mu? Kayıt koduyla başvur.</button>
      </section>
    </div>
  );
}
