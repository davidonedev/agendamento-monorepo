import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { forgotPasswordApi } from '@/services/account.service';
import { ApiError } from '@/lib/api';
import { AuthShell, AuthAlert, authInputClass, authButtonClass, authLabelClass } from '@/components/account/AuthShell';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      setSent(await forgotPasswordApi(email.trim()));
    } catch (err) {
      // A API só falha por limite de tentativas (429) ou formato inválido (422) — nunca por conta inexistente
      setError(err instanceof ApiError
        ? (err.status === 422 ? 'E-mail inválido.' : err.message)
        : 'Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Informe o e-mail que você usa para entrar.">
      {sent ? (
        <div className="space-y-5">
          <AuthAlert kind="success">{sent}</AuthAlert>
          <p className="text-sm text-white/50">
            O link vale por 30 minutos e só pode ser usado uma vez. Confira também a caixa de spam.
          </p>
          <Link to="/login" className={authButtonClass}>Voltar ao login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className={authLabelClass}>E-mail</label>
            <input
              id="email" type="email" placeholder="voce@email.com" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} required
              className={authInputClass}
            />
          </div>

          {error && <AuthAlert kind="error">{error}</AuthAlert>}

          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? 'Enviando…' : <>Enviar instruções <ArrowRight className="h-4 w-4" /></>}
          </button>

          <p className="pt-2 text-center text-sm text-white/50">
            Não tem mais acesso a esse e-mail?{' '}
            <Link to="/access-help" className="font-medium text-white underline-offset-4 hover:underline">
              Pedir ajuda
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
