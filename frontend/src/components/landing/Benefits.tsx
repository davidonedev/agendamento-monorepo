import { BENEFITS } from './content';

/** Faixa de benefícios universais, logo abaixo do hero. */
export default function Benefits() {
  return (
    <section aria-label="Benefícios" className="px-4 py-16 sm:py-20">
      <ul className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <li key={b.title} className="reveal" style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
              <Icon className="h-6 w-6 text-landing-petrol" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-landing-ink">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-landing-muted">{b.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
