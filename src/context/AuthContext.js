'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore logged-in session on page refresh
  useEffect(() => {
    const savedToken = localStorage.getItem('sms_token');
    const savedUser = localStorage.getItem('sms_user');

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // UC-01: Login & redirect to role-specific portal
  async function login(username, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem('sms_token', data.token);
    localStorage.setItem('sms_user', JSON.stringify(data.user));
    setUser(data.user);

    // Open role portal (Activity Diagram 13.1)
    if (data.user.role === 'ADMIN') router.push('/admin');
    else if (data.user.role === 'TEACHER') router.push('/teacher');
    else if (data.user.role === 'PARENT') router.push('/parent');
  }

  function logout() {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}