import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Power, PowerOff, ExternalLink, Pencil, Loader2,
  Users, Scissors, Calendar, DollarSign, UserCheck, Store,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePlatform } from '@/context/PlatformContext';
import { getTenantDetailApi } from '@/services/super.service';
import { formatCurrency } from '@/lib/utils';
import type { TenantStatus } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  active:    { label: 'Ativo',    variant: 'success'     },
  trial:     { label: 'Trial',    variant: 'warning'     },
  suspended: { label: 'Suspenso', variant: 'destructive' },
};

// Forma real retornada pelo backend: tenant plano com relações aninhadas
type TenantRaw = TenantWithCounts & {
  professionals: { id: string; name: string; specialty: string; avatar?: string; _count?: { appointments: number } }[];
  services: { id: string; name: string; price: number; duration: number; category?: string }[];
  clients: { id: string; name: string; email: string }[];
  appointments: {
    id: string; status: string; price: number; date: string;
    client?: { name: string }; professional?: { name: string }; service?: { name: string };
  }[];
};

interface TenantDetail {
  tenant: TenantWithCounts;
  professionals: TenantRaw['professionals'];
  services: TenantRaw['services'];
  clients: TenantRaw['clients'];
  appointments: TenantRaw['appointments'];
}

export default function TenantDetailView() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { updateTenant, updateTenantStatus } = usePlatform();
  const navigate = useNavigate();

  const [detail, setDetail]     = useState<TenantDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string; ownerName: string; phone: string; address: string;
    plan: 'basic' | 'pro' | 'enterprise'; monthlyPrice: string;
    primaryColor: string; status: TenantStatus;
  } | null>(null);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    getTenantDetailApi(tenantId)
      .then((raw) => {
        const r = raw as unknown as TenantRaw;
        setDetail({
          tenant:        r,
          professionals: r.professionals ?? [],
          services:      r.services      ?? [],
          clients:       r.clients       ?? [],
          appointments:  r.appointments  ?? [],
        });
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
      </div>
    );
  }

  if (!detail) {
    return <p className="text-muted-foreground">Tenant não encontrado.</p>;
  }

  const { tenant } = detail;
  const sc = STATUS_CONFIG[tenant.status];

  const totalRevenue   = detail.appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.price, 0);
  const completedCount = detail.appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = detail.appointments.filter(a => a.status === 'cancelled').length;

  const openEdit = () => {
    setEditForm({
      name: tenant.name, ownerName: tenant.ownerName, phone: tenant.phone ?? '',
      address: tenant.address ?? '', plan: tenant.plan,
      monthlyPrice: String(tenant.monthlyPrice), primaryColor: tenant.primaryColor,
      status: tenant.status,
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm) return;
    const form = editForm;
    setEditError('');
    setSaving(true);
    try {
      await updateTenant(tenant.id, {
        name: form.name,
        ownerName: form.ownerName,
        phone: form.phone || undefined,
        address: form.address || undefined,
        plan: form.plan,
        monthlyPrice: parseFloat(form.monthlyPrice) || 0,
        primaryColor: form.primaryColor,
        status: form.status,
      });
      // Atualiza o detalhe local sem refetch
      setDetail(prev => prev ? {
        ...prev,
        tenant: {
          ...prev.tenant,
          name:         form.name,
          ownerName:    form.ownerName,
          phone:        form.phone || '',
          address:      form.address || '',
          plan:         form.plan,
          monthlyPrice: parseFloat(form.monthlyPrice) || 0,
          primaryColor: form.primaryColor,
          status:       form.status,
        },
      } : prev);
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const next: TenantStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setSaving(true);
    try {
      await updateTenantStatus(tenant.id, next);
      setDetail(prev => prev ? { ...prev, tenant: { ...prev.tenant, status: next } } : prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/super/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">{tenant.name}</h2>
            <Badge variant={sc.variant}>{sc.label}</Badge>
            <Badge variant="outline">{tenant.plan}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">/{tenant.slug}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`/${tenant.slug}`)}>
            <ExternalLink className="h-4 w-4 mr-1" /> Portal
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button
            variant={tenant.status === 'active' ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggle}
            disabled={saving}
          >
            {tenant.status === 'active'
              ? <><PowerOff className="h-4 w-4 mr-1" /> Suspender</>
              : <><Power className="h-4 w-4 mr-1" /> Reativar</>}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,     label: 'Profissionais', value: detail.professionals.length },
          { icon: Scissors,  label: 'Serviços',      value: detail.services.length },
          { icon: Calendar,  label: 'Agendamentos',  value: detail.appointments.length },
          { icon: DollarSign,label: 'Receita Total', value: formatCurrency(totalRevenue), raw: true },
        ].map(({ icon: Icon, label, value, raw }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Icon className="h-4 w-4" /><span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold">{raw ? value : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" />Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ['Responsável',   tenant.ownerName],
              ['E-mail',        tenant.email],
              ['Telefone',      tenant.phone ?? '—'],
              ['Endereço',      tenant.address ?? '—'],
              ['Plano',         `${tenant.plan} — ${formatCurrency(tenant.monthlyPrice)}/mês`],
              ['Status portal', tenant.isOpen ? 'Aberto' : 'Fechado'],
              ['Cliente desde', format(parseISO(tenant.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Faturamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Receita total gerada', value: formatCurrency(totalRevenue),          color: 'text-foreground' },
              { label: 'MRR do plano',          value: formatCurrency(tenant.monthlyPrice),   color: 'text-primary'    },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-muted/40 text-center">
                <p className="font-bold text-green-600">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
              <div className="p-2 rounded bg-muted/40 text-center">
                <p className="font-bold text-destructive">{cancelledCount}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profissionais */}
      {detail.professionals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4" />Profissionais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {detail.professionals.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.specialty}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{p._count?.appointments ?? 0} agend.</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Serviços */}
      {detail.services.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scissors className="h-4 w-4" />Serviços</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detail.services.map(s => (
                <div key={s.id} className="p-3 rounded-lg border space-y-1">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.duration} min · {s.category}</p>
                  <p className="text-sm font-bold" style={{ color: tenant.primaryColor }}>{formatCurrency(s.price)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog de edição ───────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={o => { if (!saving) { setEditOpen(o); setEditError(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Tenant</DialogTitle></DialogHeader>

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
                  <Select value={editForm.plan} onValueChange={v => setEditForm(f => f ? { ...f, plan: v as 'basic' | 'pro' | 'enterprise' } : f)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor/mês (R$)</Label>
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

              {editError && <p className="text-sm text-destructive">{editError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
