import { AUDIENCES, SEGMENTS } from './content';
import SectionHeading from './SectionHeading';
import ImagePlaceholder from './ImagePlaceholder';

export default function ForWho() {
  return (
    <section id="para-quem" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge="Para quem é"
          title="Feito para quem atende com hora marcada"
          description="A rotina muda de um negócio para outro. A agenda se adapta a cada um."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {AUDIENCES.map((a, i) => {
            const seg = SEGMENTS.find(s => s.id === a.segment)!;
            const Icon = seg.icon;
            return (
              <article
                key={a.segment}
                className="reveal flex flex-col rounded-3xl border border-landing-line bg-landing-surface p-6 sm:p-7"
                style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}
              >
                <ImagePlaceholder hint={a.imageHint} className="aspect-[16/10]" />

                <h3 className="mt-6 flex items-center gap-2.5 font-display text-xl font-semibold text-landing-ink">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${seg.tone.soft}`}>
                    <Icon className={`h-4 w-4 ${seg.tone.text}`} aria-hidden="true" />
                  </span>
                  {a.title}
                </h3>

                <dl className="mt-5 space-y-4 text-sm leading-relaxed">
                  <div>
                    <dt className="font-semibold text-landing-ink">O problema</dt>
                    <dd className="mt-1 text-landing-muted">{a.pain}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-landing-ink">Como o AgendePro resolve</dt>
                    <dd className="mt-1 text-landing-muted">{a.solution}</dd>
                  </div>
                </dl>

                <div className="mt-auto pt-6">
                  <p className={`rounded-2xl p-4 text-sm leading-relaxed text-landing-ink ${seg.tone.soft}`}>
                    <span className={`mb-1 block text-xs font-semibold ${seg.tone.text}`}>Na prática</span>
                    {a.example}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
