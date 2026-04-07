import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, UserPlus, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';

const STATUS_VARIANT = { confirmed: 'info', completed: 'success', cancelled: 'destructive', pending: 'warning' } as const;
const STATUS_LABEL   = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };

function parseDate(s: string) { return new Date(s + 'T00:00:00'); }

export default function ClientsView() {
  const { clients, appointments, services, professionals, addClient, tenant } = useTenant();
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const getStats = (clientId: string) => {
    const appts     = appointments.filter(a => a.clientId === clientId);
    const completed = appts.filter(a => a.status === 'completed');
    const lastVisit = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { total: appts.length, completed: completed.length, totalSpent: completed.reduce((s, a) => s + a.price, 0), lastVisit };
  };

  const handleAdd = async () => {
    try {
      await addClient(form);
      setAddDialog(false);
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={() => setAddDialog(true)}><UserPlus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, e-mail ou telefone…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <div className="divide-y">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          )}
          {filtered.map(client => {
            const stats = getStats(client.id);
            return (
              <button
                key={client.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => setSelected(client)}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="font-bold text-white text-sm" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                    {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
            );
          })}
        </div>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-white font-bold" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                  {selected?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['E-mail', selected.email], ['Telefone', selected.phone], ['Cliente desde', format(parseDate(selected.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })], ['Total gasto', formatCurrency(getStats(selected.id).totalSpent)]].map(([l, v]) => (
                  <div key={l}><p className="text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                ))}
              </div>
              <div>
                <p className="font-semibold mb-2">Histórico</p>
                <div className="space-y-2">
                  {appointments.filter(a => a.clientId === selected.id).sort((a, b) => b.date.localeCompare(a.date)).map(appt => {
                    const svc  = services.find(s => s.id === appt.serviceId);
                    const prof = professionals.find(p => p.id === appt.professionalId);
                    return (
                      <div key={appt.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div>
                          <p className="font-medium">{svc?.name}</p>
                          <p className="text-xs text-muted-foreground">{format(parseDate(appt.date), "d 'de' MMM", { locale: ptBR })} · {appt.startTime} · {prof?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                          <p className="text-xs font-medium mt-1">{formatCurrency(appt.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add client */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Nome completo</Label><Input placeholder="João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" placeholder="joao@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Telefone</Label><Input placeholder="(11) 99999-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.email}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
