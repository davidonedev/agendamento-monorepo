import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmailChangeApi } from '@/services/account.service';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AuthShell, AuthAlert, authButtonClass } from '@/components/account/AuthShell';

export default function ConfirmEmailChangePage() {
  const [params] = useSearchParams();
  const { logout } = useAuth();
  const [token] = useState(() => params.get('token') ?? '');
  const [state, setState] = useState<{ kind: 'loading' | 'success' | 'error'; message: string }>(
    token ? { kind: 'loading', message: '' } : { kind: 'error', message: 'Link de confirmação inválido ou expirado.' },
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // StrictMode monta duas vezes — o token é de uso único
    window.history.replaceState(null, '', window.location.pathname);
    confirmEmailChangeApi(token)
      .then(message => {
        // A sessão salva tem o e-mail antigo; força novo login com o novo e-mail
        logout();
        setState({ kind: 'success', message });
      })
      .catch(err => setState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Erro ao conectar com o servidor. Tente novamente.',
      }));
  }, [token, logout]);

  return (
    <AuthShell title="Confirmação de e-mail">
      <div className="space-y-5">
        {state.kind === 'loading' && <p className="text-center text-sm text-white/60">Confirmando…</p>}
        {state.kind !== 'loading' && <AuthAlert kind={state.kind}>{state.message}</AuthAlert>}
        {state.kind !== 'loading' && <Link to="/login" replace className={authButtonClass}>Ir para o login</Link>}
      </div>
    </AuthShell>
  );
}
