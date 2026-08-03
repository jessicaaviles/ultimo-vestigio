import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authValidate, authLogout, getProfile } from '../services/api';

interface AuthUser {
  userId: string;
  displayName: string;
  email: string | null;
  hasProfile: boolean;
  onboardingCompleted: boolean;
  photo: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authenticated: false,
  logout: async () => {},
  refresh: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUser = useCallback(async (): Promise<AuthUser | null> => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const validateRes = await authValidate(authToken);
        if (validateRes.success && validateRes.data?.userId) {
          const profileRes = await getProfile(validateRes.data.userId);
          if (profileRes.success) {
            localStorage.setItem('userId', validateRes.data.userId);
            setUser({
              userId: validateRes.data.userId,
              displayName: profileRes.data.displayName || 'Investigador',
              email: validateRes.data.email || null,
              hasProfile: profileRes.data.hasProfile || false,
              onboardingCompleted: profileRes.data.onboardingCompleted || false,
              photo: profileRes.data.photo || null,
            });
            setLoading(false);
            return {
              userId: validateRes.data.userId,
              displayName: profileRes.data.displayName || 'Investigador',
              email: validateRes.data.email || null,
              hasProfile: profileRes.data.hasProfile || false,
              onboardingCompleted: profileRes.data.onboardingCompleted || false,
              photo: profileRes.data.photo || null,
            };
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
            onboardingCompleted: profileRes.data.onboardingCompleted || false,
            photo: profileRes.data.photo || null,
          });
          setLoading(false);
          return {
            userId: anonId,
            displayName: profileRes.data.displayName || 'Investigador',
            email: null,
            hasProfile: profileRes.data.hasProfile || false,
            onboardingCompleted: profileRes.data.onboardingCompleted || false,
            photo: profileRes.data.photo || null,
          };
        }
      }
    } catch {}
    setUser(null);
    setLoading(false);
    return null;
  }, []);

  useEffect(() => { resolveUser(); }, [resolveUser]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) await authLogout(token).catch(() => {});
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authenticated: !!user, logout, refresh: resolveUser }}>
      {children}
    </AuthContext.Provider>
  );
};
