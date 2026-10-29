import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, Building2, LayoutGrid, Plus, RefreshCw, Search, SearchX, Table2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatform } from '@/context/PlatformContext';
import { useAuth } from '@/context/AuthContext';
import { cn, formatCurrency } from '@/lib/utils';
import type { TenantPlan, TenantStatus } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';
import { DeleteTenantDialog, StatusConfirmDialog, type StatusTarget } from './TenantConfirmDialogs';
import { TenantCard } from './TenantCard';
import { TenantFormDialog } from './TenantFormDialog';
import { TenantsTable, type SortDir, type SortKey } from './TenantsTable';
import { PLAN_CONFIG, PLAN_KEYS, STATUS_CONFIG, STATUS_KEYS, normalizeText, type StatusAction } from './tenantMeta';

type ViewMode = 'cards' | 'table';
type StatusFilter = TenantStatus | 'all';
type PlanFilter = TenantPlan | 'all';

const VIEW_STORAGE_KEY = 'super-tenants-view';
const DEFAULT_SORT = 'createdAt:desc';
const SORT_KEYS: SortKey[] = ['name', 'status', 'plan', 'clients', 'appointments', 'price', 'createdAt'];
const SORT_PRESETS = [
  { value: 'createdAt:desc',    label: 'Mais recentes' },
  { value: 'createdAt:asc',     label: 'Mais antigos' },
  { value: 'name:asc',          label: 'Nome (A–Z)' },
  { value: 'appointments:desc', label: 'Mais agendamentos' },
  { value: 'price:desc',        label: 'Maior mensalidade' },
];

function readStoredView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
}

function parseSort(value: string | null): { key: SortKey; dir: SortDir } {
  const [key, dir] = (value ?? DEFAULT_SORT).split(':');
  if (SORT_KEYS.includes(key as SortKey) && (dir === 'asc' || dir === 'desc')) {
    return { key: key as SortKey, dir };
  }
  return { key: 'createdAt', dir: 'desc' };
}

function compareBy(a: TenantWithCounts, b: TenantWithCounts, key: SortKey): number {
  switch (key) {
    case 'name':         return a.name.localeCompare(b.name, 'pt-BR');
    case 'status':       return STATUS_CONFIG[a.status].rank - STATUS_CONFIG[b.status].rank;
    case 'plan':         return PLAN_CONFIG[a.plan].rank - PLAN_CONFIG[b.plan].rank;
    case 'clients':      return (a._count?.clients ?? 0) - (b._count?.clients ?? 0);
    case 'appointments': return (a._count?.appointments ?? 0) - (b._count?.appointments ?? 0);
    case 'price':        return a.monthlyPrice - b.monthlyPrice;
    case 'createdAt':    return a.createdAt.localeCompare(b.createdAt);
  }
}

interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

function Kpi({ label, value, hint, active = false, onClick }: KpiProps) {
  const body = (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1 block text-2xl font-bold tabular-nums">{value}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>}
    </>
  );

  if (!onClick) {
    return <div className="rounded-lg border bg-card p-3 text-left">{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'border-primary bg-primary/5 ring-1 ring-primary'
      )}
    >
      {body}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando tenants">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-48" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: typeof Building2;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        {action && <Button variant="outline" onClick={action.onClick}>{action.label}</Button>}
      </CardContent>
    </Card>
  );
}

