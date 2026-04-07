import { useState, useMemo } from 'react';
import {
  format, parseISO, isWithinInterval,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency } from '@/lib/utils';
import type { RevenueRange } from '@/types';

const PIE_PALETTE = ['#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#db2777'];

const RANGE_LABELS: Record<RevenueRange, string> = {
  day:    'Hoje',
  week:   'Esta Semana',
  month:  'Este Mês',
  year:   'Este Ano',
  custom: 'Personalizado',
};

export default function RevenueView() {
  const { appointments, services, professionals, tenant } = useTenant();
  const adminColor = tenant.adminColor ?? tenant.primaryColor;
  const COLORS = [adminColor, ...PIE_PALETTE];

  const now = new Date();
  const [range, setRange] = useState<RevenueRange>('month');

  // Custom range defaults: last 30 days
  const [customStart, setCustomStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customEnd,   setCustomEnd]   = useState(format(now, 'yyyy-MM-dd'));

  // ── Interval ────────────────────────────────────────────────────────────────
  const interval = useMemo(() => {
    if (range === 'custom') {
      const s = parseISO(customStart);
      const e = parseISO(customEnd);
      return { start: startOfDay(s), end: endOfDay(e > s ? e : s) };
    }
    switch (range) {
      case 'day':   return { start: startOfDay(now),  end: endOfDay(now)  };
      case 'week':  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':  return { start: startOfYear(now),  end: endOfYear(now)  };
    }
  }, [range, customStart, customEnd]);

  // ── Filtered appointments ───────────────────────────────────────────────────
  const completedInRange = useMemo(() =>
    appointments.filter(a => {
      if (a.status !== 'completed') return false;
      try { return isWithinInterval(parseISO(a.date), interval); } catch { return false; }
    }),
  [appointments, interval]);

  const cancelCount = useMemo(() =>
    appointments.filter(a => {
      if (a.status !== 'cancelled') return false;
      try { return isWithinInterval(parseISO(a.date), interval); } catch { return false; }
    }).length,
  [appointments, interval]);

  const totalRevenue = completedInRange.reduce((s, a) => s + a.price, 0);
  const totalCount   = completedInRange.length;
  const avgTicket    = totalCount > 0 ? totalRevenue / totalCount : 0;

  // ── Chart grouping strategy ─────────────────────────────────────────────────
  // day/week → line by day; month → line by day; year → bar by month
  // custom → ≤31d: by day  |  ≤90d: by week  |  >90d: by month
  const spanDays  = differenceInDays(interval.end, interval.start) + 1;
  const useMonths = range === 'year' || (range === 'custom' && spanDays > 90);
  const useWeeks  = range === 'custom' && spanDays > 31 && spanDays <= 90;

  const chartData = useMemo(() => {
    if (useMonths) {
      return eachMonthOfInterval(interval).map(month => ({
        label: format(month, 'MMM/yy', { locale: ptBR }),
        revenue: completedInRange
          .filter(a => a.date.startsWith(format(month, 'yyyy-MM')))
          .reduce((s, a) => s + a.price, 0),
      }));
    }
    if (useWeeks) {
      return eachWeekOfInterval(interval, { weekStartsOn: 1 }).map(week => ({
        label: format(week, "d/MM", { locale: ptBR }),
        revenue: completedInRange.filter(a => {
          const d = parseISO(a.date);
          const wEnd = new Date(week); wEnd.setDate(wEnd.getDate() + 6);
          return d >= week && d <= wEnd;
        }).reduce((s, a) => s + a.price, 0),
      }));
    }
    // by day
    return eachDayOfInterval(interval).map(day => ({
      label: format(day, range === 'week' ? 'EEE' : 'd/MM', { locale: ptBR }),
      revenue: completedInRange
        .filter(a => a.date === format(day, 'yyyy-MM-dd'))
        .reduce((s, a) => s + a.price, 0),
    }));
  }, [useMonths, useWeeks, interval, completedInRange, range]);

  const byService = services.map(s => ({
    name:  s.name,
    value: completedInRange.filter(a => a.serviceId === s.id).reduce((sum, a) => sum + a.price, 0),
    count: completedInRange.filter(a => a.serviceId === s.id).length,
  })).filter(s => s.value > 0);

  const byProfessional = professionals.map(p => ({
    name:    p.name.split(' ')[0],
    revenue: completedInRange.filter(a => a.professionalId === p.id).reduce((sum, a) => sum + a.price, 0),
  }));

  // ── Period label ────────────────────────────────────────────────────────────
  const periodLabel = range === 'custom'
    ? `${format(interval.start, "d 'de' MMM", { locale: ptBR })} → ${format(interval.end, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    : RANGE_LABELS[range];

  return (
    <div className="space-y-6">

      {/* Header + range selector */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Faturamento</h2>
            <p className="text-muted-foreground text-sm">{periodLabel}</p>
          </div>
          <div className="flex gap-1 border rounded-md overflow-hidden w-fit flex-wrap">
            {(['day','week','month','year','custom'] as RevenueRange[]).map(r => (
              <Button
                key={r}
                variant={range === r ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setRange(r)}
              >
                {r === 'custom' ? <><CalendarRange className="h-3.5 w-3.5 mr-1" />Período</> : RANGE_LABELS[r]}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs */}
        {range === 'custom' && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Data inicial</Label>
                  <Input
                    type="date"
                    value={customStart}
                    max={customEnd}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data final</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={format(now, 'yyyy-MM-dd')}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="text-xs text-muted-foreground self-center sm:self-end pb-2">
                  {spanDays} {spanDays === 1 ? 'dia' : 'dias'} selecionado{spanDays !== 1 ? 's' : ''}
                  {useWeeks ? ' · agrupado por semana' : useMonths ? ' · agrupado por mês' : ' · agrupado por dia'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita Total',  value: formatCurrency(totalRevenue) },
          { label: 'Atendimentos',   value: totalCount.toString() },
          { label: 'Ticket Médio',   value: formatCurrency(avgTicket) },
          { label: 'Cancelamentos',  value: cancelCount.toString(), className: 'text-destructive' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.className ?? ''}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evolution chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolução da Receita</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            {useMonths ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs fill-muted-foreground" interval="preserveStartEnd" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={spanDays <= 14} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* By service + by professional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Receita por Serviço</CardTitle></CardHeader>
          <CardContent>
            {byService.length === 0
              ? <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byService} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {byService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receita por Profissional</CardTitle></CardHeader>
          <CardContent>
            {byProfessional.every(p => p.revenue === 0)
              ? <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byProfessional} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                    <YAxis type="category" dataKey="name" className="text-xs fill-muted-foreground" width={60} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Service breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalhamento por Serviço</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {services.map(s => {
            const count   = completedInRange.filter(a => a.serviceId === s.id).length;
            const revenue = completedInRange.filter(a => a.serviceId === s.id).reduce((sum, a) => sum + a.price, 0);
            const pct     = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            return (
              <div key={s.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.name}</span>
                  <span className="font-medium">{formatCurrency(revenue)} ({count} atend.)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
