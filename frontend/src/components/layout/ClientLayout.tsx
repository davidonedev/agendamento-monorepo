import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';

export default function ClientLayout() {
  const { data: { tenant } } = usePublicTenant();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'services' | 'booking'>('services');

  const goTo = (t: 'services' | 'booking') => {
    setTab(t);
    navigate(t === 'booking' ? `/${tenant.slug}/booking` : `/${tenant.slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with tenant branding */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
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

          <nav className="flex items-center gap-1">
            {(['services', 'booking'] as const).map(t => (
              <Button
                key={t}
                variant={tab === t ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goTo(t)}
                style={tab === t ? { backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor } : {}}
              >
                {t === 'booking' && <CalendarCheck className="h-4 w-4 mr-1" />}
                {t === 'services' ? 'Serviços' : 'Agendar'}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet context={{ setTab }} />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>{tenant.name} · Agendamento online via AgendePro</p>
      </footer>
    </div>
  );
}
