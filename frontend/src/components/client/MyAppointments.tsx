import { useState, useEffect, useCallback } from 'react';
import { format, isPast, differenceInMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Loader2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { usePublicClient } from '@/context/PublicClientContext';
import { getClientAppointmentsApi, cancelPublicAppointmentApi, type PublicAppointment } from '@/services/public.service';
import { ApiError } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show:   'Não compareceu',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending:   'outline',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show:   'destructive',
};

function canCancel(appt: PublicAppointment): boolean {
  if (appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show') return false;
  // Brasília = UTC-3
  const apptDatetime = parseISO(`${appt.date}T${appt.startTime}:00-03:00`);
  const minutesLeft  = differenceInMinutes(apptDatetime, new Date());
  return minutesLeft >= 60;
}

function isUpcoming(appt: PublicAppointment): boolean {
  const apptDate = parseISO(`${appt.date}T${appt.startTime}:00-03:00`);
  return !isPast(apptDate) && appt.status !== 'cancelled';
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MyAppointments() {
  const { data: { tenant } } = usePublicTenant();
  const { client }            = usePublicClient();

  const [appointments, setAppointments] = useState<PublicAppointment[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Cancelamento
  const [cancelTarget, setCancelTarget]   = useState<PublicAppointment | null>(null);
  const [cancelling, setCancelling]       = useState(false);
  const [cancelError, setCancelError]     = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getClientAppointmentsApi(tenant.slug, client.id);
      setAppointments(data);
    } catch {
      setError('Não foi possível carregar seus agendamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [client, tenant.slug]);

  useEffect(() => { load(); }, [load]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !client) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelPublicAppointmentApi(tenant.slug, cancelTarget.id, client.id);
      setAppointments(prev =>
        prev.map(a => a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a)
      );
      setCancelSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError('Erro ao cancelar. Tente novamente.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const closeDialog = () => {
    setCancelTarget(null);
    setCancelError(null);
    setCancelSuccess(false);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <User className="h-12 w-12 opacity-20" />
        <p className="text-sm">Faça login para ver seus agendamentos.</p>
      </div>
    );
  }

  const upcoming = appointments.filter(isUpcoming).sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
  );

  const past = appointments
    .filter(a => !isUpcoming(a))
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Meus Agendamentos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus agendamentos em {tenant.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Próximos ── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Próximos ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl bg-muted/20">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Nenhum agendamento futuro</p>
                <p className="text-xs mt-1">Que tal agendar agora?</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    primaryColor={tenant.primaryColor}
                    onCancel={() => setCancelTarget(appt)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Histórico ── */}
          {past.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Histórico ({past.length})
              </h3>
              <div className="space-y-2">
                {past.map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    primaryColor={tenant.primaryColor}
                    onCancel={() => setCancelTarget(appt)}
                    muted
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Dialog de confirmação de cancelamento ── */}
      <Dialog open={!!cancelTarget} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar agendamento</DialogTitle>
            <DialogDescription>
              {cancelSuccess
                ? 'Agendamento cancelado com sucesso.'
                : cancelTarget
                ? `Deseja cancelar ${cancelTarget.service?.name ?? 'este serviço'} em ${format(parseISO(cancelTarget.date + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })} às ${cancelTarget.startTime}?`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {cancelError}
            </div>
          )}

          <DialogFooter>
            {cancelSuccess ? (
              <Button onClick={closeDialog} style={{ backgroundColor: tenant.primaryColor }}>
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog} disabled={cancelling}>
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelConfirm}
                  disabled={cancelling}
                >
                  {cancelling && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Confirmar cancelamento
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Card individual de agendamento ──────────────────────────────────────────

interface CardProps {
  appt: PublicAppointment;
  primaryColor: string;
  onCancel: () => void;
  muted?: boolean;
}

function AppointmentCard({ appt, primaryColor, onCancel, muted }: CardProps) {
  const cancellable = canCancel(appt);
  const apptDate = parseISO(`${appt.date}T00:00:00`);

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors
      ${muted ? 'opacity-70 bg-muted/20' : 'bg-card hover:bg-muted/20'}`}>

      {/* Data */}
      <div
        className="shrink-0 w-12 h-14 rounded-lg flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: muted ? '#94a3b8' : primaryColor }}
      >
        <span className="text-lg font-bold leading-none">{format(apptDate, 'd')}</span>
        <span className="text-[10px] uppercase tracking-wide leading-none mt-0.5">
          {format(apptDate, 'MMM', { locale: ptBR })}
        </span>
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{appt.service?.name ?? '—'}</p>
          <Badge variant={STATUS_VARIANT[appt.status] ?? 'outline'} className="text-[10px]">
            {STATUS_LABEL[appt.status] ?? appt.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {appt.startTime}
          </span>
          {appt.professional && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {appt.professional.name}
            </span>
          )}
          {appt.service?.duration && (
            <span>{appt.service.duration} min</span>
          )}
        </div>
      </div>

      {/* Ação */}
      {cancellable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onCancel}
          title="Cancelar agendamento"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
