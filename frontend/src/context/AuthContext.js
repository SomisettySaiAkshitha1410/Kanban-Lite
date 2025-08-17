import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/api';
import socket from '../socket';

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')||'null'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post('api/auth/login', { email, password });
    setToken(data.token);
    setUser({ id: data.userId, username: data.username });
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('api/auth/register', { username, email, password });
    setToken(data.token);
    setUser({ id: data.userId, username });
  };

  const logout = () => { if (socket.connected) socket.disconnect();
    setToken(null); setUser(null);
  localStorage.removeItem('user');
    localStorage.removeItem('token'); };

  return <AuthContext.Provider value={{ token, user, login, register, logout }}>{children}</AuthContext.Provider>;
}
