import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError, AuthRequest, JwtPayload } from '../types';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true, professional: true },
    });

    if (!user) {
      return next(new AppError('E-mail ou senha inválidos', 401, 'INVALID_CREDENTIALS'));
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return next(new AppError('E-mail ou senha inválidos', 401, 'INVALID_CREDENTIALS'));
    }

    // Verifica se tenant está ativo
    if (user.tenant && user.tenant.status === 'suspended') {
      return next(new AppError('Conta suspensa. Entre em contato com o suporte.', 403, 'TENANT_SUSPENDED'));
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
      professionalId: user.professionalId ?? undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          professionalId: user.professionalId,
          tenant: user.tenant
            ? {
                id: user.tenant.id,
                slug: user.tenant.slug,
                name: user.tenant.name,
                status: user.tenant.status,
                plan: user.tenant.plan,
              }
            : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub } = (req as AuthRequest).user;

    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        professionalId: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            plan: true,
            primaryColor: true,
            adminColor: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('Usuário não encontrado', 404));
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

const updateMeSchema = z.object({
  name:  z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
});

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub } = (req as AuthRequest).user;
    const data = updateMeSchema.parse(req.body);

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== sub) {
        return next(new AppError('E-mail já está em uso', 400, 'EMAIL_IN_USE'));
      }
    }

    const updated = await prisma.user.update({
      where: { id: sub },
      data,
      select: { id: true, name: true, email: true, role: true, tenantId: true, professionalId: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub } = (req as AuthRequest).user;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) return next(new AppError('Usuário não encontrado', 404));

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return next(new AppError('Senha atual incorreta', 400, 'WRONG_PASSWORD'));
    }

    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: sub }, data: { passwordHash: newHash } });

    res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
  } catch (err) {
    next(err);
  }
}
