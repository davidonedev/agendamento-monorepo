import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scissors, Shield, Store, User, Eye, EyeOff,
  AlertCircle, ArrowRight, ArrowLeft, ChevronDown, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

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
  dot: 'bg-violet-400',
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
  if (adminAccounts.length > 0) groups.push({ role: 'Admins',         icon: Store, dot: 'bg-sky-400',   accounts: adminAccounts });
  if (profAccounts.length  > 0) groups.push({ role: 'Profissionais',  icon: User,  dot: 'bg-zinc-400',  accounts: profAccounts  });
  return groups;
}

const inputClass =
  'w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 text-sm ' +
  'outline-none transition-all focus:bg-white/[0.08] focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20';

// ─── Componente ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
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
    setError(''); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Credenciais inválidas.'); return; }
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
    <div className="relative min-h-screen overflow-hidden bg-[#07070a] font-landing text-white antialiased">
      {/* Fundo: grade + glows (mesma linguagem da landing) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-[-10%] h-[360px] w-[360px] rounded-full bg-blue-600/15 blur-[110px]" />

      {/* Topo */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
            <Scissors className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">AgendePro</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>
      </header>

      <main className="relative z-10 flex justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="hero-in w-full max-w-[420px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
            <div className="mb-7 text-center">
              <h1 className="font-display text-[1.75rem] font-bold tracking-tight">Entrar na sua conta</h1>
              <p className="mt-2 text-sm text-white/50">Acesse o painel da sua barbearia.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/70">E-mail</label>
                <input
                  id="email" type="email" placeholder="voce@email.com" autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">Senha</label>
                  <Link to="/forgot-password" className="rounded text-xs font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button" onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/35 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-zinc-900
                  shadow-[0_0_40px_-10px_rgba(139,92,246,0.7)] transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {loading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" /> Entrando…</>
                  : <>Entrar <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-5 text-center text-sm">
              <Link to="/access-help" className="text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline">
                Não consigo acessar meu e-mail
              </Link>
            </p>

            <p className="mt-4 text-center text-sm text-white/50">
              Ainda não tem uma conta?{' '}
              <Link to="/signup" className="font-medium text-white underline-offset-4 hover:underline">
                Criar conta grátis
              </Link>
            </p>
          </div>

          {/* Contas demo (recolhível) */}
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setDemoOpen(o => !o)}
              aria-expanded={demoOpen}
              aria-controls="demo-accounts"
              className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-white/75">
                <Zap className="h-4 w-4 text-violet-300" />
                Testar com conta demo
              </span>
              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-300 ${demoOpen ? 'rotate-180' : ''}`} />
            </button>

            <div id="demo-accounts" className={`grid transition-[grid-template-rows] duration-300 ease-out ${demoOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="max-h-[360px] space-y-5 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'thin' }}>
                  {roleGroups.map(group => {
                    const Icon = group.icon;
                    return (
                      <div key={group.role}>
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-white/40">
                          <span className={`h-1.5 w-1.5 rounded-full ${group.dot}`} />
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
                              className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-left
                                transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] disabled:opacity-40
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08]">
                                {loadingDemo === acc.email
                                  ? <span className="block h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white" />
                                  : <Icon className="h-3.5 w-3.5 text-white/60" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="mb-0.5 truncate text-sm font-medium leading-none text-white/85">{acc.label}</p>
                                <p className="truncate text-xs text-white/35">{acc.sub}</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <p className="border-t border-white/[0.07] pt-4 text-xs text-white/35">
                    Senhas demo:{' '}
                    <span className="font-mono text-white/55">super123</span>{' · '}
                    <span className="font-mono text-white/55">admin123</span>{' · '}
                    <span className="font-mono text-white/55">prof123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
