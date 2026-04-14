import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, UserCog, BarChart3, LogOut, Menu, X,
  Settings, Sun, Moon, ExternalLink, Scissors, Package, Bell,
  UserCircle, Globe, Clock, ChevronDown, Copy, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { useTheme } from '@/hooks/useTheme';
import { hexToHslVars } from '@/lib/utils';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';

const NAV_ITEMS = [
  { to: '/admin/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/agenda',        label: 'Agenda',        icon: Calendar        },
  { to: '/admin/clients',       label: 'Clientes',      icon: Users           },
  { to: '/admin/professionals', label: 'Profissionais', icon: UserCog         },
  { to: '/admin/services',      label: 'Serviços',      icon: Scissors        },
  { to: '/admin/products',      label: 'Produtos',      icon: Package         },
  { to: '/admin/reminders',     label: 'Lembretes',     icon: Bell            },
  { to: '/admin/revenue',       label: 'Faturamento',   icon: BarChart3       },
];

const ACCOUNT_ITEMS = [
  { to: '/admin/account',          label: 'Configurações',     icon: Settings },
  { to: '/admin/account/portal',   label: 'Portal do Cliente', icon: Globe    },
  { to: '/admin/account/schedule', label: 'Dispon. de Horários ',          icon: Clock    },
];

const PLAN_VARIANT = { basic: 'outline', pro: 'default', enterprise: 'secondary' } as const;

export default function AdminLayout() {
  const { logout, user }                            = useAuth();
  const { tenant, appointments, clients, services } = useTenant();
  const { isDark, toggle }                          = useTheme();
  const navigate = useNavigate();
  const [open, setOpen]             = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const [copied, setCopied]         = useState(false);

  const { notifications, unreadCount, markAllRead, activeToasts, dismissToast, clearAll } =
    useAppointmentNotifications(appointments, clients, services, `apn_${tenant?.id ?? 'admin'}`);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const accentColor = tenant.adminColor ?? tenant.primaryColor;
  const { hsl, isLight } = hexToHslVars(accentColor);
  const fgHsl = isLight ? '222 47% 11%' : '0 0% 100%';

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--primary-foreground', fgHsl);
    root.style.setProperty('--ring', hsl);
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
    };
  }, [hsl, fgHsl]);

  const handleCopyPortal = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${tenant.slug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
    ${isActive ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`;

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    isActive ? { backgroundColor: accentColor } : {};

  return (
    <div
      className="flex h-screen bg-muted/30 overflow-hidden"
      style={{ '--primary': hsl, '--primary-foreground': fgHsl, '--ring': hsl } as React.CSSProperties}
    >
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Brand */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
              style={{ backgroundColor: tenant.logoUrl ? undefined : accentColor }}
            >
              {tenant.logoUrl
                ? <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                : tenant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{tenant.name}</p>
              <Badge variant={PLAN_VARIANT[tenant.plan]} className="text-[10px] px-1 py-0 h-4">
                {tenant.plan}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

          {/* Itens principais */}
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={linkClass} style={linkStyle}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Minha Conta — colapsável, mesmo estilo visual */}
          <button
            onClick={() => setAccountOpen(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Minha Conta</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountOpen && (
            <div className="ml-4 pl-3 border-l border-muted-foreground/20 space-y-0.5">
              {ACCOUNT_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end onClick={() => setOpen(false)}
                  className={linkClass} style={linkStyle}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Portal do cliente — link rápido no final da nav */}
          <div className="pt-2">
            <p className="px-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Portal do Cliente
            </p>
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
              <span className="flex-1 font-mono text-muted-foreground truncate">/{tenant.slug}</span>
              <button onClick={handleCopyPortal} title="Copiar link"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                {copied
                  ? <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => { setOpen(false); navigate(`/${tenant.slug}`); }} title="Abrir portal"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Usuário + logout */}
        <div className="p-3 border-t space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: accentColor }}>
              {user?.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground gap-2 text-sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
            activeToasts={activeToasts}
            dismissToast={dismissToast}
            clearAll={clearAll}
          />
          <Button variant="ghost" size="icon" onClick={toggle} title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: accentColor }}>
            {user?.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
