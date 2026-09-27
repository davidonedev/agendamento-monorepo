import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { PlanConfig } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';
import { TenantActionsMenu } from './TenantActionsMenu';
import { TenantAvatar } from './TenantAvatar';
import {
  PLAN_CONFIG, STATUS_CONFIG, getPlanConfig, getStatusActions, getUsage, type StatusAction, type UsageItem,
} from './tenantMeta';

export type SortKey = 'name' | 'status' | 'plan' | 'clients' | 'appointments' | 'price' | 'createdAt';
export type SortDir = 'asc' | 'desc';

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

function SortHeader({ label, sortKey, sort, onSort, align = 'left', className = '' }: SortHeaderProps) {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-3 font-medium text-muted-foreground ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex w-full items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${justify} ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </button>
    </th>
  );
}

function usageText(label: string, usage: UsageItem | null): string | null {
  if (!usage) return null;
  return usage.unlimited ? `${label} ${usage.used}` : `${label} ${usage.used}/${usage.max}`;
}

const USAGE_TEXT_COLOR = {
  ok: 'text-muted-foreground',
  warn: 'text-amber-600 dark:text-amber-400',
  full: 'text-destructive',
};

interface TenantsTableProps {
  tenants: TenantWithCounts[];
  planConfigs: PlanConfig[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  onEdit: (tenant: TenantWithCounts) => void;
  onStatus: (tenant: TenantWithCounts, action: StatusAction) => void;
  onDelete: (tenant: TenantWithCounts) => void;
}

export function TenantsTable({ tenants, planConfigs, sort, onSort, onEdit, onStatus, onDelete }: TenantsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <SortHeader label="Tenant" sortKey="name" sort={sort} onSort={onSort} className="pl-4" />
              <th scope="col" className="hidden px-3 py-3 font-medium text-muted-foreground md:table-cell">Responsável</th>
              <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
              <SortHeader label="Plano" sortKey="plan" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
              <th scope="col" className="hidden px-3 py-3 font-medium text-muted-foreground xl:table-cell">Uso do plano</th>
              <SortHeader label="Clientes" sortKey="clients" sort={sort} onSort={onSort} align="right" className="hidden lg:table-cell" />
              <SortHeader label="Agendam." sortKey="appointments" sort={sort} onSort={onSort} align="right" className="hidden lg:table-cell" />
              <SortHeader label="Mensalidade" sortKey="price" sort={sort} onSort={onSort} align="right" className="hidden sm:table-cell" />
              <SortHeader label="Desde" sortKey="createdAt" sort={sort} onSort={onSort} align="right" className="hidden md:table-cell" />
              <th scope="col" className="w-14 px-3 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tenants.map(tenant => {
              const status = STATUS_CONFIG[tenant.status];
              const plan = PLAN_CONFIG[tenant.plan];
              const cfg = getPlanConfig(tenant.plan, planConfigs);
              const profUsage = cfg ? getUsage(tenant._count?.professionals ?? 0, cfg.maxProfessionals) : null;
              const servUsage = cfg ? getUsage(tenant._count?.services ?? 0, cfg.maxServices) : null;

              return (
                <tr
                  key={tenant.id}
                  onClick={() => navigate(`/super/tenants/${tenant.id}`)}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                >
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-2.5">
                      <TenantAvatar name={tenant.name} logoUrl={tenant.logoUrl} primaryColor={tenant.primaryColor} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/super/tenants/${tenant.id}`}
                          onClick={e => e.stopPropagation()}
                          className="block truncate font-medium leading-tight hover:underline"
                        >
                          {tenant.name}
                        </Link>
                        <p className="font-mono text-[11px] text-muted-foreground">/{tenant.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <p className="max-w-[160px] truncate">{tenant.ownerName}</p>
                    <p className="max-w-[160px] truncate text-xs text-muted-foreground">{tenant.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <Badge variant={plan.variant} className="gap-1"><plan.Icon className="h-3 w-3" aria-hidden="true" />{plan.label}</Badge>
                  </td>
                  <td className="hidden px-3 py-3 text-xs xl:table-cell">
                    {profUsage && servUsage ? (
                      <div className="space-y-0.5">
                        <p className={USAGE_TEXT_COLOR[profUsage.level]}>{usageText('Prof.', profUsage)}</p>
                        <p className={USAGE_TEXT_COLOR[servUsage.level]}>{usageText('Serv.', servUsage)}</p>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums lg:table-cell">{tenant._count?.clients ?? 0}</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums lg:table-cell">{tenant._count?.appointments ?? 0}</td>
                  <td className="hidden px-3 py-3 text-right font-medium tabular-nums sm:table-cell">{formatCurrency(tenant.monthlyPrice)}</td>
                  <td className="hidden px-3 py-3 text-right text-xs text-muted-foreground md:table-cell">
                    {format(parseISO(tenant.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <TenantActionsMenu
                        tenant={tenant}
                        statusActions={getStatusActions(tenant.status)}
                        onEdit={() => onEdit(tenant)}
                        onStatus={action => onStatus(tenant, action)}
                        onDelete={() => onDelete(tenant)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
