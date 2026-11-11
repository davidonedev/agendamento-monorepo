import { Link } from 'react-router-dom';

/**
 * Logo principal do site (arquivos em public/images, gerados a partir de logo-nimbo.png com fundo transparente):
 *  - logo-nimbo-dark.png: traço preto, para fundos claros
 *  - logo-nimbo-white.png: traço branco, para fundos azul/preto (`onDark`)
 * Na landing aponta para #inicio; nas outras telas use `to="/"`.
 */
export function Logo({ onDark, to }: { onDark?: boolean; to?: string }) {
  const img = (
    <img
      src={onDark ? '/images/logo-nimbo-white.png' : '/images/logo-nimbo-dark.png'}
      alt="Nimbo"
      width={181}
      height={36}
      className="h-9 w-auto"
    />
  );
  const cls = 'flex items-center rounded-lg';
  return to ? <Link to={to} className={cls}>{img}</Link> : <a href="#inicio" className={cls}>{img}</a>;
}
