import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PLANS, ANNUAL_DISCOUNT, type Plan } from './content';
import { CheckList, LpButton, Section } from './ui';

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Cada plano mantém a sua cor ao girar: fraco (Basic), profundo (Pro) e marca (Premium). Sem preto. */
const TONES = [
  { card: 'bg-lp-primary-soft text-lp-black border border-lp-primary/15', soft: 'text-lp-black/70', divider: 'border-lp-primary/20', dark: false, button: 'primary' as const },
  { card: 'bg-lp-primary-active text-white lp-on-dark', soft: 'text-white/90', divider: 'border-white/25', dark: true, button: 'light' as const },
  { card: 'bg-lp-primary text-white lp-on-dark', soft: 'text-white/90', divider: 'border-white/25', dark: true, button: 'light' as const },
];

/** Conteúdo visual do cartão. No plano inativo o botão é só desenho (o cartão inteiro é o botão de selecionar). */
function PlanBody({ plan, annual, tone, interactive }: { plan: Plan; annual: boolean; tone: (typeof TONES)[number]; interactive: boolean }) {
  const price = annual ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly;
  const ctaCls = cn(
    'mt-6 inline-flex h-12 w-full items-center justify-center rounded-full px-7 text-sm font-bold uppercase tracking-[0.05em]',
    tone.button === 'light' ? 'bg-lp-white text-lp-primary' : 'bg-lp-primary text-white',
  );
  return (
    <>
      {plan.highlighted && <span className="absolute -top-3 left-7 rounded-full bg-lp-success px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] text-white">Mais escolhido</span>}
      <h3 className="text-2xl font-extrabold">{plan.name}</h3>
      <p className={cn('mt-1.5 text-sm', tone.soft)}>{plan.description}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className={cn('text-sm', tone.soft)}>R$</span>
        <span className="text-5xl font-extrabold tracking-tight">{brl(price)}</span>
        <span className={cn('text-sm', tone.soft)}>/mês</span>
      </p>
      <p className={cn('mt-1 h-5 text-xs', tone.soft)}>{annual ? `R$ ${brl(price * 12)} cobrados por ano` : ''}</p>

      {interactive
        ? <LpButton to="/signup" variant={tone.button} className="mt-6">Começar grátis</LpButton>
        : <span className={ctaCls} aria-hidden>Começar grátis</span>}

      <div className={cn('mt-7 border-t pt-6 text-sm', tone.divider)}>
        <CheckList items={plan.features} onDark={tone.dark} />
      </div>
    </>
  );
}

/**
 * Carrossel rotativo de planos: o do meio é o selecionado (maior); os dois dos lados têm o mesmo
 * tamanho, um pouco menor. Clicar em um lado o gira para o centro.
 */
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const reduce = useReducedMotion();
  const n = PLANS.length;
  const [active, setActive] = useState(Math.max(PLANS.findIndex(p => p.highlighted), 0));

  // esquerda, centro, direita (rotação circular)
  const order = [(active - 1 + n) % n, active, (active + 1) % n];

  return (
    <Section id="planos" tone="alt" labelledBy="pricing-title">
      <h2 id="pricing-title" className="lp-h2 reveal text-center">Um plano para cada tamanho de equipe</h2>
      <p className="reveal mx-auto mt-4 max-w-xl text-center text-lp-muted">Toda conta começa no Trial gratuito, sem cartão. Escolha um plano quando quiser.</p>

      <div className="reveal mt-8 flex justify-center">
        <div role="radiogroup" aria-label="Período de cobrança" className="inline-flex rounded-full border border-lp-line bg-lp-white p-1">
          {[{ v: false, label: 'Mensal' }, { v: true, label: 'Anual' }].map(o => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={annual === o.v}
              onClick={() => setAnnual(o.v)}
              className={cn('flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors', annual === o.v ? 'bg-lp-primary text-white' : 'text-lp-muted hover:text-lp-black')}
            >
              {o.label}
              {o.v && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', annual ? 'bg-white text-lp-primary' : 'bg-lp-success-soft text-lp-success-ink')}>-{ANNUAL_DISCOUNT * 100}%</span>}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-16 grid items-center gap-6 lg:grid-cols-3 lg:gap-5">
        {order.map((planIndex, slot) => {
          const plan = PLANS[planIndex];
          const tone = TONES[planIndex] ?? TONES[0];
          const isActive = slot === 1;
          const shared = cn('relative flex h-full w-full flex-col rounded-lp-card p-7 text-left transition-[transform,box-shadow] duration-500 ease-out', tone.card);
          return (
            <motion.li
              key={plan.name}
              layout="position"
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }}
              className="flex self-stretch lg:self-auto lg:h-[38rem]"
            >
              {isActive ? (
                <article aria-current="true" className={cn(shared, 'z-10 shadow-2xl lg:scale-[1.06] lg:py-9')}>
                  <PlanBody plan={plan} annual={annual} tone={tone} interactive />
                </article>
              ) : (
                <button
                  type="button"
                  onClick={() => setActive(planIndex)}
                  aria-label={`Destacar o plano ${plan.name}`}
                  className={cn(shared, 'cursor-pointer shadow-lp-card hover:shadow-2xl lg:scale-[0.92] lg:hover:scale-[0.94]')}
                >
                  <PlanBody plan={plan} annual={annual} tone={tone} interactive={false} />
                </button>
              )}
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-12 text-center text-sm text-lp-muted">Toque em um plano para destacá-lo.</p>
      <p className="sr-only" aria-live="polite">Plano {PLANS[active].name} em destaque.</p>
    </Section>
  );
}
