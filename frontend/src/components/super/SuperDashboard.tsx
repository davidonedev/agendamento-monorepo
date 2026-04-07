import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, DollarSign, CalendarCheck, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/context/PlatformContext';
import { formatCurrency } from '@/lib/utils';

const STATUS_CONFIG = {
  active:    { label: 'Ativo',      variant: 'success'     as const },
  trial:     { label: 'Trial',      variant: 'warning'     as const },
  suspended: { label: 'Suspenso',   variant: 'destructive' as const },
};

const PLAN_CONFIG = {
  basic:      { label: 'Basic',      variant: 'outline'    as const },
  pro:        { label: 'Pro',        variant: 'default'    as const },
  enterprise: { label: 'Enterprise', variant: 'secondary'  as const },
};

export default function SuperDashboard() {
  const { tenants, metrics: apiMetrics, allData } = usePlatform();
  const navigate = useNavigate();
  const now = new Date();

  // Métricas consolidadas vindas da API
  const metrics = useMemo(() => {
    const activeTenants  = tenants.filter(t => t.status === 'active').length;
    const mrr            = tenants.filter(t => t.status === 'active').reduce((s, t) => s + t.monthlyPrice, 0);
    const totalClients   = apiMetrics?.totals.clients ?? 0;
    const completedMonth = apiMetrics?.totals.completedAppointments ?? 0;
    const revenueMonth   = apiMetrics?.revenue.total ?? 0;
    const monthAppts     = apiMetrics?.totals.appointments ?? 0;
    return { activeTenants, mrr, monthAppts, completedMonth, revenueMonth, totalClients };
  }, [tenants, apiMetrics]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Visão Geral da Plataforma</h2>
        <p className="text-muted-foreground text-sm">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.activeTenants}</p>
            <p className="text-xs text-muted-foreground">de {allData.length} totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</p>
            <p className="text-xs text-muted-foreground">receita mensal recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agend. no Mês</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.monthAppts}</p>
            <p className="text-xs text-muted-foreground">{metrics.completedMonth} concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.revenueMonth)}</p>
            <p className="text-xs text-muted-foreground">{metrics.totalClients} clientes na plataforma</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Todos os Tenants</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/super/tenants')}>
            Ver todos <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenants.map(tenant => {
              const sc = STATUS_CONFIG[tenant.status];
              const pc = PLAN_CONFIG[tenant.plan];
              return (
                <div key={tenant.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {tenant.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{tenant.name}</p>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      <Badge variant={pc.variant}>{pc.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">/{tenant.slug} · {tenant.ownerName}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold">{formatCurrency(tenant.monthlyPrice)}/mês</p>
                    <p className="text-xs text-muted-foreground">{tenant._count?.appointments ?? 0} agend.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/super/tenants/${tenant.id}`)}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {tenants.some(t => t.status === 'suspended') && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-sm text-destructive">Tenants Suspensos</p>
              <p className="text-xs text-muted-foreground">
                {tenants.filter(t => t.status === 'suspended').map(t => t.name).join(', ')} — acesse a aba Tenants para reativar.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="ml-auto shrink-0" onClick={() => navigate('/super/tenants')}>
              Gerenciar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
