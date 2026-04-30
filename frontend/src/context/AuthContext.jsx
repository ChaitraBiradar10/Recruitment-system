import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem('git_token');
    const u = localStorage.getItem('git_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setLoading(false);
  }, []);
  const login = useCallback((data) => {
    const { token, ...u } = data;
    localStorage.setItem('git_token', token);
    localStorage.setItem('git_user', JSON.stringify(u));
    setToken(token); setUser(u);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('git_token'); localStorage.removeItem('git_user');
    setToken(null); setUser(null);
  }, []);
  const updateUser = useCallback((updates) => {
    setUser(prev => { const u = {...prev,...updates}; localStorage.setItem('git_user', JSON.stringify(u)); return u; });
  }, []);
  return <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const c = useContext(AuthContext); if (!c) throw new Error('useAuth outside AuthProvider'); return c; };
