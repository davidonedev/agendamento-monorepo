import { api } from '../lib/api';
import type { Tenant } from '../types';

export async function getMyTenantApi(): Promise<Tenant> {
  return api.get<Tenant>('/admin/me');
}

export interface TenantSettingsPayload {
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  adminColor?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isOpen?: boolean;
  minAdvanceMinutes?: number;
  // WhatsApp
  whatsappApiUrl?:   string | null;
  whatsappApiKey?:   string | null;
  whatsappInstance?: string | null;
  whatsappTemplate?: string | null;
}

export async function updateTenantSettingsApi(payload: TenantSettingsPayload): Promise<Tenant> {
  return api.patch<Tenant>('/admin/settings', payload);
}

export interface RevenueFilters {
  startDate: string;
  endDate: string;
  professionalId?: string;
}

export interface RevenueData {
  total: number;
  count: number;
  byDate: Record<string, number>;
  byService: { name: string; revenue: number; count: number }[];
  byProfessional: { name: string; revenue: number; count: number }[];
}

export async function getRevenueApi(filters: RevenueFilters): Promise<RevenueData> {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.professionalId && { professionalId: filters.professionalId }),
  });
  return api.get<RevenueData>(`/admin/revenue?${params.toString()}`);
}
