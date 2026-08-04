import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const returnUrl = encodeURIComponent(location.pathname + location.search);
  const onboardingRequiredPaths = [
    '/create',
    '/join',
    '/lobby',
    '/room',
    '/map',
    '/scene',
    '/board',
    '/case-files',
    '/evidence',
  ];
  const requiresOnboarding = onboardingRequiredPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  if (loading) return <Loading message="Verificando autenticação..." />;

  if (!user) return <Navigate to={`/register?return=${returnUrl}`} replace />;
  if (!user.onboardingCompleted && requiresOnboarding) {
    return <Navigate to={`/onboarding?return=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
