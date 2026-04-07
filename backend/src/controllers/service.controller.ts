import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest, PLAN_LIMITS } from '../types';

const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Preço deve ser positivo'),
  duration: z.number().int().positive('Duração deve ser positiva (minutos)'),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

// ─── Listar serviços ──────────────────────────────────────────────────────────
export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const services = await prisma.service.findMany({
      where: { tenantId },
      include: {
        professionals: { include: { professional: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
}

// ─── Criar serviço ────────────────────────────────────────────────────────────
export async function createService(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = serviceSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    const limit = PLAN_LIMITS[tenant.plan].services;
    const currentCount = await prisma.service.count({ where: { tenantId } });

    if (currentCount >= limit) {
      return next(new AppError(`Limite de serviços atingido para o plano ${tenant.plan}`, 403, 'PLAN_LIMIT_REACHED'));
    }

    const service = await prisma.service.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar serviço ────────────────────────────────────────────────────────
export async function updateService(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.service.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Serviço não encontrado', 404));

    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({ where: { id }, data });

    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar serviço ──────────────────────────────────────────────────────────
export async function deleteService(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.service.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Serviço não encontrado', 404));

    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
