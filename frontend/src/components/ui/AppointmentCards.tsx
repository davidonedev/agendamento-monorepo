/**
 * AppointmentCards — mobile-first card list for admin and professional agenda views.
 * Shows on small screens; desktop keeps the table/calendar as-is.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, Scissors, Loader2, CheckCircle, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

// ─── Shared status config ─────────────────────────────────────────────────────
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending:   'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show:   'Não compareceu',
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  completed: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  no_show:   'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
};

const ALL_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

function parseApptDate(s: string) {
  return s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00');
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApptCardData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  price: number;
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  serviceDuration?: number;
  professionalName?: string; // undefined = don't show (professional's own view)
}

interface SingleCardProps {
  appt: ApptCardData;
  onSave: (id: string, status: AppointmentStatus) => Promise<void>;
  accentColor?: string;
}

// ─── Single appointment card ──────────────────────────────────────────────────
function AppointmentCard({ appt, onSave, accentColor }: SingleCardProps) {
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);
  const [saving, setSaving] = useState(false);
  const dirty = status !== appt.status;

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(appt.id, status); }
    finally { setSaving(false); }
  };

  const borderAccent =
    appt.status === 'pending' ? 'border-l-yellow-400' :
    appt.status === 'confirmed' ? 'border-l-blue-400' :
    appt.status === 'completed' ? 'border-l-green-500' :
    appt.status === 'cancelled' ? 'border-l-red-400' :
    'border-l-gray-300';

  return (
    <Card className={`border-l-4 ${borderAccent} shadow-sm`}>
      <CardContent className="p-4 space-y-3">

        {/* Row 1 — status + price */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[appt.status]}`}>
            {STATUS_LABEL[appt.status]}
          </span>
          <span className="text-base font-bold" style={accentColor ? { color: accentColor } : {}}>
            {formatCurrency(appt.price)}
          </span>
        </div>

        {/* Row 2 — date + time */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {format(parseApptDate(appt.date), "EEE, d 'de' MMM", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {appt.startTime} – {appt.endTime}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Row 3 — client */}
        {appt.clientName && (
          <div className="flex items-start gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold leading-tight">{appt.clientName}</p>
              {appt.clientPhone && (
                <p className="text-xs text-muted-foreground">{appt.clientPhone}</p>
              )}
            </div>
          </div>
        )}

        {/* Row 4 — service */}
        {appt.serviceName && (
          <div className="flex items-center gap-2 text-sm">
            <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {appt.serviceName}
              {appt.serviceDuration != null && (
                <span className="text-muted-foreground text-xs ml-1">· {appt.serviceDuration} min</span>
              )}
            </span>
          </div>
        )}

        {/* Row 5 — professional (admin view only) */}
        {appt.professionalName && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{appt.professionalName}</span>
          </div>
        )}

        {/* Row 6 — notes */}
        {appt.notes && (
          <p className="text-xs text-muted-foreground italic bg-muted/40 rounded px-2 py-1">
            {appt.notes}
          </p>
        )}

        {/* Divider */}
        <div className="border-t" />

        {/* Row 7 — status change + save */}
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={v => setStatus(v as AppointmentStatus)}>
            <SelectTrigger className={`flex-1 text-xs h-9 ${STATUS_STYLE[status]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-sm">
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-9 px-4 gap-1.5 shrink-0"
            disabled={!dirty || saving}
            onClick={handleSave}
            variant={dirty ? 'default' : 'ghost'}
          >
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCircle className="h-3.5 w-3.5" />}
            {saving ? 'Salvando…' : dirty ? 'Salvar' : 'Salvo'}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

// ─── Card list with date grouping ─────────────────────────────────────────────
interface AppointmentCardListProps {
  appointments: ApptCardData[];
  onSave: (id: string, status: AppointmentStatus) => Promise<void>;
  emptyMessage?: string;
  accentColor?: string;
}

export function AppointmentCardList({
  appointments,
  onSave,
  emptyMessage = 'Nenhum agendamento encontrado.',
  accentColor,
}: AppointmentCardListProps) {
  if (appointments.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-10">{emptyMessage}</p>
    );
  }

  // Group by date
  const groups = new Map<string, ApptCardData[]>();
  appointments.forEach(a => {
    const key = a.date.slice(0, 10); // "YYYY-MM-DD"
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  });

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([date, appts]) => (
        <div key={date}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {format(parseApptDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="space-y-3">
            {appts
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onSave={onSave}
                  accentColor={accentColor}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
