import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, Shield, Store, User, Eye, EyeOff,
  AlertCircle, ArrowRight, Zap,
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
    <div className="min-h-screen flex bg-[#09090b]">

      {/* ── Painel esquerdo ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] flex-col relative overflow-hidden border-r border-white/[0.06]">

        {/* Padrão de grade */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Luz de canto superior esquerdo */}
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent 70%)' }}
        />

        {/* Luz de canto inferior direito */}
        <div
          className="absolute -bottom-48 -right-32 h-[420px] w-[420px] rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur shrink-0">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-base leading-none tracking-tight">AgendePro</p>
              <p className="text-white/35 text-[11px] mt-0.5 tracking-wide">Plataforma SaaS</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-[2.4rem] xl:text-[2.75rem] font-black text-white leading-[1.08] tracking-tight mb-4">
              Gestão completa<br />para sua barbearia
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
              Agendamentos, profissionais, faturamento e clientes — tudo em uma plataforma.
            </p>
          </div>

          {/* Demo accounts */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-white/25" />
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.18em]">Acesso rápido</p>
            </div>

            {roleGroups.map(group => {
              const Icon = group.icon;
              return (
                <div key={group.role}>
                  <p className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 pl-0.5">
                    {group.role}
                  </p>
                  <div className="space-y-1.5">
                    {group.accounts.map(acc => (
                      <button
                        key={acc.email}
                        onClick={() => handleDemo(acc.email, acc.password)}
                        disabled={!!loadingDemo}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg
                          bg-white/[0.04] hover:bg-white/[0.08]
                          border border-white/[0.07] hover:border-white/[0.14]
                          transition-all duration-150 text-left group disabled:opacity-40"
                      >
                        <div className="h-7 w-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                          {loadingDemo === acc.email
                            ? <span className="h-3 w-3 border border-white/20 border-t-white rounded-full animate-spin block" />
                            : <Icon className="h-3.5 w-3.5 text-white/60" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium leading-none mb-0.5 truncate">{acc.label}</p>
                          <p className="text-white/30 text-xs truncate">{acc.sub}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé senhas */}
          <div className="mt-6 pt-5 border-t border-white/[0.07]">
            <p className="text-white/20 text-xs">
              Senhas demo:{' '}
              <span className="font-mono text-white/35">super123</span>
              {' · '}
              <span className="font-mono text-white/35">admin123</span>
              {' · '}
              <span className="font-mono text-white/35">prof123</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Painel direito — formulário ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[340px]">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
              <Scissors className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">AgendePro</span>
          </div>

          {/* Título */}
          <div className="mb-8">
            <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.2em] mb-2">
              Bem-vindo ao AgendePRO
            </p>
            <h2 className="text-[1.85rem] font-black text-white leading-tight tracking-tight">
              Entrar na sua conta
            </h2>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/40 uppercase tracking-wider">
                E-mail
              </label>
              <input
                id="email" type="email" placeholder="voce@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-11 px-4 rounded-xl
                  bg-white/[0.06] border border-white/[0.1]
                  text-white placeholder:text-white/20 text-sm
                  outline-none transition-all
                  focus:bg-white/[0.09] focus:border-white/25
                  focus:ring-2 focus:ring-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-white/40 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-11 px-4 pr-11 rounded-xl
                    bg-white/[0.06] border border-white/[0.1]
                    text-white placeholder:text-white/20 text-sm
                    outline-none transition-all
                    focus:bg-white/[0.09] focus:border-white/25
                    focus:ring-2 focus:ring-white/10"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-white text-zinc-900 text-sm font-bold
                flex items-center justify-center gap-2
                transition-all active:scale-[0.98] disabled:opacity-50
                hover:bg-zinc-100 shadow-lg shadow-black/30 mt-2"
            >
              {loading
                ? <><span className="h-4 w-4 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" /> Entrando…</>
                : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* Criar conta */}
          <div className="mt-7 pt-6 border-t border-white/[0.08] text-center">
            <p className="text-white/25 text-sm mb-3">Ainda não tem uma conta?</p>
            <a
              href="/signup"
              className="w-full h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1]
                border border-white/[0.1] hover:border-white/[0.2]
                text-white/60 hover:text-white text-sm font-medium
                flex items-center justify-center gap-2 transition-all"
            >
              Quero me cadastrar <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Demo mobile */}
          <div className="mt-7 lg:hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[10px] text-white/20 font-medium uppercase tracking-widest">acesso rápido</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <div className="space-y-4">
              {roleGroups.map(group => {
                const Icon = group.icon;
                return (
                  <div key={group.role}>
                    <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-1.5 pl-0.5">
                      {group.role}
                    </p>
                    <div className="space-y-1.5">
                      {group.accounts.map(acc => (
                        <button
                          key={acc.email}
                          onClick={() => handleDemo(acc.email, acc.password)}
                          disabled={!!loadingDemo}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            bg-white/[0.04] hover:bg-white/[0.08]
                            border border-white/[0.07] hover:border-white/[0.14]
                            transition-all text-left disabled:opacity-40"
                        >
                          <div className="h-7 w-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                            {loadingDemo === acc.email
                              ? <span className="h-3 w-3 border border-white/20 border-t-white rounded-full animate-spin block" />
                              : <Icon className="h-3.5 w-3.5 text-white/50" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-sm font-medium truncate leading-none mb-0.5">{acc.label}</p>
                            <p className="text-white/25 text-xs truncate">{acc.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-white/15 text-xs mt-5 text-center">
              Senhas demo:{' '}
              <span className="font-mono text-white/25">super123</span>
              {' · '}
              <span className="font-mono text-white/25">admin123</span>
              {' · '}
              <span className="font-mono text-white/25">prof123</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
