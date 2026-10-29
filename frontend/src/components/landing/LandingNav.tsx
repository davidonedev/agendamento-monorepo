import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Menu, X } from 'lucide-react';
import { NAV_LINKS } from './content';

// PLACEHOLDER de logo: ícone neutro até existir uma marca definitiva.
export function Logo() {
  return (
    <a href="#inicio" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-petrol">
        <CalendarCheck className="h-4 w-4 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-landing-ink">AgendePro</span>
    </a>
  );
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 transition-all duration-300 sm:px-5 ${
          scrolled || open
            ? 'border border-landing-line bg-landing-surface/85 shadow-lg shadow-landing-ink/5 backdrop-blur-xl'
            : 'border border-transparent'
        }`}
        aria-label="Principal"
      >
        <Logo />

        <ul className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-2 text-sm text-landing-muted transition-colors hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-landing-ink transition-colors hover:text-landing-petrol focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol">
            Entrar
          </Link>
          <Link to="/signup" className="rounded-full bg-landing-petrol px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-landing-petrol-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol focus-visible:ring-offset-2">
            Teste grátis
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-landing-ink hover:bg-landing-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-petrol lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="mx-auto mt-2 max-w-6xl rounded-3xl border border-landing-line bg-landing-surface/95 p-3 shadow-lg shadow-landing-ink/5 backdrop-blur-xl lg:hidden">
          <ul>
            {NAV_LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm text-landing-ink hover:bg-landing-bg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-landing-line pt-3 sm:hidden">
            <Link to="/login" className="rounded-full border border-landing-line py-2.5 text-center text-sm font-medium text-landing-ink">Entrar</Link>
            <Link to="/signup" className="rounded-full bg-landing-petrol py-2.5 text-center text-sm font-semibold text-white">Teste grátis</Link>
          </div>
        </div>
      )}
    </header>
  );
}
