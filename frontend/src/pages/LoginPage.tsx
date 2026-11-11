import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Store, User, ArrowRight, ArrowLeft, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LpButton } from '@/components/brand/LpButton';
import { AuthHeader, headerLinkClass } from '@/components/auth/AuthHeader';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { TextField, PasswordField } from '@/components/auth/TextField';
import { Spinner } from '@/components/auth/Spinner';
import { cn } from '@/lib/utils';

// ─── Tipos vindos do endpoint /api/public/login-data ─────────────────────────
interface LoginTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  users: { id: string; name: string; email: string; role: string }[];
  professionals: {
    id: string;
    name: string;
    specialty: string;
    users: { email: string }[];
  }[];
}

interface DemoAccount {
  label: string;
  sub: string;
  email: string;
  password: string;
}

interface RoleGroup {
  role: string;
  icon: typeof Shield;
  dot: string;
  accounts: DemoAccount[];
}

const SUPER_GROUP: RoleGroup = {
  role: 'Super Admin',
  icon: Shield,
  dot: 'bg-lp-primary',
  accounts: [
    { label: 'Super Admin', sub: 'Plataforma completa', email: 'super@agendepro.com', password: 'super123' },
  ],
};

function buildGroups(tenants: LoginTenant[]): RoleGroup[] {
  const adminAccounts: DemoAccount[] = [];
  const profAccounts:  DemoAccount[] = [];

  for (const t of tenants) {
    const planLabel   = t.plan.charAt(0).toUpperCase() + t.plan.slice(1);
    const statusLabel = t.status === 'active' ? 'Ativo' : t.status === 'trial' ? 'Trial' : 'Suspenso';

    for (const u of t.users) {
      if (u.role === 'tenant_admin')
        adminAccounts.push({ label: t.name, sub: `Plano ${planLabel} · ${statusLabel}`, email: u.email, password: 'admin123' });
    }
    for (const prof of t.professionals)
      for (const u of prof.users)
        profAccounts.push({ label: prof.name, sub: t.name, email: u.email, password: 'prof123' });
  }

  const groups: RoleGroup[] = [SUPER_GROUP];
  if (adminAccounts.length > 0) groups.push({ role: 'Admins',         icon: Store, dot: 'bg-lp-success', accounts: adminAccounts });
  if (profAccounts.length  > 0) groups.push({ role: 'Profissionais',  icon: User,  dot: 'bg-lp-black',   accounts: profAccounts  });
  return groups;
}

interface FieldErrors { email?: string; password?: string }

