import { prisma } from '../config/database';

interface ConflictCheckParams {
  tenantId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}

/**
 * Verifica se existe conflito de horário para um profissional.
 * Retorna true se houver conflito.
 */
export async function checkConflict(params: ConflictCheckParams): Promise<boolean> {
  const { tenantId, professionalId, date, startTime, endTime, excludeAppointmentId } = params;

  const [appointmentConflict, blockedConflict] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        tenantId,
        professionalId,
        date,
        status: { notIn: ['cancelled'] },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    }),
    prisma.blockedSlot.findFirst({
      where: {
        tenantId,
        professionalId,
        date,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    }),
  ]);

  return !!(appointmentConflict || blockedConflict);
}

/**
 * Gera lista de slots de horário dado um intervalo, duração do bloco e passo.
 *
 * @param start         Hora de início (HH:mm)
 * @param end           Hora de fim (HH:mm)
 * @param blockDuration Duração total que precisa estar livre a partir do slot (min)
 * @param step          Intervalo entre slots oferecidos (min). Padrão: 15
 *
 * Ex: start="08:00", end="18:00", blockDuration=30, step=15
 *   → ["08:00","08:15","08:30","08:45","09:00",...]
 */
export function generateTimeSlots(
  start: string,
  end: string,
  blockDuration: number,
  step = 15,
): string[] {
  const slots: string[] = [];

  const [startH, startM] = start.split(':').map(Number);
  const [endH,   endM]   = end.split(':').map(Number);

  let current    = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current + blockDuration <= endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += step;
  }

  return slots;
}

/**
 * Retorna os agendamentos de um profissional em um dia.
 */
export async function getProfessionalSchedule(
  tenantId: string,
  professionalId: string,
  date: string
) {
  return prisma.appointment.findMany({
    where: {
      tenantId,
      professionalId,
      date,
      status: { notIn: ['cancelled'] },
    },
    include: { client: true, service: true },
    orderBy: { startTime: 'asc' },
  });
}
