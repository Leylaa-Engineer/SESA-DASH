import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, KeyRound, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminCode: '',
    bolum_id: '',
    role: 'operator'
  });
  const [bolumler, setBolumler] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    const sesaBolumleri = [
      { id: 'baski', ad: 'Baskı (Flekso)' },
      { id: 'laminasyon', ad: 'Laminasyon' },
      { id: 'kurlenme', ad: 'Kürlenme' },
      { id: 'kalite_kontrol', ad: 'Kalite Kontrol' },
      { id: 'dilme', ad: 'Dilme' },
      { id: 'torba_yapimi', ad: 'Torba Yapımı' }
    ];
    setBolumler(sesaBolumleri);
  }, []);

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: nextValue,
      ...(e.target.name === 'role' && nextValue === 'admin' ? { bolum_id: '' } : {}),
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name: formData.name, email: formData.email, password: formData.password, bolum_id: formData.bolum_id, role: formData.role, adminCode: formData.adminCode });

      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      if (err.message === 'Geçersiz kayıt kodu' || err.message === 'Geçersiz kayıt kodu!') {
        setError(err.message);
      } else if (err.status === 409) {
        setError('Bu e-posta veya personel kaydı zaten mevcut.');
      } else {
        setError(err.message || 'Kayıt sırasında beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      
      <div className="card" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h2 className="mb-3 text-center" style={{ fontSize: '1.4rem' }}>Yeni Kullanıcı Kaydı</h2>
        
        {error && <div style={{ color: 'var(--color-status-open)', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#FFEBEE', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          
          <div className="input-group">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <User size={20} color="var(--color-text-muted)" style={{ marginRight: '0.8rem' }} />
              <input
                type="text"
                name="name"
                placeholder="Ad Soyad"
                value={formData.name}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <ShieldCheck size={20} color="var(--color-text-muted)" style={{ marginRight: '0.8rem' }} />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0' }}
                required
              >
                <option value="operator">Düz kullanıcı</option>
                <option value="sorumlu">Bölüm sorumlusu</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <Mail size={20} color="var(--color-text-muted)" style={{ marginRight: '0.8rem' }} />
              <input
                type="email"
                name="email"
                placeholder="E-Posta Adresi"
                value={formData.email}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <Lock size={20} color="var(--color-text-muted)" style={{ marginRight: '0.8rem' }} />
              <input
                type="password"
                name="password"
                placeholder="Hesap Şifresi"
                value={formData.password}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0' }}
                required
              />
            </div>
          </div>

          {formData.role !== 'admin' && <div className="input-group">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <Building2 size={20} color="var(--color-text-muted)" style={{ marginRight: '0.8rem' }} />
              <select
                name="bolum_id"
                value={formData.bolum_id}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0', color: formData.bolum_id ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                required={formData.role !== 'admin'}
              >
                <option value="" disabled>Bölüm veya Rol Seçin</option>
                {bolumler.map(b => (
                  <option key={b.id} value={b.id}>{b.ad}</option>
                ))}
              </select>
            </div>
          </div>}

          {formData.role !== 'operator' && <div className="input-group mb-3">
            <div className="flex items-center" style={{ backgroundColor: '#fff', border: '1px solid var(--color-primary)', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem' }}>
              <KeyRound size={20} color="var(--color-primary)" style={{ marginRight: '0.8rem' }} />
              <input
                type="password"
                name="adminCode"
                placeholder="Yetkili Kayıt Kodu"
                value={formData.adminCode}
                onChange={handleChange}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '1rem', backgroundColor: 'transparent', padding: '0.5rem 0' }}
                required
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>Sistem yöneticisinden aldığınız kodu girin.</p>
          </div>}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol ve Giriş Yap'}
          </button>
        </form>
        
        <div className="text-center mt-2" style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={() => navigate('/login')} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Zaten hesabın var mı? Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}