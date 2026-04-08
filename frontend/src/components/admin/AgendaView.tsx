import { useState, useMemo } from 'react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell, ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus, X,
  ThumbsUp, ThumbsDown, Table2, Calendar, Search, CheckCircle, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency } from '@/lib/utils';
import { AppointmentCardList, type ApptCardData } from '@/components/ui/AppointmentCards';
import type { Appointment, AppointmentStatus } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────
const ALL_STATUSES: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não compareceu' },
];

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  completed: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  no_show: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
  completed: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  cancelled: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
  no_show: 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-400',
  blocked: 'bg-muted border-border text-muted-foreground',
};

const HOURS = Array.from({ length: 11 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Retorna data e hora atual no fuso de Brasília (America/Sao_Paulo). */
function nowBrasilia(): { date: string; time: string } {
  const now = new Date();
  const datePart = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // "YYYY-MM-DD"
  const timePart = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }); // "HH:mm"
  return { date: datePart, time: timePart };
}

/** Retorna true se a data+hora escolhida já passou em Brasília. */
function isPastInBrasilia(date: string, time: string): boolean {
  const { date: todayBR, time: nowTimeBR } = nowBrasilia();
  if (date < todayBR) return true;
  if (date === todayBR && time <= nowTimeBR) return true;
  return false;
}

function isSlotConflict(
  date: string, profId: string, startTime: string, endTime: string,
  appointments: Appointment[], blockedSlots: { professionalId: string; date: string; startTime: string; endTime: string }[],
  excludeId?: string
): boolean {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const sMin = toMin(startTime), eMin = toMin(endTime);
  return (
    appointments.some(a =>
      a.id !== excludeId && a.professionalId === profId && a.date === date &&
      a.status !== 'cancelled' && sMin < toMin(a.endTime) && eMin > toMin(a.startTime)
    ) ||
    blockedSlots.some(b =>
      b.professionalId === profId && b.date === date &&
      sMin < toMin(b.endTime) && eMin > toMin(b.startTime)
    )
  );
}

interface ApptForm {
  // cliente existente
  clientId: string;
  clientSearch: string;
  // novo cliente
  newClientMode: boolean;
  newName: string;
  newEmail: string;
  newPhone: string;
  // agendamento
  professionalId: string; serviceId: string;
  date: string; startTime: string; notes: string; status: AppointmentStatus;
}
const emptyForm = (): ApptForm => ({
  clientId: '', clientSearch: '',
  newClientMode: false,
  newName: '', newEmail: '', newPhone: '',
  professionalId: '', serviceId: '',
  date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00',
  notes: '', status: 'confirmed',
});

