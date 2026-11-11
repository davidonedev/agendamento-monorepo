import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  label: string;
  /** Cada filho é um slide. Só o slide ativo ocupa espaço, então a altura acompanha o conteúdo. */
  children: ReactNode[];
  /** Troca automática em ms; pausa com hover/foco e é desligada com prefers-reduced-motion. */
  autoPlayMs?: number;
  onDark?: boolean;
  className?: string;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Carrossel acessível: setas do teclado (← →), botões, pontos e swipe no toque. Sem dependências. */
export default function Carousel({ label, children, autoPlayMs, onDark, className }: CarouselProps) {
  const count = children.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (!autoPlayMs || paused || count < 2 || reducedMotion()) return;
    const t = window.setTimeout(() => goTo(index + 1), autoPlayMs);
    return () => window.clearTimeout(t);
  }, [autoPlayMs, paused, index, count, goTo]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
  };
  const onTouchStart = (e: TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1));
  };

  const arrow = cn(
    'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors',
    onDark ? 'border-white text-white hover:bg-white hover:text-lp-primary' : 'border-lp-primary text-lp-primary hover:bg-lp-primary-soft',
  );

  return (
    <div
      className={className}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div key={index} role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${count}`} aria-live={paused ? 'polite' : 'off'} className="lp-fade">
        {children[index]}
      </div>

      {count > 1 && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {children.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para o slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="flex h-8 items-center px-1"
              >
                <span
                  className={cn(
                    'block h-2.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8' : 'w-2.5',
                    onDark ? (i === index ? 'bg-white' : 'bg-white/40') : (i === index ? 'bg-lp-primary' : 'bg-lp-line'),
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} aria-label="Slide anterior" onClick={() => goTo(index - 1)}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className={arrow} aria-label="Próximo slide" onClick={() => goTo(index + 1)}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
