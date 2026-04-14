import { useState } from 'react';
import {
  Check, CreditCard, Loader2, Pencil, Users,
  TrendingUp, Crown, Zap, Star, Plus, Trash2, X,
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
import type { TenantPlan, PlanConfig } from '@/types';
import { TenantAvatar } from './TenantAvatar';

// ─── Metadados visuais fixos por chave de plano ───────────────────────────────

type PlanKey = 'basic' | 'pro' | 'enterprise';

const PLAN_VISUAL: Record<PlanKey, {
  icon: React.ElementType;
  color: string;
  badgeVariant: 'outline' | 'default' | 'secondary';
}> = {
  basic:      { icon: Star,  color: 'text-slate-600', badgeVariant: 'outline'   },
  pro:        { icon: Zap,   color: 'text-blue-600',  badgeVariant: 'default'   },
  enterprise: { icon: Crown, color: 'text-amber-600', badgeVariant: 'secondary' },
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: 'Ativo',    variant: 'success'     as const },
  trial:     { label: 'Trial',    variant: 'warning'     as const },
  suspended: { label: 'Suspenso', variant: 'destructive' as const },
};

function formatLimit(value: number) {
  return value === -1 ? 'Ilimitado' : String(value);
}

// ─── Dialog de alteração de plano do tenant ───────────────────────────────────

interface ChangePlanDialogProps {
  tenant: TenantWithCounts | null;
  planConfigs: PlanConfig[];
  onClose: () => void;
  onSave: (id: string, plan: PlanKey, price: number) => Promise<void>;
}

