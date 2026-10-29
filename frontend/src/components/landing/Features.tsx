import { Link2, MessageCircle } from 'lucide-react';
import { FEATURES, type Feature } from './content';
import SectionHeading from './SectionHeading';

// Mini-ilustrações dos cards largos do bento
function BookingVisual() {
  return (
    <div className="mt-6 rounded-xl border border-landing-line bg-landing-bg p-4">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-landing-surface px-3 py-2 text-xs text-landing-muted">
        <Link2 className="h-3.5 w-3.5 text-landing-petrol" /> agendepro.com/<span className="font-medium text-landing-ink">seu-negocio</span>
      </div>
      <p className="mb-2 text-[11px] text-landing-muted">Horários livres no sábado</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {['09:00', '09:30', '10:30', '11:00', '13:30', '14:00', '15:30', '16:00', '16:30', '17:00', '18:00', '18:30'].map((h, i) => (
          <span
            key={h}
            className={`rounded-md border py-1.5 text-center text-[11px] ${
              i === 4
                ? 'border-landing-petrol bg-landing-petrol font-semibold text-white'
                : 'border-landing-line bg-landing-surface text-landing-muted'
            }`}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

function RevenueVisual() {
  const bars = [
    { name: 'Carlos', v: 92 },
    { name: 'Juliana', v: 76 },
    { name: 'Priscila', v: 58 },
  ];
  return (
    <div className="mt-6 space-y-3 rounded-xl border border-landing-line bg-landing-bg p-4">
      {bars.map(b => (
        <div key={b.name}>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-landing-ink">{b.name}</span>
            <span className="text-landing-muted">{b.v}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-landing-line">
            <div className="h-full rounded-full bg-landing-petrol" style={{ width: `${b.v}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReturnVisual() {
  return (
    <div className="mt-6 space-y-2 rounded-xl border border-landing-line bg-landing-bg p-4">
      <p className="mb-1 text-[11px] text-landing-muted">Sem visita há mais de 30 dias</p>
      {[
        { n: 'Marcos T.', d: '34 dias', s: 'Corte + barba' },
        { n: 'Renata P.', d: '52 dias', s: 'Coloração' },
        { n: 'Aline G.',  d: '41 dias', s: 'Limpeza de pele' },
      ].map(c => (
        <div key={c.n} className="flex items-center justify-between gap-3 rounded-lg bg-landing-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-landing-ink">{c.n}</p>
            <p className="truncate text-[10px] text-landing-muted">{c.s}, há {c.d}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-landing-sage-light px-2.5 py-1 text-[10px] font-semibold text-landing-sage-ink">
            <MessageCircle className="h-3 w-3" /> Chamar
          </span>
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<number, () => React.ReactElement> = {
  0: BookingVisual,
  3: RevenueVisual,
  5: ReturnVisual,
};

// Ordem do bento: largo, estreito / estreito, largo / estreito, largo
const WIDE = new Set([0, 3, 5]);

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  const Visual = VISUALS[index];
  return (
    <article
      className={`reveal relative overflow-hidden rounded-3xl border border-landing-line bg-landing-surface p-6 transition-colors hover:border-landing-ink/20 sm:p-7 ${
        WIDE.has(index) ? 'lg:col-span-2' : ''
      }`}
      style={{ '--reveal-delay': `${(index % 3) * 90}ms` } as React.CSSProperties}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-landing-petrol/10">
        <Icon className="h-5 w-5 text-landing-petrol" />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-landing-ink">{feature.title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-landing-muted">{feature.description}</p>
      {Visual && <Visual />}
    </article>
  );
}

export default function Features() {
  return (
    <section id="recursos" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge="Recursos"
          title="Tudo o que o seu negócio precisa para funcionar"
          description="Da reserva do cliente ao fechamento do mês, para qualquer serviço e qualquer tamanho de equipe."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
