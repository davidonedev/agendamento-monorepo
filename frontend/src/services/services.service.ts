import { api } from '../lib/api';
import type { Service } from '../types';

export async function listServicesApi(): Promise<Service[]> {
  return api.get<Service[]>('/admin/services');
}

export interface ServicePayload {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive?: boolean;
}

export async function createServiceApi(payload: ServicePayload): Promise<Service> {
  return api.post<Service>('/admin/services', payload);
}

export async function updateServiceApi(id: string, payload: Partial<ServicePayload>): Promise<Service> {
  return api.patch<Service>(`/admin/services/${id}`, payload);
}

export async function deleteServiceApi(id: string): Promise<void> {
  return api.delete(`/admin/services/${id}`);
}

// ─── Portal do profissional ───────────────────────────────────────────────────
export async function listProfServicesApi(): Promise<Service[]> {
  return api.get<Service[]>('/professional/services');
}

export async function createProfServiceApi(payload: ServicePayload): Promise<Service> {
  return api.post<Service>('/professional/services', payload);
}

export async function updateProfServiceApi(id: string, payload: Partial<ServicePayload>): Promise<Service> {
  return api.patch<Service>(`/professional/services/${id}`, payload);
}

export async function deleteProfServiceApi(id: string): Promise<void> {
  return api.delete(`/professional/services/${id}`);
}
