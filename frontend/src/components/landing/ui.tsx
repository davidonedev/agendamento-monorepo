import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Botão e logo vivem em src/components/brand (compartilhados com login e cadastro)
export { LpButton } from '@/components/brand/LpButton';

// ─── Link com seta ("Soluções para…", "Saiba mais") ───────────────────────────
export function ArrowLink({ href, to, children, onDark }: { href?: string; to?: string; children: React.ReactNode; onDark?: boolean }) {
  const cls = cn(
    'group inline-flex items-center gap-2 py-2 font-bold underline-offset-4 hover:underline',
    onDark ? 'text-white' : 'text-lp-primary',
  );
  const inner = <>{children}<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></>;
  return to ? <Link to={to} className={cls}>{inner}</Link> : <a href={href} className={cls}>{inner}</a>;
}

// ─── Seção: fundo por tom, padding vertical da escala, container 1240px ───────
export type Tone = 'white' | 'alt' | 'blue' | 'black';
const TONES: Record<Tone, string> = {
  white: 'bg-lp-white text-lp-black',
  alt:   'bg-lp-alt text-lp-black',
  blue:  'bg-lp-primary text-white lp-on-dark',
  black: 'bg-lp-black text-white lp-on-dark',
};

export function Section({ id, tone = 'white', labelledBy, className, children }: {
  id?: string; tone?: Tone; labelledBy?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn(TONES[tone], className)} style={{ paddingBlock: 'var(--section-y)' }}>
      <div className="mx-auto w-full px-5 sm:px-8" style={{ maxWidth: 'var(--container-max)' }}>{children}</div>
    </section>
  );
}

/** Lista com check verde (checks das listas de benefícios). */
export function CheckList({ items, onDark }: { items: string[]; onDark?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3 font-medium">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lp-success text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          </span>
          <span className={onDark ? 'text-white' : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
