import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';

const productSchema = z.object({
  name:              z.string().min(2).max(100),
  description:       z.string().max(500).optional(),
  price:             z.number().positive('Preço deve ser positivo'),
  stock:             z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  category:          z.string().max(50).optional(),
  imageUrl:          z.string().optional(),
  isActive:          z.boolean().default(true),
});

// ─── Listar produtos ──────────────────────────────────────────────────────────
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: products });
  } catch (err) { next(err); }
}

// ─── Criar produto ────────────────────────────────────────────────────────────
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: { ...data, tenantId } });

    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
}

// ─── Atualizar produto ────────────────────────────────────────────────────────
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Produto não encontrado', 404));

    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id }, data });

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

// ─── Deletar produto ──────────────────────────────────────────────────────────
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Produto não encontrado', 404));

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ─── Ajustar estoque (entrada/saída) ─────────────────────────────────────────
export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthRequest).user;
    const { id } = req.params;

    const { delta } = z.object({
      delta: z.number().int(), // positivo = entrada, negativo = saída
    }).parse(req.body);

    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) return next(new AppError('Produto não encontrado', 404));

    const newStock = existing.stock + delta;
    if (newStock < 0) return next(new AppError('Estoque insuficiente', 400, 'INSUFFICIENT_STOCK'));

    const product = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

// ─── Listar produtos públicos (upsell no agendamento) ────────────────────────
export async function getPublicProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: products });
  } catch (err) { next(err); }
}
