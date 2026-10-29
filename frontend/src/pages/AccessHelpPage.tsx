import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { createAccessHelpApi, type AccessHelpRequesterType } from '@/services/account.service';
import { ApiError } from '@/lib/api';
import { AuthShell, AuthAlert, authInputClass, authButtonClass, authLabelClass } from '@/components/account/AuthShell';

const TYPES: { value: AccessHelpRequesterType; label: string; who: string }[] = [
  { value: 'professional', label: 'Sou funcionário',          who: 'o responsável pela sua barbearia' },
  { value: 'tenant_admin', label: 'Sou dono da barbearia',    who: 'a equipe AgendePro' },
];

export default function AccessHelpPage() {
  const [form, setForm] = useState({
    requesterType: 'professional' as AccessHelpRequesterType,
    name: '', contact: '', barbershop: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const selected = TYPES.find(t => t.value === form.requesterType)!;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      setSent(await createAccessHelpApi({
        requesterType: form.requesterType,
        name: form.name.trim(),
        contact: form.contact.trim(),
        barbershop: form.barbershop.trim(),
        message: form.message.trim() || undefined,
      }));
    } catch (err) {
      setError(err instanceof ApiError
        ? (err.details?.[0]?.message ?? err.message)
        : 'Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Não consigo acessar meu e-mail" wide
      subtitle="Seu e-mail é a sua identificação de login, por isso não dá para recuperá-lo automaticamente.">
      {sent ? (
        <div className="space-y-5">
          <AuthAlert kind="success">{sent}</AuthAlert>
          <Link to="/login" className={authButtonClass}>Voltar ao login</Link>
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-white/60">
            <p className="font-medium text-white/80">Como funciona</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Se você só esqueceu a senha, use <Link to="/forgot-password" className="text-white underline underline-offset-4">Esqueci minha senha</Link>.</li>
              <li>Se perdeu o acesso ao e-mail ou não lembra qual usou, preencha o formulário abaixo.</li>
              <li>
                <strong className="text-white/80">Funcionário:</strong> o dono da sua barbearia recebe o pedido e atualiza seu acesso.{' '}
                <strong className="text-white/80">Dono:</strong> a equipe AgendePro confirma seus dados e atualiza o acesso.
              </li>
              <li>Você será contatado pelo telefone ou contato informado. Nunca pedimos sua senha.</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className={`${authLabelClass} mb-1.5`}>Tipo de conta</legend>
              {TYPES.map(t => (
                <label
                  key={t.value}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition-colors ${
                    form.requesterType === t.value
                      ? 'border-violet-400/60 bg-violet-500/15 text-white'
                      : 'border-white/[0.1] bg-white/[0.03] text-white/60 hover:text-white'
                  }`}
                >
                  <input
                    type="radio" name="requesterType" value={t.value} className="sr-only"
                    checked={form.requesterType === t.value}
                    onChange={() => setForm(f => ({ ...f, requesterType: t.value }))}
                  />
                  {t.label}
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="name" className={authLabelClass}>Nome completo</label>
              <input id="name" required minLength={2} maxLength={150} value={form.name} onChange={set('name')} className={authInputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact" className={authLabelClass}>Telefone ou outro contato</label>
              <input id="contact" required minLength={3} maxLength={150} placeholder="(11) 99999-0000"
                value={form.contact} onChange={set('contact')} className={authInputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="barbershop" className={authLabelClass}>Barbearia</label>
              <input id="barbershop" required minLength={2} maxLength={150}
                placeholder="Nome da barbearia ou endereço do portal (ex.: minha-barbearia)"
                value={form.barbershop} onChange={set('barbershop')} className={authInputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className={authLabelClass}>Detalhes (opcional)</label>
              <textarea id="message" rows={3} maxLength={1000}
                placeholder="Ex.: e-mail antigo que você lembra, o que aconteceu…"
                value={form.message} onChange={set('message')}
                className={`${authInputClass} h-auto py-3`} />
            </div>

            <p className="text-xs text-white/40">Seu pedido será analisado por {selected.who}.</p>

            {error && <AuthAlert kind="error">{error}</AuthAlert>}

            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? 'Enviando…' : <>Enviar pedido de ajuda <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
