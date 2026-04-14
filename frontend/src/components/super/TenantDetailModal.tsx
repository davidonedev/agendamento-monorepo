import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Power, PowerOff, ExternalLink, Pencil, Loader2,
  Users, Scissors, CalendarDays, DollarSign, UserCheck, Store,
  CalendarCheck, TrendingUp,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlatform } from '@/context/PlatformContext';
import { getTenantDetailApi } from '@/services/super.service';
import type { TenantDetailResponse } from '@/services/super.service';
import { formatCurrency } from '@/lib/utils';
import type { TenantStatus } from '@/types';
import { TenantAvatar } from './TenantAvatar';

// ─── Configs ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  active:    { label: 'Ativo',    variant: 'success'     },
  trial:     { label: 'Trial',    variant: 'warning'     },
  suspended: { label: 'Suspenso', variant: 'destructive' },
};

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  tenantId: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TenantDetailModal({ tenantId, onClose }: Props) {
  const { updateTenant, updateTenantStatus } = usePlatform();
  const navigate = useNavigate();

  const [detail,    setDetail]    = useState<TenantDetailResponse | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editOpen,  setEditOpen]  = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm,  setEditForm]  = useState<{
    name: string; ownerName: string; phone: string; address: string;
    plan: 'basic' | 'pro' | 'enterprise'; monthlyPrice: string;
    primaryColor: string; status: TenantStatus;
  } | null>(null);

  useEffect(() => {
    if (!tenantId) { setDetail(null); return; }
    setLoading(true);
    getTenantDetailApi(tenantId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const openEdit = () => {
    if (!detail) return;
    setEditForm({
      name: detail.name, ownerName: detail.ownerName,
      phone: detail.phone ?? '', address: detail.address ?? '',
      plan: detail.plan, monthlyPrice: String(detail.monthlyPrice),
      primaryColor: detail.primaryColor, status: detail.status,
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm || !detail) return;
    const f = editForm;
    setSaving(true);
    setEditError('');
    try {
      await updateTenant(detail.id, {
        name: f.name, ownerName: f.ownerName,
        phone: f.phone || undefined, address: f.address || undefined,
        plan: f.plan, monthlyPrice: parseFloat(f.monthlyPrice) || 0,
        primaryColor: f.primaryColor, status: f.status,
      });
      setDetail(prev => prev ? {
        ...prev,
        name: f.name, ownerName: f.ownerName, phone: f.phone, address: f.address,
        plan: f.plan, monthlyPrice: parseFloat(f.monthlyPrice) || 0,
        primaryColor: f.primaryColor, status: f.status,
      } : prev);
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!detail) return;
    const next: TenantStatus = detail.status === 'active' ? 'suspended' : 'active';
    setSaving(true);
    try {
      await updateTenantStatus(detail.id, next);
      setDetail(prev => prev ? { ...prev, status: next } : prev);
    } finally {
      setSaving(false);
    }
  };

  const isOpen = !!tenantId;
  const sc = detail ? STATUS_CONFIG[detail.status] : null;

  return (
    <>
      <Dialog open={isOpen && !editOpen} onOpenChange={o => { if (!o) onClose(); }}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden max-h-[90vh] flex flex-col">

          {/* Barra de cor — padrão super admin */}
          {detail && <div className="h-1.5 w-full bg-primary shrink-0" />}

          {/* ── Header ───────────────────────────────────────────────────── */}
          <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" /> Carregando detalhes...
              </div>
            ) : detail && sc ? (
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <TenantAvatar
                    name={detail.name}
                    logoUrl={detail.logoUrl}
                    primaryColor={detail.primaryColor}
                    size="xl"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-xl font-bold leading-tight">
                        {detail.name}
                      </DialogTitle>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      <Badge variant="outline">{PLAN_LABELS[detail.plan]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="font-mono">/{detail.slug}</span>
                      {' · '}{detail.ownerName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/${detail.slug}`)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Portal
                  </Button>
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button
                    variant={detail.status === 'active' ? 'destructive' : 'default'}
                    size="sm" onClick={handleToggle} disabled={saving}
                  >
                    {detail.status === 'active'
                      ? <><PowerOff className="h-3.5 w-3.5 mr-1.5" />Suspender</>
                      : <><Power className="h-3.5 w-3.5 mr-1.5" />Reativar</>}
                  </Button>
                </div>
              </div>
            ) : (
              <DialogTitle>Tenant não encontrado</DialogTitle>
            )}
          </DialogHeader>

          {/* ── Corpo ────────────────────────────────────────────────────── */}
          {detail && (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-6 pb-6 space-y-5">

                {/* ── KPIs rápidos ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users,     label: 'Profissionais', value: detail.professionals.length },
                    { icon: Scissors,  label: 'Serviços',      value: detail.services.length },
                    { icon: CalendarDays, label: 'Agend. total', value: detail._count?.appointments ?? 0 },
                    { icon: Users,     label: 'Clientes',      value: detail._count?.clients ?? 0 },
                  ].map(({ icon: Icon, label, value }) => (
                    <Card key={label} className="border-0 bg-muted/40">
                      <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{label}</span>
                        </div>
                        <p className="text-xl font-bold">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* ── Agendamentos por período ──────────────────────────── */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" /> Agendamentos por período
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { label: 'Hoje',       stat: detail.appointmentStats.today },
                        { label: 'Este mês',   stat: detail.appointmentStats.month },
                        { label: 'Este ano',   stat: detail.appointmentStats.year  },
                      ] as const).map(({ label, stat }) => (
                        <div key={label} className="rounded-lg border p-3 text-center space-y-0.5">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-2xl font-bold">{stat.count}</p>
                          <p className="text-xs text-muted-foreground">agendamentos</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ── Informações ──────────────────────────────────────── */}
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Store className="h-4 w-4" /> Informações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {([
                        ['Responsável',   detail.ownerName],
                        ['E-mail',        detail.email],
                        ['Telefone',      detail.phone || '—'],
                        ['Endereço',      detail.address || '—'],
                        ['Plano',         `${PLAN_LABELS[detail.plan]} — ${formatCurrency(detail.monthlyPrice)}/mês`],
                        ['Portal',        detail.isOpen ? 'Aberto' : 'Fechado'],
                        ['Cliente desde', format(parseISO(detail.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2 text-sm">
                          <span className="text-muted-foreground shrink-0">{label}</span>
                          <span className="font-medium text-right truncate max-w-[55%]">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* ── Faturamento por período ───────────────────────── */}
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Faturamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {([
                        { label: 'Hoje',     stat: detail.appointmentStats.today },
                        { label: 'Este mês', stat: detail.appointmentStats.month },
                        { label: 'Este ano', stat: detail.appointmentStats.year  },
                      ] as const).map(({ label, stat }) => (
                        <div key={label} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(stat.revenue)}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> MRR do plano
                        </span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(detail.monthlyPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ── Profissionais ─────────────────────────────────────── */}
                {detail.professionals.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Profissionais ({detail.professionals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {detail.professionals.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            {p.avatar ? (
                              <img src={p.avatar} alt={p.name}
                                className="h-8 w-8 rounded-full object-cover shrink-0 border" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                                {p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.specialty}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {p._count.appointments} agend.
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Serviços ──────────────────────────────────────────── */}
                {detail.services.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scissors className="h-4 w-4" /> Serviços ({detail.services.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {detail.services.map(s => (
                          <div key={s.id} className="p-3 rounded-lg border space-y-1">
                            <p className="font-medium text-sm truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.duration} min{s.category ? ` · ${s.category}` : ''}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(s.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={o => { if (!saving) { setEditOpen(o); setEditError(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar — {detail?.name}</DialogTitle>
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
                  <Select value={editForm.plan}
                    onValueChange={v => setEditForm(f => f ? { ...f, plan: v as 'basic' | 'pro' | 'enterprise' } : f)}>
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
                  <Input type="number" min="0" step="0.01" value={editForm.monthlyPrice}
                    onChange={e => setEditForm(f => f ? { ...f, monthlyPrice: e.target.value } : f)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status}
                    onValueChange={v => setEditForm(f => f ? { ...f, status: v as TenantStatus } : f)}>
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
              {editError && <p className="text-sm text-destructive">{editError}</p>}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
