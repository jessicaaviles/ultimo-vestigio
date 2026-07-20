import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, authenticated } = useAuth();
  const location = useLocation();
  const returnUrl = encodeURIComponent(location.pathname + location.search);

  if (loading) return <Loading message="Verificando autenticação..." />;

  if (!user) return <Navigate to={`/register?return=${returnUrl}`} replace />;

  if (!authenticated) return <Navigate to={`/register?return=${returnUrl}`} replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
