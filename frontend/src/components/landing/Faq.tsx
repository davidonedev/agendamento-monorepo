import { useState, useId } from 'react';
import { Plus } from 'lucide-react';
import { FAQ } from './content';
import SectionHeading from './SectionHeading';

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`rounded-2xl border transition-colors ${open ? 'border-landing-ink/20 bg-landing-surface' : 'border-landing-line bg-landing-surface'}`}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-[15px] font-medium text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol"
        >
          {q}
          <Plus className={`h-5 w-5 shrink-0 text-landing-petrol transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
        </button>
      </h3>
      {/* grid-rows 0fr→1fr anima a altura sem medir o conteúdo */}
      <div id={id} role="region" className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-landing-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="duvidas" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge="Dúvidas" title="Perguntas frequentes" />
        <div className="reveal mt-12 space-y-3">
          {FAQ.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(o => (o === i ? null : i))} />
          ))}
        </div>
      </div>
    </section>
  );
}
