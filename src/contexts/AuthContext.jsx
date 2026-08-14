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

  // Giriş Yap
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Çıkış Yap
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firestore'dan rolü kontrol et
        try {
          const sorumluRef = doc(db, 'sorumlular', user.uid);
          const sorumluDoc = await getDoc(sorumluRef);

          if (sorumluDoc.exists()) {
            const docData = sorumluDoc.data();
            let dbRol = docData.rol || 'sorumlu';
            if (dbRol === 'yonetici') dbRol = 'admin'; // Geriye dönük uyumluluk
            
            // Son giriş zamanını Firestore'a kaydet/güncelle
            await updateDoc(sorumluRef, {
              sonGirisTarihi: serverTimestamp()
            }).catch((err) => console.log("Son giriş güncellenemedi", err));

            setUserRole(dbRol);
            setCurrentUser({ ...user, ...docData, rol: dbRol });
          } else {
            const yoneticiRef = doc(db, 'yoneticiler', user.uid);
            const yoneticiDoc = await getDoc(yoneticiRef);

            if (yoneticiDoc.exists()) {
              await updateDoc(yoneticiRef, {
                sonGirisTarihi: serverTimestamp()
              }).catch((err) => console.log("Son giriş güncellenemedi", err));

              setUserRole('admin');
              setCurrentUser({ ...user, ...yoneticiDoc.data() });
            } else {
              setUserRole(null);
              setCurrentUser(user);
            }
          }
        } catch (error) {
          console.error("Rol bilgisi alınamadı", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}