import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type NavItem } from './content';
import { LpButton } from './ui';

// Logo compartilhado (login e cadastro usam o mesmo)
export { Logo } from '@/components/brand/Logo';
import { Logo } from '@/components/brand/Logo';

/** Dropdown: abre por clique, teclado (Enter/Espaço, Esc fecha) e hover no desktop. */
function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium transition-colors hover:text-lp-primary"
      >
        {item.label}
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ul className="lp-fade absolute left-0 top-full z-10 w-72 rounded-lp-card border border-lp-line bg-lp-white p-2 shadow-lp-card">
          {item.children!.map(c => (
            <li key={c.href}>
              <a href={c.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 transition-colors hover:bg-lp-alt">
                <span className="block font-bold">{c.label}</span>
                {c.hint && <span className="block text-sm text-lp-muted">{c.hint}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={cn('sticky top-0 z-50 bg-lp-white transition-shadow duration-300', scrolled || open ? 'shadow-[0_1px_0_rgb(var(--color-border)),0_8px_24px_rgb(0_0_0/0.05)]' : '')}>
      <nav className="mx-auto flex h-[72px] items-center justify-between gap-4 px-5 sm:px-8" style={{ maxWidth: 'var(--container-max)' }} aria-label="Principal">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(item => item.children
            ? <NavDropdown key={item.label} item={item} />
            : (
              <li key={item.label}>
                <a href={item.href} className="inline-flex rounded-full px-3 py-2 text-[15px] font-medium transition-colors hover:text-lp-primary">{item.label}</a>
              </li>
            ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/login" className="rounded-full px-2 py-2 text-[15px] font-bold text-lp-primary underline-offset-4 hover:underline">Já sou cliente</Link>
          <LpButton to="/signup">Teste grátis</LpButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-lp-alt lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="lp-mobile-menu" className="lp-fade max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-lp-line bg-lp-white px-5 pb-6 pt-2 lg:hidden">
          {NAV_ITEMS.map(item => (
            <div key={item.label} className="border-b border-lp-line py-3">
              {item.children ? (
                <>
                  <p className="py-1 text-sm font-bold text-lp-muted">{item.label}</p>
                  <ul>
                    {item.children.map(c => (
                      <li key={c.href}><a href={c.href} onClick={() => setOpen(false)} className="block py-2.5 text-lg font-bold">{c.label}</a></li>
                    ))}
                  </ul>
                </>
              ) : (
                <a href={item.href} onClick={() => setOpen(false)} className="block py-1.5 text-lg font-bold">{item.label}</a>
              )}
            </div>
          ))}
          <div className="mt-5 grid gap-3">
            <LpButton to="/signup" size="lg">Teste grátis</LpButton>
            <LpButton to="/login" variant="outline" size="lg">Já sou cliente</LpButton>
          </div>
        </div>
      )}
    </header>
  );
}
