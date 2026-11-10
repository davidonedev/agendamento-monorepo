import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isPast, differenceInMinutes, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar, Clock, User, Loader2, XCircle, AlertCircle, RefreshCw,
  CalendarCheck, QrCode, Copy, CheckCircle2,
} from 'lucide-react';
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
import {
  getClientAppointmentsApi,
  cancelPublicAppointmentApi,
  reschedulePublicAppointmentApi,
  getAvailableSlotsApi,
  createPixPaymentApi,
  getPaymentStatusApi,
  type PublicAppointment,
  type PixPaymentData,
} from '@/services/public.service';
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

function minLeft(appt: PublicAppointment): number {
  const apptDatetime = parseISO(`${appt.date}T${appt.startTime}:00-03:00`);
  return differenceInMinutes(apptDatetime, new Date());
}

function canCancel(appt: PublicAppointment): boolean {
  if (appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show') return false;
  return minLeft(appt) >= 60;
}

function canReschedule(appt: PublicAppointment): boolean {
  if (appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show') return false;
  return minLeft(appt) >= 60;
}

function canPay(appt: PublicAppointment): boolean {
  if (appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show') return false;
  if (appt.paymentStatus === 'approved') return false;
  const apptDatetime = parseISO(`${appt.date}T${appt.startTime}:00-03:00`);
  return !isPast(apptDatetime);
}

function isUpcoming(appt: PublicAppointment): boolean {
  const apptDate = parseISO(`${appt.date}T${appt.startTime}:00-03:00`);
  return !isPast(apptDate) && appt.status !== 'cancelled';
}


// ─── Componente principal ─────────────────────────────────────────────────────

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

  // Reagendamento
  const [reschedTarget, setReschedTarget]     = useState<PublicAppointment | null>(null);
  const [reschedDate, setReschedDate]         = useState('');
  const [reschedSlots, setReschedSlots]       = useState<string[]>([]);
  const [reschedSlot, setReschedSlot]         = useState('');
  const [reschedLoading, setReschedLoading]   = useState(false);
  const [reschedSlotsLoading, setReschedSlotsLoading] = useState(false);
  const [reschedError, setReschedError]       = useState<string | null>(null);
  const [reschedSuccess, setReschedSuccess]   = useState(false);

  // Pix
  const [pixTarget, setPixTarget]     = useState<PublicAppointment | null>(null);
  const [pixData, setPixData]         = useState<PixPaymentData | null>(null);
  const [pixLoading, setPixLoading]   = useState(false);
  const [pixError, setPixError]       = useState<string | null>(null);
  const [pixCopied, setPixCopied]     = useState(false);
  const pixPollRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ── Cancelamento ────────────────────────────────────────────────────────────

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !client) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelPublicAppointmentApi(tenant.slug, cancelTarget.id, client.id);
      setAppointments(prev => prev.map(a => a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a));
      setCancelSuccess(true);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Erro ao cancelar. Tente novamente.');
    } finally {
      setCancelling(false);
    }
  };

  const closeCancel = () => { setCancelTarget(null); setCancelError(null); setCancelSuccess(false); };

  // ── Reagendamento ───────────────────────────────────────────────────────────

  const openReschedule = (appt: PublicAppointment) => {
    setReschedTarget(appt);
    setReschedDate('');
    setReschedSlots([]);
    setReschedSlot('');
    setReschedError(null);
    setReschedSuccess(false);
  };

  useEffect(() => {
    if (!reschedTarget || !reschedDate) { setReschedSlots([]); return; }
    setReschedSlotsLoading(true);
    setReschedSlot('');
    getAvailableSlotsApi(tenant.slug, {
      professionalId: reschedTarget.professional?.id ?? '',
      serviceIds:     [reschedTarget.service?.id ?? ''],
      date:           reschedDate,
    })
      .then(slots => setReschedSlots(slots))
      .catch(() => setReschedSlots([]))
      .finally(() => setReschedSlotsLoading(false));
  }, [reschedDate, reschedTarget, tenant.slug]);

  const handleRescheduleConfirm = async () => {
    if (!reschedTarget || !client || !reschedDate || !reschedSlot) return;
    setReschedLoading(true);
    setReschedError(null);
    try {
      await reschedulePublicAppointmentApi(tenant.slug, reschedTarget.id, {
        clientId: client.id,
        date: reschedDate,
        startTime: reschedSlot,
      });
      setAppointments(prev => prev.map(a =>
        a.id === reschedTarget.id ? { ...a, date: reschedDate, startTime: reschedSlot } : a
      ));
      setReschedSuccess(true);
    } catch (err) {
      setReschedError(err instanceof ApiError ? err.message : 'Erro ao reagendar. Tente novamente.');
    } finally {
      setReschedLoading(false);
    }
  };

  const closeReschedule = () => {
    setReschedTarget(null);
    setReschedDate('');
    setReschedSlots([]);
    setReschedSlot('');
    setReschedError(null);
    setReschedSuccess(false);
  };

  // ── Pix ─────────────────────────────────────────────────────────────────────

  const openPix = async (appt: PublicAppointment) => {
    if (!client) return;
    setPixTarget(appt);
    setPixData(null);
    setPixError(null);
    setPixLoading(true);
    try {
      const data = await createPixPaymentApi(tenant.slug, appt.id, client.id);
      setPixData(data);
    } catch (err) {
      setPixError(err instanceof ApiError ? err.message : 'Erro ao gerar Pix. Tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  // Poll a cada 5s enquanto Pix está pendente
  useEffect(() => {
    if (!pixData || pixData.status === 'approved' || !pixTarget || !client) return;
    pixPollRef.current = setInterval(async () => {
      try {
        const result = await getPaymentStatusApi(tenant.slug, pixTarget.id, client.id);
        if (result.status === 'approved') {
          setPixData(prev => prev ? { ...prev, status: 'approved' } : prev);
          setAppointments(prev => prev.map(a =>
            a.id === pixTarget.id
              ? { ...a, status: 'confirmed', paymentStatus: 'approved' }
              : a
          ));
          if (pixPollRef.current) clearInterval(pixPollRef.current);
        }
      } catch { /* silêncio */ }
    }, 5000);
    return () => { if (pixPollRef.current) clearInterval(pixPollRef.current); };
  }, [pixData, pixTarget, client, tenant.slug]);

  const closePix = () => {
    if (pixPollRef.current) clearInterval(pixPollRef.current);
    setPixTarget(null);
    setPixData(null);
    setPixError(null);
    setPixCopied(false);
  };

  const copyPixCode = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    });
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
                    onReschedule={() => openReschedule(appt)}
                    onPay={() => openPix(appt)}
                  />
                ))}
              </div>
            )}
          </section>

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
                    onReschedule={() => openReschedule(appt)}
                    onPay={() => openPix(appt)}
                    muted
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Dialog cancelamento ── */}
      <Dialog open={!!cancelTarget} onOpenChange={open => { if (!open) closeCancel(); }}>
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
              <Button onClick={closeCancel} style={{ backgroundColor: tenant.primaryColor }}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeCancel} disabled={cancelling}>Voltar</Button>
                <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling}>
                  {cancelling && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Confirmar cancelamento
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog reagendamento ── */}
      <Dialog open={!!reschedTarget} onOpenChange={open => { if (!open) closeReschedule(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reagendar agendamento</DialogTitle>
            <DialogDescription>
              {reschedSuccess
                ? 'Agendamento reagendado com sucesso!'
                : reschedTarget
                ? `Escolha uma nova data e horário para ${reschedTarget.service?.name ?? 'o serviço'}.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {!reschedSuccess && reschedTarget && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nova data</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  value={reschedDate}
                  onChange={e => setReschedDate(e.target.value)}
                />
              </div>

              {reschedDate && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Horário disponível</label>
                  {reschedSlotsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : reschedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Nenhum horário disponível nesta data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
                      {reschedSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setReschedSlot(slot)}
                          className={`text-sm py-2 px-1 rounded-md border transition-colors
                            ${reschedSlot === slot
                              ? 'text-white border-transparent'
                              : 'border-border hover:border-primary/50 bg-background'
                            }`}
                          style={reschedSlot === slot ? { backgroundColor: tenant.primaryColor } : undefined}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {reschedError && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {reschedError}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {reschedSuccess ? (
              <Button onClick={closeReschedule} style={{ backgroundColor: tenant.primaryColor }}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeReschedule} disabled={reschedLoading}>Cancelar</Button>
                <Button
                  onClick={handleRescheduleConfirm}
                  disabled={reschedLoading || !reschedDate || !reschedSlot}
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {reschedLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Confirmar reagendamento
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Pix ── */}
      <Dialog open={!!pixTarget} onOpenChange={open => { if (!open) closePix(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Pagar com Pix
            </DialogTitle>
            <DialogDescription>
              {pixTarget
                ? `${pixTarget.service?.name ?? 'Serviço'} — R$ ${(pixTarget.service?.price ?? 0).toFixed(2).replace('.', ',')}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {pixLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}

          {pixError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {pixError}
            </div>
          )}

          {pixData && pixData.status === 'approved' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
              <p className="font-semibold text-green-700 dark:text-green-400">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground">Seu agendamento está confirmado.</p>
            </div>
          )}

          {pixData && pixData.status !== 'approved' && (
            <div className="space-y-4">
              {/* QR Code */}
              {pixData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>
              )}

              {/* Pix Copia e Cola */}
              {pixData.qrCode && (
                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">
                    Pix Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pixData.qrCode}
                      className="flex-1 text-xs bg-muted rounded-md px-2 py-1.5 border truncate font-mono"
                    />
                    <Button variant="outline" size="sm" onClick={copyPixCode} className="shrink-0">
                      {pixCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePix}>
              {pixData?.status === 'approved' ? 'Fechar' : 'Fechar (pagar depois)'}
            </Button>
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
  onReschedule: () => void;
  onPay: () => void;
  muted?: boolean;
}

function AppointmentCard({ appt, primaryColor, onCancel, onReschedule, onPay, muted }: CardProps) {
  const cancellable  = canCancel(appt);
  const reschedulable = canReschedule(appt);
  const payable      = canPay(appt);
  const apptDate     = parseISO(`${appt.date}T00:00:00`);

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
          {appt.service?.duration && <span>{appt.service.duration} min</span>}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        {payable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-green-600"
            onClick={onPay}
            title="Pagar com Pix"
          >
            <QrCode className="h-4 w-4" />
          </Button>
        )}
        {reschedulable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={onReschedule}
            title="Reagendar"
          >
            <CalendarCheck className="h-4 w-4" />
          </Button>
        )}
        {cancellable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onCancel}
            title="Cancelar agendamento"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
