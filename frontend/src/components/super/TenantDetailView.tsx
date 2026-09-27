import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle, AlertTriangle, Building2, Calendar, Clock, Copy, DollarSign, ExternalLink, Globe,
  MapPin, Mail, MessageCircle, Pencil, Phone, Scissors, Trash2, User, UserCheck, Users, type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { usePlatform } from '@/context/PlatformContext';
import { formatCurrency } from '@/lib/utils';
import { getTenantDetailApi, type TenantDetailResponse, type TenantWithCounts } from '@/services/super.service';
import { DeleteTenantDialog, StatusConfirmDialog, type StatusTarget } from './TenantConfirmDialogs';
import { TenantActionsMenu } from './TenantActionsMenu';
import { TenantAvatar } from './TenantAvatar';
import { TenantFormDialog } from './TenantFormDialog';
import { PlanUsageBar } from './PlanUsageBar';
import {
  PLAN_CONFIG, STATUS_CONFIG, formatMinutes, getPlanConfig, getStatusActions, getUsage, timeAgo, whatsappLink,
  type StatusAction,
} from './tenantMeta';

const TABS = ['overview', 'team', 'finance', 'settings'] as const;
type TabKey = typeof TABS[number];

interface DetailResult {
  id: string;
  data: TenantDetailResponse | null;
  error?: string;
}

// ─── Blocos reutilizáveis ─────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">{label}</span>
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {children}
      </CardTitle>
    </CardHeader>
  );
}

