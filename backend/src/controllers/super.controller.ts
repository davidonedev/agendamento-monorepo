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

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearStart  = new Date(now.getFullYear(), 0, 1).toISOString();

    const [tenant, todayCount, monthCount, yearCount, todayRev, monthRev, yearRev] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id },
        include: {
          professionals: {
            select: {
              id: true, name: true, specialty: true, avatar: true,
              _count: { select: { appointments: true } },
            },
          },
          services: {
            select: { id: true, name: true, price: true, duration: true, category: true },
          },
          _count: { select: { appointments: true, clients: true } },
        },
      }),
      // Contagens por período
      prisma.appointment.count({ where: { tenantId: id, date: { gte: todayStart } } }),
      prisma.appointment.count({ where: { tenantId: id, date: { gte: monthStart } } }),
      prisma.appointment.count({ where: { tenantId: id, date: { gte: yearStart  } } }),
      // Receita (apenas agendamentos concluídos)
      prisma.appointment.aggregate({ where: { tenantId: id, status: 'completed', date: { gte: todayStart } }, _sum: { price: true } }),
      prisma.appointment.aggregate({ where: { tenantId: id, status: 'completed', date: { gte: monthStart } }, _sum: { price: true } }),
      prisma.appointment.aggregate({ where: { tenantId: id, status: 'completed', date: { gte: yearStart  } }, _sum: { price: true } }),
    ]);

    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    res.json({
      success: true,
      data: {
        ...tenant,
        appointmentStats: {
          today: { count: todayCount, revenue: todayRev._sum?.price ?? 0 },
          month: { count: monthCount, revenue: monthRev._sum?.price ?? 0 },
          year:  { count: yearCount,  revenue: yearRev._sum?.price  ?? 0 },
        },
      },
    });
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

// ─── Listar usuários (admins + profissionais) ─────────────────────────────────
export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['tenant_admin', 'professional'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar e-mail de qualquer usuário ─────────────────────────────────────
const updateUserEmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export async function updateUserEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { email } = updateUserEmailSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      return next(new AppError('E-mail já está em uso', 400, 'EMAIL_IN_USE'));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { email },
      select: { id: true, name: true, email: true, role: true, tenantId: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Forçar nova senha de qualquer usuário ────────────────────────────────────
const forcePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export async function forceChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { newPassword } = forcePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError('Usuário não encontrado', 404));

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
  } catch (err) {
    next(err);
  }
}

// ─── Planos (PlanConfig) ──────────────────────────────────────────────────────

const PLAN_DEFAULTS = [
  {
    plan: 'basic' as const,
    displayName: 'Basic',
    defaultPrice: 97,
    maxProfessionals: 2,
    maxServices: 3,
    features: [
      'Até 2 profissionais',
      'Agendamento online',
      'Gestão de clientes',
      'Portal público personalizado',
      'Suporte via e-mail',
    ],
  },
  {
    plan: 'pro' as const,
    displayName: 'Pro',
    defaultPrice: 197,
    maxProfessionals: 5,
    maxServices: -1,
    features: [
      'Até 5 profissionais',
      'Agendamento online',
      'Gestão de clientes',
      'Relatórios avançados',
      'Portal público personalizado',
      'Gestão de produtos',
      'Suporte prioritário',
    ],
  },
  {
    plan: 'enterprise' as const,
    displayName: 'Premium',
    defaultPrice: 397,
    maxProfessionals: -1,
    maxServices: -1,
    features: [
      'Profissionais ilimitados',
      'Agendamento online',
      'Gestão de clientes',
      'Relatórios avançados',
      'Portal público personalizado',
      'Gestão de produtos',
      'Suporte dedicado 24/7',
      'Onboarding personalizado',
    ],
  },
];

export async function listPlanConfigs(_req: Request, res: Response, next: NextFunction) {
  try {
    // Garante que as configs existam (idempotente)
    for (const defaults of PLAN_DEFAULTS) {
      await prisma.planConfig.upsert({
        where: { plan: defaults.plan },
        create: defaults,
        update: {},
      });
    }

    const configs = await prisma.planConfig.findMany({
      orderBy: { plan: 'asc' },
    });

    res.json({ success: true, data: configs });
  } catch (err) {
    next(err);
  }
}

const updatePlanConfigSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  defaultPrice: z.number().min(0).optional(),
  maxProfessionals: z.number().int().min(-1).optional(),
  maxServices: z.number().int().min(-1).optional(),
  features: z.array(z.string().min(1)).optional(),
});

export async function updatePlanConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { plan } = req.params;
    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return next(new AppError('Plano inválido', 400));
    }

    const data = updatePlanConfigSchema.parse(req.body);

    const config = await prisma.planConfig.update({
      where: { plan: plan as 'basic' | 'pro' | 'enterprise' },
      data,
    });

    res.json({ success: true, data: config });
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
