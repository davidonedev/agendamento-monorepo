import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError, AuthRequest, JwtPayload } from '../types';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticação não fornecido', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch {
    next(new AppError('Token inválido ou expirado', 401, 'INVALID_TOKEN'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!roles.includes(user.role)) {
      return next(new AppError('Acesso negado', 403, 'FORBIDDEN'));
    }
    next();
  };
}

// Garante que o tenant_admin só acessa dados do próprio tenant
export function requireTenantMatch(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;
  const { tenantId } = req.params;

  if (user.role === 'super_admin') return next();

  if (user.role === 'tenant_admin' && user.tenantId === tenantId) return next();

  if (user.role === 'professional' && user.tenantId === tenantId) return next();

  next(new AppError('Acesso negado a este tenant', 403, 'FORBIDDEN'));
}

// Garante que professional só vê seus próprios dados
export function requireProfessionalMatch(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;
  const { professionalId } = req.params;

  if (['super_admin', 'tenant_admin'].includes(user.role)) return next();

  if (user.role === 'professional' && user.professionalId === professionalId) return next();

  next(new AppError('Acesso negado', 403, 'FORBIDDEN'));
}
