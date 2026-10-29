import { Power, PowerOff, Star, Zap, Crown, type LucideIcon } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PlanConfig, TenantPlan, TenantStatus } from '@/types';

// ─── Status e plano (fonte única para toda a área de tenants) ─────────────────
export const STATUS_CONFIG: Record<TenantStatus, {
  label: string;
  variant: 'success' | 'warning' | 'destructive';
  rank: number;
}> = {
  active:    { label: 'Ativo',    variant: 'success',     rank: 0 },
  trial:     { label: 'Trial',    variant: 'warning',     rank: 1 },
  suspended: { label: 'Suspenso', variant: 'destructive', rank: 2 },
};

export const PLAN_CONFIG: Record<TenantPlan, {
  label: string;
  variant: 'outline' | 'default' | 'secondary';
  Icon: LucideIcon;
  rank: number;
}> = {
  basic:      { label: 'Basic',      variant: 'outline',   Icon: Star,  rank: 0 },
  pro:        { label: 'Pro',        variant: 'default',   Icon: Zap,   rank: 1 },
  enterprise: { label: 'Enterprise', variant: 'secondary', Icon: Crown, rank: 2 },
};

export const STATUS_KEYS = Object.keys(STATUS_CONFIG) as TenantStatus[];
export const PLAN_KEYS = Object.keys(PLAN_CONFIG) as TenantPlan[];

// ─── Ações de status disponíveis para cada estado atual ───────────────────────
export interface StatusAction {
  next: TenantStatus;
  label: string;
  Icon: LucideIcon;
  destructive: boolean;
}

const SUSPEND: StatusAction = { next: 'suspended', label: 'Suspender', Icon: PowerOff, destructive: true };

export function getStatusActions(status: TenantStatus): StatusAction[] {
  switch (status) {
    case 'active':
      return [SUSPEND];
    case 'trial':
      return [{ next: 'active', label: 'Ativar', Icon: Power, destructive: false }, SUSPEND];
    case 'suspended':
      return [{ next: 'active', label: 'Reativar', Icon: Power, destructive: false }];
  }
}

export const STATUS_EFFECT: Partial<Record<TenantStatus, string>> = {
  suspended: 'O portal do cliente e o login do administrador e dos profissionais ficarão bloqueados imediatamente.',
  active: 'O portal do cliente e os acessos voltarão a funcionar imediatamente.',
};

// ─── Uso do plano ─────────────────────────────────────────────────────────────
export type UsageLevel = 'ok' | 'warn' | 'full';

export interface UsageItem {
  used: number;
  max: number;
  unlimited: boolean;
  percent: number;
  level: UsageLevel;
}

/** `max` de PlanConfig: -1 = ilimitado; undefined = plano sem configuração carregada. */
export function getUsage(used: number, max: number | undefined): UsageItem | null {
  if (max === undefined) return null;
  if (max < 0) return { used, max, unlimited: true, percent: 0, level: 'ok' };
  const percent = max === 0 ? 100 : Math.round((used / max) * 100);
  const level: UsageLevel = percent >= 100 ? 'full' : percent >= 80 ? 'warn' : 'ok';
  return { used, max, unlimited: false, percent, level };
}

export function getPlanConfig(plan: TenantPlan, planConfigs: PlanConfig[]) {
  return planConfigs.find(p => p.plan === plan);
}

// ─── Formatação ───────────────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR });
}

export function formatMinutes(min: number): string {
  if (min <= 0) return 'Sem antecedência mínima';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Número de telefone para link do WhatsApp (assume Brasil quando não há DDI). */
export function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}
