import { Link } from 'react-router-dom';
import { Eye, ExternalLink, LogIn, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StatusAction } from './tenantMeta';

interface TenantActionsMenuProps {
  tenant: { id: string; name: string; slug: string };
  statusActions: StatusAction[];
  showDetails?: boolean;
  showPortal?: boolean;
  onEdit?: () => void;
  onImpersonate?: () => void;
  onStatus: (action: StatusAction) => void;
  onDelete: () => void;
}

export function TenantActionsMenu({
  tenant, statusActions, showDetails = true, showPortal = true, onEdit, onImpersonate, onStatus, onDelete,
}: TenantActionsMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações de ${tenant.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showDetails && (
          <DropdownMenuItem asChild>
            <Link to={`/super/tenants/${tenant.id}`}><Eye /> Ver detalhes</Link>
          </DropdownMenuItem>
        )}
        {showPortal && (
          <DropdownMenuItem asChild>
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Abrir portal
            </a>
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={onEdit}><Pencil /> Editar</DropdownMenuItem>
        )}
        {onImpersonate && (
          <DropdownMenuItem onSelect={onImpersonate}><LogIn /> Acessar painel</DropdownMenuItem>
        )}
        {statusActions.map(action => (
          <DropdownMenuItem
            key={action.next}
            destructive={action.destructive}
            onSelect={() => onStatus(action)}
          >
            <action.Icon /> {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}><Trash2 /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
