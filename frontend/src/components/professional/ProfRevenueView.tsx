import { useMemo, useState } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfessional } from '@/context/ProfessionalContext';
import { formatCurrency } from '@/lib/utils';
import type { RevenueRange } from '@/types';

const RANGE_LABELS: Record<RevenueRange, string> = {
  day: 'Hoje', week: 'Esta Semana', month: 'Este Mês', year: 'Este Ano', custom: 'Personalizado',
};

export default function ProfRevenueView() {
  const { appointments, services, professional, tenant } = useProfessional();
  const accentColor = tenant.adminColor ?? tenant.primaryColor;

  const now = new Date();
  const [range, setRange] = useState<RevenueRange>('month');
  const [customStart, setCustomStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customEnd,   setCustomEnd]   = useState(format(now, 'yyyy-MM-dd'));

  const interval = useMemo(() => {
    if (range === 'custom') {
      const s = parseISO(customStart), e = parseISO(customEnd);
      return { start: startOfDay(s), end: endOfDay(e > s ? e : s) };
    }
    switch (range) {
      case 'day':  return { start: startOfDay(now),  end: endOfDay(now) };
      case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'year': return { start: startOfYear(now),  end: endOfYear(now) };
      default:     return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [range, customStart, customEnd]);

  const completedInRange = useMemo(() =>
    appointments.filter(a => {
      if (a.status !== 'completed') return false;
      try { return isWithinInterval(parseISO(a.date), interval); } catch { return false; }
    }),
  [appointments, interval]);

  const totalRevenue = completedInRange.reduce((s, a) => s + a.price, 0);
  const totalCount   = completedInRange.length;
  const avgTicket    = totalCount > 0 ? totalRevenue / totalCount : 0;

  const spanDays  = differenceInDays(interval.end, interval.start) + 1;
  const useMonths = range === 'year' || (range === 'custom' && spanDays > 90);

  const chartData = useMemo(() => {
    if (useMonths) {
      return eachMonthOfInterval(interval).map(month => ({
        label: format(month, 'MMM/yy', { locale: ptBR }),
        revenue: completedInRange.filter(a => a.date.startsWith(format(month, 'yyyy-MM'))).reduce((s, a) => s + a.price, 0),
      }));
    }
    return eachDayOfInterval(interval).map(day => ({
      label: format(day, range === 'week' ? 'EEE' : 'd/MM', { locale: ptBR }),
      revenue: completedInRange.filter(a => a.date === format(day, 'yyyy-MM-dd')).reduce((s, a) => s + a.price, 0),
    }));
  }, [useMonths, interval, completedInRange, range]);

  const byService = services.map(s => ({
    name:  s.name,
    value: completedInRange.filter(a => a.serviceId === s.id).reduce((sum, a) => sum + a.price, 0),
    count: completedInRange.filter(a => a.serviceId === s.id).length,
  })).filter(s => s.value > 0);

  const periodLabel = range === 'custom'
    ? `${format(interval.start, "d 'de' MMM", { locale: ptBR })} → ${format(interval.end, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    : RANGE_LABELS[range];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meu Faturamento</h2>
          <p className="text-muted-foreground text-sm">{professional.name} · {periodLabel}</p>
        </div>
        <div className="flex gap-1 border rounded-md overflow-hidden w-fit flex-wrap">
          {(['day','week','month','year','custom'] as RevenueRange[]).map(r => (
            <Button key={r} variant={range === r ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setRange(r)}>
              {r === 'custom' ? <><CalendarRange className="h-3.5 w-3.5 mr-1" />Período</> : RANGE_LABELS[r]}
            </Button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Data inicial</Label>
                <Input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} className="w-44" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data final</Label>
                <Input type="date" value={customEnd} min={customStart} max={format(now, 'yyyy-MM-dd')} onChange={e => setCustomEnd(e.target.value)} className="w-44" />
              </div>
              <p className="text-xs text-muted-foreground self-end pb-2">
                {spanDays} {spanDays === 1 ? 'dia' : 'dias'} · {useMonths ? 'por mês' : 'por dia'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Receita no Período', value: formatCurrency(totalRevenue) },
          { label: 'Atendimentos',       value: totalCount.toString() },
          { label: 'Ticket Médio',       value: formatCurrency(avgTicket) },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolução da Receita</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            {useMonths ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill={accentColor} radius={[4,4,0,0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs fill-muted-foreground" interval="preserveStartEnd" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke={accentColor} strokeWidth={2} dot={spanDays <= 14} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service breakdown */}
      {byService.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Por Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byService.map(s => {
              const pct = totalRevenue > 0 ? (s.value / totalRevenue) * 100 : 0;
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.name}</span>
                    <span className="font-medium">{formatCurrency(s.value)} ({s.count} atend.)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
