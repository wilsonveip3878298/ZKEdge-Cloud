'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch {
      toast.error('Credenciales inválidas');
      throw new Error('Login failed');
    }
  }, [router, setUser]);

  const logoutUser = useCallback(() => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
    toast.success('Sesión cerrada');
  }, [logout, router]);

  const refreshToken = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) throw new Error('No refresh token');
      const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
      localStorage.setItem('accessToken', data.accessToken);
      return data.accessToken;
    } catch {
      logoutUser();
      return null;
    }
  }, [logoutUser]);

  return { user, isAuthenticated, login, logout: logoutUser, refreshToken };
}
