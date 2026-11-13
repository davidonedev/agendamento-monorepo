import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Erro de um card do resumo, com ação de tentar de novo. */
export function CardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-muted-foreground">Não foi possível carregar estes dados.</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Tentar novamente
      </Button>
    </div>
  );
}

export function LinesSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );
}
