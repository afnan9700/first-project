// src/components/RequireAuth.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingIndicator } from "./LoadingIndicator";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();  // laoding and user states from AuthContext

  if (loading) return <LoadingIndicator />;
  if (!user) return <Navigate to="/login" replace />;   // redirect to login if not authenticated

  return <>{children}</>;
};
