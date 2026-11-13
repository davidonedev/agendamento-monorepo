import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Busca do painel — por enquanto só a interface.
 * TODO: ligar à busca (clientes, agendamentos, serviços) e ao atalho Ctrl+K.
 */
export function AdminSearch() {
  return (
    <>
      {/* Mobile: vira só o ícone */}
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buscar" type="button">
        <Search className="h-4 w-4" aria-hidden />
      </Button>

      <div className="relative hidden w-full max-w-xs md:block lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar"
          className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline" aria-hidden>
          Ctrl K
        </kbd>
      </div>
    </>
  );
}
