import React, { createContext, useContext, useState } from 'react';
import type { AuthUser } from '../types';
import { loginApi, logoutApi, updateMeApi, changePasswordApi } from '../services/auth.service';
import { ApiError } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; redirectTo: string; error?: string }>;
  logout: () => void;
  updateUser: (payload: { name?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'agendepro_session';

function readUserFromSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // sessionStorage guarda { token, user }
    return (parsed.user ?? parsed) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUserFromSession);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; redirectTo: string; error?: string }> => {
    try {
      const { user: apiUser } = await loginApi(email, password);

      const authUser: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        password: '', // nunca exposto pela API
        role: apiUser.role,
        tenantId: apiUser.tenantId ?? undefined,
        professionalId: apiUser.professionalId ?? undefined,
      };

      setUser(authUser);

      // Atualiza o campo user dentro do objeto de sessão já salvo pelo loginApi
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: authUser }));
      }

      const redirectTo =
        authUser.role === 'super_admin'
          ? '/super/dashboard'
          : authUser.role === 'professional'
          ? '/professional/agenda'
          : '/admin/dashboard';

      return { ok: true, redirectTo };
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erro ao conectar com o servidor. Tente novamente.';
      return { ok: false, redirectTo: '/login', error: message };
    }
  };

  const logout = () => {
    setUser(null);
    logoutApi();
  };

  const updateUser = async (payload: { name?: string; email?: string }) => {
    const updated = await updateMeApi(payload);
    const next: AuthUser = { ...user!, ...updated };
    setUser(next);
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: next }));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordApi({ currentPassword, newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
