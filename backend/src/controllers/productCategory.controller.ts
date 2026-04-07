import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../types';

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).user.tenantId as string;
    const cats = await prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: cats });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({ name: z.string().min(1).max(60) });

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).user.tenantId as string;
    const { name } = createSchema.parse(req.body);

    const existing = await prisma.productCategory.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
    if (existing) return next(new AppError('Categoria já existe', 409));

    const cat = await prisma.productCategory.create({ data: { tenantId, name } });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).user.tenantId as string;
    const { id } = req.params;

    const cat = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!cat) return next(new AppError('Categoria não encontrada', 404));

    await prisma.productCategory.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
