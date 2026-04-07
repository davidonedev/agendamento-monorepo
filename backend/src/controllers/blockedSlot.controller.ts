import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';

const blockedSlotSchema = z.object({
  professionalId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm'),
  reason: z.string().max(200).optional(),
});

// ─── Listar horários bloqueados ───────────────────────────────────────────────
export async function listBlockedSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const { professionalId, date, startDate, endDate } = req.query as {
      professionalId?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
    };

    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        tenantId,
        ...(professionalId && { professionalId }),
        ...(date && { date }),
        ...(startDate || endDate
          ? { date: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) } }
          : {}),
      },
      include: { professional: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, data: blockedSlots });
  } catch (err) {
    next(err);
  }
}

// ─── Criar horário bloqueado ──────────────────────────────────────────────────
export async function createBlockedSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = blockedSlotSchema.parse(req.body);

    // Verificar que o profissional pertence ao tenant
    const professional = await prisma.professional.findFirst({
      where: { id: data.professionalId, tenantId },
    });
    if (!professional) return next(new AppError('Profissional não encontrado', 404));

    if (data.startTime >= data.endTime) {
      return next(new AppError('Horário de início deve ser anterior ao horário de fim', 400));
    }

    const blockedSlot = await prisma.blockedSlot.create({
      data: { ...data, tenantId },
      include: { professional: true },
    });

    res.status(201).json({ success: true, data: blockedSlot });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar horário bloqueado ────────────────────────────────────────────────
export async function deleteBlockedSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.blockedSlot.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Horário bloqueado não encontrado', 404));

    await prisma.blockedSlot.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
