import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, ExternalLink, Power, PowerOff, Eye, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePlatform } from '@/context/PlatformContext';
import { formatCurrency } from '@/lib/utils';
import type { TenantStatus } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';

// ─── Configs visuais ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:    { label: 'Ativo',    variant: 'success'     as const, next: 'suspended' as TenantStatus, actionLabel: 'Suspender', ActionIcon: PowerOff },
  trial:     { label: 'Trial',    variant: 'warning'     as const, next: 'active'    as TenantStatus, actionLabel: 'Ativar',    ActionIcon: Power    },
  suspended: { label: 'Suspenso', variant: 'destructive' as const, next: 'active'    as TenantStatus, actionLabel: 'Reativar',  ActionIcon: Power    },
};

const PLAN_CONFIG = {
  basic:      { label: 'Basic',      variant: 'outline'   as const },
  pro:        { label: 'Pro',        variant: 'default'   as const },
  enterprise: { label: 'Enterprise', variant: 'secondary' as const },
};

// ─── Formulários ──────────────────────────────────────────────────────────────
interface CreateForm {
  slug: string; name: string; ownerName: string; email: string;
  phone: string; address: string;
  plan: 'basic' | 'pro' | 'enterprise'; monthlyPrice: string;
  primaryColor: string; adminPassword: string;
}

interface EditForm {
  name: string; ownerName: string; phone: string; address: string;
  plan: 'basic' | 'pro' | 'enterprise'; monthlyPrice: string;
  primaryColor: string; status: TenantStatus;
}

const EMPTY_CREATE: CreateForm = {
  slug: '', name: '', ownerName: '', email: '', phone: '', address: '',
  plan: 'basic', monthlyPrice: '97', primaryColor: '#3B82F6', adminPassword: '',
};

