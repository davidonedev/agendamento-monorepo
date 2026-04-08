import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CalendarCheck, UserPlus, LogOut, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { usePublicClient } from '@/context/PublicClientContext';
import ClientLoginDialog from '@/components/register/ClientLoginDialog';

// ─── Avatar do cliente logado ─────────────────────────────────────────────────

interface ClientAvatarProps {
  name: string;
  primaryColor: string;
  onLogout: () => void;
}

function ClientAvatar({ name, primaryColor, onLogout }: ClientAvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {/* Avatar com iniciais */}
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: primaryColor }}
        title={name}
      >
        {initials}
      </div>

      {/* Nome — visível só em sm+ */}
      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate" title={name}>
        {name.split(' ')[0]}
      </span>

      {/* Botão de sair */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onLogout}
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function ClientLayout() {
  const { data: { tenant } } = usePublicTenant();
  const { client, logout } = usePublicClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab]         = useState<'services' | 'booking'>('services');
  const [loginOpen, setLoginOpen] = useState(false);

  const isRegister = location.pathname.endsWith('/register');

  const goTo = (t: 'services' | 'booking') => {
    setTab(t);
    navigate(t === 'booking' ? `/${tenant.slug}/booking` : `/${tenant.slug}`);
  };

  const handleLogout = () => {
    logout();
    navigate(`/${tenant.slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo + nome */}
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: tenant.logoUrl ? undefined : tenant.primaryColor }}
            >
              {tenant.logoUrl
                ? <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                : tenant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <span className="font-bold text-base leading-tight">{tenant.name}</span>
              <p className="text-xs text-muted-foreground hidden sm:block">{tenant.address}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {/* Tabs de navegação */}
            {(['services', 'booking'] as const).map(t => (
              <Button
                key={t}
                variant={tab === t && !isRegister ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goTo(t)}
                style={tab === t && !isRegister
                  ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }
                  : {}}
              >
                {t === 'booking' && <CalendarCheck className="h-4 w-4 mr-1" />}
                {t === 'services' ? 'Serviços' : 'Agendar'}
              </Button>
            ))}

            {/* Auth: logado → avatar | deslogado → entrar + cadastrar */}
            {client ? (
              <ClientAvatar
                name={client.name}
                primaryColor={tenant.primaryColor}
                onLogout={handleLogout}
              />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLoginOpen(true)}
                >
                  <LogIn className="h-4 w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>

                <Button
                  variant={isRegister ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => navigate(`/${tenant.slug}/register`)}
                  style={isRegister
                    ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }
                    : {}}
                >
                  <UserPlus className="h-4 w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Cadastrar</span>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <ClientLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onRegister={() => navigate(`/${tenant.slug}/register`)}
      />

      {/* ── Faixa de boas-vindas (cliente logado) ── */}
      {client && !isRegister && (
        <div
          className="border-b py-2 px-4"
          style={{ backgroundColor: `${tenant.primaryColor}0D` }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 shrink-0" style={{ color: tenant.primaryColor }} />
            <span className="text-muted-foreground">
              Olá, <strong style={{ color: tenant.primaryColor }}>{client.name.split(' ')[0]}</strong>! Pronto para agendar?
            </span>
          </div>
        </div>
      )}

      {/* ── Conteúdo ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet context={{ setTab }} />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>{tenant.name} · Agendamento online via AgendePro</p>
      </footer>
    </div>
  );
}
