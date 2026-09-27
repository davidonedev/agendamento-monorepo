import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UsageItem, UsageLevel } from './tenantMeta';

const BAR_COLOR: Record<UsageLevel, string> = {
  ok: 'bg-primary',
  warn: 'bg-amber-500',
  full: 'bg-destructive',
};

const TEXT_COLOR: Record<UsageLevel, string> = {
  ok: 'text-foreground',
  warn: 'text-amber-600 dark:text-amber-400',
  full: 'text-destructive',
};

interface PlanUsageBarProps {
  label: string;
  usage: UsageItem | null;
}

export function PlanUsageBar({ label, usage }: PlanUsageBarProps) {
  if (!usage) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium tabular-nums', TEXT_COLOR[usage.level])}>
          {usage.unlimited ? `${usage.used} · ilimitado` : `${usage.used} de ${usage.max}`}
        </span>
      </div>
      {!usage.unlimited && (
        <Progress
          value={usage.percent}
          indicatorClassName={BAR_COLOR[usage.level]}
          aria-label={`${label}: ${usage.used} de ${usage.max}`}
        />
      )}
    </div>
  );
}
