import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthHeader, headerLinkClass } from '@/components/auth/AuthHeader';
import { AuthAlert } from '@/components/auth/AuthAlert';

// Moldura das telas públicas de recuperação de conta (esqueci a senha, redefinir, ajuda de acesso…).
// Mesmo visual claro da landing/login. Os 5 exports abaixo continuam estáveis para essas páginas.

export const authInputClass =
  'flex h-12 w-full rounded-[10px] border border-lp-line bg-lp-alt px-4 py-2 text-sm text-lp-black placeholder:text-lp-muted ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-lp-primary disabled:cursor-not-allowed disabled:opacity-50';

export const authButtonClass =
  'mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lp-primary text-sm font-bold uppercase tracking-[0.05em] text-white ' +
  'transition-colors duration-300 hover:bg-lp-primary-hover active:bg-lp-primary-active disabled:pointer-events-none disabled:opacity-50';

export const authLabelClass = 'block text-sm font-bold text-lp-black';

export function AuthShell({ title, subtitle, children, wide = false }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="lp-root">
      <div className="min-h-screen bg-lp-alt">
        <AuthHeader right={<Link to="/login" className={headerLinkClass}><ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao login</Link>} />
        <main className="flex justify-center px-4 pb-16 pt-8 sm:pt-14">
          <div className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[440px]'}`}>
            <div className="rounded-lp-card border border-lp-line bg-lp-white p-6 shadow-lp-card sm:p-8">
              <div className="mb-7 text-center">
                <h1 className="lp-h3">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-lp-muted">{subtitle}</p>}
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export { AuthAlert };
