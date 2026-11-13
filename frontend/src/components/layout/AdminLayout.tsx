import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, UserCog, BarChart3, LogOut, Menu, X,
  Settings, Sun, Moon, ExternalLink, Scissors, Package, Bell,
  UserCircle, Globe, Clock, ChevronDown, ChevronLeft, ChevronRight, Plus, Copy, CheckCircle, LifeBuoy, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { AdminSearch } from './admin/AdminSearch';
import { OpenStatus } from './admin/OpenStatus';
import { UserMenu } from './admin/UserMenu';
import { useAuth, IMPERSONATION_BACKUP_KEY } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { useTheme } from '@/hooks/useTheme';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { hexToHslVars } from '@/lib/utils';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';

const NAV_ITEMS = [
  { to: '/admin/dashboard',     label: 'Painel',        icon: LayoutDashboard },
  { to: '/admin/agenda',        label: 'Agenda',        icon: Calendar        },
  { to: '/admin/clients',       label: 'Clientes',      icon: Users           },
  { to: '/admin/professionals', label: 'Profissionais', icon: UserCog         },
  { to: '/admin/services',      label: 'Serviços',      icon: Scissors        },
  { to: '/admin/products',      label: 'Produtos',      icon: Package         },
  { to: '/admin/reminders',     label: 'Lembretes',     icon: Bell            },
  { to: '/admin/revenue',       label: 'Faturamento',   icon: BarChart3       },
  { to: '/admin/access-help',   label: 'Pedidos de acesso', icon: LifeBuoy    },
];

const ACCOUNT_ITEMS = [
  { to: '/admin/account',          label: 'Configurações',     icon: Settings },
  { to: '/admin/account/portal',   label: 'Portal do Cliente', icon: Globe    },
  { to: '/admin/account/schedule', label: 'Dispon. de Horários ',          icon: Clock    },
];

