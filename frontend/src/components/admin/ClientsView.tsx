import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, UserPlus, Calendar, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';

const STATUS_VARIANT = {
  confirmed: 'info', completed: 'success',
  cancelled: 'destructive', pending: 'warning', no_show: 'destructive',
} as const;
const STATUS_LABEL = {
  pending: 'Pendente', confirmed: 'Confirmado',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu',
};

function parseDate(s: string) {
  return s.includes('T') ? parseISO(s) : new Date(s + 'T00:00:00');
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2)  return `(${digits}`;
  if (digits.length <= 7)  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const EMPTY_FORM = { name: '', email: '', phone: '' };

export default function ClientsView() {
  const { clients, appointments, services, professionals, addClient, updateClient, deleteClient } = useTenant();

  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<Client | null>(null);
  const [addOpen, setAddOpen]     = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const getStats = (clientId: string) => {
    const appts     = appointments.filter(a => a.clientId === clientId);
    const completed = appts.filter(a => a.status === 'completed');
    const lastVisit = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      total: appts.length,
      completed: completed.length,
      totalSpent: completed.reduce((s, a) => s + a.price, 0),
      lastVisit,
    };
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // ── CREATE ────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await addClient({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      setAddOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    } finally {
      setSaving(false);
    }
  };

  // ── UPDATE ────────────────────────────────────────────────────────────────────
  const openEdit = (client: Client) => {
    setSelected(client);
    setForm({ name: client.name, email: client.email, phone: client.phone });
    setFormError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selected) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await updateClient(selected.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      setEditOpen(false);
      setSelected(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao atualizar cliente.');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────────
  const openDelete = (client: Client) => {
    setSelected(client);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteClient(selected.id);
      setDeleteOpen(false);
      setSelected(null);
    } catch {
      // erro silencioso — pode adicionar toast aqui se quiser
    } finally {
      setSaving(false);
    }
  };

  // ── CLIENT FORM (reutilizado em create e edit) ────────────────────────────────
  const ClientForm = (
    <div className="space-y-3 py-2">
      <div className="space-y-1">
        <Label>Nome completo *</Label>
        <Input
          placeholder="João Silva"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label>E-mail *</Label>
        <Input
          type="email"
          placeholder="joao@email.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label>Telefone *</Label>
        <Input
          placeholder="(00) 00000-0000"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))}
        />
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
    </div>
  );

  const isSaveDisabled = saving || !form.name || !form.email || !form.phone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, e-mail ou telefone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <Card>
        <div className="divide-y">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          )}
          {filtered.map(client => {
            const stats = getStats(client.id);
            return (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {/* Clicável para ver detalhes */}
                <button
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  onClick={() => setSelected(client)}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="font-bold text-white text-sm" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                      {initials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{client.phone} · {client.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 shrink-0 text-center">
                    <div>
                      <p className="text-sm font-semibold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Agend.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{formatCurrency(stats.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Gasto total</p>
                    </div>
                    {stats.lastVisit && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseDate(stats.lastVisit.date), "d 'de' MMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">Última visita</p>
                      </div>
                    )}
                  </div>
                  <div className="sm:hidden shrink-0 text-right">
                    <p className="text-sm font-semibold">{stats.total} agend.</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                </button>

                {/* Ações */}
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDelete(client)} title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── DETAIL DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={!!selected && !editOpen && !deleteOpen} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-white font-bold" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                  {selected ? initials(selected.name) : ''}
                </AvatarFallback>
              </Avatar>
              {selected?.name}
            </DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const stats = getStats(selected.id);
            const clientAppts = appointments
              .filter(a => a.clientId === selected.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['E-mail',        selected.email],
                    ['Telefone',      selected.phone],
                    ['Cliente desde', format(parseDate(selected.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })],
                    ['Total gasto',   formatCurrency(stats.totalSpent)],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-muted-foreground text-xs">{l}</p>
                      <p className="font-medium">{v}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <p className="font-semibold mb-2 text-sm">Histórico de agendamentos</p>
                  {clientAppts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>
                  ) : (
                    <div className="space-y-2">
                      {clientAppts.map(appt => {
                        const svc  = services.find(s => s.id === appt.serviceId);
                        const prof = professionals.find(p => p.id === appt.professionalId);
                        return (
                          <div key={appt.id} className="flex items-center justify-between p-2 rounded border text-sm">
                            <div>
                              <p className="font-medium">{svc?.name ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseDate(appt.date), "d 'de' MMM", { locale: ptBR })} · {appt.startTime} · {prof?.name ?? '—'}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                              <p className="text-xs font-medium mt-1">{formatCurrency(appt.price)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => selected && openEdit(selected)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => selected && openDelete(selected)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={o => { if (!saving) { setAddOpen(o); setFormError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          {ClientForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setFormError(''); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={isSaveDisabled}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cadastrando...</> : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={o => { if (!saving) { setEditOpen(o); setFormError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {ClientForm}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setFormError(''); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSaveDisabled}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={o => { if (!saving) setDeleteOpen(o); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-semibold text-foreground">{selected?.name}</span>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