function ChangePlanDialog({ tenant, planConfigs, onClose, onSave }: ChangePlanDialogProps) {
  const [plan, setPlan]   = useState<PlanKey>((tenant?.plan ?? 'basic') as PlanKey);
  const [price, setPrice] = useState(String(tenant?.monthlyPrice ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const currentConfig = planConfigs.find(p => p.plan === plan);

  const handlePlanChange = (p: string) => {
    const newPlan = p as PlanKey;
    setPlan(newPlan);
    const cfg = planConfigs.find(c => c.plan === newPlan);
    if (cfg) setPrice(String(cfg.defaultPrice));
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
                  {planConfigs.map(p => {
                    const visual = PLAN_VISUAL[p.plan as PlanKey];
                    const Icon = visual?.icon ?? Star;
                    return (
                      <SelectItem key={p.plan} value={p.plan}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${visual?.color ?? ''}`} />
                          {p.displayName}
                        </div>
                      </SelectItem>
                    );
                  })}
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
              {currentConfig && (
                <p className="text-xs text-muted-foreground">
                  Sugestão para {currentConfig.displayName}: {formatCurrency(currentConfig.defaultPrice)}
                </p>
              )}
            </div>

            {currentConfig && currentConfig.features.length > 0 && (
              <div className="p-3 rounded-lg border space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recursos inclusos
                </p>
                {currentConfig.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            )}

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

// ─── Dialog de edição do plano (CRUD) ────────────────────────────────────────

interface EditPlanDialogProps {
  config: PlanConfig | null;
  onClose: () => void;
  onSave: (plan: TenantPlan, data: {
    displayName: string;
    defaultPrice: number;
    maxProfessionals: number;
    maxServices: number;
    features: string[];
  }) => Promise<void>;
}

function EditPlanDialog({ config, onClose, onSave }: EditPlanDialogProps) {
  const [displayName, setDisplayName]             = useState(config?.displayName ?? '');
  const [defaultPrice, setDefaultPrice]           = useState(String(config?.defaultPrice ?? ''));
  const [maxProfessionals, setMaxProfessionals]   = useState(String(config?.maxProfessionals ?? -1));
  const [maxServices, setMaxServices]             = useState(String(config?.maxServices ?? -1));
  const [features, setFeatures]                   = useState<string[]>(config?.features ?? []);
  const [newFeature, setNewFeature]               = useState('');
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState('');

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed || features.includes(trimmed)) return;
    setFeatures(prev => [...prev, trimmed]);
    setNewFeature('');
  };

  const removeFeature = (f: string) => {
    setFeatures(prev => prev.filter(x => x !== f));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addFeature(); }
  };

  const handleSave = async () => {
    if (!config) return;
    if (!displayName.trim()) { setError('Nome do plano é obrigatório.'); return; }
    const price = parseFloat(defaultPrice);
    if (isNaN(price) || price < 0) { setError('Informe um preço válido.'); return; }
    const maxProf = parseInt(maxProfessionals);
    const maxSvc  = parseInt(maxServices);
    if (isNaN(maxProf) || maxProf < -1) { setError('Limite de profissionais inválido (-1 = ilimitado).'); return; }
    if (isNaN(maxSvc)  || maxSvc  < -1) { setError('Limite de serviços inválido (-1 = ilimitado).'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave(config.plan, {
        displayName: displayName.trim(),
        defaultPrice: price,
        maxProfessionals: maxProf,
        maxServices: maxSvc,
        features,
      });
      onClose();
    } catch {
      setError('Erro ao salvar plano. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const visual = config ? PLAN_VISUAL[config.plan as PlanKey] : null;
  const Icon   = visual?.icon ?? Star;

  return (
    <Dialog open={!!config} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config && <Icon className={`h-5 w-5 ${visual?.color ?? ''}`} />}
            Editar Plano {config?.displayName}
          </DialogTitle>
        </DialogHeader>

        {config && (
          <div className="space-y-5 py-2">
            {/* Nome */}
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Pro"
              />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label>Preço padrão sugerido (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={defaultPrice}
                onChange={e => setDefaultPrice(e.target.value)}
                placeholder="Ex: 197.00"
              />
              <p className="text-xs text-muted-foreground">
                Valor pré-preenchido ao atribuir este plano a um tenant.
              </p>
            </div>

            {/* Limites */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máx. profissionais</Label>
                <Input
                  type="number"
                  min="-1"
                  step="1"
                  value={maxProfessionals}
                  onChange={e => setMaxProfessionals(e.target.value)}
                  placeholder="-1 = ilimitado"
                />
                <p className="text-xs text-muted-foreground">-1 = ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label>Máx. serviços</Label>
                <Input
                  type="number"
                  min="-1"
                  step="1"
                  value={maxServices}
                  onChange={e => setMaxServices(e.target.value)}
                  placeholder="-1 = ilimitado"
                />
                <p className="text-xs text-muted-foreground">-1 = ilimitado</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Recursos do plano</Label>

              {/* Lista atual */}
              <div className="border rounded-lg divide-y">
                {features.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum recurso adicionado.
                  </p>
                ) : (
                  features.map(f => (
                    <div key={f} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {f}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFeature(f)}
                        title="Remover recurso"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Adicionar novo recurso */}
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={e => setNewFeature(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Novo recurso... (Enter para adicionar)"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addFeature}
                  disabled={!newFeature.trim()}
                  title="Adicionar recurso"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlansView() {
  const { tenants, planConfigs, updateTenant, updatePlanConfig, loading } = usePlatform();
  const [editTarget, setEditTarget]   = useState<TenantWithCounts | null>(null);
  const [editPlan, setEditPlan]       = useState<PlanConfig | null>(null);
  const [filterPlan, setFilterPlan]   = useState<PlanKey | 'all'>('all');

  // Estatísticas por plano
  const planStats = planConfigs.map(config => {
    const planTenants = tenants.filter(t => t.plan === config.plan);
    const mrr = planTenants.reduce((acc, t) => acc + t.monthlyPrice, 0);
    return { ...config, count: planTenants.length, mrr };
  });

  const mrr = tenants.reduce((acc, t) => acc + t.monthlyPrice, 0);

  const filtered = tenants.filter(t =>
    filterPlan === 'all' ? true : t.plan === filterPlan
  );

  const handleSavePlan = async (id: string, plan: PlanKey, monthlyPrice: number) => {
    await updateTenant(id, { plan: plan as TenantPlan, monthlyPrice });
  };


  const handleSavePlanConfig = async (
    plan: TenantPlan,
    data: { displayName: string; defaultPrice: number; maxProfessionals: number; maxServices: number; features: string[] }
  ) => {
    await updatePlanConfig(plan, data);
  };

  const currentFilterConfig = planConfigs.find(p => p.plan === filterPlan);


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
            Configure os planos de assinatura e gerencie os tenants
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">MRR Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</p>
        </div>
      </div>

      {/* Cards dos planos */}
      {loading && planConfigs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planStats.map(plan => {
            const visual = PLAN_VISUAL[plan.plan as PlanKey];
            const Icon = visual?.icon ?? Star;
            return (
              <Card
                key={plan.plan}
                className={`transition-all border-2 ${filterPlan === plan.plan ? 'border-primary' : 'border-transparent'}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <button
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                      onClick={() => setFilterPlan(prev => prev === plan.plan ? 'all' : plan.plan as PlanKey)}
                    >
                      <Icon className={`h-5 w-5 ${visual?.color ?? ''}`} />
                      {plan.displayName}
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant={visual?.badgeVariant ?? 'outline'}>{plan.count} tenant{plan.count !== 1 ? 's' : ''}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditPlan(plan)}
                        title={`Editar plano ${plan.displayName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

                  {/* Limites */}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Profissionais: <strong className="text-foreground">{formatLimit(plan.maxProfessionals)}</strong></span>
                    <span>Serviços: <strong className="text-foreground">{formatLimit(plan.maxServices)}</strong></span>
                  </div>

                  {/* Features */}
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
      )}

      {/* Filtro ativo */}
      {filterPlan !== 'all' && currentFilterConfig && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filtrando por: <strong>{currentFilterConfig.displayName}</strong>
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
              : `Tenants no plano ${currentFilterConfig?.displayName ?? filterPlan} (${filtered.length})`}
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
                const planCfg = planConfigs.find(p => p.plan === tenant.plan);
                const visual  = PLAN_VISUAL[tenant.plan as PlanKey];
                const status  = STATUS_CONFIG[tenant.status];
                const PlanIcon = visual?.icon ?? Star;
                return (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <TenantAvatar
                        name={tenant.name}
                        logoUrl={tenant.logoUrl}
                        primaryColor={tenant.primaryColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{tenant._count.professionals} prof.</span>
                        <span>{tenant._count.clients} clientes</span>
                      </div>

                      <Badge variant={status.variant} className="hidden sm:inline-flex">
                        {status.label}
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        <PlanIcon className={`h-4 w-4 ${visual?.color ?? ''}`} />
                        <Badge variant={visual?.badgeVariant ?? 'outline'} className="text-xs">
                          {planCfg?.displayName ?? tenant.plan}
                        </Badge>
                      </div>


                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(tenant.monthlyPrice)}<span className="text-xs text-muted-foreground">/mês</span>
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditTarget(tenant)}
                        title="Alterar plano do tenant"
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

      {/* Dialog de alteração de plano do tenant */}
      <ChangePlanDialog
        tenant={editTarget}
        planConfigs={planConfigs}
        onClose={() => setEditTarget(null)}
        onSave={handleSavePlan}
      />

      {/* Dialog de edição da config do plano */}
      <EditPlanDialog
        config={editPlan}
        onClose={() => setEditPlan(null)}
        onSave={handleSavePlanConfig}
      />
    </div>
  );
}
