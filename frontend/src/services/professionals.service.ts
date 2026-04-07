import { api } from '../lib/api';
import type { Professional } from '../types';

// ─── Normaliza resposta do backend → tipo frontend ────────────────────────────
// Backend usa workingHoursStart/End e services como array de objetos aninhados.
// Frontend usa workingHours.start/end e services como array de IDs.
function normalize(p: Record<string, unknown>): Professional {
  const services = (p.services as { serviceId: string }[] | undefined) ?? [];
  return {
    id: p.id as string,
    tenantId: p.tenantId as string,
    name: p.name as string,
    specialty: p.specialty as string,
    avatar: (p.avatar as string) ?? '',
    photoUrl: p.photoUrl as string | undefined,
    bio: (p.bio as string) ?? '',
    services: services.map((s) => s.serviceId),
    workingHours: {
      start: (p.workingHoursStart as string) ?? '08:00',
      end: (p.workingHoursEnd as string) ?? '18:00',
    },
    workingDays: (p.workingDays as number[]) ?? [1, 2, 3, 4, 5],
  };
}

export async function listProfessionalsApi(): Promise<Professional[]> {
  const data = await api.get<Record<string, unknown>[]>('/admin/professionals');
  return data.map(normalize);
}

export interface CreateProfessionalPayload {
  name: string;
  specialty: string;
  bio?: string;
  avatar?: string;
  photoUrl?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  serviceIds: string[];
  email?: string;
  password?: string;
}

export async function createProfessionalApi(payload: CreateProfessionalPayload): Promise<Professional> {
  const data = await api.post<Record<string, unknown>>('/admin/professionals', payload);
  return normalize(data);
}

export async function updateProfessionalApi(
  id: string,
  payload: Partial<CreateProfessionalPayload>
): Promise<Professional> {
  const data = await api.patch<Record<string, unknown>>(`/admin/professionals/${id}`, payload);
  return normalize(data);
}

export async function deleteProfessionalApi(id: string): Promise<void> {
  return api.delete(`/admin/professionals/${id}`);
}

// ─── Profissional atualizando a si mesmo ─────────────────────────────────────
export interface UpdateMePayload {
  workingDays?:       number[];
  workingHoursStart?: string;
  workingHoursEnd?:   string;
  bio?:               string;
  specialty?:         string;
  avatar?:            string;
  photoUrl?:          string;
}

export async function updateProfessionalMeApi(payload: UpdateMePayload): Promise<Professional> {
  const data = await api.patch<Record<string, unknown>>('/professional/me', payload);
  return normalize(data);
}
