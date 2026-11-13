import { useEffect, useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { computeOpenStatus } from '@/lib/businessStatus';

/**
 * "Aberto" com bolinha verde pulsando; "Fechado" com bolinha vermelha estática (um vermelho piscando
 * lê como alarme). O pulso respeita prefers-reduced-motion (motion-reduce). Reavalia a cada minuto.
 */
export function OpenStatus() {
  const { tenant, professionals } = useTenant();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const open = computeOpenStatus(tenant, professionals, now);

  return (
    <div role="status" className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium">
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60 motion-reduce:animate-none" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
      </span>
      <span className="hidden sm:inline">{open ? 'Aberto' : 'Fechado'}</span>
      <span className="sr-only sm:hidden">{open ? 'Aberto' : 'Fechado'}</span>
    </div>
  );
}
