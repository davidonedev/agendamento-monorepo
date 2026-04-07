import { api } from '../lib/api';
import type { Tenant, Service, Professional, Appointment, Client } from '../types';

// Normaliza professional do backend para tipo frontend
function normalizeProfessional(p: Record<string, unknown>): Professional {
  const services = (p.services as { serviceId: string }[] | undefined) ?? [];
  return {
    id:         p.id as string,
    tenantId:   p.tenantId as string,
    name:       p.name as string,
    specialty:  p.specialty as string,
    avatar:     (p.avatar as string) ?? '',
    photoUrl:   p.photoUrl as string | undefined,
    bio:        (p.bio as string) ?? '',
    services:   services.map((s) => s.serviceId),
    workingHours: {
      start: (p.workingHoursStart as string) ?? '08:00',
      end:   (p.workingHoursEnd   as string) ?? '18:00',
    },
    workingDays: (p.workingDays as number[]) ?? [1, 2, 3, 4, 5],
  };
}

// Normaliza appointment (strip nested relations)
function normalizeAppointment(a: Record<string, unknown>): Appointment {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { client: _c, professional: _p, service: _s, ...rest } = a;
  return rest as Appointment;
}

// ─── Dados públicos do tenant ─────────────────────────────────────────────────
export async function getPublicTenantApi(slug: string): Promise<Tenant> {
  return api.get<Tenant>(`/public/${slug}`);
}

export async function getPublicServicesApi(slug: string): Promise<Service[]> {
  return api.get<Service[]>(`/public/${slug}/services`);
}

export async function getPublicProfessionalsApi(
  slug: string,
  serviceId?: string,
): Promise<Professional[]> {
  const query = serviceId ? `?serviceId=${serviceId}` : '';
  const data = await api.get<Record<string, unknown>[]>(`/public/${slug}/professionals${query}`);
  return data.map(normalizeProfessional);
}

// ─── Disponibilidade — suporta um ou múltiplos serviços ──────────────────────
export async function getAvailableSlotsApi(
  slug: string,
  params: { professionalId: string; serviceIds: string[]; date: string },
): Promise<string[]> {
  const qs = new URLSearchParams({
    professionalId: params.professionalId,
    serviceIds:     params.serviceIds.join(','),
    date:           params.date,
  }).toString();
  return api.get<string[]>(`/public/${slug}/availability?${qs}`);
}

// ─── Payload de agendamento público ──────────────────────────────────────────
export interface PublicBookingPayload {
  professionalId: string;
  serviceIds:     string[];   // um ou mais serviços
  date:           string;
  startTime:      string;
  clientName:     string;
  clientEmail:    string;
  clientPhone?:   string;
  notes?:         string;
}

// ─── Criar agendamento — retorna array (um por serviço) ───────────────────────
export async function createPublicBookingApi(
  slug: string,
  payload: PublicBookingPayload,
): Promise<{ appointments: Appointment[]; client: Client }> {
  const raw = await api.post<Record<string, unknown>[]>(`/public/${slug}/booking`, payload);
  // backend retorna array de appointments, cada um com client/professional/service nested
  const appointments = raw.map(normalizeAppointment);
  const client = ((raw[0] as Record<string, unknown>)?.client ?? {}) as Client;
  return { appointments, client };
}