export default function AdminLayout() {
  const { logout, user }                            = useAuth();
  const { tenant, appointments, clients, services } = useTenant();
  const { isDark, toggle }                          = useTheme();
  const { collapsed, toggle: toggleCollapsed }      = useSidebarCollapsed();
  const navigate = useNavigate();
  const [open, setOpen]             = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const [copied, setCopied]         = useState(false);
  // Tooltip dos ícones com a sidebar recolhida: num portal, porque a nav (com rolagem) recortaria o que passa da borda.
  const [tip, setTip] = useState<{ label: string; top: number } | null>(null);
  const showTip = (label: string) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (!collapsed || !window.matchMedia('(min-width: 768px)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label: label.trim(), top: r.top + r.height / 2 });
  };
  const hideTip = () => setTip(null);

  const [impersonating] = useState<string | null>(() => {
    try { return localStorage.getItem(IMPERSONATION_BACKUP_KEY) ? (tenant?.name ?? 'tenant') : null; } catch { return null; }
  });

  const exitImpersonation = () => {
    try {
      const backup = localStorage.getItem(IMPERSONATION_BACKUP_KEY);
      if (backup) {
        sessionStorage.setItem('agendepro_session', backup);
        localStorage.removeItem(IMPERSONATION_BACKUP_KEY);
      }
    } catch { /* ignore */ }
    logout();
    window.location.href = '/super/tenants';
  };

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

  // `collapsed` só vale do breakpoint md para cima; na gaveta mobile o menu é sempre completo.
  const hideWhenCollapsed = collapsed ? 'md:hidden' : '';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    ${collapsed ? 'md:justify-center md:px-0' : ''}
    ${isActive ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`;

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    isActive ? { backgroundColor: accentColor } : {};

  /** Item de menu: com a sidebar recolhida só o ícone aparece, com tooltip (hover e foco) e aria-label. */
  const renderLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Settings }, end?: boolean) => (
    <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
      className={linkClass} style={linkStyle} aria-label={collapsed ? label.trim() : undefined}
      onMouseEnter={showTip(label)} onMouseLeave={hideTip} onFocus={showTip(label)} onBlur={hideTip}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className={hideWhenCollapsed}>{label}</span>
    </NavLink>
  );

  return (
    <div
      className="flex h-screen bg-muted/30 overflow-hidden"
      style={{ '--primary': hsl, '--primary-foreground': fgHsl, '--ring': hsl } as React.CSSProperties}
    >
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        id="admin-sidebar"
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 ${collapsed ? 'md:w-16' : 'md:w-64'} bg-card border-r flex flex-col transform transition-[transform,width] duration-200 motion-reduce:transition-none ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Recolher / expandir (desktop) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-expanded={!collapsed}
          aria-controls="admin-sidebar"
          className="absolute -right-3 top-5 z-50 hidden h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
        </button>

        {/* Logo da Nimbo (versão escura no tema escuro); recolhida mostra só o ícone */}
        <div className={`p-4 flex h-14 items-center justify-between ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <Link to="/admin/dashboard" onClick={() => setOpen(false)} aria-label="Nimbo — ir para o Painel" className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className={hideWhenCollapsed}>
              <img src="/images/nimbo-logo-icon.png" alt="Nimbo" width={181} height={36} className="h-8 w-auto dark:hidden" />
              <img src="/images/nimbo-logo-branco.png" alt="Nimbo" width={181} height={36} className="hidden h-8 w-auto dark:block" />
            </span>
            {collapsed && (
              <img src="/images/favicon-32.png" alt="Nimbo" width={32} height={32} className="hidden h-8 w-8 rounded-lg md:block" />
            )}
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/* Nav */}
        <nav aria-label="Menu principal" className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden md:overflow-x-visible">

          {/* Itens principais */}
          {NAV_ITEMS.map(item => renderLink(item))}

          {/* Minha Conta — colapsável; recolhida, os itens aparecem direto como ícones */}
          <button
            onClick={() => setAccountOpen(v => !v)}
            aria-expanded={accountOpen}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hideWhenCollapsed}`}
          >
            <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 text-left">Minha Conta</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${accountOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          <div className={`${accountOpen ? '' : collapsed ? 'hidden md:block' : 'hidden'} ml-4 pl-3 border-l border-muted-foreground/20 space-y-0.5 ${collapsed ? 'md:ml-0 md:border-l-0 md:border-t md:pl-0 md:pt-2 md:mt-2' : ''}`}>
            {ACCOUNT_ITEMS.map(item => renderLink(item, true))}
          </div>

          {/* Portal do cliente — link rápido no final da nav */}
          <div className={`pt-2 ${hideWhenCollapsed}`}>
            <p className="px-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Portal do Cliente
            </p>
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
              <span className="flex-1 font-mono text-muted-foreground truncate">/{tenant.slug}</span>
              <button onClick={handleCopyPortal} title="Copiar link" aria-label="Copiar link do portal"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                {copied
                  ? <CheckCircle className="h-3.5 w-3.5 text-green-600" aria-hidden />
                  : <Copy className="h-3.5 w-3.5" aria-hidden />}
              </button>
              <button onClick={() => { setOpen(false); navigate(`/${tenant.slug}`); }} title="Abrir portal" aria-label="Abrir portal do cliente"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </nav>

        {/* Usuário + logout */}
        <div className="p-3 border-t space-y-1">
          <div className={`flex items-center gap-2 px-3 py-1.5 ${hideWhenCollapsed}`}>
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: accentColor }}>
              {user?.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className={`w-full justify-start text-muted-foreground gap-2 text-sm ${collapsed ? 'md:justify-center md:px-0' : ''}`}
            onClick={handleLogout}
            aria-label="Sair"
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="h-4 w-4" aria-hidden /> <span className={hideWhenCollapsed}>Sair</span>
          </Button>
        </div>
      </aside>

      {tip && createPortal(
        <div role="tooltip" style={{ position: 'fixed', left: 72, top: tip.top, transform: 'translateY(-50%)' }}
          className="pointer-events-none z-[60] whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md">
          {tip.label}
        </div>,
        document.body,
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-controls="admin-sidebar" aria-expanded={open}>
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <AdminSearch />
          <div className="flex-1" />
          <OpenStatus />
          {/* TODO: abrir o fluxo de novo agendamento (solicitação do zero). Por ora, só o botão. */}
          <Button type="button" size="sm" className="gap-1.5" aria-label="Novo agendamento" onClick={() => { /* TODO */ }}>
            <Plus className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Novo</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"}>
            {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </Button>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
            activeToasts={activeToasts}
            dismissToast={dismissToast}
            clearAll={clearAll}
          />
          <UserMenu name={user?.name ?? ""} email={user?.email} accentColor={accentColor} onLogout={handleLogout} />
        </header>
        {impersonating && (
          <div className="shrink-0 flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm dark:bg-amber-950/30">
            <Shield className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1 text-amber-800 dark:text-amber-300">
              Acessando como admin — <strong>{impersonating}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-amber-300 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
              onClick={exitImpersonation}
            >
              Voltar ao Super Admin
            </Button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