function DetailUnavailable({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <p role="alert" className="text-sm text-muted-foreground">
          Não foi possível carregar os detalhes{message ? `: ${message}` : '.'}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>Tentar de novo</Button>
      </CardContent>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando tenant">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-32" /></div>
      </div>
      <Skeleton className="h-10 w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 rounded border" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="font-mono text-xs">{color}</span>
    </span>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function TenantDetailView() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { tenants, planConfigs, metrics, loading: platformLoading } = usePlatform();
  const { toast } = useToast();

  const [result, setResult] = useState<DetailResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    getTenantDetailApi(tenantId)
      .then(data => { if (!cancelled) setResult({ id: tenantId, data }); })
      .catch(err => {
        if (!cancelled) {
          setResult({ id: tenantId, data: null, error: err instanceof Error ? err.message : 'Erro ao carregar.' });
        }
      });
    return () => { cancelled = true; };
  }, [tenantId, reloadKey]);

  const retry = () => { setResult(null); setReloadKey(k => k + 1); };

  const current = result && result.id === tenantId ? result : null;
  const detailLoading = !current;
  const detail = current?.data ?? null;
  const detailError = current?.error;

  // A lista do contexto é mantida atualizada pelas mutações (editar, status); o detalhe traz o restante.
  const tenant = tenants.find(t => t.id === tenantId) ?? detail;

  const requestedTab = params.get('tab');
  const tab: TabKey = TABS.includes(requestedTab as TabKey) ? (requestedTab as TabKey) : 'overview';

  if (!tenant) {
    if (detailLoading || platformLoading) return <PageSkeleton />;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-semibold">Tenant não encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">{detailError ?? 'Ele pode ter sido excluído.'}</p>
          </div>
          <Button asChild variant="outline"><Link to="/super/tenants">Voltar para Tenants</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const counts = {
    professionals: detail?.professionals.length ?? tenant._count?.professionals ?? 0,
    services: detail?.services.length ?? tenant._count?.services ?? 0,
    clients: detail?._count?.clients ?? tenant._count?.clients ?? 0,
    appointments: detail?._count?.appointments ?? tenant._count?.appointments ?? 0,
  };
  const tenantWithCounts: TenantWithCounts = { ...tenant, _count: counts };

  const status = STATUS_CONFIG[tenant.status];
  const plan = PLAN_CONFIG[tenant.plan];
  const planCfg = getPlanConfig(tenant.plan, planConfigs);
  const [primaryAction, ...otherActions] = getStatusActions(tenant.status);
  const portalUrl = `${window.location.origin}/${tenant.slug}`;
  const wa = tenant.phone ? whatsappLink(tenant.phone) : null;
  const whatsappConfigured = !!(tenant.whatsappApiUrl && tenant.whatsappInstance && tenant.whatsappApiKey);
  const stats = detail?.appointmentStats;
  const mrrShare = tenant.status !== 'suspended' && metrics && metrics.revenue.mrr > 0
    ? (tenant.monthlyPrice / metrics.revenue.mrr) * 100
    : null;

  const openStatus = (action: StatusAction) => setStatusTarget({ tenant: tenantWithCounts, action });

  const copyPortal = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast({ title: 'Link do portal copiado', description: portalUrl });
    } catch {
      toast({ title: 'Não foi possível copiar o link', variant: 'error' });
    }
  };

  const periods = [
    { label: 'Hoje', stat: stats?.today },
    { label: 'Este mês', stat: stats?.month },
    { label: 'Este ano', stat: stats?.year },
  ];

  return (
    <div className="space-y-5">
      {/* ── Navegação e cabeçalho ─────────────────────────────────────────── */}
      <nav aria-label="Você está em" className="text-sm text-muted-foreground">
        <Link to="/super/tenants" className="hover:text-foreground hover:underline">Tenants</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-foreground">{tenant.name}</span>
      </nav>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-center gap-4">
          <TenantAvatar name={tenant.name} logoUrl={tenant.logoUrl} primaryColor={tenant.primaryColor} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={plan.variant} className="gap-1"><plan.Icon className="h-3 w-3" aria-hidden="true" />{plan.label}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono">/{tenant.slug}</span>
              <span>Cliente {timeAgo(tenant.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir portal</a>
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil /> Editar</Button>
          <Button
            variant={primaryAction.destructive ? 'outline' : 'default'}
            className={primaryAction.destructive ? 'border-destructive/40 text-destructive hover:text-destructive' : ''}
            onClick={() => openStatus(primaryAction)}
          >
            <primaryAction.Icon /> {primaryAction.label}
          </Button>
          <TenantActionsMenu
            tenant={tenant}
            statusActions={otherActions}
            showDetails={false}
            showPortal={false}
            onStatus={openStatus}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>
      </div>

      {tenant.status !== 'active' && (
        <div
          role="status"
          className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
            tenant.status === 'suspended'
              ? 'border-destructive/40 bg-destructive/5'
              : 'border-yellow-500/40 bg-yellow-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`mt-0.5 h-5 w-5 shrink-0 ${tenant.status === 'suspended' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'}`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">
                {tenant.status === 'suspended' ? 'Este tenant está suspenso' : 'Este tenant está em período de teste (trial)'}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenant.status === 'suspended'
                  ? 'O portal do cliente e o login do administrador e dos profissionais estão bloqueados.'
                  : 'Ative o tenant quando o teste terminar para tirá-lo do modo trial.'}
              </p>
            </div>
          </div>
          {tenant.status === 'suspended' && (
            <Button size="sm" onClick={() => openStatus(primaryAction)}>{primaryAction.label}</Button>
          )}
          {tenant.status === 'trial' && (
            <Button size="sm" onClick={() => openStatus(primaryAction)}>{primaryAction.label}</Button>
          )}
        </div>
      )}

      {/* ── Abas ─────────────────────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onValueChange={value => setParams(prev => {
          const next = new URLSearchParams(prev);
          if (value === 'overview') next.delete('tab'); else next.set('tab', value);
          return next;
        }, { replace: true })}
      >
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="team">Equipe e serviços</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Visão geral */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={Users} label="Profissionais" value={counts.professionals} />
            <StatTile icon={Scissors} label="Serviços" value={counts.services} />
            <StatTile icon={UserCheck} label="Clientes" value={counts.clients} />
            <StatTile icon={Calendar} label="Agendamentos (total)" value={counts.appointments} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <SectionTitle icon={Calendar}>Movimento</SectionTitle>
                <CardContent>
                  {detailLoading ? (
                    <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
                  ) : !stats ? (
                    <DetailUnavailable message={detailError} onRetry={retry} />
                  ) : (
                    <ul className="divide-y">
                      {periods.map(({ label, stat }) => (
                        <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-right">
                            <span className="font-semibold tabular-nums">{stat?.count ?? 0}</span> agendamentos
                            <span className="ml-3 font-semibold tabular-nums text-primary">{formatCurrency(stat?.revenue ?? 0)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    A contagem inclui todos os status; a receita considera apenas agendamentos concluídos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <SectionTitle icon={Building2}>Uso do plano {plan.label}</SectionTitle>
                <CardContent className="space-y-3">
                  {planCfg ? (
                    <>
                      <PlanUsageBar label="Profissionais" usage={getUsage(counts.professionals, planCfg.maxProfessionals)} />
                      <PlanUsageBar label="Serviços" usage={getUsage(counts.services, planCfg.maxServices)} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Limites do plano indisponíveis.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <SectionTitle icon={User}>Informações</SectionTitle>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow icon={User} label="Responsável">{tenant.ownerName}</InfoRow>
                  <InfoRow icon={Mail} label="E-mail do admin">
                    <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">{tenant.email}</a>
                  </InfoRow>
                  <InfoRow icon={Phone} label="Telefone">
                    {tenant.phone ? (
                      <span className="flex flex-wrap items-center gap-x-3">
                        <a href={`tel:${tenant.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">{tenant.phone}</a>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <MessageCircle className="h-3 w-3" aria-hidden="true" /> WhatsApp
                          </a>
                        )}
                      </span>
                    ) : '—'}
                  </InfoRow>
                  <InfoRow icon={MapPin} label="Endereço">{tenant.address || '—'}</InfoRow>
                  <InfoRow icon={Globe} label="Portal do cliente">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs">{portalUrl}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyPortal()}
                        aria-label="Copiar link do portal" title="Copiar link">
                        <Copy />
                      </Button>
                    </span>
                    <Badge variant={tenant.isOpen ? 'success' : 'outline'} className="mt-1">
                      {tenant.isOpen ? 'Aceitando agendamentos' : 'Fechado para agendamentos'}
                    </Badge>
                  </InfoRow>
                  <InfoRow icon={Calendar} label="Cadastrado em">
                    {format(parseISO(tenant.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {tenant.updatedAt && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        Última alteração {timeAgo(tenant.updatedAt)}
                      </span>
                    )}
                  </InfoRow>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipe e serviços */}
        <TabsContent value="team" className="mt-4">
          {detailLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64" /><Skeleton className="h-64" />
            </div>
          ) : !detail ? (
            <DetailUnavailable message={detailError} onRetry={retry} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <SectionTitle icon={Users}>Profissionais ({detail.professionals.length})</SectionTitle>
                <CardContent>
                  {detail.professionals.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Nenhum profissional cadastrado.</p>
                  ) : (
                    <ul className="divide-y">
                      {detail.professionals.map(p => (
                        <li key={p.id} className="flex items-center gap-3 py-2.5">
                          <TenantAvatar name={p.name} primaryColor={tenant.primaryColor} size="sm" className="rounded-full" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.specialty || 'Sem especialidade'}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {p._count?.appointments ?? 0} agend.
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <SectionTitle icon={Scissors}>Serviços ({detail.services.length})</SectionTitle>
                <CardContent>
                  {detail.services.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
                  ) : (
                    <ul className="divide-y">
                      {detail.services.map(s => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.duration} min{s.category ? ` · ${s.category}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile icon={DollarSign} label="Mensalidade" value={formatCurrency(tenant.monthlyPrice)} />
            <StatTile
              icon={Building2}
              label="Participação no MRR"
              value={mrrShare === null ? '—' : `${mrrShare.toFixed(1).replace('.', ',')}%`}
            />
            <StatTile icon={Calendar} label="Receita gerada (ano)" value={stats ? formatCurrency(stats.year.revenue) : '—'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle icon={DollarSign}>Plano e cobrança</SectionTitle>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow icon={Building2} label="Plano">
                    {planCfg?.displayName ?? plan.label}
                  </InfoRow>
                  <InfoRow icon={DollarSign} label="Preço padrão do plano">
                    {planCfg ? formatCurrency(planCfg.defaultPrice) : '—'}
                    {planCfg && planCfg.defaultPrice !== tenant.monthlyPrice && (
                      <Badge variant="info" className="ml-2">Mensalidade personalizada</Badge>
                    )}
                  </InfoRow>
                  <InfoRow icon={Clock} label="Conta no MRR">
                    {tenant.status === 'suspended' ? 'Não (tenant suspenso)' : 'Sim'}
                  </InfoRow>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <SectionTitle icon={Calendar}>Receita gerada pelos agendamentos</SectionTitle>
              <CardContent>
                {detailLoading ? (
                  <Skeleton className="h-32" />
                ) : !stats ? (
                  <DetailUnavailable message={detailError} onRetry={retry} />
                ) : (
                  <ul className="divide-y">
                    {periods.map(({ label, stat }) => (
                      <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(stat?.revenue ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Soma dos agendamentos concluídos. Não é o valor cobrado do tenant.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle icon={Globe}>Portal e marca</SectionTitle>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow icon={Globe} label="Cor principal do portal"><Swatch color={tenant.primaryColor} /></InfoRow>
                  {tenant.adminColor && (
                    <InfoRow icon={Globe} label="Cor do painel do admin"><Swatch color={tenant.adminColor} /></InfoRow>
                  )}
                  <InfoRow icon={Globe} label="Situação do portal">{tenant.isOpen ? 'Aberto' : 'Fechado'}</InfoRow>
                  <InfoRow icon={Clock} label="Antecedência mínima para agendar">{formatMinutes(tenant.minAdvanceMinutes)}</InfoRow>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <SectionTitle icon={MessageCircle}>Integrações</SectionTitle>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow icon={MessageCircle} label="WhatsApp (Evolution API)">
                    <Badge variant={whatsappConfigured ? 'success' : 'outline'}>
                      {whatsappConfigured ? 'Configurado' : 'Não configurado'}
                    </Badge>
                    {tenant.whatsappInstance && (
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        Instância: {tenant.whatsappInstance}
                      </span>
                    )}
                  </InfoRow>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card className="border-destructive/40">
            <SectionTitle icon={Trash2}>Zona de perigo</SectionTitle>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Excluir remove permanentemente o tenant, profissionais, serviços, clientes e agendamentos.
                Se você só quer bloquear o acesso, use “Suspender”.
              </p>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 /> Excluir tenant</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TenantFormDialog open={editOpen} onOpenChange={setEditOpen} tenant={tenantWithCounts} />
      <StatusConfirmDialog target={statusTarget} onClose={() => setStatusTarget(null)} />
      <DeleteTenantDialog
        tenant={deleteOpen ? tenantWithCounts : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/super/tenants', { replace: true })}
      />
    </div>
  );
}
