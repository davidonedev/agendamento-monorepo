import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/context/PlatformContext';
import { formatCurrency } from '@/lib/utils';
import type { RevenueRange } from '@/types';

const COLORS = ['#7c3aed', '#d97706', '#16a34a', '#2563eb', '#dc2626'];

export default function PlatformMetricsView() {
  const { allData } = usePlatform();
  const [range, setRange] = useState<RevenueRange>('month');
  const now = new Date();

  const interval = useMemo(() => {
    switch (range) {
      case 'day':   return { start: startOfDay(now),  end: endOfDay(now)  };
      case 'week':  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'year':  return { start: startOfYear(now),  end: endOfYear(now)  };
      default:      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [range]);

  const allAppts = allData.flatMap(td => td.appointments);

  const completedInRange = useMemo(() =>
    allAppts.filter(a => {
      if (a.status !== 'completed') return false;
      try { return isWithinInterval(parseISO(a.date), interval); } catch { return false; }
    }),
  [allAppts, interval]);

  const totalRevenue = completedInRange.reduce((s, a) => s + a.price, 0);

  // Time-series
  const chartData = useMemo(() => {
    if (range === 'year') {
      return eachMonthOfInterval(interval).map(month => ({
        label: format(month, 'MMM', { locale: ptBR }),
        revenue: completedInRange.filter(a => a.date.startsWith(format(month, 'yyyy-MM'))).reduce((s, a) => s + a.price, 0),
      }));
    }
    return eachDayOfInterval(interval).map(day => ({
      label: format(day, range === 'week' ? 'EEE' : 'd', { locale: ptBR }),
      revenue: completedInRange.filter(a => a.date === format(day, 'yyyy-MM-dd')).reduce((s, a) => s + a.price, 0),
    }));
  }, [range, completedInRange, interval]);

  // By tenant pie
  const byTenant = allData.map(td => ({
    name: td.tenant.name,
    value: completedInRange.filter(a => a.tenantId === td.tenant.id).reduce((s, a) => s + a.price, 0),
  })).filter(t => t.value > 0);

  const rangeLabels: Record<RevenueRange, string> = { day: 'Hoje', week: 'Esta Semana', month: 'Este Mês', year: 'Este Ano', custom: 'Personalizado' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Métricas da Plataforma</h2>
          <p className="text-muted-foreground text-sm">Dados consolidados de todos os tenants</p>
        </div>
        <div className="flex gap-1 border rounded-md overflow-hidden w-fit">
          {(['day','week','month','year'] as RevenueRange[]).map(r => (
            <Button key={r} variant={range === r ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setRange(r)}>
              {rangeLabels[r]}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita Total',     value: formatCurrency(totalRevenue) },
          { label: 'Atendimentos',      value: completedInRange.length.toString() },
          { label: 'Tenants Ativos',    value: allData.filter(td => td.tenant.status === 'active').length.toString() },
          { label: 'MRR',               value: formatCurrency(allData.filter(td => td.tenant.status === 'active').reduce((s, td) => s + td.tenant.monthlyPrice, 0)) },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Receita Consolidada — {rangeLabels[range]}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By tenant */}
        <Card>
          <CardHeader><CardTitle className="text-base">Receita por Tenant</CardTitle></CardHeader>
          <CardContent>
            {byTenant.length === 0
              ? <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byTenant} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {byTenant.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        {/* Per-tenant breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Desempenho por Tenant</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {allData.map((td, i) => {
              const revenue = completedInRange.filter(a => a.tenantId === td.tenant.id).reduce((s, a) => s + a.price, 0);
              const count   = completedInRange.filter(a => a.tenantId === td.tenant.id).length;
              const pct     = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
              return (
                <div key={td.tenant.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{td.tenant.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(revenue)} · {count} atend.</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
