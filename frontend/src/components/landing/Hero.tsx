import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductMockup from './ProductMockup';
import { SEGMENTS, type SegmentId } from './content';

/** Chips de segmento: radiogroup com tabindex móvel (setas trocam a opção). */
function SegmentPicker({ value, onChange }: { value: SegmentId; onChange: (id: SegmentId) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + SEGMENTS.length) % SEGMENTS.length;
    onChange(SEGMENTS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby="segment-label" className="inline-flex flex-wrap justify-center gap-2">
      {SEGMENTS.map((s, i) => {
        const Icon = s.icon;
        const active = s.id === value;
        return (
          <button
            key={s.id}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(s.id)}
            onKeyDown={e => onKeyDown(e, i)}
            className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg ${
              active
                ? 'border-landing-ink bg-landing-ink text-white'
                : 'border-landing-line bg-landing-surface text-landing-ink hover:border-landing-ink/40'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Hero() {
  const [segment, setSegment] = useState<SegmentId>('barbearia');
  const current = SEGMENTS.find(s => s.id === segment)!;

  return (
    <section id="inicio" className="relative overflow-hidden px-4 pb-20 pt-32 sm:pt-40">
      {/* manchas de cor: petróleo, lavanda e sálvia, um tom por público */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-landing-sage-light blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[380px] w-[380px] rounded-full bg-landing-lavender/40 blur-[110px]" />
      <div className="pointer-events-none absolute left-1/2 top-[55%] h-[360px] w-[700px] -translate-x-1/2 rounded-full bg-landing-petrol/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="hero-in text-sm font-medium text-landing-muted" style={{ animationDelay: '0ms' }}>
          Para barbearias, salões de beleza e clínicas de estética
        </p>

        <h1 className="hero-in mx-auto mt-5 max-w-3xl font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-landing-ink sm:text-6xl lg:text-[4.25rem]" style={{ animationDelay: '80ms' }}>
          Agenda cheia, menos faltas e clientes que voltam
        </h1>

        <p className="hero-in mx-auto mt-6 max-w-2xl text-base leading-relaxed text-landing-muted sm:text-lg" style={{ animationDelay: '160ms' }}>
          Seu cliente agenda sozinho pelo link, recebe a confirmação e aparece.
          Você cuida da equipe, dos clientes e do faturamento em um só painel.
        </p>

        <div className="hero-in mt-9" style={{ animationDelay: '240ms' }}>
          <p id="segment-label" className="mb-3 text-sm text-landing-muted">Qual é o seu negócio?</p>
          <SegmentPicker value={segment} onChange={setSegment} />
          <p key={segment} aria-live="polite" className="seg-swap mx-auto mt-4 min-h-[3rem] max-w-xl text-[15px] leading-relaxed text-landing-ink/80">
            {current.heroLine}
          </p>
        </div>

        <div className="hero-in mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '320ms' }}>
          <Link
            to="/signup"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-landing-petrol px-7 text-sm font-semibold text-white shadow-lg shadow-landing-petrol/25 transition-colors hover:bg-landing-petrol-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg"
          >
            Teste grátis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex h-12 items-center rounded-full border border-landing-line bg-landing-surface px-7 text-sm font-medium text-landing-ink transition-colors hover:border-landing-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol"
          >
            Ver como funciona
          </a>
        </div>

        <p className="hero-in mt-5 text-xs text-landing-muted" style={{ animationDelay: '400ms' }}>
          Trial gratuito, sem cartão de crédito
        </p>
      </div>

      <div className="relative mt-14 sm:mt-20">
        <ProductMockup segment={current} />
      </div>
    </section>
  );
}
