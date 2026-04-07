import { api } from '../lib/api';
import type { Appointment } from '../types';

// ─── Normaliza resposta do backend → tipo frontend ────────────────────────────
// O backend inclui { client, professional, service } aninhados — removemos para
// manter compatibilidade com o formato usado pelos componentes (lookup por ID).
function normalize(a: Record<string, unknown>): Appointment {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { client: _c, professional: _p, service: _s, ...rest } = a;
  return rest as Appointment;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AppointmentFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  status?: string;
}

export async function listAppointmentsApi(filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api.get<Record<string, unknown>[]>(`/admin/appointments${query}`);
  return data.map(normalize);
}

export interface CreateAppointmentPayload {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export async function createAppointmentApi(payload: CreateAppointmentPayload): Promise<Appointment> {
  const data = await api.post<Record<string, unknown>>('/admin/appointments', payload);
  return normalize(data);
}

export async function updateAppointmentStatusApi(
  id: string,
  status: Appointment['status']
): Promise<Appointment> {
  const data = await api.patch<Record<string, unknown>>(`/admin/appointments/${id}/status`, { status });
  return normalize(data);
}

export async function deleteAppointmentApi(id: string): Promise<void> {
  return api.delete(`/admin/appointments/${id}`);
}

// ─── Professional ─────────────────────────────────────────────────────────────
export async function createProfAppointmentApi(payload: CreateAppointmentPayload): Promise<Appointment> {
  const data = await api.post<Record<string, unknown>>('/professional/appointments', payload);
  return normalize(data);
}

export async function listProfAppointmentsApi(filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api.get<Record<string, unknown>[]>(`/professional/appointments${query}`);
  return data.map(normalize);
}

export async function updateProfAppointmentStatusApi(
  id: string,
  status: Appointment['status']
): Promise<Appointment> {
  const data = await api.patch<Record<string, unknown>>(`/professional/appointments/${id}/status`, { status });
  return normalize(data);
}
