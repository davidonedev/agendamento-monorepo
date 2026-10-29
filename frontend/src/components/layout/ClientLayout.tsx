import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, LogIn, ListOrdered } from 'lucide-react';
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
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: primaryColor }}
        title={name}
      >
        {initials}
      </div>

      {/* Nome visível só em sm+ */}
      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate" title={name}>
        {name.split(' ')[0]}
      </span>

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
  const [loginOpen, setLoginOpen] = useState(false);

  const isMyAppts = location.pathname.endsWith('/my-appointments');

  const handleLogout = () => {
    logout();
    navigate(`/${tenant.slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo + nome — clica volta ao início */}
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/${tenant.slug}`)}
          >
            <div
              className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: tenant.logoUrl ? undefined : tenant.primaryColor }}
            >
              {tenant.logoUrl
                ? <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                : tenant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="text-left">
              <span className="font-bold text-base leading-tight">{tenant.name}</span>
              <p className="text-xs text-muted-foreground hidden sm:block">{tenant.address}</p>
            </div>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {/* Meus Agendamentos — só quando logado */}
            {client && (
              <Button
                variant={isMyAppts ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(`/${tenant.slug}/my-appointments`)}
                style={isMyAppts
                  ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }
                  : {}}
              >
                <ListOrdered className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Meus Agendamentos</span>
              </Button>
            )}

            {/* Auth */}
            {client ? (
              <ClientAvatar
                name={client.name}
                primaryColor={tenant.primaryColor}
                onLogout={handleLogout}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoginOpen(true)}
                title="Entrar"
              >
                {/* Mobile: só ícone | sm+: ícone + texto */}
                <LogIn className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <ClientLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      {/* ── Faixa de boas-vindas (cliente logado) ── */}
      {client && (
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
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>{tenant.name} · Agendamento online via AgendePro</p>
      </footer>
    </div>
  );
}