import type { Professional, Tenant } from '../types';

/**
 * Aberto/Fechado do estabelecimento — ÚNICO ponto que decide o estado exibido na navbar.
 * TODO: o tenant ainda não tem horário de funcionamento próprio. Enquanto isso, está "aberto" quando
 * o portal aceita agendamentos (tenant.isOpen) e algum profissional trabalha neste dia e horário.
 * Quando o backend expuser o horário do estabelecimento, troque só esta função.
 */
export function computeOpenStatus(
  tenant: Pick<Tenant, 'isOpen'>,
  professionals: Pick<Professional, 'workingDays' | 'workingHours'>[],
  now: Date = new Date(),
): boolean {
  if (!tenant.isOpen) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  return professionals.some(p =>
    p.workingDays.includes(now.getDay()) &&
    minutes >= toMin(p.workingHours.start) &&
    minutes < toMin(p.workingHours.end),
  );
}
