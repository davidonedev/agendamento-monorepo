import { api } from '../lib/api';

// ─── Shared result type ───────────────────────────────────────────────────────

export interface ClientSessionData {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// ─── Register (email + password) ─────────────────────────────────────────────

export interface ClientRegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function registerClientApi(
  slug: string,
  payload: ClientRegisterPayload,
): Promise<ClientSessionData> {
  return api.post<ClientSessionData>(`/public/${slug}/register/client`, payload);
}

// ─── Login (email + password) ─────────────────────────────────────────────────

export async function clientLoginApi(
  slug: string,
  email: string,
  password: string,
): Promise<ClientSessionData> {
  return api.post<ClientSessionData>(`/public/${slug}/login/client`, { email, password });
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function googleAuthClientApi(
  slug: string,
  accessToken: string,
): Promise<ClientSessionData> {
  return api.post<ClientSessionData>(`/public/${slug}/auth/google`, { accessToken });
}

// ─── Professional register ────────────────────────────────────────────────────

export interface ProfessionalRegisterPayload {
  name: string;
  email: string;
  password: string;
  specialty: string;
  bio?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
}

export async function registerProfessionalApi(
  slug: string,
  payload: ProfessionalRegisterPayload,
): Promise<{ name: string; email: string }> {
  return api.post(`/public/${slug}/register/professional`, payload);
}
