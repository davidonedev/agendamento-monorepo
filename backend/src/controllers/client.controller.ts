import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';

const clientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
});

// ─── Listar clientes ──────────────────────────────────────────────────────────
export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const { search } = req.query as { search?: string };

    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
}

// ─── Buscar cliente + histórico ───────────────────────────────────────────────
export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        appointments: {
          include: { service: true, professional: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!client) return next(new AppError('Cliente não encontrado', 404));

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ─── Criar cliente ────────────────────────────────────────────────────────────
export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = clientSchema.parse(req.body);

    const client = await prisma.client.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar cliente ────────────────────────────────────────────────────────
export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Cliente não encontrado', 404));

    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.update({ where: { id }, data });

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar cliente ──────────────────────────────────────────────────────────
export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Cliente não encontrado', 404));

    await prisma.client.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
