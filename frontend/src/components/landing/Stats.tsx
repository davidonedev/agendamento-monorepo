import { STATS } from './content';
import { Section } from './ui';

/** Faixa de números grandes com legenda curta. Só fatos do produto (ver STATS em content.ts). */
export default function Stats() {
  return (
    <Section tone="black" labelledBy="stats-title" className="!py-14 sm:!py-16">
      <h2 id="stats-title" className="sr-only">O Nimbo em números</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.value} className="reveal flex flex-col-reverse" style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}>
            <dt className="mt-2 text-sm text-lp-on-dark-muted sm:text-base">{s.label}</dt>
            <dd className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
