import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
          const sorumluRef = doc(db, 'sorumlular', user.uid);
          const sorumluDoc = await getDoc(sorumluRef);

          if (sorumluDoc.exists()) {
            const docData = sorumluDoc.data();
            let dbRol = docData.rol || 'sorumlu';
            if (dbRol === 'yonetici') dbRol = 'admin';
            setUserRole(dbRol);
            setCurrentUser({ ...user, ...docData, rol: dbRol });
            updateDoc(sorumluRef, { sonGirisTarihi: serverTimestamp() }).catch((err) => console.log('Son giriş güncellenemedi', err));
            return;
          }

          const yoneticiRef = doc(db, 'yoneticiler', user.uid);
          const yoneticiDoc = await getDoc(yoneticiRef);
          if (yoneticiDoc.exists()) {
            setUserRole('admin');
            setCurrentUser({ ...user, ...yoneticiDoc.data() });
            updateDoc(yoneticiRef, { sonGirisTarihi: serverTimestamp() }).catch((err) => console.log('Son giriş güncellenemedi', err));
          }
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
