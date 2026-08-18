import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { mysqlApi } from '../api/client';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'sorumlu' veya 'admin'
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserRole(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      // Temel kullanıcı bilgisini hemen yayınla; dashboard rol sorgusunu beklemeden açılabilir.
      setCurrentUser(user);
      setUserRole(null);
      setProfileLoading(true);
      setLoading(false);

      // Rol bilgisi ve son giriş güncellemesi arka planda tamamlanır.
      (async () => {
        try {
          const profile = await mysqlApi.me();
          setUserRole(profile.rol || null);
          setCurrentUser({ ...user, ...profile });
        } catch (error) {
          console.error('Rol bilgisi alınamadı', error);
        } finally {
          setProfileLoading(false);
        }
      })();
    });

    return unsubscribe;
  }, []);

  const value = { currentUser, userRole, loading, profileLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
