import { STEPS } from './content';
import { Section } from './ui';

export default function HowItWorks() {
  return (
    <Section id="como-funciona" labelledBy="how-title">
      <h2 id="how-title" className="lp-h2 reveal text-center">Comece a receber agendamentos hoje</h2>
      <p className="reveal mx-auto mt-4 max-w-xl text-center text-lp-muted">Três passos entre criar a conta e ver o primeiro cliente marcado.</p>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="reveal rounded-lp-card bg-lp-alt p-7" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lp-primary text-2xl font-extrabold text-white" aria-hidden>{i + 1}</span>
            <h3 className="mt-5 text-2xl font-extrabold leading-tight">{s.title}</h3>
            <p className="mt-2 text-lp-muted">{s.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