// ─── Table row — status inline editable ──────────────────────────────────────
function TableRow({
  appt, clients, professionals, services, onSave,
}: {
  appt: Appointment;
  clients: ReturnType<typeof useTenant>['clients'];
  professionals: ReturnType<typeof useTenant>['professionals'];
  services: ReturnType<typeof useTenant>['services'];
  onSave: (id: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);
  const [saving, setSaving] = useState(false);
  const dirty = status !== appt.status;

  const client = clients.find(c => c.id === appt.clientId);
  const prof = professionals.find(p => p.id === appt.professionalId);
  const svc = services.find(s => s.id === appt.serviceId);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(appt.id, status); }
    finally { setSaving(false); }
  };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      {/* Data */}
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="font-medium">{format(new Date(appt.date + 'T00:00:00'), 'dd/MM/yyyy')}</div>
      </td>
      {/* Hora */}
      <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
        {appt.startTime} – {appt.endTime}
      </td>
      {/* Cliente */}
      <td className="px-4 py-3 text-sm">
        <div className="font-medium truncate max-w-[140px]">{client?.name ?? '—'}</div>
        {client?.phone && <div className="text-xs text-muted-foreground">{client.phone}</div>}
      </td>
      {/* Serviço */}
      <td className="px-4 py-3 text-sm">
        <div className="truncate max-w-[140px]">{svc?.name ?? '—'}</div>
      </td>
      {/* Barbeiro */}
      <td className="px-4 py-3 text-sm">
        <div className="truncate max-w-[120px]">{prof?.name ?? '—'}</div>
      </td>
      {/* Pagamento */}
      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
        {formatCurrency(appt.price)}
      </td>
      {/* Status — select inline */}
      <td className="px-4 py-3">
        <Select value={status} onValueChange={(value) => setStatus(value as AppointmentStatus)}>
          <SelectTrigger className={`min-w-[180px] w-auto ${STATUS_BADGE[status]}`}>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {ALL_STATUSES.filter(s => s.value !== 'all').map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Ação */}
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="ghost"
          className={`
    h-7 gap-1 text-xs
    ${dirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"}
  `}
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <CheckCircle className="h-3 w-3" />}

          {saving ? 'Salvando...' : dirty ? 'Salvar' : 'Salvo'}
        </Button>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgendaView() {
  const {
    appointments, professionals, clients, services,
    blockedSlots, addBlockedSlot, removeBlockedSlot,
    updateAppointmentStatus, cancelAppointment, addAppointment,
  } = useTenant();

  const [view, setView] = useState<'calendar' | 'table'>('table');

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calMode, setCalMode] = useState<'day' | 'week'>('week');
  const [selectedProf, setSelectedProf] = useState<string>('all');

  // ── Table state ─────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterProf, setFilterProf] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Dialogs ─────────────────────────────────────────────────────────────────
  const [blockDialog, setBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({
    professionalId: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '12:00', endTime: '13:00', reason: '',
  });
  const [apptDialog, setApptDialog] = useState(false);
  const [apptForm, setApptForm] = useState<ApptForm>(emptyForm());
  const [apptError, setApptError] = useState('');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const pending = useMemo(() =>
    appointments.filter(a => a.status === 'pending')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [appointments]);

  // ── Table filtering ─────────────────────────────────────────────────────────
  const tableRows = useMemo(() => {
    return appointments
      .filter(a => {
        if (filterStatus !== 'all' && a.status !== filterStatus) return false;
        if (filterProf !== 'all' && a.professionalId !== filterProf) return false;
        if (dateFrom && a.date < dateFrom) return false;
        if (dateTo && a.date > dateTo) return false;
        if (search) {
          const q = search.toLowerCase();
          const client = clients.find(c => c.id === a.clientId);
          const prof = professionals.find(p => p.id === a.professionalId);
          const svc = services.find(s => s.id === a.serviceId);
          if (
            !client?.name.toLowerCase().includes(q) &&
            !prof?.name.toLowerCase().includes(q) &&
            !svc?.name.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [appointments, filterStatus, filterProf, dateFrom, dateTo, search, clients, professionals, services]);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const displayDays = calMode === 'day' ? [currentDate] : weekDays;
  const filteredProfs = selectedProf === 'all' ? professionals : professionals.filter(p => p.id === selectedProf);

  const getSlotItems = (date: Date, profId: string, hour: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      appts: appointments.filter(a =>
        a.date === dateStr && a.professionalId === profId &&
        a.startTime.startsWith(hour.slice(0, 2)) && a.status !== 'cancelled'
      ),
      blocks: blockedSlots.filter(b =>
        b.date === dateStr && b.professionalId === profId &&
        b.startTime.startsWith(hour.slice(0, 2))
      ),
    };
  };

  const navigate = (dir: 1 | -1) => {
    if (calMode === 'day') setCurrentDate(p => dir === 1 ? addDays(p, 1) : subDays(p, 1));
    else setCurrentDate(p => dir === 1 ? addWeeks(p, 1) : subWeeks(p, 1));
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBlock = async () => {
    if (isPastInBrasilia(blockForm.date, blockForm.startTime)) {
      console.warn('Horário de bloqueio já passou'); return;
    }
    try {
      await addBlockedSlot(blockForm);
      setBlockDialog(false);
      setBlockForm({ professionalId: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '12:00', endTime: '13:00', reason: '' });
    } catch (err) { console.error(err); }
  };

  const selectedService = services.find(s => s.id === apptForm.serviceId);
  const availableProfs = useMemo(() =>
    apptForm.serviceId ? professionals.filter(p => p.services.includes(apptForm.serviceId)) : professionals,
    [professionals, apptForm.serviceId]);

  const handleApptSave = async () => {
    setApptError('');
    if (!apptForm.professionalId || !apptForm.serviceId || !apptForm.date || !apptForm.startTime) {
      setApptError('Preencha todos os campos obrigatórios.'); return;
    }
    if (apptForm.newClientMode) {
      if (!apptForm.newName.trim() || !apptForm.newEmail.trim() || !apptForm.newPhone.trim()) {
        setApptError('Preencha nome, e-mail e telefone do novo cliente.'); return;
      }
    } else {
      if (!apptForm.clientId) {
        setApptError('Selecione um cliente.'); return;
      }
    }
    if (isPastInBrasilia(apptForm.date, apptForm.startTime)) {
      setApptError('Não é possível agendar em um horário que já passou.'); return;
    }
    if (!selectedService) return;
    const endTime = addMinutes(apptForm.startTime, selectedService.duration);
    if (isSlotConflict(apptForm.date, apptForm.professionalId, apptForm.startTime, endTime, appointments, blockedSlots)) {
      setApptError('Conflito de horário: o profissional já tem um compromisso neste intervalo.'); return;
    }
    try {
      // Garante formato HH:mm independente do browser (alguns retornam HH:mm:ss)
      const startTime = apptForm.startTime.slice(0, 5);

      const base = {
        professionalId: apptForm.professionalId,
        serviceId:      apptForm.serviceId,
        date:           apptForm.date,
        startTime,
        notes:          apptForm.notes.trim() || undefined,
      };

      const payload = apptForm.newClientMode
        ? {
            ...base,
            clientName:  apptForm.newName.trim(),
            clientEmail: apptForm.newEmail.trim(),
            clientPhone: apptForm.newPhone.trim() || undefined,
          }
        : {
            ...base,
            clientId: apptForm.clientId,
          };

      await addAppointment(payload);
      setApptDialog(false); setApptForm(emptyForm());
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

  const openApptDialog = (date?: string, profId?: string) => {
    setApptError('');
    setApptForm({ ...emptyForm(), date: date ?? format(new Date(), 'yyyy-MM-dd'), professionalId: profId ?? '' });
    setApptDialog(true);
  };

  const handleTableSave = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
          <p className="text-muted-foreground text-sm">
            {view === 'table'
              ? `${tableRows.length} agendamento${tableRows.length !== 1 ? 's' : ''} encontrado${tableRows.length !== 1 ? 's' : ''}`
              : calMode === 'week'
                ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} – ${format(addDays(weekStart, 5), "d 'de' MMM", { locale: ptBR })}`
                : format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className={`rounded-none border-r gap-1.5 ${view === 'table' ? 'bg-muted' : ''}`}
              onClick={() => setView('table')}>
              <Table2 className="h-3.5 w-3.5" /> Tabela
            </Button>
            <Button variant="ghost" size="sm" className={`rounded-none gap-1.5 ${view === 'calendar' ? 'bg-muted' : ''}`}
              onClick={() => setView('calendar')}>
              <Calendar className="h-3.5 w-3.5" /> Calendário
            </Button>
          </div>

          {view === 'calendar' && (
            <>
              <Select value={selectedProf} onValueChange={setSelectedProf}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Profissional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button variant="ghost" size="sm" className="rounded-none border-r" onClick={() => setCalMode('day')}>Dia</Button>
                <Button variant="ghost" size="sm" className="rounded-none" onClick={() => setCalMode('week')}>Semana</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setBlockDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Bloquear
              </Button>
            </>
          )}

          <Button size="sm" onClick={() => openApptDialog()}>
            <CalendarPlus className="h-4 w-4 mr-1" /> Novo Agend.
          </Button>
        </div>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {pending.length} agendamento{pending.length > 1 ? 's' : ''} aguardando confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {pending.map(appt => {
              const client = clients.find(c => c.id === appt.clientId);
              const prof = professionals.find(p => p.id === appt.professionalId);
              const svc = services.find(s => s.id === appt.serviceId);
              return (
                <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        {client?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(appt.date + 'T00:00:00'), "d 'de' MMM", { locale: ptBR })} às {appt.startTime} · {svc?.name} · {prof?.name}
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

      {/* ── TABLE VIEW ────────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar cliente, barbeiro ou serviço…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filtro profissional */}
            <Select value={filterProf} onValueChange={setFilterProf}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Barbeiro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Datas */}
            <Input type="date" className="w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              placeholder="De" title="Data inicial" />
            <Input type="date" className="w-40" value={dateTo} onChange={e => setDateTo(e.target.value)}
              placeholder="Até" title="Data final" />
          </div>

          {/* Filtro de status */}
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as AppointmentStatus | 'all')}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                  <span className="ml-1.5 text-muted-foreground text-xs">
                    ({s.value === 'all' ? appointments.length : appointments.filter(a => a.status === s.value).length})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tabela — visível apenas em telas médias+ */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['Data', 'Hora', 'Cliente', 'Serviço', 'Barbeiro', 'Pagamento', 'Status', 'Ação'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground text-sm">
                        Nenhum agendamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map(appt => (
                      <TableRow key={appt.id}
                        appt={appt} clients={clients}
                        professionals={professionals} services={services}
                        onSave={handleTableSave} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cards — visível apenas em mobile */}
          <div className="md:hidden">
            <AppointmentCardList
              appointments={tableRows.map((a): ApptCardData => {
                const client = clients.find(c => c.id === a.clientId);
                const prof   = professionals.find(p => p.id === a.professionalId);
                const svc    = services.find(s => s.id === a.serviceId);
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
                  professionalName: prof?.name,
                };
              })}
              onSave={handleTableSave}
            />
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW ─────────────────────────────────────────────────────── */}
      {view === 'calendar' && filteredProfs.map(prof => (
        <Card key={prof.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                {prof.avatar}
              </div>
              {prof.name}
              <span className="text-muted-foreground text-sm font-normal">· {prof.specialty}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex">
                <div className="w-16 shrink-0" />
                {displayDays.map(day => (
                  <div key={day.toISOString()} className={`flex-1 text-center py-1 text-xs font-medium border-b ${isSameDay(day, new Date()) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE d', { locale: ptBR })}
                  </div>
                ))}
              </div>
              {HOURS.map(hour => (
                <div key={hour} className="flex border-b last:border-b-0">
                  <div className="w-16 shrink-0 text-xs text-muted-foreground py-2 pr-2 text-right">{hour}</div>
                  {displayDays.map(day => {
                    const { appts, blocks } = getSlotItems(day, prof.id, hour);
                    return (
                      <div key={day.toISOString()} className="flex-1 border-l min-h-[52px] p-1 space-y-1 group/cell">
                        {appts.length === 0 && blocks.length === 0 && (
                          <button
                            onClick={() => openApptDialog(format(day, 'yyyy-MM-dd'), prof.id)}
                            className="w-full h-full min-h-[40px] rounded border-2 border-dashed border-transparent group-hover/cell:border-primary/30 group-hover/cell:bg-primary/5 transition-all flex items-center justify-center opacity-0 group-hover/cell:opacity-100"
                          >
                            <Plus className="h-3 w-3 text-primary/50" />
                          </button>
                        )}
                        {blocks.map(b => (
                          <div key={b.id} className={`text-xs rounded p-1 border flex items-center justify-between ${STATUS_COLORS['blocked']}`}>
                            <span className="truncate">{b.reason || 'Bloqueado'} {b.startTime}–{b.endTime}</span>
                            <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => removeBlockedSlot(b.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {appts.map(a => {
                          const client = clients.find(c => c.id === a.clientId);
                          const svc = services.find(s => s.id === a.serviceId);
                          return (
                            <button key={a.id}
                              className={`w-full text-left text-xs rounded p-1 border ${STATUS_COLORS[a.status]} hover:opacity-90 transition-opacity`}
                              onClick={() => setDetailAppt(a)}>
                              <div className="font-semibold truncate">{client?.name}</div>
                              <div className="truncate opacity-80">{svc?.name} · {a.startTime}–{a.endTime}</div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span>{formatCurrency(a.price)}</span>
                                <span className="opacity-70">{STATUS_LABEL[a.status]}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* ── Dialogs (mantidos idênticos) ───────────────────────────────────── */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bloquear Horário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Profissional *</Label>
              <Select value={blockForm.professionalId} onValueChange={v => setBlockForm(f => ({ ...f, professionalId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data *</Label>
              <Input type="date" value={blockForm.date}
                min={nowBrasilia().date}
                onChange={e => setBlockForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início *</Label>
                <Input type="time" value={blockForm.startTime}
                  min={blockForm.date === nowBrasilia().date ? nowBrasilia().time : undefined}
                  onChange={e => setBlockForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Fim *</Label>
                <Input type="time" value={blockForm.endTime}
                  min={blockForm.date === nowBrasilia().date ? nowBrasilia().time : undefined}
                  onChange={e => setBlockForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Motivo (opcional)</Label>
              <Input placeholder="Ex: Almoço, Reunião…" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancelar</Button>
            <Button onClick={handleBlock} disabled={!blockForm.professionalId || !blockForm.date}>Bloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apptDialog} onOpenChange={o => { setApptDialog(o); if (!o) { setApptError(''); setApptForm(emptyForm()); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" /> Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Serviço */}
            <div className="space-y-1">
              <Label>Serviço *</Label>
              <Select value={apptForm.serviceId} onValueChange={v => setApptForm(f => ({ ...f, serviceId: v, professionalId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o serviço…" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)} · {s.duration} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Profissional */}
            <div className="space-y-1">
              <Label>Profissional *</Label>
              <Select value={apptForm.professionalId} onValueChange={v => setApptForm(f => ({ ...f, professionalId: v }))} disabled={!apptForm.serviceId}>
                <SelectTrigger><SelectValue placeholder={apptForm.serviceId ? 'Selecione…' : 'Selecione o serviço primeiro'} /></SelectTrigger>
                <SelectContent>
                  {availableProfs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.specialty}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente — busca ou novo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cliente *</Label>
                <button
                  type="button"
                  className="text-xs text-primary underline underline-offset-2"
                  onClick={() => setApptForm(f => ({
                    ...f,
                    newClientMode: !f.newClientMode,
                    clientId: '', clientSearch: '',
                    newName: '', newEmail: '', newPhone: '',
                  }))}
                >
                  {apptForm.newClientMode ? '← Buscar cliente existente' : '+ Novo cliente'}
                </button>
              </div>

              {!apptForm.newClientMode ? (
                /* ── Busca de cliente existente ── */
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Digite o nome do cliente…"
                      value={apptForm.clientSearch}
                      onChange={e => setApptForm(f => ({ ...f, clientSearch: e.target.value, clientId: '' }))}
                    />
                  </div>
                  {apptForm.clientSearch.trim().length > 0 && (
                    <div className="border rounded-md max-h-44 overflow-y-auto bg-popover shadow-md">
                      {clients
                        .filter(c => c.name.toLowerCase().startsWith(apptForm.clientSearch.toLowerCase()))
                        .slice(0, 20)
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-0 ${apptForm.clientId === c.id ? 'bg-primary/10 font-semibold' : ''}`}
                            onClick={() => setApptForm(f => ({ ...f, clientId: c.id, clientSearch: c.name }))}
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>
                          </button>
                        ))}
                      {clients.filter(c => c.name.toLowerCase().startsWith(apptForm.clientSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                      )}
                    </div>
                  )}
                  {apptForm.clientId && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ {clients.find(c => c.id === apptForm.clientId)?.name} selecionado
                    </p>
                  )}
                </div>
              ) : (
                /* ── Novo cliente ── */
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Preencha os dados do novo cliente:</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Nome completo *</Label>
                    <Input
                      placeholder="João Silva"
                      value={apptForm.newName}
                      onChange={e => setApptForm(f => ({ ...f, newName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-mail *</Label>
                    <Input
                      type="email"
                      placeholder="joao@email.com"
                      value={apptForm.newEmail}
                      onChange={e => setApptForm(f => ({ ...f, newEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefone *</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={apptForm.newPhone}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        let masked = '';
                        if (digits.length === 0) masked = '';
                        else if (digits.length <= 2) masked = `(${digits}`;
                        else if (digits.length <= 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        else masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                        setApptForm(f => ({ ...f, newPhone: masked }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data *</Label>
                <Input type="date" value={apptForm.date}
                  min={nowBrasilia().date}
                  onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Horário *</Label>
                <Input type="time" value={apptForm.startTime}
                  min={apptForm.date === nowBrasilia().date ? nowBrasilia().time : undefined}
                  onChange={e => setApptForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
            </div>

            {/* Resumo do serviço */}
            {selectedService && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                Duração: <strong>{selectedService.duration} min</strong> · Término: <strong>{addMinutes(apptForm.startTime, selectedService.duration)}</strong> · Valor: <strong>{formatCurrency(selectedService.price)}</strong>
              </p>
            )}

            {/* Status */}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={apptForm.status} onValueChange={v => setApptForm(f => ({ ...f, status: v as AppointmentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea placeholder="Alguma observação…" value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-20" />
            </div>

            {apptError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                <X className="h-4 w-4 shrink-0" /> {apptError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setApptDialog(false); setApptError(''); setApptForm(emptyForm()); }}>Cancelar</Button>
            <Button
              onClick={handleApptSave}
              disabled={
                !apptForm.serviceId ||
                !apptForm.professionalId ||
                !apptForm.date ||
                !apptForm.startTime ||
                (apptForm.newClientMode
                  ? !apptForm.newName.trim() || !apptForm.newEmail.trim() || !apptForm.newPhone.trim()
                  : !apptForm.clientId)
              }
            >
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectId} onOpenChange={o => !o && setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar recusa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja recusar este agendamento?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Voltar</Button>
            <Button variant="destructive" onClick={() => { if (rejectId) cancelAppointment(rejectId); setRejectId(null); }}>Recusar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailAppt} onOpenChange={o => !o && setDetailAppt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Agendamento</DialogTitle></DialogHeader>
          {detailAppt && (() => {
            const client = clients.find(c => c.id === detailAppt.clientId);
            const prof = professionals.find(p => p.id === detailAppt.professionalId);
            const svc = services.find(s => s.id === detailAppt.serviceId);
            return (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Cliente', client?.name ?? '—'],
                    ['Profissional', prof?.name ?? '—'],
                    ['Serviço', svc?.name ?? '—'],
                    ['Data', format(new Date(detailAppt.date + 'T00:00:00'), "d 'de' MMM 'de' yyyy", { locale: ptBR })],
                    ['Horário', `${detailAppt.startTime} – ${detailAppt.endTime}`],
                    ['Valor', formatCurrency(detailAppt.price)],
                  ].map(([l, v]) => (
                    <div key={l}><p className="text-muted-foreground text-xs">{l}</p><p className="font-medium">{v}</p></div>
                  ))}
                </div>
                {detailAppt.notes && (
                  <div className="text-sm bg-muted/40 rounded p-3">
                    <p className="text-muted-foreground text-xs mb-1">Observações</p>
                    <p>{detailAppt.notes}</p>
                  </div>
                )}
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[detailAppt.status]}`}>
                    {STATUS_LABEL[detailAppt.status]}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap pt-2 border-t">
                  {detailAppt.status === 'pending' && (
                    <Button size="sm" onClick={() => { updateAppointmentStatus(detailAppt.id, 'confirmed'); setDetailAppt(null); }}>Confirmar</Button>
                  )}
                  {(detailAppt.status === 'confirmed' || detailAppt.status === 'pending') && (
                    <Button size="sm" variant="outline" onClick={() => { updateAppointmentStatus(detailAppt.id, 'completed'); setDetailAppt(null); }}>Marcar Concluído</Button>
                  )}
                  {detailAppt.status !== 'cancelled' && detailAppt.status !== 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => { updateAppointmentStatus(detailAppt.id, 'no_show'); setDetailAppt(null); }}>Não compareceu</Button>
                  )}
                  {detailAppt.status !== 'cancelled' && detailAppt.status !== 'completed' && (
                    <Button size="sm" variant="destructive" onClick={() => { cancelAppointment(detailAppt.id); setDetailAppt(null); }}>Cancelar</Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
