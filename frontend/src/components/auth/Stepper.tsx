import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Indicador de etapas: concluída (verde + check), atual (azul) e futura (neutra). */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Etapas do cadastro" className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                  done && 'bg-lp-success text-white',
                  active && 'bg-lp-primary text-white',
                  !done && !active && 'border border-lp-line bg-lp-alt text-lp-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('text-sm font-bold', active ? 'text-lp-black' : 'text-lp-muted')}>
                {label}
                {done && <span className="sr-only"> (concluída)</span>}
              </span>
            </span>
            {i < steps.length - 1 && <span aria-hidden className={cn('h-0.5 w-6 rounded-full sm:w-12', done ? 'bg-lp-success' : 'bg-lp-line')} />}
          </li>
        );
      })}
    </ol>
  );
}
