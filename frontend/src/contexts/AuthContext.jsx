import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If token was stored inside user object, extract it
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
    // Extract and store JWT token separately
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    localStorage.removeItem('recruitai_primary_resumes');
    localStorage.removeItem('recruitai_primary_career_descs');
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
