import { api } from '@/lib/api';

export interface AbsentClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  lastAppointmentDate: string | null;
  lastServiceName: string | null;
  daysMissing: number | null;
}

export async function listAbsentClientsApi(daysSince: number): Promise<AbsentClient[]> {
  return api.get<AbsentClient[]>(`/admin/reminders/absent-clients?daysSince=${daysSince}`);
}
