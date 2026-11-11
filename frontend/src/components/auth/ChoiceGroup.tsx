import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Choice<T extends string> {
  value: T;
  title: string;
  description: string;
  icon: ReactNode;
  items?: string[];
}

/**
 * Cartões selecionáveis (radiogroup acessível): setas movem a seleção, Tab entra/sai do grupo.
 * Estados: normal, hover, selecionado (borda e fundo em lp-primary + check) e foco visível.
 */
export function ChoiceGroup<T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T | null;
  onChange: (value: T) => void;
  options: Choice<T>[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusable = value ? options.findIndex(o => o.value === value) : 0;

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className="grid gap-4 sm:grid-cols-2">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === focusable ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={e => onKeyDown(e, i)}
            className={cn(
              'relative flex flex-col rounded-lp-card border-2 p-6 text-left transition-all duration-300',
              selected ? 'border-lp-primary bg-lp-primary-soft shadow-lp-card' : 'border-lp-line bg-lp-white hover:border-lp-primary hover:shadow-lp-card',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-lp-primary bg-lp-primary text-white' : 'border-lp-line bg-lp-white text-transparent',
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', selected ? 'bg-lp-primary text-white' : 'bg-lp-primary-soft text-lp-primary')} aria-hidden>
              {o.icon}
            </span>
            <span className="mt-4 text-xl font-extrabold leading-tight">{o.title}</span>
            <span className="mt-2 text-sm text-lp-black/70">{o.description}</span>
            {o.items && (
              <ul className="mt-4 space-y-1.5 text-sm text-lp-black/70">
                {o.items.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-px text-xs text-lp-primary" aria-hidden>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}
