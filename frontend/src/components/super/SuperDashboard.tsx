import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2, DollarSign, CalendarCheck, TrendingUp,
  AlertTriangle, Users, UserMinus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/context/PlatformContext';
import { mrrHistory, appointmentsHistory } from './dashboard.mock';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'hsl(var(--card-foreground))',
};

// Cor primária da marca (roxa), igual em ambos os temas
const PRIMARY = 'hsl(262 83% 58%)';

const STATUS_COLORS: Record<string, string> = {
  active: 'hsl(142 71% 45%)',
  trial: 'hsl(38 92% 50%)',
  suspended: 'hsl(0 84% 60%)',
};

const PLAN_COLORS: Record<string, string> = {
  basic: 'hsl(240 5% 64%)',
  pro: PRIMARY,
  enterprise: 'hsl(217 91% 60%)',
};

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mb-3" />
        <div className="h-8 w-3/4 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="bg-muted animate-pulse rounded-md w-full" style={{ height }} />;
}

function EmptyChart() {
  return (
    <p className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 220 }}>
      Sem dados no período
    </p>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function SuperDashboard() {
  const { tenants, metrics: apiMetrics, loading, error } = usePlatform();
  const navigate = useNavigate();
  const now = new Date();

  const kpis = useMemo(() => {
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
    const trialTenants = tenants.filter(t => t.status === 'trial').length;
    const mrr = tenants.filter(t => t.status === 'active').reduce((s, t) => s + t.monthlyPrice, 0);
    const totalClients = apiMetrics?.totals.clients ?? 0;
    const completedMonth = apiMetrics?.totals.completedAppointments ?? 0;
    const revenueMonth = apiMetrics?.revenue.total ?? 0;
    const monthAppts = apiMetrics?.totals.appointments ?? 0;
    const avgTicket = activeTenants > 0 ? mrr / activeTenants : 0;
    return {
      activeTenants, suspendedTenants, trialTenants,
      mrr, monthAppts, completedMonth, revenueMonth, totalClients, avgTicket,
    };
  }, [tenants, apiMetrics]);

  const statusData = useMemo(() => {
    const s = apiMetrics?.tenantsByStatus;
    if (!s) return [];
    const labels: Record<string, string> = { active: 'Ativo', trial: 'Trial', suspended: 'Suspenso' };
    return (Object.entries(s) as [string, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: labels[k] ?? k, value: v, color: STATUS_COLORS[k] ?? PRIMARY }));
  }, [apiMetrics]);

  const planData = useMemo(() => {
    const p = apiMetrics?.tenantsByPlan;
    if (!p) return [];
    return (Object.entries(p) as [string, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: v,
        color: PLAN_COLORS[k] ?? PRIMARY,
      }));
  }, [apiMetrics]);

  const topTenants = useMemo(() =>
    [...tenants]
      .sort((a, b) => (b._count?.appointments ?? 0) - (a._count?.appointments ?? 0))
      .slice(0, 5)
      .map(t => ({ name: t.name, agendamentos: t._count?.appointments ?? 0 })),
  [tenants]);

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Visão Geral da Plataforma</h2>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Visão Geral da Plataforma</h2>
        <p className="text-muted-foreground text-sm">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Tenants Ativos" value={String(kpis.activeTenants)} subtitle={`de ${tenants.length} totais`} icon={Building2} />
            <StatCard title="MRR" value={fmt(kpis.mrr)} subtitle="receita mensal recorrente" icon={DollarSign} />
            <StatCard title="Agend. no Mês" value={String(kpis.monthAppts)} subtitle={`${kpis.completedMonth} concluídos`} icon={CalendarCheck} />
            <StatCard title="Receita Gerada" value={fmt(kpis.revenueMonth)} subtitle={`${kpis.totalClients} clientes na plataforma`} icon={TrendingUp} />
          </>
        )}
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Churn / Suspensos" value={String(kpis.suspendedTenants)} subtitle={`${kpis.trialTenants} em trial`} icon={UserMinus} />
            <StatCard title="Ticket Médio" value={fmt(kpis.avgTicket)} subtitle="por tenant ativo / mês" icon={DollarSign} />
            <StatCard title="Total de Clientes" value={String(kpis.totalClients)} subtitle="cadastrados na plataforma" icon={Users} />
          </>
        )}
      </div>

      {/* MRR histórico — largura total */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MRR — Últimos 6 Meses</CardTitle>
          <CardDescription>Receita mensal recorrente histórica · dados mock</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartSkeleton height={260} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={mrrHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v ?? 0)), 'MRR']} />
                <Area type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2} fill="url(#gradMrr)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Linha 2: Agendamentos + Tenants por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendamentos por Mês</CardTitle>
            <CardDescription>Volume total nos últimos 6 meses · dados mock</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton height={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={appointmentsHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Agendamentos" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenants por Status</CardTitle>
            <CardDescription>Distribuição atual de status dos tenants</CardDescription>
          </CardHeader>
          <CardContent aria-label="Gráfico de distribuição de tenants por status">
            {loading ? <ChartSkeleton height={220} /> : statusData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Linha 3: Tenants por Plano + Top Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenants por Plano</CardTitle>
            <CardDescription>Distribuição por tipo de plano contratado</CardDescription>
          </CardHeader>
          <CardContent aria-label="Gráfico de distribuição de tenants por plano">
            {loading ? <ChartSkeleton height={220} /> : planData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={planData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Tenants</CardTitle>
            <CardDescription>Por número total de agendamentos</CardDescription>
          </CardHeader>
          <CardContent aria-label="Gráfico dos top tenants por agendamentos">
            {loading ? <ChartSkeleton height={220} /> : topTenants.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topTenants} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--border))"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="agendamentos" name="Agendamentos" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Alerta de tenants suspensos */}
      {!loading && tenants.some(t => t.status === 'suspended') && (
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
