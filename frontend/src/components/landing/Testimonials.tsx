import { TESTIMONIALS, SEGMENTS, type Testimonial } from './content';
import SectionHeading from './SectionHeading';
import Marquee from './Marquee';

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.name.split(' ').map(p => p[0]).join('').slice(0, 2);
  const seg = SEGMENTS.find(s => s.id === t.segment)!;
  return (
    <figure className="mx-2 flex w-[300px] shrink-0 flex-col rounded-3xl border border-landing-line bg-landing-surface p-6 sm:w-[320px]">
      <span className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${seg.tone.soft} ${seg.tone.text}`}>
        {seg.label}
      </span>
      <blockquote className="mt-4 text-sm leading-relaxed text-landing-ink">“{t.quote}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${seg.tone.soft} ${seg.tone.text}`}>
          {initials}
        </span>
        <span>
          <span className="block text-sm font-medium text-landing-ink">{t.name}</span>
          <span className="block text-xs text-landing-muted">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  // Cada fileira tem poucos cards: repete a lista para cobrir telas largas sem buraco no loop
  const row = (list: Testimonial[]) => [...list, ...list].map((t, i) => <TestimonialCard key={`${t.name}-${i}`} t={t} />);
  const hasPlaceholder = TESTIMONIALS.some(t => t.placeholder);
  return (
    <section id="depoimentos" className="py-24 sm:py-32">
      <div className="px-4">
        <SectionHeading
          badge="Depoimentos"
          title="Quem usa não volta para o caderno"
          description="Profissionais de barbearias, salões e estética contam como ficou a rotina."
        />
        {/* PLACEHOLDER: remover este aviso quando os depoimentos forem reais */}
        {hasPlaceholder && (
          <p className="mx-auto mt-4 max-w-md rounded-full border border-dashed border-landing-ink/25 px-4 py-1.5 text-center text-xs text-landing-muted">
            [Depoimentos ilustrativos: substituir por depoimentos reais]
          </p>
        )}
      </div>
      <div className="reveal mt-14 space-y-4">
        <Marquee>{row(TESTIMONIALS.slice(0, half))}</Marquee>
        <Marquee reverse>{row(TESTIMONIALS.slice(half))}</Marquee>
      </div>
    </section>
  );
}
