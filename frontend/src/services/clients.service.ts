import { api } from '../lib/api';
import type { Client } from '../types';

export async function listClientsApi(search?: string): Promise<Client[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return api.get<Client[]>(`/admin/clients${query}`);
}

export interface ClientPayload {
  name: string;
  email: string;
  phone?: string;
}

export async function createClientApi(payload: ClientPayload): Promise<Client> {
  return api.post<Client>('/admin/clients', payload);
}

export async function updateClientApi(id: string, payload: Partial<ClientPayload>): Promise<Client> {
  return api.patch<Client>(`/admin/clients/${id}`, payload);
}

export async function deleteClientApi(id: string): Promise<void> {
  return api.delete(`/admin/clients/${id}`);
}
