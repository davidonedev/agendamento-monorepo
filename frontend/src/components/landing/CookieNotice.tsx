import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LpButton } from '@/components/brand/LpButton';

const STORAGE_KEY = 'agendepro:aviso-privacidade';

/** O localStorage pode lançar (modo privado, dados bloqueados): a página tem que funcionar sem ele. */
function wasDismissed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

/**
 * Aviso de privacidade (LGPD) no estilo "ok, entendi" da referência. O texto descreve só o que o
 * sistema realmente usa: armazenamento do navegador para a sessão e esta escolha. Sem rastreadores.
 * Enquanto está aberto marca <html data-cookie-notice="open"> para outros elementos fixos se afastarem.
 */
export default function CookieNotice() {
  const [open, setOpen] = useState(() => !wasDismissed());

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.cookieNotice = 'open'; else delete root.dataset.cookieNotice;
    return () => { delete root.dataset.cookieNotice; };
  }, [open]);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* segue sem persistir */ }
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de privacidade"
      className="lp-on-dark lp-fade fixed inset-x-3 bottom-3 z-50 rounded-lp-card bg-lp-black p-5 text-white shadow-lp-card sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-md"
    >
      <p className="text-sm">
        Usamos o armazenamento do seu navegador para manter sua sessão e lembrar esta escolha. Saiba mais na{' '}
        <Link to="/privacidade" className="font-bold underline underline-offset-4">Política de Privacidade</Link>.
      </p>
      <LpButton variant="light" className="mt-4 h-11 w-full sm:w-auto" onClick={dismiss}>Ok, entendi</LpButton>
    </div>
  );
}
