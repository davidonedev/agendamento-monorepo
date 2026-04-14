import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, ExternalLink, Power, PowerOff, Eye,
  Plus, Pencil, Trash2, Loader2, LayoutGrid, Table2,
  Users, Scissors, Calendar,
} from 'lucide-react';
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
import TenantDetailModal from './TenantDetailModal';
import { TenantAvatar } from './TenantAvatar';

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

type ViewMode = 'cards' | 'table';

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TenantsView() {
  const { tenants, createTenant, updateTenant, deleteTenant, updateTenantStatus } = usePlatform();
  const navigate = useNavigate();

  const [search,   setSearch]   = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  // Detail modal
  const [detailTenantId, setDetailTenantId] = useState<string | null>(null);

  // Dialogs
  const [createOpen,    setCreateOpen]    = useState(false);
  const [createForm,    setCreateForm]    = useState<CreateForm>(EMPTY_CREATE);
  const [editTenant,    setEditTenant]    = useState<TenantWithCounts | null>(null);
  const [editForm,      setEditForm]      = useState<EditForm | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<TenantWithCounts | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    tenant: TenantWithCounts; next: TenantStatus; label: string
  } | null>(null);

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
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
        name: createForm.name, ownerName: createForm.ownerName,
        email: createForm.email, phone: createForm.phone || undefined,
        address: createForm.address || undefined, plan: createForm.plan,
        monthlyPrice: parseFloat(createForm.monthlyPrice) || 0,
        primaryColor: createForm.primaryColor, adminPassword: createForm.adminPassword,
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
        name: editForm.name, ownerName: editForm.ownerName,
        phone: editForm.phone || undefined, address: editForm.address || undefined,
        plan: editForm.plan, monthlyPrice: parseFloat(editForm.monthlyPrice) || 0,
        primaryColor: editForm.primaryColor, status: editForm.status,
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground text-sm">{tenants.length} estabelecimentos cadastrados</p>
        </div>
        <Button onClick={() => { setCreateForm(EMPTY_CREATE); setError(''); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Tenant
        </Button>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, slug ou responsável..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* View toggle */}
        <div className="flex rounded-md border overflow-hidden shrink-0">
          <button
            className={`px-3 py-2 transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={() => setViewMode('cards')}
            title="Visualização em cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={() => setViewMode('table')}
            title="Visualização em tabela"
          >
            <Table2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Cards View ─────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(tenant => {
            const sc = STATUS_CONFIG[tenant.status];
            const pc = PLAN_CONFIG[tenant.plan];
            const { ActionIcon } = sc;

            return (
              <Card key={tenant.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-4 space-y-3">
                  {/* Identity row */}
                  <div className="flex items-start gap-3">
                    <TenantAvatar
                      name={tenant.name}
                      logoUrl={tenant.logoUrl}
                      primaryColor={tenant.primaryColor}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-tight truncate">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {tenant.ownerName} · <span className="font-mono">/{tenant.slug}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={sc.variant} className="text-[10px] px-1.5 py-0">{sc.label}</Badge>
                      <Badge variant={pc.variant} className="text-[10px] px-1.5 py-0">{pc.label}</Badge>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-1 text-center bg-muted/30 rounded-lg py-2.5 px-1">
                    <div>
                      <p className="text-xs font-bold">{tenant._count?.professionals ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground flex justify-center mt-0.5"><Users className="h-3 w-3" /></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold">{tenant._count?.services ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground flex justify-center mt-0.5"><Scissors className="h-3 w-3" /></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold">{tenant._count?.appointments ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground flex justify-center mt-0.5"><Calendar className="h-3 w-3" /></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {formatCurrency(tenant.monthlyPrice).replace('R$\u00a0', 'R$')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">/mês</p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Button
                      variant="outline" size="sm"
                      className="h-7 px-2 flex-1 text-xs"
                      onClick={() => setDetailTenantId(tenant.id)}
                      title="Ver detalhes completos"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Detalhes
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      title="Editar" onClick={() => openEdit(tenant)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      title="Abrir portal" onClick={() => navigate(`/${tenant.slug}`)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className={`h-7 w-7 shrink-0 ${tenant.status === 'active' ? 'text-destructive hover:text-destructive' : 'text-primary'}`}
                      title={sc.actionLabel}
                      onClick={() => setStatusConfirm({ tenant, next: sc.next, label: sc.actionLabel })}
                    >
                      <ActionIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      title="Excluir" onClick={() => setDeleteTarget(tenant)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">
              Nenhum tenant encontrado.
            </div>
          )}
        </div>
      )}

      {/* ── Table View ─────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Tenant</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3 hidden md:table-cell">Responsável</th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3">Status</th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3 hidden sm:table-cell">Plano</th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3 hidden lg:table-cell">
                    <Users className="h-3.5 w-3.5 inline" />
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3 hidden lg:table-cell">
                    <Calendar className="h-3.5 w-3.5 inline" />
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-3 hidden sm:table-cell">MRR</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Desde</th>
                  <th className="px-4 py-3 w-[120px]" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(tenant => {
                  const sc = STATUS_CONFIG[tenant.status];
                  const pc = PLAN_CONFIG[tenant.plan];
                  const { ActionIcon } = sc;

                  return (
                    <tr key={tenant.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Tenant name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <TenantAvatar
                            name={tenant.name}
                            logoUrl={tenant.logoUrl}
                            primaryColor={tenant.primaryColor}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate leading-tight">{tenant.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">/{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Owner */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        <p className="truncate max-w-[140px] text-muted-foreground">{tenant.ownerName}</p>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <Badge variant={sc.variant} className="text-[10px] px-1.5">{sc.label}</Badge>
                      </td>
                      {/* Plan */}
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <Badge variant={pc.variant} className="text-[10px] px-1.5">{pc.label}</Badge>
                      </td>
                      {/* Professionals */}
                      <td className="px-3 py-3 text-center text-muted-foreground hidden lg:table-cell">
                        {tenant._count?.professionals ?? 0}
                      </td>
                      {/* Appointments */}
                      <td className="px-3 py-3 text-center text-muted-foreground hidden lg:table-cell">
                        {tenant._count?.appointments ?? 0}
                      </td>
                      {/* MRR */}
                      <td className="px-3 py-3 text-right font-medium text-primary hidden sm:table-cell">
                        {formatCurrency(tenant.monthlyPrice)}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden md:table-cell">
                        {format(parseISO(tenant.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Ver detalhes"
                            onClick={() => setDetailTenantId(tenant.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Editar"
                            onClick={() => openEdit(tenant)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className={`h-7 w-7 ${tenant.status === 'active' ? 'text-destructive hover:text-destructive' : 'text-primary'}`}
                            title={sc.actionLabel}
                            onClick={() => setStatusConfirm({ tenant, next: sc.next, label: sc.actionLabel })}
                          >
                            <ActionIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Excluir"
                            onClick={() => setDeleteTarget(tenant)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-16">
                Nenhum tenant encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tenant Detail Modal ──────────────────────────────────────────── */}
      <TenantDetailModal
        tenantId={detailTenantId}
        onClose={() => setDetailTenantId(null)}
      />

      {/* ── Dialog: Criar Tenant ─────────────────────────────────────────── */}
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
                <Input placeholder="João Silva" value={createForm.ownerName}
                  onChange={e => setCreateForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail admin *</Label>
                <Input type="email" placeholder="admin@exemplo.com" value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-0000" value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input placeholder="Rua das Flores, 123" value={createForm.address}
                  onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
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
                <Input type="number" min="0" step="0.01" value={createForm.monthlyPrice}
                  onChange={e => setCreateForm(f => ({ ...f, monthlyPrice: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cor principal</Label>
                <div className="flex gap-2">
                  <input type="color" value={createForm.primaryColor}
                    onChange={e => setCreateForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border p-0.5" />
                  <Input value={createForm.primaryColor}
                    onChange={e => setCreateForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="font-mono text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Senha do admin *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={createForm.adminPassword}
                onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} />
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

      {/* ── Dialog: Editar Tenant ────────────────────────────────────────── */}
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
                  <Input value={editForm.name}
                    onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Input value={editForm.ownerName}
                    onChange={e => setEditForm(f => f ? { ...f, ownerName: e.target.value } : f)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={editForm.phone}
                    onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Endereço</Label>
                  <Input value={editForm.address}
                    onChange={e => setEditForm(f => f ? { ...f, address: e.target.value } : f)} />
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
                  <Input type="number" min="0" step="0.01" value={editForm.monthlyPrice}
                    onChange={e => setEditForm(f => f ? { ...f, monthlyPrice: e.target.value } : f)} />
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
                  <input type="color" value={editForm.primaryColor}
                    onChange={e => setEditForm(f => f ? { ...f, primaryColor: e.target.value } : f)}
                    className="h-9 w-12 cursor-pointer rounded border p-0.5" />
                  <Input value={editForm.primaryColor}
                    onChange={e => setEditForm(f => f ? { ...f, primaryColor: e.target.value } : f)}
                    className="font-mono text-sm" />
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

      {/* ── Dialog: Confirmar status ─────────────────────────────────────── */}
      <Dialog open={!!statusConfirm} onOpenChange={o => !o && setStatusConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar ação</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja <strong>{statusConfirm?.label.toLowerCase()}</strong> o tenant{' '}
            <strong>{statusConfirm?.tenant.name}</strong>?
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

      {/* ── Dialog: Confirmar exclusão ───────────────────────────────────── */}
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
