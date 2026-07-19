import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, authenticated } = useAuth();

  if (loading) return <Loading message="Verificando autenticação..." />;

  if (!user) return <Navigate to="/register" replace />;

  if (!authenticated && !user.hasProfile) return <Navigate to="/register" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