function editFormFrom(t: TenantWithCounts): EditForm {
  return {
    name: t.name, ownerName: t.ownerName, phone: t.phone ?? '',
    address: t.address ?? '', plan: t.plan,
    monthlyPrice: String(t.monthlyPrice), primaryColor: t.primaryColor,
    status: t.status,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function TenantsView() {
  const { tenants, createTenant, updateTenant, deleteTenant, updateTenantStatus } = usePlatform();
  const navigate = useNavigate();

  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);

  const [editTenant, setEditTenant] = useState<TenantWithCounts | null>(null);
  const [editForm,   setEditForm]   = useState<EditForm | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TenantWithCounts | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ tenant: TenantWithCounts; next: TenantStatus; label: string } | null>(null);

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setError('');
    if (!createForm.slug || !createForm.name || !createForm.email || !createForm.adminPassword) {
      setError('Preencha slug, nome, e-mail e senha do admin.');
      return;
    }
    setSaving(true);
    try {
      await createTenant({
        slug: createForm.slug.toLowerCase().replace(/\s+/g, '-'),
        name: createForm.name,
        ownerName: createForm.ownerName,
        email: createForm.email,
        phone: createForm.phone || undefined,
        address: createForm.address || undefined,
        plan: createForm.plan,
        monthlyPrice: parseFloat(createForm.monthlyPrice) || 0,
        primaryColor: createForm.primaryColor,
        adminPassword: createForm.adminPassword,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tenant.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (t: TenantWithCounts) => {
    setEditTenant(t);
    setEditForm(editFormFrom(t));
    setError('');
  };

  const handleEdit = async () => {
    if (!editTenant || !editForm) return;
    setError('');
    setSaving(true);
    try {
      await updateTenant(editTenant.id, {
        name: editForm.name,
        ownerName: editForm.ownerName,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        plan: editForm.plan,
        monthlyPrice: parseFloat(editForm.monthlyPrice) || 0,
        primaryColor: editForm.primaryColor,
        status: editForm.status,
      });
      setEditTenant(null);
      setEditForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteTenant(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusConfirm) return;
    setSaving(true);
    try {
      await updateTenantStatus(statusConfirm.tenant.id, statusConfirm.next);
      setStatusConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground text-sm">{tenants.length} estabelecimentos cadastrados</p>
        </div>
        <Button onClick={() => { setCreateForm(EMPTY_CREATE); setError(''); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Tenant
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, slug ou responsável..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {filtered.map(tenant => {
          const sc = STATUS_CONFIG[tenant.status];
          const pc = PLAN_CONFIG[tenant.plan];
          const { ActionIcon } = sc;

          return (
            <Card key={tenant.id} className="overflow-hidden">
              <div className="#"/>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Identidade */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      {tenant.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{tenant.name}</p>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        <Badge variant={pc.variant}>{pc.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{tenant.ownerName} · {tenant.email}</p>
                      <p className="text-xs text-muted-foreground">/{tenant.slug}{tenant.address ? ` · ${tenant.address}` : ''}</p>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-4 text-center sm:flex sm:gap-6">
                    <div>
                      <p className="text-sm font-bold">{tenant._count?.appointments ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Agend.</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{tenant._count?.clients ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{formatCurrency(tenant.monthlyPrice)}/mês</p>
                      <p className="text-xs text-muted-foreground">Plano</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/${tenant.slug}`)}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Portal
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/super/tenants/${tenant.id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(tenant)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button
                      variant={tenant.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => setStatusConfirm({ tenant, next: sc.next, label: sc.actionLabel })}
                    >
                      <ActionIcon className="h-3.5 w-3.5 mr-1" /> {sc.actionLabel}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(tenant)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">Plano:</span> {tenant.plan} — {formatCurrency(tenant.monthlyPrice)}/mês</div>
                  <div><span className="font-medium text-foreground">Profissionais:</span> {tenant._count?.professionals ?? 0}</div>
                  <div><span className="font-medium text-foreground">Serviços:</span> {tenant._count?.services ?? 0}</div>
                  <div><span className="font-medium text-foreground">Desde:</span> {format(parseISO(tenant.createdAt), "MMM 'de' yyyy", { locale: ptBR })}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum tenant encontrado.</p>
        )}
      </div>

      {/* ── Dialog: Criar Tenant ───────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={o => { if (!saving) { setCreateOpen(o); setError(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Tenant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do estabelecimento *</Label>
                <Input placeholder="Barber Kings" value={createForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setCreateForm(f => ({ ...f, name, slug }));
                  }} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL) *</Label>
                <Input placeholder="barber-kings" value={createForm.slug}
                  onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Responsável *</Label>
                <Input placeholder="João Silva" value={createForm.ownerName} onChange={e => setCreateForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail admin *</Label>
                <Input type="email" placeholder="admin@exemplo.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-0000" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input placeholder="Rua das Flores, 123" value={createForm.address} onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={createForm.plan} onValueChange={v => setCreateForm(f => ({ ...f, plan: v as CreateForm['plan'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor mensal (R$)</Label>
                <Input type="number" min="0" step="0.01" value={createForm.monthlyPrice} onChange={e => setCreateForm(f => ({ ...f, monthlyPrice: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cor principal</Label>
                <div className="flex gap-2">
                  <input type="color" value={createForm.primaryColor} onChange={e => setCreateForm(f => ({ ...f, primaryColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
                  <Input value={createForm.primaryColor} onChange={e => setCreateForm(f => ({ ...f, primaryColor: e.target.value }))} className="font-mono text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Senha do admin *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={createForm.adminPassword} onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} />
              <p className="text-xs text-muted-foreground">O admin usará o e-mail acima + esta senha para acessar o painel.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Tenant ──────────────────────────────────────────── */}
      <Dialog open={!!editTenant} onOpenChange={o => { if (!saving && !o) { setEditTenant(null); setEditForm(null); setError(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tenant — {editTenant?.name}</DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={editForm.name} onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Input value={editForm.ownerName} onChange={e => setEditForm(f => f ? { ...f, ownerName: e.target.value } : f)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Endereço</Label>
                  <Input value={editForm.address} onChange={e => setEditForm(f => f ? { ...f, address: e.target.value } : f)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Plano</Label>
                  <Select value={editForm.plan} onValueChange={v => setEditForm(f => f ? { ...f, plan: v as EditForm['plan'] } : f)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor mensal (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={editForm.monthlyPrice} onChange={e => setEditForm(f => f ? { ...f, monthlyPrice: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => f ? { ...f, status: v as TenantStatus } : f)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Cor principal</Label>
                <div className="flex gap-2">
                  <input type="color" value={editForm.primaryColor} onChange={e => setEditForm(f => f ? { ...f, primaryColor: e.target.value } : f)} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
                  <Input value={editForm.primaryColor} onChange={e => setEditForm(f => f ? { ...f, primaryColor: e.target.value } : f)} className="font-mono text-sm" />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTenant(null); setEditForm(null); }} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar status ───────────────────────────────────────── */}
      <Dialog open={!!statusConfirm} onOpenChange={o => !o && setStatusConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar ação</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja <strong>{statusConfirm?.label.toLowerCase()}</strong> o tenant <strong>{statusConfirm?.tenant.name}</strong>?
            {statusConfirm?.next === 'suspended' && ' O portal do cliente ficará inacessível imediatamente.'}
            {statusConfirm?.next === 'active'    && ' O portal do cliente voltará a funcionar imediatamente.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirm(null)} disabled={saving}>Cancelar</Button>
            <Button
              variant={statusConfirm?.next === 'suspended' ? 'destructive' : 'default'}
              onClick={handleStatusChange}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {statusConfirm?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar exclusão ─────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Tenant</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Tem certeza que deseja excluir permanentemente <strong className="text-foreground">{deleteTarget?.name}</strong>?</p>
            <p className="text-destructive font-medium">Esta ação é irreversível. Todos os profissionais, serviços, clientes e agendamentos serão removidos.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
