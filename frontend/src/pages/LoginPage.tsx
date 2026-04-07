import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Shield, Store, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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

// ─── Conta quick-access normalizada ──────────────────────────────────────────
interface DemoAccount {
  label: string;
  sub: string;
  email: string;
  password: string;
}

interface RoleGroup {
  role: string;
  icon: typeof Shield;
  iconBg: string;
  iconColor: string;
  accounts: DemoAccount[];
}

// Super admin sempre aparece (único, não pertence a tenant)
const SUPER_GROUP: RoleGroup = {
  role: 'Super Admin',
  icon: Shield,
  iconBg: 'bg-purple-200',
  iconColor: 'text-purple-700',
  accounts: [
    { label: 'Super Admin', sub: 'Plataforma completa', email: 'super@agendepro.com', password: 'super123' },
  ],
};

function buildGroups(tenants: LoginTenant[]): RoleGroup[] {
  const adminAccounts: DemoAccount[] = [];
  const profAccounts: DemoAccount[] = [];

  for (const t of tenants) {
    const planLabel = t.plan.charAt(0).toUpperCase() + t.plan.slice(1);
    const statusLabel = t.status === 'active' ? 'Ativo' : t.status === 'trial' ? 'Trial' : 'Suspenso';

    for (const u of t.users) {
      if (u.role === 'tenant_admin') {
        adminAccounts.push({
          label: t.name,
          sub: `Plano ${planLabel} · ${statusLabel}`,
          email: u.email,
          password: 'admin123',
        });
      }
    }

    for (const prof of t.professionals) {
      for (const u of prof.users) {
        profAccounts.push({
          label: prof.name,
          sub: t.name,
          email: u.email,
          password: 'prof123',
        });
      }
    }
  }

  const groups: RoleGroup[] = [SUPER_GROUP];

  if (adminAccounts.length > 0) {
    groups.push({
      role: 'Admins',
      icon: Store,
      iconBg: 'bg-violet-200',
      iconColor: 'text-violet-700',
      accounts: adminAccounts,
    });
  }

  if (profAccounts.length > 0) {
    groups.push({
      role: 'Profissionais',
      icon: User,
      iconBg: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-700',
      accounts: profAccounts,
    });
  }

  return groups;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  // Dados dinâmicos de tenants para o quick-access
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([SUPER_GROUP]);

  useEffect(() => {
    api.get<LoginTenant[]>('/public/login-data')
      .then(data => setRoleGroups(buildGroups(data)))
      .catch(() => { /* mantém só super admin */ });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Credenciais inválidas.'); return; }
    navigate(result.redirectTo, { replace: true });
  };

  const handleDemo = async (demoEmail: string, demoPassword: string) => {
    setLoadingDemo(demoEmail);
    setError('');
    const result = await login(demoEmail, demoPassword);
    setLoadingDemo(null);
    if (result.ok) navigate(result.redirectTo, { replace: true });
    else setError(result.error ?? 'Erro ao autenticar.');
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Coluna esquerda — painel roxo ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3b0764 0%, #581c87 40%, #6d28d9 100%)' }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e879f9, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">AgendePro</p>
              <p className="text-purple-300 text-xs mt-0.5">Plataforma SaaS Multi-Tenant</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl xl:text-[2.75rem] font-black text-white leading-tight tracking-tight mb-3">
              Sua barbearia<br />no próximo nível
            </h1>
            <p className="text-purple-200 text-sm leading-relaxed max-w-xs">
              Agendamentos, profissionais e faturamento — tudo integrado em uma plataforma.
            </p>
          </div>

          {/* Grupos de acesso demo */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
            <p className="text-purple-300 text-[10px] font-bold uppercase tracking-[0.15em]">Acesso rápido demo</p>

            {roleGroups.map(group => {
              const Icon = group.icon;
              return (
                <div key={group.role}>
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1">
                    {group.role}
                  </p>
                  <div className="space-y-1.5">
                    {group.accounts.map(acc => (
                      <button
                        key={acc.email}
                        onClick={() => handleDemo(acc.email, acc.password)}
                        disabled={!!loadingDemo}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all text-left group disabled:opacity-50"
                      >
                        <div className={`h-8 w-8 rounded-lg ${group.iconBg} flex items-center justify-center shrink-0`}>
                          {loadingDemo === acc.email
                            ? <div className="h-3.5 w-3.5 border-2 border-purple-400/40 border-t-purple-600 rounded-full animate-spin" />
                            : <Icon className={`h-3.5 w-3.5 ${group.iconColor}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium leading-none mb-0.5">{acc.label}</p>
                          <p className="text-purple-300 text-xs truncate">{acc.sub}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-purple-300/60 text-xs">
              Senhas demo:{' '}
              <span className="font-mono text-purple-200/80">super123</span>
              {' · '}
              <span className="font-mono text-purple-200/80">admin123</span>
              {' · '}
              <span className="font-mono text-purple-200/80">prof123</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Coluna direita — formulário ──────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a21caf)' }}>
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AgendePro</span>
          </div>

          {/* Título */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-2">Bem-vindo de volta</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Entrar na<br />sua conta</h2>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">E-mail</label>
              <input
                id="email" type="email" placeholder="voce@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm outline-none transition-all focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Senha</label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm outline-none transition-all focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-sm bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}
            >
              {loading
                ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando…</>
                : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* Demo mobile */}
          <div className="mt-8 lg:hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">acesso rápido</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-4">
              {roleGroups.map(group => {
                const Icon = group.icon;
                return (
                  <div key={group.role}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                      {group.role}
                    </p>
                    <div className="space-y-1">
                      {group.accounts.map(acc => (
                        <button
                          key={acc.email}
                          onClick={() => handleDemo(acc.email, acc.password)}
                          disabled={!!loadingDemo}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 transition-all text-left disabled:opacity-50"
                        >
                          <div className={`h-7 w-7 rounded-lg ${group.iconBg} flex items-center justify-center shrink-0`}>
                            {loadingDemo === acc.email
                              ? <div className="h-3 w-3 border border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                              : <Icon className={`h-3.5 w-3.5 ${group.iconColor}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate leading-none mb-0.5">{acc.label}</p>
                            <p className="text-xs text-gray-400 truncate">{acc.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
