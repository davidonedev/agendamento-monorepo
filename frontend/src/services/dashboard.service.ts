import { api } from '../lib/api';

export interface DashboardSummary {
  today: string; // yyyy-MM-dd (America/Sao_Paulo)
  clients: { total: number; last7Days: number; previous7Days: number };
  cancellations: { total: number; cancelled: number; noShow: number };
  week: { date: string; count: number }[];
  upcoming: {
    id: string;
    date: string;
    startTime: string;
    clientName: string;
    serviceName: string;
    professionalName: string;
    status: 'pending' | 'confirmed';
  }[];
  trial: {
    state: 'in_progress' | 'last_day' | 'expired' | 'paid' | 'none';
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    endsAt: string | null; // yyyy-MM-dd
  };
}

export function getDashboardSummaryApi(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/admin/dashboard/summary');
}
