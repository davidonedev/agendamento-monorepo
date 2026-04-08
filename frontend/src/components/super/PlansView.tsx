import { useState } from 'react';
import {
  Check, CreditCard, Loader2, Pencil, Users,
  TrendingUp, Crown, Zap, Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePlatform } from '@/context/PlatformContext';
import { formatCurrency } from '@/lib/utils';
import type { TenantWithCounts } from '@/services/super.service';
import type { TenantPlan } from '@/types';

// ─── Configuração dos planos ──────────────────────────────────────────────────

type PlanKey = 'basic' | 'pro' | 'enterprise';

interface PlanConfig {
  key: PlanKey;
  label: string;
  displayLabel: string;
  icon: React.ElementType;
  color: string;
  badgeVariant: 'outline' | 'default' | 'secondary';
  defaultPrice: number;
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    key: 'basic',
    label: 'Basic',
    displayLabel: 'Basic',
    icon: Star,
    color: 'text-slate-600',
    badgeVariant: 'outline',
    defaultPrice: 97,
    features: [
      'Até 2 profissionais',
      'Agendamento online',
      'Gestão de clientes',
      'Portal público personalizado',
      'Suporte via e-mail',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    displayLabel: 'Pro',
    icon: Zap,
    color: 'text-blue-600',
    badgeVariant: 'default',
    defaultPrice: 197,
    features: [
      'Até 5 profissionais',
      'Agendamento online',
      'Gestão de clientes',
      'Relatórios avançados',
      'Portal público personalizado',
      'Gestão de produtos',
      'Suporte prioritário',
    ],
  },
  {
    key: 'enterprise',
    label: 'Premium',
    displayLabel: 'Premium',
    icon: Crown,
    color: 'text-amber-600',
    badgeVariant: 'secondary',
    defaultPrice: 397,
    features: [
      'Profissionais ilimitados',
      'Agendamento online',
      'Gestão de clientes',
      'Relatórios avançados',
      'Portal público personalizado',
      'Gestão de produtos',
      'Suporte dedicado 24/7',
      'Onboarding personalizado',
    ],
  },
];

const PLAN_MAP = Object.fromEntries(PLANS.map(p => [p.key, p])) as Record<PlanKey, PlanConfig>;

// ─── Utilitários ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: 'Ativo',    variant: 'success'     as const },
  trial:     { label: 'Trial',    variant: 'warning'     as const },
  suspended: { label: 'Suspenso', variant: 'destructive' as const },
};

// ─── Dialog de alteração de plano ────────────────────────────────────────────

interface ChangePlanDialogProps {
  tenant: TenantWithCounts | null;
  onClose: () => void;
  onSave: (id: string, plan: PlanKey, price: number) => Promise<void>;
}

function ChangePlanDialog({ tenant, onClose, onSave }: ChangePlanDialogProps) {
  const [plan, setPlan]   = useState<PlanKey>((tenant?.plan ?? 'basic') as PlanKey);
  const [price, setPrice] = useState(String(tenant?.monthlyPrice ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Atualiza preço sugerido quando muda o plano
  const handlePlanChange = (p: string) => {
    const newPlan = p as PlanKey;
    setPlan(newPlan);
    setPrice(String(PLAN_MAP[newPlan].defaultPrice));
  };

  const handleSave = async () => {
    if (!tenant) return;
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      setError('Informe um valor mensal válido.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(tenant.id, plan, numPrice);
      onClose();
    } catch {
      setError('Erro ao atualizar plano. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!tenant} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
        </DialogHeader>

        {tenant && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium">{tenant.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{tenant.slug}</p>
            </div>

            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map(p => (
                    <SelectItem key={p.key} value={p.key}>
                      <div className="flex items-center gap-2">
                        <p.icon className={`h-4 w-4 ${p.color}`} />
                        {p.displayLabel}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor mensal (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ex: 197.00"
              />
              <p className="text-xs text-muted-foreground">
                Sugestão para {PLAN_MAP[plan].displayLabel}: {formatCurrency(PLAN_MAP[plan].defaultPrice)}
              </p>
            </div>

            {/* Features do plano selecionado */}
            <div className="p-3 rounded-lg border space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recursos inclusos
              </p>
              {PLAN_MAP[plan].features.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlansView() {
  const { tenants, updateTenant, loading } = usePlatform();
  const [editTarget, setEditTarget] = useState<TenantWithCounts | null>(null);
  const [filterPlan, setFilterPlan] = useState<PlanKey | 'all'>('all');

  // Estatísticas por plano
  const planStats = PLANS.map(plan => {
    const planTenants = tenants.filter(t => t.plan === plan.key);
    const mrr = planTenants.reduce((acc, t) => acc + t.monthlyPrice, 0);
    return { ...plan, count: planTenants.length, mrr };
  });

  const mrr = tenants.reduce((acc, t) => acc + t.monthlyPrice, 0);

  const filtered = tenants.filter(t =>
    filterPlan === 'all' ? true : t.plan === filterPlan
  );

  const handleSavePlan = async (id: string, plan: PlanKey, monthlyPrice: number) => {
    await updateTenant(id, { plan: plan as TenantPlan, monthlyPrice });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Planos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os planos de todos os tenants da plataforma
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">MRR Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</p>
        </div>
      </div>

      {/* Cards dos planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planStats.map(plan => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.key}
              className={`cursor-pointer transition-all border-2 ${filterPlan === plan.key ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setFilterPlan(prev => prev === plan.key ? 'all' : plan.key)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                    {plan.displayLabel}
                  </div>
                  <Badge variant={plan.badgeVariant}>{plan.count} tenant{plan.count !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{plan.count} ativo{plan.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{formatCurrency(plan.mrr)}/mês</span>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  {plan.features.slice(0, 4).map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-muted-foreground pl-4">
                      +{plan.features.length - 4} mais...
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Preço sugerido: <span className="font-semibold">{formatCurrency(plan.defaultPrice)}/mês</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtro ativo */}
      {filterPlan !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filtrando por: <strong>{PLAN_MAP[filterPlan].displayLabel}</strong>
          </span>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilterPlan('all')}>
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Tabela de tenants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filterPlan === 'all'
              ? `Todos os tenants (${tenants.length})`
              : `Tenants no plano ${PLAN_MAP[filterPlan].displayLabel} (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum tenant encontrado.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(tenant => {
                const plan = PLAN_MAP[tenant.plan as PlanKey];
                const status = STATUS_CONFIG[tenant.status];
                const PlanIcon = plan?.icon ?? Star;
                return (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold"
                        style={{ backgroundColor: tenant.primaryColor }}
                      >
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Contadores */}
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{tenant._count.professionals} prof.</span>
                        <span>{tenant._count.clients} clientes</span>
                      </div>

                      {/* Status */}
                      <Badge variant={status.variant} className="hidden sm:inline-flex">
                        {status.label}
                      </Badge>

                      {/* Plano */}
                      <div className="flex items-center gap-1.5">
                        <PlanIcon className={`h-4 w-4 ${plan?.color ?? ''}`} />
                        <Badge variant={plan?.badgeVariant ?? 'outline'} className="text-xs">
                          {plan?.displayLabel ?? tenant.plan}
                        </Badge>
                      </div>

                      {/* Preço */}
                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(tenant.monthlyPrice)}<span className="text-xs text-muted-foreground">/mês</span>
                      </span>

                      {/* Ação */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditTarget(tenant)}
                        title="Alterar plano"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de alteração */}
      <ChangePlanDialog
        tenant={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSavePlan}
      />
    </div>
  );
}
