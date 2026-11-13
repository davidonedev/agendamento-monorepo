import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dayNumber, weekdayShort } from '@/lib/painel';
import type { DashboardSummary } from '@/services/dashboard.service';
import { CardError } from './SummaryState';

interface Props {
  week?: DashboardSummary['week'];
  today?: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/**
 * Próximos 7 dias (hoje incluído): cada dia é uma "pílula" com dia da semana, número em círculo e uma
 * barra de ocupação proporcional ao dia mais cheio da faixa. A quantidade sempre aparece em texto
 * (a barra e a cor são só reforço visual).
 */
export function WeekStrip({ week, today, loading, error, onRetry }: Props) {
  // TODO: abrir a Agenda no dia clicado.
  const handleSelectDay = (isoDay: string) => { void isoDay; };

  const total = week?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const max = Math.max(1, ...(week?.map(d => d.count) ?? [0]));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-lg">Próximos 7 dias</CardTitle>
        {week && <p className="text-sm text-muted-foreground"><strong className="text-foreground">{total}</strong> {total === 1 ? 'agendamento' : 'agendamentos'} na semana</p>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div role="status" aria-label="Carregando" className="flex gap-2">
            {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-28 min-w-[4.25rem] flex-1 rounded-2xl" />)}
          </div>
        ) : error || !week ? (
          <CardError onRetry={onRetry} />
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
            {week.map(day => {
              const isToday = day.date === today;
              const busiest = day.count > 0 && day.count === max;
              const pct = day.count === 0 ? 0 : Math.max(12, Math.round((day.count / max) * 100));
              return (
                <li key={day.date} className="min-w-[4.25rem] flex-1">
                  <button
                    type="button"
                    onClick={() => handleSelectDay(day.date)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={`${weekdayShort(day.date)}, dia ${dayNumber(day.date)}${isToday ? ' (hoje)' : ''}: ${day.count} ${day.count === 1 ? 'agendamento' : 'agendamentos'}`}
                    className={`group flex h-full w-full flex-col items-center gap-2 rounded-2xl border px-2 pb-3 pt-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isToday ? 'border-primary/40 bg-primary/5' : 'bg-card hover:bg-muted/60'}`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{weekdayShort(day.date)}</span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground group-hover:bg-background'}`}>
                      {dayNumber(day.date)}
                    </span>
                    <span aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span className={`block h-full rounded-full ${busiest ? 'bg-primary' : 'bg-primary/40'}`} style={{ width: `${pct}%` }} />
                    </span>
                    <span className={`text-xs leading-tight ${day.count === 0 ? 'text-muted-foreground' : 'font-semibold'}`}>
                      {day.count === 0 ? 'Livre' : <>{day.count} <span className="font-normal text-muted-foreground">agend.</span></>}
                    </span>
                    {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">Hoje</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
