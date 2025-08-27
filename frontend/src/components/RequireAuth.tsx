// src/components/RequireAuth.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingIndicator } from './LoadingIndicator';


export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();  // laoding and user states from AuthContext

  // redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [loading, user]);

  if (loading) return <LoadingIndicator />;
  if (!user) return null;  // if not authenticated, return null to avoid rendering children

  // if authenticated, render children components
  return <>{children}</>;
};
