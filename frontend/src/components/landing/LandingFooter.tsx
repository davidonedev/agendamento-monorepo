import { Link } from 'react-router-dom';
import { Logo } from './LandingNav';


/** Footer em colunas (Institucional, Conheça, Comercial). Sem redes sociais, apps ou CNPJ: ainda não existem. */
export default function LandingFooter() {
  return (
    <footer className="lp-on-dark bg-lp-black pb-28 pt-14 text-white lg:pb-10">
      <div className="mx-auto grid gap-10 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]" style={{ maxWidth: 'var(--container-max)' }}>
        <div className="max-w-xs">
          <Logo onDark />
          <p className="mt-4 text-sm text-lp-on-dark-muted">
            Agendamento online e gestão para barbearias, salões de beleza e clínicas de estética.
          </p>
        </div>

        <nav aria-label="Institucional">
          <p className="font-bold">Institucional</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/termos" className="text-lp-on-dark-muted transition-colors hover:text-white">Termos de uso</Link></li>
            <li><Link to="/privacidade" className="text-lp-on-dark-muted transition-colors hover:text-white">Política de privacidade</Link></li>
          </ul>
        </nav>

        <nav aria-label="Conheça">
          <p className="font-bold">Conheça</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[['#seg-barbearia', 'Barbearias'], ['#seg-salao', 'Salões de cabelo'], ['#seg-estetica', 'Estética'], ['#seg-lash', 'Lash design'], ['#seg-manicure', 'Manicure'], ['#recursos', 'Recursos']].map(([href, label]) => (
              <li key={href}><a href={href} className="text-lp-on-dark-muted transition-colors hover:text-white">{label}</a></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Comercial">
          <p className="font-bold">Comercial</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/signup" className="text-lp-on-dark-muted transition-colors hover:text-white">Teste grátis</Link></li>
            <li><a href="#planos" className="text-lp-on-dark-muted transition-colors hover:text-white">Planos</a></li>
            <li><Link to="/login" className="text-lp-on-dark-muted transition-colors hover:text-white">Já sou cliente</Link></li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-12 px-5 sm:px-8" style={{ maxWidth: 'var(--container-max)' }}><div className="border-t border-white/20 pt-6 text-sm text-lp-on-dark-muted">
        © {new Date().getFullYear()} AgendePro. Todos os direitos reservados.
      </div></div>
    </footer>
  );
}
