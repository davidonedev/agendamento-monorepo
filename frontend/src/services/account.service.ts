import { api } from '../lib/api';

// ─── Recuperação de conta ─────────────────────────────────────────────────────

interface MessageResponse {
  message: string;
}

export type AccessHelpRequesterType = 'professional' | 'tenant_admin';

export interface AccessHelpRequest {
  id: string;
  requesterType: AccessHelpRequesterType;
  name: string;
  contact: string;
  barbershop: string;
  message: string | null;
  tenantId: string | null;
  tenantName: string | null;
  target: 'tenant' | 'super_admin';
  status: 'pending' | 'resolved';
  resolvedAt: string | null;
  createdAt: string;
}

export async function forgotPasswordApi(email: string): Promise<string> {
  const data = await api.post<MessageResponse>('/auth/forgot-password', { email });
  return data.message;
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<string> {
  const data = await api.post<MessageResponse>('/auth/reset-password', { token, newPassword });
  return data.message;
}

export async function requestEmailChangeApi(newEmail: string, currentPassword: string): Promise<string> {
  const data = await api.post<MessageResponse>('/auth/email-change', { newEmail, currentPassword });
  return data.message;
}

export async function confirmEmailChangeApi(token: string): Promise<string> {
  const data = await api.post<MessageResponse>('/auth/email-change/confirm', { token });
  return data.message;
}

export async function createAccessHelpApi(payload: {
  requesterType: AccessHelpRequesterType;
  name: string;
  contact: string;
  barbershop: string;
  message?: string;
}): Promise<string> {
  const data = await api.post<MessageResponse>('/auth/access-help', payload);
  return data.message;
}

/** scope: 'admin' (tenant — pedidos dos seus funcionários) ou 'super' (pedidos de donos). */
export async function listAccessHelpApi(scope: 'admin' | 'super'): Promise<AccessHelpRequest[]> {
  return api.get<AccessHelpRequest[]>(`/${scope}/access-help`);
}

export async function resolveAccessHelpApi(scope: 'admin' | 'super', id: string): Promise<AccessHelpRequest> {
  return api.patch<AccessHelpRequest>(`/${scope}/access-help/${id}/resolve`, {});
}
