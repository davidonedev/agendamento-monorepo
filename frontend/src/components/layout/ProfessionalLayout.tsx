import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, BarChart3, CalendarClock, LogOut, Menu, X, Sun, Moon, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useProfessional } from '@/context/ProfessionalContext';
import { useTheme } from '@/hooks/useTheme';
import { hexToHslVars } from '@/lib/utils';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';

const NAV_ITEMS = [
  { to: '/professional/agenda',    label: 'Minha Agenda',    icon: Calendar      },
  { to: '/professional/services',  label: 'Serviços',        icon: Scissors      },
  { to: '/professional/revenue',   label: 'Meu Faturamento', icon: BarChart3     },
  { to: '/professional/settings',  label: 'Disponibilidade', icon: CalendarClock },
];

export default function ProfessionalLayout() {
  const { logout }                                              = useAuth();
  const { professional, tenant, appointments, clients, services } = useProfessional();
  const { isDark, toggle }                                      = useTheme();
  const navigate                                                = useNavigate();
  const [open, setOpen]                                         = useState(false);

  const { notifications, unreadCount, markAllRead, activeToasts, dismissToast } =
    useAppointmentNotifications(appointments, clients, services);

  const accentColor           = tenant.adminColor ?? tenant.primaryColor;
  const { hsl, isLight }      = hexToHslVars(accentColor);
  const fgHsl                 = isLight ? '222 47% 11%' : '0 0% 100%';

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div
      className="flex h-screen bg-muted/30 overflow-hidden"
      style={{ '--primary': hsl, '--primary-foreground': fgHsl, '--ring': hsl } as React.CSSProperties}
    >
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Professional identity */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              {professional.photoUrl && <AvatarImage src={professional.photoUrl} alt={professional.name} className="object-cover" />}
              <AvatarFallback className="text-white font-bold" style={{ backgroundColor: accentColor }}>
                {professional.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{professional.name}</p>
              <p className="text-xs text-muted-foreground truncate">{professional.specialty}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground truncate">{tenant.name}</p>
        </div>

        <Separator />

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
                }
                style={({ isActive }) => isActive ? { backgroundColor: accentColor } : {}}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <Separator />
        <div className="p-3 space-y-1">
          <div className="px-3 py-1 text-xs text-muted-foreground truncate">{professional.email}</div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground gap-2 text-sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

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
          />
          <Button variant="ghost" size="icon" onClick={toggle} title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Avatar className="h-8 w-8 shrink-0">
            {professional.photoUrl && <AvatarImage src={professional.photoUrl} alt={professional.name} className="object-cover" />}
            <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: accentColor }}>
              {professional.avatar}
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