export default function TenantsView() {
  const { tenants, planConfigs, loading, error, refreshTenants } = usePlatform();
  const { impersonateTenant } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantWithCounts | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantWithCounts | null>(null);

  // ── Estado da tela guardado na URL (compartilhável e sobrevive ao reload) ──
  const q = params.get('q') ?? '';
  const statusParam = params.get('status');
  const planParam = params.get('plan');
  const status: StatusFilter = STATUS_KEYS.includes(statusParam as TenantStatus) ? (statusParam as TenantStatus) : 'all';
  const plan: PlanFilter = PLAN_KEYS.includes(planParam as TenantPlan) ? (planParam as TenantPlan) : 'all';
  const sort = parseSort(params.get('sort'));
  const sortValue = `${sort.key}:${sort.dir}`;
  const viewParam = params.get('view');
  const view: ViewMode = viewParam === 'table' || viewParam === 'cards' ? viewParam : readStoredView();

  const updateParams = (patch: Record<string, string | null>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value); else next.delete(key);
      });
      return next;
    }, { replace: true });
  };

  const setView = (mode: ViewMode) => {
    try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch { /* armazenamento indisponível */ }
    updateParams({ view: mode });
  };

  const handleSort = (key: SortKey) => {
    const dir: SortDir = sort.key === key
      ? (sort.dir === 'asc' ? 'desc' : 'asc')
      : (key === 'name' || key === 'status' || key === 'plan' ? 'asc' : 'desc');
    updateParams({ sort: `${key}:${dir}` === DEFAULT_SORT ? null : `${key}:${dir}` });
  };

  const clearFilters = () => updateParams({ q: null, status: null, plan: null });

  // ── Dados derivados ────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    mrr: tenants.filter(t => t.status !== 'suspended').reduce((sum, t) => sum + t.monthlyPrice, 0),
  }), [tenants]);

  const visible = useMemo(() => {
    const term = normalizeText(q.trim());
    const filtered = tenants.filter(t =>
      (status === 'all' || t.status === status) &&
      (plan === 'all' || t.plan === plan) &&
      (!term || [t.name, t.slug, t.ownerName, t.email].some(field => normalizeText(field ?? '').includes(term)))
    );
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compareBy(a, b, sort.key) * factor);
  }, [tenants, q, status, plan, sort.key, sort.dir]);

  const hasFilters = q.trim() !== '' || status !== 'all' || plan !== 'all';
  const sortOptions = SORT_PRESETS.some(p => p.value === sortValue)
    ? SORT_PRESETS
    : [...SORT_PRESETS, { value: sortValue, label: 'Ordem da tabela' }];

  const openStatus = (tenant: TenantWithCounts, action: StatusAction) => setStatusTarget({ tenant, action });

  const handleImpersonate = (tenant: TenantWithCounts) => {
    impersonateTenant(tenant.id).then(() => navigate('/admin/dashboard')).catch(() => {});
  };

  // ── Estados de carregamento e erro ─────────────────────────────────────────
  if (loading && tenants.length === 0) return <LoadingState />;

  if (error && tenants.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-semibold">Não foi possível carregar os tenants</p>
              <p role="alert" className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => void refreshTenants()}><RefreshCw /> Tentar de novo</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os estabelecimentos da plataforma, seus planos e acessos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="icon" aria-label="Atualizar lista" title="Atualizar lista"
            onClick={() => void refreshTenants()} disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => setCreateOpen(true)}><Plus /> Novo tenant</Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> Não foi possível atualizar: {error}
        </p>
      )}

      {tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum tenant cadastrado"
          description="Cadastre o primeiro estabelecimento para começar a operar a plataforma."
          action={{ label: 'Criar primeiro tenant', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <>
          {/* ── Indicadores (clicar filtra por status) ──────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Total" value={counts.total} active={status === 'all'} onClick={() => updateParams({ status: null })} />
            <Kpi label="Ativos" value={counts.active} active={status === 'active'} onClick={() => updateParams({ status: status === 'active' ? null : 'active' })} />
            <Kpi label="Em trial" value={counts.trial} active={status === 'trial'} onClick={() => updateParams({ status: status === 'trial' ? null : 'trial' })} />
            <Kpi label="Suspensos" value={counts.suspended} active={status === 'suspended'} onClick={() => updateParams({ status: status === 'suspended' ? null : 'suspended' })} />
            <Kpi label="Receita mensal (MRR)" value={formatCurrency(counts.mrr)} hint="Ativos e em trial" />
          </div>

          {/* ── Ferramentas ─────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                type="search"
                aria-label="Buscar tenants"
                placeholder="Buscar por nome, slug, responsável ou e-mail..."
                value={q}
                onChange={e => updateParams({ q: e.target.value || null })}
              />
            </div>
            <Select value={plan} onValueChange={v => updateParams({ plan: v === 'all' ? null : v })}>
              <SelectTrigger className="w-[150px]" aria-label="Filtrar por plano"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {PLAN_KEYS.map(p => <SelectItem key={p} value={p}>{PLAN_CONFIG[p].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => updateParams({ status: v === 'all' ? null : v })}>
              <SelectTrigger className="w-[150px]" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_KEYS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortValue} onValueChange={v => updateParams({ sort: v === DEFAULT_SORT ? null : v })}>
              <SelectTrigger className="w-[180px]" aria-label="Ordenar por"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex shrink-0 overflow-hidden rounded-md border" role="group" aria-label="Modo de visualização">
              {([['cards', LayoutGrid, 'Cards'], ['table', Table2, 'Tabela']] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  aria-label={`Visualizar em ${label.toLowerCase()}`}
                  title={label}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    view === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground" aria-live="polite">
            <span>Mostrando {visible.length} de {tenants.length} tenants</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
                <X /> Limpar filtros
              </Button>
            )}
          </div>

          {/* ── Resultados ──────────────────────────────────────────────────── */}
          {visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nenhum tenant encontrado"
              description="Nenhum resultado com os filtros atuais. Tente outro termo ou limpe os filtros."
              action={{ label: 'Limpar filtros', onClick: clearFilters }}
            />
          ) : view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(tenant => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  planConfigs={planConfigs}
                  onEdit={setEditTenant}
                  onImpersonate={handleImpersonate}
                  onStatus={openStatus}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <TenantsTable
              tenants={visible}
              planConfigs={planConfigs}
              sort={sort}
              onSort={handleSort}
              onEdit={setEditTenant}
              onImpersonate={handleImpersonate}
              onStatus={openStatus}
              onDelete={setDeleteTarget}
            />
          )}
        </>
      )}

      <TenantFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TenantFormDialog open={!!editTenant} onOpenChange={open => { if (!open) setEditTenant(null); }} tenant={editTenant} />
      <StatusConfirmDialog target={statusTarget} onClose={() => setStatusTarget(null)} />
      <DeleteTenantDialog tenant={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
