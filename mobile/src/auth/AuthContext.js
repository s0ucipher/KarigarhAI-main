import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Wraps the EXISTING FastAPI JWT auth (/api/auth/*). Tokens stored on-device.
// Google / Apple / Phone-OTP are surfaced as configuration states until the
// backend OAuth credentials are provisioned — never faked as success.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'seller' | 'buyer'
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, u, r, l] = await Promise.all([
        AsyncStorage.getItem('kalasetu_token'),
        AsyncStorage.getItem('kalasetu_user'),
        AsyncStorage.getItem('kalasetu_role'),
        AsyncStorage.getItem('kalasetu_lang'),
      ]);
      if (t && u) {
        setUser(JSON.parse(u));
        setRole(r);
        api.defaults.headers.common.Authorization = `Bearer ${t}`;
      }
      if (l) setLang(l);
      setLoading(false);
    })();
  }, []);

  const persist = async (token, u) => {
    await AsyncStorage.multiSet([
      ['kalasetu_token', token],
      ['kalasetu_user', JSON.stringify(u)],
      ['kalasetu_role', u.role],
    ]);
    setUser(u);
    setRole(u.role);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    await persist(data.access_token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    await persist(data.access_token, data.user);
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['kalasetu_token', 'kalasetu_user', 'kalasetu_role']);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setRole(null);
  };

  const switchLang = async (l) => {
    setLang(l);
    await AsyncStorage.setItem('kalasetu_lang', l);
  };

  return (
    <AuthCtx.Provider value={{ user, role, lang, loading, login, register, logout, setRole, switchLang }}>
      {children}
    </AuthCtx.Provider>
  );
}
