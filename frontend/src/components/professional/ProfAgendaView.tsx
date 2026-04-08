import { useMemo, useState } from 'react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell, Calendar, CalendarPlus, CheckCircle, Clock,
  List, Loader2, ThumbsDown, ThumbsUp, X, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfessional } from '@/context/ProfessionalContext';
import { formatCurrency } from '@/lib/utils';
import { AppointmentCardList, type ApptCardData } from '@/components/ui/AppointmentCards';
import type { Appointment, AppointmentStatus } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────
function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

interface ApptForm {
  clientId: string; serviceId: string; date: string; startTime: string; notes: string;
}
const emptyForm = (): ApptForm => ({
  clientId: '', serviceId: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', notes: '',
});

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending:   'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show:   'Não compareceu',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_show:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

type StatusFilter = AppointmentStatus | 'all';
type ViewMode = 'table' | 'calendar';
type FilterTab = 'upcoming' | 'today' | 'past';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'Todos'           },
  { key: 'pending',   label: 'Agendado'        },
  { key: 'confirmed', label: 'Confirmado'      },
  { key: 'completed', label: 'Concluído'       },
  { key: 'cancelled', label: 'Cancelado'       },
  { key: 'no_show',   label: 'Não compareceu'  },
];

// ─── TableRow ────────────────────────────────────────────────────────────────
function TableRow({ appt, clients, services, onStatusSave }: {
  appt: Appointment;
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
  onStatusSave: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [localStatus, setLocalStatus] = useState<AppointmentStatus>(appt.status);
  const [saving, setSaving] = useState(false);
  const dirty = localStatus !== appt.status;

  const client  = clients.find(c => c.id === appt.clientId);
  const service = services.find(s => s.id === appt.serviceId);

  const handleSave = async () => {
    setSaving(true);
    try { await onStatusSave(appt.id, localStatus); }
    finally { setSaving(false); }
  };

  return (
    <tr className="border-b hover:bg-muted/40 transition-colors">
      <td className="px-3 py-2.5 text-sm whitespace-nowrap">
        {format(parseISO(appt.date), "dd/MM/yyyy")}
      </td>
      <td className="px-3 py-2.5 text-sm whitespace-nowrap">
        {appt.startTime}–{appt.endTime}
      </td>
      <td className="px-3 py-2.5 text-sm">{client?.name ?? '—'}</td>
      <td className="px-3 py-2.5 text-sm">{service?.name ?? '—'}</td>
      <td className="px-3 py-2.5 text-sm font-medium">{formatCurrency(appt.price)}</td>
      <td className="px-3 py-2.5">
        <select
          value={localStatus}
          onChange={e => setLocalStatus(e.target.value as AppointmentStatus)}
          className={`text-xs font-medium rounded px-2 py-1 border-0 outline-none cursor-pointer ${STATUS_COLOR[localStatus]}`}
        >
          {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5">
        <Button
          size="sm"
          variant={dirty ? 'default' : 'ghost'}
          className="h-7 text-xs"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
        </Button>
      </td>
    </tr>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ProfAgendaView() {
  const { appointments, clients, allClients, services, professional, addAppointment, updateAppointmentStatus, cancelAppointment } = useProfessional();

  const [view, setView]         = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  // Calendar-mode state
  const [tab, setTab]           = useState<FilterTab>('today');
  const [rejectId, setRejectId] = useState<string | null>(null);

  // New appointment dialog
  const [apptDialog, setApptDialog] = useState(false);
  const [apptForm,   setApptForm]   = useState<ApptForm>(emptyForm());
  const [apptError,  setApptError]  = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  // ── Table filtered appointments ──────────────────────────────────────────
  const tableFiltered = useMemo(() => {
    let list = [...appointments];
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (dateFrom)               list = list.filter(a => a.date >= dateFrom);
    if (dateTo)                 list = list.filter(a => a.date <= dateTo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const client  = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        return client?.name.toLowerCase().includes(q) || service?.name.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [appointments, statusFilter, search, dateFrom, dateTo, clients, services]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: appointments.length };
    appointments.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    return counts;
  }, [appointments]);

  // ── Calendar mode helpers ────────────────────────────────────────────────
  const pending = useMemo(() =>
    appointments.filter(a => a.status === 'pending').sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
  [appointments]);

  const calFiltered = useMemo(() => {
    const active = appointments.filter(a => a.status !== 'cancelled');
    switch (tab) {
      case 'today':    return active.filter(a => a.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
      case 'upcoming': return active.filter(a => a.date > today).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      case 'past':     return active.filter(a => a.date < today).sort((a, b) => b.date.localeCompare(a.date));
    }
  }, [appointments, tab, today]);

  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    const upcoming   = appointments.filter(a => a.date > today && a.status !== 'cancelled');
    const completed  = appointments.filter(a => a.status === 'completed');
    return { today: todayAppts.length, upcoming: upcoming.length, completed: completed.length, revenue: completed.reduce((s, a) => s + a.price, 0) };
  }, [appointments, today]);

  const TAB_LABELS: Record<FilterTab, string> = { today: 'Hoje', upcoming: 'Próximos', past: 'Anteriores' };

  const grouped = useMemo(() => {
    if (tab === 'today') return null;
    const map = new Map<string, Appointment[]>();
    calFiltered.forEach(a => { if (!map.has(a.date)) map.set(a.date, []); map.get(a.date)!.push(a); });
    return map;
  }, [calFiltered, tab]);

  const getClient  = (id: string) => clients.find(c => c.id === id);
  const getService = (id: string) => services.find(s => s.id === id);

  const myServices = useMemo(() => services.filter(s => professional.services.includes(s.id)), [services, professional.services]);
  const selectedSvc = myServices.find(s => s.id === apptForm.serviceId);

  const handleApptSave = async () => {
    setApptError('');
    if (!apptForm.clientId || !apptForm.serviceId || !apptForm.date || !apptForm.startTime) {
      setApptError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!selectedSvc) return;
    const endTime = addMinutes(apptForm.startTime, selectedSvc.duration);
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const sMin = toMin(apptForm.startTime), eMin = toMin(endTime);
    const conflict = appointments.some(a =>
      a.date === apptForm.date && a.status !== 'cancelled' &&
      sMin < toMin(a.endTime) && eMin > toMin(a.startTime)
    );
    if (conflict) { setApptError('Conflito de horário: você já tem um compromisso neste intervalo.'); return; }
    try {
      await addAppointment({
        clientId:       apptForm.clientId,
        professionalId: professional.id,
        serviceId:      apptForm.serviceId,
        date:           apptForm.date,
        startTime:      apptForm.startTime.slice(0, 5),
        notes:          apptForm.notes.trim() || undefined,
      });
      setApptDialog(false);
      setApptForm(emptyForm());
    } catch (err) {
      if (err && typeof err === 'object' && 'details' in err) {
        const details = (err as { details?: { field: string; message: string }[] }).details;
        if (details?.length) {
          setApptError(details.map(d => `${d.field}: ${d.message}`).join(' | '));
          return;
        }
      }
      setApptError(err instanceof Error ? err.message : 'Erro ao criar agendamento.');
    }
  };

  const handleStatusSave = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
  };

  // ── Calendar card component ──────────────────────────────────────────────
  const ApptCard = ({ appt }: { appt: Appointment }) => {
    const client = getClient(appt.clientId);
    const svc    = getService(appt.serviceId);
    const isPending   = appt.status === 'pending';
    const isConfirmed = appt.status === 'confirmed';
    const hasActions  = isPending || isConfirmed;

    return (
      <div className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-card transition-colors ${isPending ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-center min-w-[48px]">
            <p className="text-sm font-bold text-primary">{appt.startTime}</p>
            <p className="text-xs text-muted-foreground">{appt.endTime}</p>
          </div>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {client?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{client?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{svc?.name} · {svc?.duration} min</p>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[appt.status]}`}>
              {STATUS_LABEL[appt.status]}
            </span>
            <p className="text-xs font-semibold mt-1">{formatCurrency(appt.price)}</p>
          </div>
        </div>
        {hasActions && (
          <div className="flex gap-2 sm:shrink-0">
            {isPending && (
              <>
                <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none sm:w-8 sm:p-0"
                  title="Aceitar agendamento" onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}>
                  <ThumbsUp className="h-3.5 w-3.5" /><span className="sm:hidden">Aceitar</span>
                </Button>
                <Button size="sm" variant="destructive" className="h-8 gap-1 flex-1 sm:flex-none sm:w-8 sm:p-0"
                  title="Recusar agendamento" onClick={() => setRejectId(appt.id)}>
                  <ThumbsDown className="h-3.5 w-3.5" /><span className="sm:hidden">Recusar</span>
                </Button>
              </>
            )}
            {isConfirmed && (
              <>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-green-600 border-green-300 hover:bg-green-50 flex-1 sm:flex-none sm:w-8 sm:p-0"
                  title="Marcar como concluído" onClick={() => updateAppointmentStatus(appt.id, 'completed')}>
                  <CheckCircle className="h-3.5 w-3.5" /><span className="sm:hidden">Concluir</span>
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 flex-1 sm:flex-none sm:w-8 sm:p-0"
                  title="Cancelar agendamento" onClick={() => setRejectId(appt.id)}>
                  <XCircle className="h-3.5 w-3.5" /><span className="sm:hidden">Cancelar</span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Minha Agenda</h2>
          <p className="text-muted-foreground text-sm">{professional.name} · {professional.specialty}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <List className="h-3.5 w-3.5" /> Tabela
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Calendar className="h-3.5 w-3.5" /> Lista
            </button>
          </div>
          <Button size="sm" onClick={() => { setApptError(''); setApptForm(emptyForm()); setApptDialog(true); }}>
            <CalendarPlus className="h-4 w-4 mr-1" /> Novo Agend.
          </Button>
        </div>
      </div>

      {/* ── TABLE VIEW ─────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="space-y-4">
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  statusFilter === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-muted-foreground/20 hover:bg-muted'
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70">{statusCounts[key] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar cliente ou serviço…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm w-36" title="De" />
            <Input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="h-8 text-sm w-36" title="Até" />
            {(search || dateFrom || dateTo || statusFilter !== 'all') && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStatusFilter('all'); }}>
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          {/* Tabela — visível apenas em telas médias+ */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Hora</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Cliente</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Serviço</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Pagamento</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {tableFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                        Nenhum agendamento encontrado
                      </td>
                    </tr>
                  ) : (
                    tableFiltered.map(appt => (
                      <TableRow
                        key={appt.id}
                        appt={appt}
                        clients={clients}
                        services={services}
                        onStatusSave={handleStatusSave}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cards — visível apenas em mobile */}
          <div className="md:hidden">
            <AppointmentCardList
              appointments={tableFiltered.map((a): ApptCardData => {
                const client  = clients.find(c => c.id === a.clientId);
                const svc     = services.find(s => s.id === a.serviceId);
                return {
                  id: a.id,
                  date: a.date,
                  startTime: a.startTime,
                  endTime: a.endTime,
                  status: a.status,
                  price: a.price,
                  notes: a.notes,
                  clientName: client?.name,
                  clientPhone: client?.phone,
                  serviceName: svc?.name,
                  serviceDuration: svc?.duration,
                  // sem professionalName — é a agenda do próprio profissional
                };
              })}
              onSave={handleStatusSave}
            />
          </div>
        </div>
      )}

      {/* ── CALENDAR/LIST VIEW ─────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <>
          {/* Pending alert */}
          {pending.length > 0 && (
            <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {pending.length} agendamento{pending.length > 1 ? 's' : ''} aguardando sua confirmação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {pending.map(appt => {
                  const client = getClient(appt.clientId);
                  const svc    = getService(appt.serviceId);
                  return (
                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {client?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{client?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {format(parseISO(appt.date), "d 'de' MMM", { locale: ptBR })} às {appt.startTime} · {svc?.name}
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0 sm:hidden">{formatCurrency(appt.price)}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <p className="text-sm font-semibold hidden sm:block">{formatCurrency(appt.price)}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                            onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}>
                            <ThumbsUp className="h-3.5 w-3.5" /> Aceitar
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 gap-1 flex-1 sm:flex-none"
                            onClick={() => setRejectId(appt.id)}>
                            <ThumbsDown className="h-3.5 w-3.5" /> Recusar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Hoje',       value: stats.today,                   icon: Calendar,    color: 'text-primary' },
              { label: 'Próximos',   value: stats.upcoming,                icon: Clock,       color: 'text-blue-600' },
              { label: 'Concluídos', value: stats.completed,               icon: CheckCircle, color: 'text-green-600' },
              { label: 'Receita',    value: formatCurrency(stats.revenue), icon: XCircle,     color: 'text-foreground' },
            ].map(kpi => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Day tabs */}
          <div className="flex gap-1 border rounded-md overflow-hidden w-fit">
            {(['today', 'upcoming', 'past'] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {calFiltered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum agendamento {TAB_LABELS[tab].toLowerCase()}
              </CardContent>
            </Card>
          ) : tab === 'today' ? (
            <div className="space-y-2">
              {calFiltered.map(a => <ApptCard key={a.id} appt={a} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {[...grouped!.entries()].map(([date, appts]) => {
                const d = parseISO(date);
                const label = isToday(d) ? 'Hoje'
                  : isFuture(d) ? format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
                  : isPast(d)   ? format(d, "d 'de' MMMM", { locale: ptBR })
                  : date;
                return (
                  <div key={date}>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                    <div className="space-y-2">
                      {appts.map(a => <ApptCard key={a.id} appt={a} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── New Appointment Dialog ── */}
      <Dialog open={apptDialog} onOpenChange={o => { setApptDialog(o); if (!o) setApptError(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" /> Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Serviço *</Label>
              <Select value={apptForm.serviceId} onValueChange={v => setApptForm(f => ({ ...f, serviceId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o serviço…" /></SelectTrigger>
                <SelectContent>
                  {myServices.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)} · {s.duration} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Select value={apptForm.clientId} onValueChange={v => setApptForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente…" /></SelectTrigger>
                <SelectContent>
                  {allClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data *</Label>
                <Input type="date" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Horário *</Label>
                <Input type="time" value={apptForm.startTime} onChange={e => setApptForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
            </div>
            {selectedSvc && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                Duração: <strong>{selectedSvc.duration} min</strong> · Término: <strong>{addMinutes(apptForm.startTime, selectedSvc.duration)}</strong> · Valor: <strong>{formatCurrency(selectedSvc.price)}</strong>
              </p>
            )}
            <div className="space-y-1">
              <Label>Observações (opcional)</Label>
              <Textarea placeholder="Alguma observação…" value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-20" />
            </div>
            {apptError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                <X className="h-4 w-4 shrink-0" /> {apptError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApptDialog(false); setApptError(''); }}>Cancelar</Button>
            <Button onClick={handleApptSave}>Criar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject / Cancel confirm dialog */}
      <Dialog open={!!rejectId} onOpenChange={o => !o && setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cancelamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja {appointments.find(a => a.id === rejectId)?.status === 'pending' ? 'recusar' : 'cancelar'} este agendamento? O cliente será notificado.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Voltar</Button>
            <Button variant="destructive" onClick={() => { if (rejectId) cancelAppointment(rejectId); setRejectId(null); }}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
