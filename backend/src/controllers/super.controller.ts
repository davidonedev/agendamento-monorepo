import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../types';

// ─── Listar todos os tenants ──────────────────────────────────────────────────
export async function listTenants(_req: Request, res: Response, next: NextFunction) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { professionals: true, services: true, clients: true, appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tenants });
  } catch (err) {
    next(err);
  }
}

// ─── Detalhe de um tenant ─────────────────────────────────────────────────────
export async function getTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        professionals: { include: { services: { include: { service: true } } } },
        services: true,
        clients: true,
        appointments: {
          include: { client: true, professional: true, service: true },
          orderBy: { date: 'desc' },
          take: 50,
        },
        _count: { select: { appointments: true, clients: true } },
      },
    });

    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Criar tenant ─────────────────────────────────────────────────────────────
const createTenantSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  name: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  monthlyPrice: z.number().min(0).default(0),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  adminPassword: z.string().min(6, 'Senha do admin deve ter no mínimo 6 caracteres'),
});

export async function createTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTenantSchema.parse(req.body);

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existingSlug) return next(new AppError('Slug já em uso', 409, 'DUPLICATE_SLUG'));

    const existingEmail = await prisma.tenant.findUnique({ where: { email: data.email } });
    if (existingEmail) return next(new AppError('E-mail já em uso', 409, 'DUPLICATE_EMAIL'));

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug: data.slug,
          name: data.name,
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          plan: data.plan,
          monthlyPrice: data.monthlyPrice,
          primaryColor: data.primaryColor,
          status: 'trial',
        },
      });

      const passwordHash = await bcrypt.hash(data.adminPassword, env.BCRYPT_ROUNDS);
      await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.email,
          passwordHash,
          role: 'tenant_admin',
          tenantId: newTenant.id,
        },
      });

      return newTenant;
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar tenant (status, plan, etc.) ───────────────────────────────────
const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'trial', 'suspended']).optional(),
  plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
  monthlyPrice: z.number().min(0).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function updateTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateTenantSchema.parse(req.body);

    const tenant = await prisma.tenant.update({ where: { id }, data });
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar tenant ───────────────────────────────────────────────────────────
export async function deleteTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.tenant.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Métricas da plataforma ───────────────────────────────────────────────────
export async function getPlatformMetrics(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalProfessionals,
      totalClients,
      totalAppointments,
      completedAppointments,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenant.count({ where: { status: 'trial' } }),
      prisma.tenant.count({ where: { status: 'suspended' } }),
      prisma.professional.count(),
      prisma.client.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'completed' } }),
    ]);

    const revenueResult = await prisma.appointment.aggregate({
      where: { status: 'completed' },
      _sum: { price: true },
    });

    const tenantsByPlan = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    const mrrResult = await prisma.tenant.aggregate({
      where: { status: { in: ['active', 'trial'] } },
      _sum: { monthlyPrice: true },
    });

    res.json({
      success: true,
      data: {
        totals: {
          tenants: totalTenants,
          professionals: totalProfessionals,
          clients: totalClients,
          appointments: totalAppointments,
          completedAppointments,
        },
        tenantsByStatus: { active: activeTenants, trial: trialTenants, suspended: suspendedTenants },
        tenantsByPlan: tenantsByPlan.reduce((acc, g) => ({ ...acc, [g.plan]: g._count.id }), {}),
        revenue: {
          total: revenueResult._sum.price ?? 0,
          mrr: mrrResult._sum.monthlyPrice ?? 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
