import { api } from '../lib/api';
import type { BlockedSlot } from '../types';

// Normaliza resposta do backend (remove campo professional aninhado)
function normalize(b: Record<string, unknown>): BlockedSlot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { professional: _p, ...rest } = b;
  return rest as BlockedSlot;
}

export async function listBlockedSlotsApi(filters?: {
  professionalId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<BlockedSlot[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api.get<Record<string, unknown>[]>(`/admin/blocked-slots${query}`);
  return data.map(normalize);
}

export interface BlockedSlotPayload {
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export async function createBlockedSlotApi(payload: BlockedSlotPayload): Promise<BlockedSlot> {
  const data = await api.post<Record<string, unknown>>('/admin/blocked-slots', payload);
  return normalize(data);
}

export async function deleteBlockedSlotApi(id: string): Promise<void> {
  return api.delete(`/admin/blocked-slots/${id}`);
}
