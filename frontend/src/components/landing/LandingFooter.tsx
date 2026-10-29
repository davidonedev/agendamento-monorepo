import { Link } from 'react-router-dom';
import { Logo } from './LandingNav';
import { NAV_LINKS } from './content';

export default function LandingFooter() {
  return (
    <footer className="border-t border-landing-line bg-landing-surface px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-landing-muted">
            Agendamento online e gestão para barbearias, salões de beleza e clínicas de estética.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:gap-16">
          <div>
            <p className="text-sm font-medium text-landing-ink">Produto</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-landing-muted transition-colors hover:text-landing-ink">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-landing-ink">Conta</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/login" className="text-sm text-landing-muted transition-colors hover:text-landing-ink">Entrar</Link></li>
              <li><Link to="/signup" className="text-sm text-landing-muted transition-colors hover:text-landing-ink">Criar conta</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-landing-line pt-6 text-xs text-landing-muted">
        © {new Date().getFullYear()} AgendePro. Todos os direitos reservados.
      </div>
    </footer>
  );
}
