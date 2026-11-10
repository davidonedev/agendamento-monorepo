import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import { SEGMENTS, type SegmentId } from './content';

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
    <div role="radiogroup" aria-labelledby="segment-label" className="inline-flex flex-wrap gap-2">
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
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg ${
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
    <section id="inicio" className="relative overflow-hidden px-4 pb-20 pt-28 sm:pt-36">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-landing-sage-light blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[380px] w-[380px] rounded-full bg-landing-lavender/40 blur-[110px]" />
      <div className="pointer-events-none absolute left-1/3 top-[60%] h-[360px] w-[600px] -translate-x-1/2 rounded-full bg-landing-petrol/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* ── Left column ── */}
          <div className="flex flex-col items-start">

            {/* Segment chips — above the headline */}
            <div className="hero-in" style={{ animationDelay: '0ms' }}>
              <p id="segment-label" className="mb-2.5 text-sm font-medium text-landing-muted">
                Qual é o seu tipo de negócio?
              </p>
              <SegmentPicker value={segment} onChange={setSegment} />
            </div>

            <h1
              className="hero-in mt-7 font-display text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-landing-ink sm:text-5xl lg:text-[3.5rem]"
              style={{ animationDelay: '80ms' }}
            >
              Agenda cheia, menos faltas e clientes que voltam
            </h1>

            <p
              key={segment}
              aria-live="polite"
              className="seg-swap mt-5 text-base leading-relaxed text-landing-muted sm:text-lg"
            >
              {current.heroLine}
            </p>

            {/* CTA buttons */}
            <div
              className="hero-in mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                to="/signup"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-landing-petrol px-7 text-sm font-semibold text-white shadow-lg shadow-landing-petrol/25 transition-colors hover:bg-landing-petrol-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg"
              >
                Criar minha conta grátis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex h-12 items-center rounded-full border border-landing-line bg-landing-surface px-7 text-sm font-medium text-landing-ink transition-colors hover:border-landing-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol"
              >
                Ver como funciona
              </a>
            </div>

            {/* Trust signals */}
            <div
              className="hero-in mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-landing-muted"
              style={{ animationDelay: '320ms' }}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-sage" />
                API Oficial do WhatsApp
              </span>
              <span>Comece grátis</span>
              <span>Sem cartão de crédito</span>
              <span>Cancele quando quiser</span>
            </div>
          </div>

          {/* ── Right column: phone mockup ── */}
          <div
            className="hero-in flex justify-center lg:justify-end"
            style={{ animationDelay: '160ms' }}
          >
            <PhoneMockup segment={current} />
          </div>

        </div>
      </div>
    </section>
  );
}
