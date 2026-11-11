import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ } from './content';
import { Section } from './ui';

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-bold sm:px-7 sm:text-lg"
        >
          {q}
          <ChevronDown className={cn('h-5 w-5 shrink-0 text-lp-primary transition-transform duration-300', open && 'rotate-180')} aria-hidden />
        </button>
      </h3>
      {/* grid-rows 0fr→1fr anima a altura sem medir o conteúdo */}
      <div id={id} role="region" aria-label={q} className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden" {...(!open ? { inert: true } : {})}>
          <p className="px-5 pb-5 text-lp-muted sm:px-7">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="duvidas" labelledBy="faq-title">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-title" className="lp-h2 reveal text-center">Tire suas dúvidas</h2>
        <div className="reveal mt-10 divide-y divide-lp-line rounded-lp-card border border-lp-line bg-lp-white">
          {FAQ.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(o => (o === i ? null : i))} />
          ))}
        </div>
      </div>
    </Section>
  );
}
