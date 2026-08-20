import { createContext, useContext, useEffect, useState } from 'react';
import { mysqlApi, setAccessToken } from '../api/client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function login(email, password) {
    const result = await mysqlApi.login({ email, password });
    setCurrentUser(result.user);
    setUserRole(result.user?.role || result.user?.rol || null);
    return result;
  }

  async function register(data) {
    const result = await mysqlApi.register(data);
    setCurrentUser(result.user);
    setUserRole(result.user?.role || result.user?.rol || null);
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
    mysqlApi.me()
      .then((profile) => {
        setCurrentUser(profile || null);
        setUserRole(profile?.role || profile?.rol || null);
      })
      .catch(() => {
        setCurrentUser(null);
        setUserRole(null);
      })
      .finally(() => {
        setProfileLoading(false);
        setLoading(false);
      });
  }, []);

  const value = { currentUser, userRole, loading, profileLoading, login, register, logout };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
