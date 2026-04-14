import { useState } from 'react';
<<<<<<< HEAD
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CalendarCheck, UserPlus, LogOut, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';
=======
<<<<<<< Updated upstream
import { Outlet, useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';
=======
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, LogIn, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';
>>>>>>> dev
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
<<<<<<< HEAD
      {/* Avatar com iniciais */}
=======
>>>>>>> dev
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: primaryColor }}
        title={name}
      >
        {initials}
      </div>

<<<<<<< HEAD
      {/* Nome — visível só em sm+ */}
=======
      {/* Nome visível só em sm+ */}
>>>>>>> dev
      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate" title={name}>
        {name.split(' ')[0]}
      </span>

<<<<<<< HEAD
      {/* Botão de sair */}
=======
>>>>>>> dev
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
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> dev

export default function ClientLayout() {
  const { data: { tenant } } = usePublicTenant();
  const { client, logout } = usePublicClient();
  const navigate = useNavigate();
<<<<<<< HEAD
  const location = useLocation();
  const [tab, setTab]         = useState<'services' | 'booking'>('services');
  const [loginOpen, setLoginOpen] = useState(false);

  const isRegister = location.pathname.endsWith('/register');
=======
<<<<<<< Updated upstream
  const [tab, setTab] = useState<'services' | 'booking'>('services');
>>>>>>> dev

  const goTo = (t: 'services' | 'booking') => {
    setTab(t);
    navigate(t === 'booking' ? `/${tenant.slug}/booking` : `/${tenant.slug}`);
  };
=======
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);

  const isMyAppts = location.pathname.endsWith('/my-appointments');
>>>>>>> Stashed changes

  const handleLogout = () => {
    logout();
    navigate(`/${tenant.slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
<<<<<<< HEAD

          {/* Logo + nome */}
=======
<<<<<<< Updated upstream
>>>>>>> dev
          <div className="flex items-center gap-2">
=======

          {/* Logo + nome — clica volta ao início */}
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/${tenant.slug}`)}
          >
>>>>>>> Stashed changes
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
<<<<<<< HEAD
            {/* Tabs de navegação */}
=======
<<<<<<< Updated upstream
>>>>>>> dev
            {(['services', 'booking'] as const).map(t => (
              <Button
                key={t}
                variant={tab === t && !isRegister ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goTo(t)}
<<<<<<< HEAD
                style={tab === t && !isRegister
                  ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }
                  : {}}
=======
                style={tab === t ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor } : {}}
=======
            {/* Meus Agendamentos — só quando logado */}
            {client && (
              <Button
                variant={isMyAppts ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(`/${tenant.slug}/my-appointments`)}
                style={isMyAppts
                  ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }
                  : {}}
>>>>>>> Stashed changes
>>>>>>> dev
              >
                <ListOrdered className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Meus Agendamentos</span>
              </Button>
<<<<<<< Updated upstream
            ))}
<<<<<<< HEAD

            {/* Auth: logado → avatar | deslogado → entrar + cadastrar */}
=======
=======
            )}

            {/* Auth */}
>>>>>>> dev
            {client ? (
              <ClientAvatar
                name={client.name}
                primaryColor={tenant.primaryColor}
                onLogout={handleLogout}
              />
            ) : (
<<<<<<< HEAD
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
=======
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
>>>>>>> Stashed changes
>>>>>>> dev
          </nav>
        </div>
      </header>

<<<<<<< HEAD
      <ClientLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onRegister={() => navigate(`/${tenant.slug}/register`)}
      />

      {/* ── Faixa de boas-vindas (cliente logado) ── */}
      {client && !isRegister && (
=======
<<<<<<< Updated upstream
=======
      <ClientLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      {/* ── Faixa de boas-vindas (cliente logado) ── */}
      {client && (
>>>>>>> dev
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
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> dev
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>{tenant.name} · Agendamento online via AgendePro</p>
      </footer>
    </div>
  );
}
