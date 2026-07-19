import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authValidate, authLogout, registerAnonymousUser, getProfile } from '../services/api';

interface AuthUser {
  userId: string;
  displayName: string;
  email: string | null;
  hasProfile: boolean;
  photo: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authenticated: false,
  logout: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUser = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        const validateRes = await authValidate(authToken);
        if (validateRes.success && validateRes.data?.userId) {
          const profileRes = await getProfile(validateRes.data.userId);
          if (profileRes.success) {
            setUser({
              userId: validateRes.data.userId,
              displayName: profileRes.data.displayName || 'Investigador',
              email: validateRes.data.email || null,
              hasProfile: profileRes.data.hasProfile || false,
              photo: profileRes.data.photo || null,
            });
            setLoading(false);
            return;
          }
        }
      }

      const anonId = localStorage.getItem('userId');
      if (anonId) {
        const profileRes = await getProfile(anonId);
        if (profileRes.success) {
          setUser({
            userId: anonId,
            displayName: profileRes.data.displayName || 'Investigador',
            email: null,
            hasProfile: profileRes.data.hasProfile || false,
            photo: profileRes.data.photo || null,
          });
          setLoading(false);
          return;
        }
      }
    } catch {}
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => { resolveUser(); }, [resolveUser]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) await authLogout(token).catch(() => {});
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authenticated: !!user, logout, refresh: resolveUser }}>
      {children}
    </AuthContext.Provider>
  );
};
