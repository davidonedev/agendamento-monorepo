import { XCircle, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardSummary } from '@/services/dashboard.service';
import { CardError, LinesSkeleton } from './SummaryState';

interface Props {
  data?: DashboardSummary['cancellations'];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

/** Cancelamentos e faltas dos últimos 7 dias, com o detalhamento (o ícone acompanha o texto, não só a cor). */
export function CancellationsCard({ data, loading, error, onRetry }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden />
          Cancelamentos e faltas recentes
          <Badge variant="outline" className="ml-auto text-xs font-normal">últimos 7 dias</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <LinesSkeleton lines={2} /> : error || !data ? <CardError onRetry={onRetry} /> : data.total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum cancelamento ou falta nos últimos 7 dias.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-3xl font-bold">{data.total}</p>
            <ul className="grid grid-cols-2 gap-3">
              <li className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <XCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" aria-hidden />
                <span><strong>{data.cancelled}</strong> {data.cancelled === 1 ? 'cancelado' : 'cancelados'}</span>
              </li>
              <li className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <UserX className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <span><strong>{data.noShow}</strong> {data.noShow === 1 ? 'falta' : 'faltas'}</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
