import { STEPS } from './content';
import SectionHeading from './SectionHeading';

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative bg-landing-surface px-4 py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          badge="Como funciona"
          title="Comece a receber agendamentos hoje"
          description="Três passos entre criar a conta e ver o primeiro cliente marcado."
        />

        <ol className="relative mt-16 grid gap-5 md:grid-cols-3">
          {/* linha conectando os passos */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-landing-line md:block" />

          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="reveal relative rounded-3xl border border-landing-line bg-landing-bg p-7 text-center"
              style={{ '--reveal-delay': `${i * 120}ms` } as React.CSSProperties}
            >
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-landing-petrol font-display text-xl font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-6 font-display text-lg font-semibold text-landing-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-landing-muted">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
