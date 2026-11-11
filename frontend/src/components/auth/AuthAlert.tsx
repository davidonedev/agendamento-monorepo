import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Alerta de erro (role="alert") ou sucesso (role="status"). */
export function AuthAlert({ kind, children, className }: { kind: 'error' | 'success'; children: React.ReactNode; className?: string }) {
  const error = kind === 'error';
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium',
        error ? 'border-lp-danger/30 bg-lp-danger-soft text-lp-danger' : 'border-lp-success/40 bg-lp-success-soft text-lp-success-ink',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
