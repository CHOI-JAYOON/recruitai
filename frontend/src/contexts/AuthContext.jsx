import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && !localStorage.getItem('token')) {
          localStorage.setItem('token', parsed.token);
          const { token, ...clean } = parsed;
          localStorage.setItem('user', JSON.stringify(clean));
          return clean;
        }
        return parsed;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  });

  const login = (userData) => {
    const { token, ...userInfo } = userData;
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const { usage, ...userInfo } = res.data;
      setUser(prev => {
        const next = { ...prev, ...userInfo };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('recruitai_primary_resumes');
    localStorage.removeItem('recruitai_primary_career_descs');
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
