import { CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDayBR } from '@/lib/painel';
import type { DashboardSummary } from '@/services/dashboard.service';
import { CardError } from './SummaryState';

interface Props {
  trial?: DashboardSummary['trial'];
  planName?: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Teste grátis: em andamento, último dia, expirado ou (plano pago) só o plano, sem barra. */
export function TrialCard({ trial, planName, loading, error, onRetry }: Props) {
  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>;
  if (error || !trial) return <Card><CardContent className="p-2"><CardError onRetry={onRetry} /></CardContent></Card>;
  if (trial.state === 'none') return null;

  if (trial.state === 'paid') {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden />
          <span>Plano ativo{planName ? <>: <strong className="capitalize">{planName}</strong></> : null}</span>
        </CardContent>
      </Card>
    );
  }

  const expired = trial.state === 'expired';
  const lastDay = trial.state === 'last_day';
  const percent = Math.round((trial.usedDays / trial.totalDays) * 100);
  const Icon = expired || lastDay ? AlertTriangle : CalendarClock;
  const tone = expired
    ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
    : lastDay ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : '';
  const iconTone = expired ? 'text-red-600 dark:text-red-400' : lastDay ? 'text-amber-600 dark:text-amber-400' : 'text-primary';

  const title = expired ? 'Seu teste grátis terminou' : lastDay ? 'Último dia do seu teste grátis' : 'Teste grátis';
  const detail = expired
    ? 'Escolha um plano para continuar usando o Nimbo sem interrupções.'
    : lastDay ? 'Seu teste termina hoje.' : `Restam ${trial.remainingDays} dias de teste.`;

  return (
    <Card className={tone}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <p className="shrink-0 text-sm font-medium">{trial.usedDays} de {trial.totalDays} dias</p>
        </div>
        <Progress
          value={percent}
          aria-label="Dias de teste usados"
          aria-valuetext={`${trial.usedDays} de ${trial.totalDays} dias usados`}
          className="h-2"
          indicatorClassName={expired ? 'bg-red-600' : lastDay ? 'bg-amber-500' : undefined}
        />
        {trial.endsAt && (
          <p className="text-xs text-muted-foreground">
            {expired ? 'Terminou em' : 'Termina em'} <strong>{formatDayBR(trial.endsAt)}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
