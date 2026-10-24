import { Link } from 'react-router-dom';
import { Calendar, Mail, Scissors, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { PlanConfig } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';
import { PlanUsageBar } from './PlanUsageBar';
import { TenantActionsMenu } from './TenantActionsMenu';
import { TenantAvatar } from './TenantAvatar';
import {
  PLAN_CONFIG, STATUS_CONFIG, getPlanConfig, getStatusActions, getUsage, timeAgo, type StatusAction,
} from './tenantMeta';

interface TenantCardProps {
  tenant: TenantWithCounts;
  planConfigs: PlanConfig[];
  onEdit: (tenant: TenantWithCounts) => void;
  onImpersonate: (tenant: TenantWithCounts) => void;
  onStatus: (tenant: TenantWithCounts, action: StatusAction) => void;
  onDelete: (tenant: TenantWithCounts) => void;
}

export function TenantCard({ tenant, planConfigs, onEdit, onImpersonate, onStatus, onDelete }: TenantCardProps) {
  const status = STATUS_CONFIG[tenant.status];
  const plan = PLAN_CONFIG[tenant.plan];
  const counts = tenant._count;
  const cfg = getPlanConfig(tenant.plan, planConfigs);

  const metrics = [
    { Icon: Users,     value: counts?.professionals ?? 0, label: 'Profissionais' },
    { Icon: Scissors,  value: counts?.services ?? 0,      label: 'Serviços' },
    { Icon: UserCheck, value: counts?.clients ?? 0,       label: 'Clientes' },
    { Icon: Calendar,  value: counts?.appointments ?? 0,  label: 'Agendam.' },
  ];

  return (
    <Card className="group relative h-full overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <TenantAvatar name={tenant.name} logoUrl={tenant.logoUrl} primaryColor={tenant.primaryColor} size="lg" />
          <div className="min-w-0 flex-1">
            <Link
              to={`/super/tenants/${tenant.id}`}
              className="block truncate font-semibold leading-tight outline-none after:absolute after:inset-0 after:content-['']"
            >
              {tenant.name}
            </Link>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/{tenant.slug}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{tenant.ownerName} · {tenant.email}</span>
            </p>
          </div>
          <div className="relative z-10 -mr-2 -mt-1 shrink-0">
            <TenantActionsMenu
              tenant={tenant}
              statusActions={getStatusActions(tenant.status)}
              onEdit={() => onEdit(tenant)}
              onImpersonate={() => onImpersonate(tenant)}
              onStatus={action => onStatus(tenant, action)}
              onDelete={() => onDelete(tenant)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={plan.variant} className="gap-1"><plan.Icon className="h-3 w-3" aria-hidden="true" />{plan.label}</Badge>
          {!tenant.isOpen && <Badge variant="outline">Portal fechado</Badge>}
        </div>

        <dl className="grid grid-cols-4 gap-1 rounded-lg bg-muted/40 px-1 py-2.5 text-center">
          {metrics.map(({ Icon, value, label }) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {cfg && (
          <div className="space-y-2">
            <PlanUsageBar label="Profissionais" usage={getUsage(counts?.professionals ?? 0, cfg.maxProfessionals)} />
            <PlanUsageBar label="Serviços" usage={getUsage(counts?.services ?? 0, cfg.maxServices)} />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
          <span className="font-semibold text-primary">{formatCurrency(tenant.monthlyPrice)}<span className="font-normal text-muted-foreground">/mês</span></span>
          <span className="text-muted-foreground">Cliente {timeAgo(tenant.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
