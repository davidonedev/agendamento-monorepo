import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError, AuthRequest, PLAN_LIMITS } from '../types';

// z.preprocess normaliza o valor ANTES da validação Zod — evita rejeições
// por string vazia, undefined inesperado, ou segundos no horário (HH:MM:SS).
const normalizeTime = (v: unknown) =>
  typeof v === 'string' ? v.slice(0, 5) : v;

const professionalSchema = z.object({
  name:      z.string().min(2, 'Nome obrigatório').max(100),
  specialty: z.preprocess(v => v ?? '', z.string().max(100)).default(''),
  bio:       z.preprocess(v => v ?? '', z.string().max(500)).default(''),
  avatar:    z.preprocess(v => v ?? '', z.string()).default(''),
  // Aceita data URLs base64, URLs normais ou ausência de foto
  photoUrl:  z.string().optional().nullable(),

  // Aceita HH:MM ou HH:MM:SS (browsers mobile às vezes retornam com segundos)
  workingHoursStart: z.preprocess(
    normalizeTime,
    z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido — use HH:MM'),
  ).default('08:00'),
  workingHoursEnd: z.preprocess(
    normalizeTime,
    z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido — use HH:MM'),
  ).default('18:00'),

  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  serviceIds:  z.array(z.string()).default([]),

  // String vazia → undefined (não cria User sem email válido)
  email:    z.preprocess(v => (v === '' ? undefined : v), z.string().email().optional()),
  password: z.preprocess(v => (v === '' ? undefined : v), z.string().min(4).optional()),
});

// ─── Listar profissionais do tenant ──────────────────────────────────────────
export async function listProfessionals(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const professionals = await prisma.professional.findMany({
      where: { tenantId },
      include: {
        services: { include: { service: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: professionals });
  } catch (err) {
    next(err);
  }
}

// ─── Buscar um profissional ───────────────────────────────────────────────────
export async function getProfessional(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const professional = await prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
        services: { include: { service: true } },
        appointments: {
          orderBy: { date: 'desc' },
          take: 20,
          include: { client: true, service: true },
        },
      },
    });

    if (!professional) return next(new AppError('Profissional não encontrado', 404));

    res.json({ success: true, data: professional });
  } catch (err) {
    next(err);
  }
}

// ─── Criar profissional ───────────────────────────────────────────────────────
export async function createProfessional(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = professionalSchema.parse(req.body);

    // Verificar limite do plano
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    const limit = PLAN_LIMITS[tenant.plan].professionals;
    const currentCount = await prisma.professional.count({ where: { tenantId } });

    if (currentCount >= limit) {
      return next(new AppError(`Limite de profissionais atingido para o plano ${tenant.plan}`, 403, 'PLAN_LIMIT_REACHED'));
    }

    const professional = await prisma.$transaction(async (tx) => {
      const prof = await tx.professional.create({
        data: {
          tenantId,
          name: data.name,
          specialty: data.specialty,
          bio: data.bio,
          avatar: data.avatar,
          photoUrl: data.photoUrl,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd: data.workingHoursEnd,
          workingDays: data.workingDays,
        },
      });

      if (data.serviceIds.length > 0) {
        await tx.professionalService.createMany({
          data: data.serviceIds.map((serviceId) => ({ professionalId: prof.id, serviceId })),
          skipDuplicates: true,
        });
      }

      // Criar acesso à plataforma se email/senha fornecidos
      if (data.email && data.password) {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
        await tx.user.upsert({
          where: { email: data.email },
          update: { passwordHash, professionalId: prof.id, tenantId },
          create: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: 'professional',
            tenantId,
            professionalId: prof.id,
          },
        });
      }

      return prof;
    });

    const result = await prisma.professional.findUnique({
      where: { id: professional.id },
      include: { services: { include: { service: true } } },
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar profissional ───────────────────────────────────────────────────
export async function updateProfessional(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.professional.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Profissional não encontrado', 404));

    const data = professionalSchema.partial().parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.professional.update({
        where: { id },
        data: {
          name: data.name,
          specialty: data.specialty,
          bio: data.bio,
          avatar: data.avatar,
          photoUrl: data.photoUrl,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd: data.workingHoursEnd,
          workingDays: data.workingDays,
        },
      });

      if (data.serviceIds !== undefined) {
        await tx.professionalService.deleteMany({ where: { professionalId: id } });
        if (data.serviceIds.length > 0) {
          await tx.professionalService.createMany({
            data: data.serviceIds.map((serviceId) => ({ professionalId: id, serviceId })),
            skipDuplicates: true,
          });
        }
      }

      if (data.email && data.password) {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
        await tx.user.upsert({
          where: { email: data.email },
          update: { passwordHash, professionalId: id, tenantId },
          create: {
            name: data.name ?? existing.name,
            email: data.email,
            passwordHash,
            role: 'professional',
            tenantId,
            professionalId: id,
          },
        });
      }
    });

    const result = await prisma.professional.findUnique({
      where: { id },
      include: { services: { include: { service: true } } },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar profissional ─────────────────────────────────────────────────────
export async function deleteProfessional(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.professional.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Profissional não encontrado', 404));

    await prisma.professional.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
