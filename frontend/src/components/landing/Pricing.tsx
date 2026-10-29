import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PLANS, ANNUAL_DISCOUNT, type Plan } from './content';
import SectionHeading from './SectionHeading';

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function PlanCard({ plan, annual, index }: { plan: Plan; annual: boolean; index: number }) {
  const price = annual ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly;
  const hl = plan.highlighted;

  return (
    <article
      className={`reveal relative flex flex-col rounded-3xl p-7 ${
        hl ? 'border-gradient shadow-xl shadow-landing-petrol/15 lg:-my-4 lg:py-11' : 'border border-landing-line bg-landing-surface'
      }`}
      style={{ '--reveal-delay': `${index * 100}ms` } as React.CSSProperties}
    >
      {hl && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-landing-petrol px-3 py-1 text-[11px] font-semibold text-white">
          Mais escolhido
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-landing-ink">{plan.name}</h3>
      <p className="mt-1.5 text-sm text-landing-muted">{plan.description}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-sm text-landing-muted">R$</span>
        <span className="font-display text-5xl font-bold tracking-tight text-landing-ink">{brl(price)}</span>
        <span className="text-sm text-landing-muted">/mês</span>
      </p>
      <p className="mt-1 h-4 text-xs text-landing-muted">
        {annual ? `R$ ${brl(price * 12)} cobrados por ano` : ''}
      </p>

      <Link
        to="/signup"
        className={`mt-6 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2 ${
          hl ? 'bg-landing-petrol text-white hover:bg-landing-petrol-dark' : 'border border-landing-line bg-landing-surface text-landing-ink hover:border-landing-ink/40'
        }`}
      >
        Começar grátis
      </Link>

      <ul className="mt-7 space-y-3 border-t border-landing-line pt-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-landing-ink/85">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-landing-petrol" />
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="planos" className="relative px-4 py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          badge="Planos"
          title="Um plano para cada tamanho de equipe"
          description="Toda conta começa no Trial gratuito, sem cartão. Escolha um plano quando quiser."
        />

        <div className="reveal mt-10 flex justify-center">
          <div role="radiogroup" aria-label="Período de cobrança" className="inline-flex items-center rounded-full border border-landing-line bg-landing-surface p-1">
            {[
              { v: false, label: 'Mensal' },
              { v: true, label: 'Anual' },
            ].map(o => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={annual === o.v}
                onClick={() => setAnnual(o.v)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol ${
                  annual === o.v ? 'bg-landing-ink text-white' : 'text-landing-muted hover:text-landing-ink'
                }`}
              >
                {o.label}
                {o.v && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${annual ? 'bg-landing-lavender text-landing-ink' : 'bg-landing-lavender/30 text-landing-plum'}`}>
                    -{ANNUAL_DISCOUNT * 100}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid items-start gap-5 lg:grid-cols-3 lg:items-center">
          {PLANS.map((p, i) => <PlanCard key={p.name} plan={p} annual={annual} index={i} />)}
        </div>
      </div>
    </section>
  );
}
