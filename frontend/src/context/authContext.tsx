import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index';

// type of the value provided by the context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
 
// AuthContext provides value of type AuthContextType
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user from /me after the first render
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me', {
          credentials: 'include', // important to send cookie
        });

        if (!res.ok) throw new Error('Not logged in');
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // function to set user state after login
  const login = async () => {
    const res = await fetch('/api/me', {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  // function to clear user state on logout
  const logout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