/** Validação de campos antes de chamar a API (equivale ao antigo `required` + type="email"). */
function validateLogin(email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!email.trim()) errs.email = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'E-mail inválido.';
  if (!password) errs.password = 'Informe sua senha.';
  return errs;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [roleGroups,  setRoleGroups]  = useState<RoleGroup[]>([SUPER_GROUP]);
  const [demoOpen,    setDemoOpen]    = useState(false);

  useEffect(() => {
    api.get<LoginTenant[]>('/public/login-data')
      .then(data => setRoleGroups(buildGroups(data)))
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateLogin(email, password);
    setFieldErrors(errs);
    if (errs.email || errs.password) { setError(''); return; }
    setError(''); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Credenciais inválidas.'); return; }
    setSuccess(true);
    navigate(result.redirectTo, { replace: true });
  };

  const handleDemo = async (demoEmail: string, demoPassword: string) => {
    setLoadingDemo(demoEmail); setError('');
    const result = await login(demoEmail, demoPassword);
    setLoadingDemo(null);
    if (result.ok) navigate(result.redirectTo, { replace: true });
    else setError(result.error ?? 'Erro ao autenticar.');
  };

  return (
    <div className="lp-root">
      <div className="min-h-screen bg-lp-alt">
        <AuthHeader
          right={<Link to="/" className={headerLinkClass}><ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao início</Link>}
        />

        <main className="flex justify-center px-4 pb-16 pt-8 sm:pt-14">
          <div className="w-full max-w-[440px]">
            <div className="rounded-lp-card border border-lp-line bg-lp-white p-6 shadow-lp-card sm:p-8">
              <div className="mb-7 text-center">
                <h1 className="lp-h3">Entrar na sua conta</h1>
                <p className="mt-2 text-sm text-lp-muted">Acesse o painel da sua barbearia.</p>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-5">
                <TextField
                  id="email" label="E-mail" type="email" placeholder="voce@email.com" autoComplete="email"
                  value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
                  error={fieldErrors.email} required
                />

                <PasswordField
                  id="password" label="Senha" placeholder="••••••••" autoComplete="current-password"
                  value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
                  error={fieldErrors.password} required
                  labelAside={
                    <Link to="/forgot-password" className="rounded text-sm font-bold text-lp-primary underline-offset-4 hover:underline">
                      Esqueci minha senha
                    </Link>
                  }
                />

                {error && <AuthAlert kind="error">{error}</AuthAlert>}
                {success && <AuthAlert kind="success">Login realizado! Redirecionando…</AuthAlert>}

                <LpButton type="submit" size="lg" disabled={loading || success} className="w-full">
                  {loading
                    ? <><Spinner /> Entrando…</>
                    : <>Entrar <ArrowRight className="h-4 w-4" aria-hidden /></>}
                </LpButton>
              </form>

              <p className="mt-6 text-center text-sm">
                <Link to="/access-help" className="font-bold text-lp-primary underline-offset-4 hover:underline">
                  Não consigo acessar meu e-mail
                </Link>
              </p>

              <p className="mt-3 text-center text-sm text-lp-muted">
                Ainda não tem uma conta?{' '}
                <Link to="/signup" className="font-bold text-lp-primary underline-offset-4 hover:underline">
                  Criar conta grátis
                </Link>
              </p>
            </div>

            {/* Contas demo (recolhível) */}
            <div className="mt-4 rounded-lp-card border border-lp-line bg-lp-white">
              <button
                type="button"
                onClick={() => setDemoOpen(o => !o)}
                aria-expanded={demoOpen}
                aria-controls="demo-accounts"
                className="flex w-full items-center justify-between gap-3 rounded-lp-card px-5 py-4 text-left"
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Zap className="h-4 w-4 text-lp-primary" aria-hidden />
                  Testar com conta demo
                </span>
                <ChevronDown className={cn('h-4 w-4 text-lp-muted transition-transform duration-300', demoOpen && 'rotate-180')} aria-hidden />
              </button>

              <div id="demo-accounts" className={cn('grid transition-[grid-template-rows] duration-300 ease-out', demoOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <div className="max-h-[360px] space-y-5 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'thin' }}>
                    {roleGroups.map(group => {
                      const Icon = group.icon;
                      return (
                        <div key={group.role}>
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-lp-muted">
                            <span className={cn('h-1.5 w-1.5 rounded-full', group.dot)} aria-hidden />
                            {group.role}
                          </p>
                          <div className="space-y-1.5">
                            {group.accounts.map(acc => (
                              <button
                                key={acc.email}
                                type="button"
                                onClick={() => handleDemo(acc.email, acc.password)}
                                disabled={!!loadingDemo}
                                tabIndex={demoOpen ? 0 : -1}
                                className="group flex w-full items-center gap-3 rounded-xl border border-lp-line bg-lp-white px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-lp-primary hover:bg-lp-primary-soft disabled:opacity-50"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lp-primary-soft text-lp-primary">
                                  {loadingDemo === acc.email ? <Spinner className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" aria-hidden />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold leading-tight">{acc.label}</span>
                                  <span className="block truncate text-xs text-lp-muted">{acc.sub}</span>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-lp-muted transition-transform group-hover:translate-x-0.5 group-hover:text-lp-primary" aria-hidden />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <p className="border-t border-lp-line pt-4 text-xs text-lp-muted">
                      Senhas demo:{' '}
                      <span className="font-mono text-lp-black">super123</span>{' · '}
                      <span className="font-mono text-lp-black">admin123</span>{' · '}
                      <span className="font-mono text-lp-black">prof123</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
