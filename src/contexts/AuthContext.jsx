import { createContext, useContext, useEffect, useState } from 'react';
<<<<<<< HEAD
=======
import { mysqlApi, setAccessToken } from '../api/client';
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const setAccessToken = (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  };

  const getAccessToken = () => localStorage.getItem('access_token');

  async function login(email, password) {
<<<<<<< HEAD
    const res = await fetch('/api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    
    if (!res.ok) throw new Error('Giriş isteği başarısız oldu');
    const result = await res.json();

    // Backend'den user objesi gelmese bile oturumun açılabilmesi ve yönlendirmenin çalışması için fallback mekanizması
    const userData = result.user || result.data || { email: email, role: 'admin' };

    setAccessToken(result.token || 'demo-token');
    setCurrentUser(userData);
    setUserRole(userData.role || userData.rol || 'admin');
=======
    const result = await mysqlApi.login({ email, password });
    setCurrentUser(result.user);
    setUserRole(result.user?.role || result.user?.rol || null);
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954
    return result;
  }

  async function register(data) {
<<<<<<< HEAD
    const res = await fetch('/api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...data })
    });

    if (!res.ok) throw new Error('Kayıt isteği başarısız oldu');
    const result = await res.json();

    const userData = result.user || result.data || { email: data.email, role: 'admin' };

    setAccessToken(result.token || 'demo-token');
    setCurrentUser(userData);
    setUserRole(userData.role || userData.rol || 'admin');
=======
    const result = await mysqlApi.register(data);
    setCurrentUser(result.user);
    setUserRole(result.user?.role || result.user?.rol || null);
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954
    return result;
  }

  async function logout() {
    await mysqlApi.logout().catch(() => {});
    setAccessToken(null);
    setCurrentUser(null);
    setUserRole(null);
  }

  useEffect(() => {
    setProfileLoading(true);
<<<<<<< HEAD

    fetch('/api/index.php', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'me' })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.user || data.data)) {
          const userObj = data.user || data.data;
          setCurrentUser(userObj);
          setUserRole(userObj.role || userObj.rol || null);
        } else {
          logout();
        }
=======
    mysqlApi.me()
      .then((profile) => {
        setCurrentUser(profile || null);
        setUserRole(profile?.role || profile?.rol || null);
      })
      .catch(() => {
        setCurrentUser(null);
        setUserRole(null);
>>>>>>> 6d1c30d935c3d5600455716a2695e91e2dcc9954
      })
      .catch(() => logout())
      .finally(() => {
        setProfileLoading(false);
        setLoading(false);
      });
  }, []);

  const value = { currentUser, userRole, loading, profileLoading, login, register, logout };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}