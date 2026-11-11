import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

/** Cabeçalho das telas de acesso: igual ao da landing (branco, 72px, logo à esquerda). */
export function AuthHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-lp-line bg-lp-white">
      <div className="mx-auto flex h-[72px] items-center justify-between gap-4 px-5 sm:px-8" style={{ maxWidth: 'var(--container-max)' }}>
        <Logo to="/" />
        {right}
      </div>
    </header>
  );
}

/** Link de texto do cabeçalho (ex.: "Voltar ao início"). */
export const headerLinkClass =
  'inline-flex items-center gap-1.5 rounded-full px-1 py-2 text-[15px] font-bold text-lp-primary underline-offset-4 hover:underline';
