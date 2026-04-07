import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';

// ─── Dados do tenant autenticado ─────────────────────────────────────────────
export async function getMyTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { professionals: true, services: true, clients: true, appointments: true },
        },
      },
    });

    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Dashboard do tenant ──────────────────────────────────────────────────────
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const today = new Date().toISOString().split('T')[0];

    const [
      todayAppointments,
      pendingCount,
      confirmedCount,
      completedCount,
      totalClients,
      totalRevenue,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { tenantId, date: today },
        include: { client: true, professional: true, service: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.appointment.count({ where: { tenantId, status: 'pending' } }),
      prisma.appointment.count({ where: { tenantId, status: 'confirmed' } }),
      prisma.appointment.count({ where: { tenantId, status: 'completed' } }),
      prisma.client.count({ where: { tenantId } }),
      prisma.appointment.aggregate({
        where: { tenantId, status: 'completed' },
        _sum: { price: true },
      }),
    ]);

    const todayRevenue = todayAppointments
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + a.price, 0);

    res.json({
      success: true,
      data: {
        today: { appointments: todayAppointments, revenue: todayRevenue },
        stats: {
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedCount,
          totalClients,
          totalRevenue: totalRevenue._sum.price ?? 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar configurações do tenant ────────────────────────────────────────
const updateSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  adminColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  isOpen: z.boolean().optional(),
  minAdvanceMinutes: z.number().int().min(0).max(1440).optional(),
});

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = updateSettingsSchema.parse(req.body);
    const tenant = await prisma.tenant.update({ where: { id: tenantId }, data });

    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Relatório de receita ─────────────────────────────────────────────────────
const revenueQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  professionalId: z.string().uuid().optional(),
});

export async function getRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const { startDate, endDate, professionalId } = revenueQuerySchema.parse(req.query);

    const where = {
      tenantId,
      status: 'completed' as const,
      date: { gte: startDate, lte: endDate },
      ...(professionalId && { professionalId }),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });

    // Agrupar por data
    const byDate = appointments.reduce<Record<string, number>>((acc, a) => {
      acc[a.date] = (acc[a.date] ?? 0) + a.price;
      return acc;
    }, {});

    // Agrupar por serviço
    const byService = appointments.reduce<Record<string, { name: string; revenue: number; count: number }>>((acc, a) => {
      const key = a.serviceId;
      if (!acc[key]) acc[key] = { name: a.service.name, revenue: 0, count: 0 };
      acc[key].revenue += a.price;
      acc[key].count += 1;
      return acc;
    }, {});

    // Agrupar por profissional
    const byProfessional = appointments.reduce<Record<string, { name: string; revenue: number; count: number }>>((acc, a) => {
      const key = a.professionalId;
      if (!acc[key]) acc[key] = { name: a.professional.name, revenue: 0, count: 0 };
      acc[key].revenue += a.price;
      acc[key].count += 1;
      return acc;
    }, {});

    const totalRevenue = appointments.reduce((sum, a) => sum + a.price, 0);

    res.json({
      success: true,
      data: {
        total: totalRevenue,
        count: appointments.length,
        byDate,
        byService: Object.values(byService),
        byProfessional: Object.values(byProfessional),
      },
    });
  } catch (err) {
    next(err);
  }
}
