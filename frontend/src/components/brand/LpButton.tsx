import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Botão do produto (landing, login e cadastro): pílula, caixa alta, 14px / 700 / tracking .05em.
 * Cores vêm dos tokens (src/styles/landing-tokens.css). Para ação (submit/onClick) use `as="button"`.
 */
type Variant = 'primary' | 'outline' | 'light' | 'success' | 'ghost-light';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:       'bg-lp-primary text-white hover:bg-lp-primary-hover active:bg-lp-primary-active',
  outline:       'border-2 border-lp-primary text-lp-primary hover:bg-lp-primary-soft active:bg-lp-primary-soft',
  light:         'bg-lp-white text-lp-primary hover:bg-lp-primary-soft active:bg-lp-primary-soft',
  // verde com texto preto (6.62:1); no hover escurece e passa a texto branco (4.96:1)
  success:       'bg-lp-success text-white hover:bg-lp-success-strong hover:text-white active:bg-lp-success-strong active:text-white',
  'ghost-light': 'border-2 border-white text-white hover:bg-white hover:text-lp-primary',
};
const SIZES: Record<Size, string> = { md: 'h-12 px-7', lg: 'h-14 px-9' };

interface LpButtonProps {
  /** Rota interna (react-router). */
  to?: string;
  /** Âncora na própria página. */
  href?: string;
  /** Sem `to` nem `href` vira <button> (submit/ação). */
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}

export function LpButton({ to, href, type = 'button', onClick, disabled, variant = 'primary', size = 'md', className, children, ...aria }: LpButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold uppercase tracking-[0.05em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant], SIZES[size], className,
  );
  if (to) return <Link to={to} className={cls} onClick={onClick} {...aria}>{children}</Link>;
  if (href) return <a href={href} className={cls} onClick={onClick} {...aria}>{children}</a>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} {...aria}>{children}</button>;
}
