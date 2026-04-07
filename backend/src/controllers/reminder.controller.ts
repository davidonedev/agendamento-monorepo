import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';

const querySchema = z.object({
  daysSince: z.coerce.number().int().min(1).max(365).default(30),
});

/**
 * GET /api/admin/reminders/absent-clients?daysSince=30
 *
 * Retorna clientes cujo ÚLTIMO agendamento (não cancelado) foi há mais de
 * `daysSince` dias, ou que nunca tiveram agendamentos após o cadastro.
 * Inclui apenas clientes com telefone cadastrado.
 */
export async function listAbsentClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const { daysSince } = querySchema.parse(req.query);

    // Data de corte: hoje - daysSince dias (formato YYYY-MM-DD)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSince);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Busca todos os clientes com telefone + seus agendamentos não cancelados
    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        phone: { not: null },
      },
      include: {
        appointments: {
          where: { status: { notIn: ['cancelled'] } },
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true, status: true, service: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filtra: clientes sem nenhum agendamento OU cujo último foi antes da data de corte
    const absent = clients
      .filter(c => {
        const last = c.appointments[0];
        return !last || last.date <= cutoffStr;
      })
      .map(c => {
        const last = c.appointments[0];
        // Dias ausente
        const daysMissing = last
          ? Math.floor((Date.now() - new Date(last.date + 'T12:00:00').getTime()) / 86_400_000)
          : null;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone!,
          email: c.email,
          createdAt: c.createdAt,
          lastAppointmentDate: last?.date ?? null,
          lastServiceName: last?.service?.name ?? null,
          daysMissing,
        };
      })
      // ordena pelos mais ausentes primeiro
      .sort((a, b) => (b.daysMissing ?? 9999) - (a.daysMissing ?? 9999));

    res.json({ success: true, data: absent });
  } catch (err) {
    next(err);
  }
}
