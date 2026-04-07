import { api, saveSession, clearSession } from '../lib/api';
import type { AuthUser } from '../types';

interface LoginResponse {
  token: string;
  user: AuthUser & {
    tenant?: { id: string; slug: string; name: string; status: string; plan: string } | null;
  };
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/auth/login', { email, password });
  saveSession(data.token, data.user);
  return data;
}

export async function getMeApi(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me');
}

export function logoutApi() {
  clearSession();
}

export async function updateMeApi(payload: { name?: string; email?: string }): Promise<AuthUser> {
  return api.patch<AuthUser>('/auth/me', payload);
}

export async function changePasswordApi(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await api.put('/auth/password', payload);
}
