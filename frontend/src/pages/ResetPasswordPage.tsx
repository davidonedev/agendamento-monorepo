import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { resetPasswordApi } from '@/services/account.service';
import { ApiError } from '@/lib/api';
import { AuthShell, AuthAlert, authInputClass, authButtonClass, authLabelClass } from '@/components/account/AuthShell';

const MIN_LENGTH = 6;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Guarda o token em memória e tira da URL (histórico / Referer)
  const [token] = useState(() => params.get('token') ?? '');
  useEffect(() => {
    if (params.get('token')) window.history.replaceState(null, '', window.location.pathname);
  }, [params]);

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) { setError(`A senha deve ter no mínimo ${MIN_LENGTH} caracteres.`); return; }
    if (password !== confirm)         { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      setDone(await resetPasswordApi(token, password));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Link inválido">
        <div className="space-y-5">
          <AuthAlert kind="error">Link de redefinição inválido ou expirado. Solicite um novo.</AuthAlert>
          <Link to="/forgot-password" className={authButtonClass}>Solicitar novo link</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar nova senha" subtitle="Ao salvar, você será desconectado de todos os dispositivos.">
      {done ? (
        <div className="space-y-5">
          <AuthAlert kind="success">{done}</AuthAlert>
          <Link to="/login" replace className={authButtonClass}>Ir para o login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className={authLabelClass}>Nova senha</label>
            <div className="relative">
              <input
                id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder={`Mínimo de ${MIN_LENGTH} caracteres`}
                value={password} onChange={e => setPassword(e.target.value)} required minLength={MIN_LENGTH}
                className={`${authInputClass} pr-11`}
              />
              <button
                type="button" onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/35 transition-colors hover:text-white/70"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className={authLabelClass}>Confirmar nova senha</label>
            <input
              id="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required
              className={authInputClass}
            />
          </div>

          {error && (
            <AuthAlert kind="error">
              {error}{' '}
              {error.includes('Solicite um novo') && (
                <Link to="/forgot-password" className="font-medium text-white underline underline-offset-4">Solicitar novo link</Link>
              )}
            </AuthAlert>
          )}

          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? 'Salvando…' : <>Salvar nova senha <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
