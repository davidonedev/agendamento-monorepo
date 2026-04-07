import { api } from '../lib/api';
import type { Tenant, TenantData } from '../types';

// ─── Métricas ─────────────────────────────────────────────────────────────────
export interface PlatformMetrics {
  totals: {
    tenants: number;
    professionals: number;
    clients: number;
    appointments: number;
    completedAppointments: number;
  };
  tenantsByStatus: { active: number; trial: number; suspended: number };
  tenantsByPlan: Record<string, number>;
  revenue: { total: number; mrr: number };
}

export async function getPlatformMetricsApi(): Promise<PlatformMetrics> {
  return api.get<PlatformMetrics>('/super/metrics');
}

// ─── Tenants ──────────────────────────────────────────────────────────────────
export interface TenantWithCounts extends Tenant {
  _count: {
    professionals: number;
    services: number;
    clients: number;
    appointments: number;
  };
}

export async function listTenantsApi(): Promise<TenantWithCounts[]> {
  return api.get<TenantWithCounts[]>('/super/tenants');
}

export async function getTenantDetailApi(id: string): Promise<TenantData> {
  return api.get<TenantData>(`/super/tenants/${id}`);
}

export interface CreateTenantPayload {
  slug: string;
  name: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  plan?: 'basic' | 'pro' | 'enterprise';
  monthlyPrice?: number;
  primaryColor?: string;
  adminPassword: string;
}

export async function createTenantApi(payload: CreateTenantPayload): Promise<Tenant> {
  return api.post<Tenant>('/super/tenants', payload);
}

export async function updateTenantApi(
  id: string,
  payload: Partial<Omit<CreateTenantPayload, 'adminPassword'>> & {
    status?: 'active' | 'trial' | 'suspended';
  }
): Promise<Tenant> {
  return api.patch<Tenant>(`/super/tenants/${id}`, payload);
}

export async function deleteTenantApi(id: string): Promise<void> {
  return api.delete(`/super/tenants/${id}`);
}
