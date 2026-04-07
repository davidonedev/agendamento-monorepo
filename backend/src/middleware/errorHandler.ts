import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Erros de domínio da aplicação
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Erros do Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Registro duplicado',
        code: 'DUPLICATE_ENTRY',
        field: prismaErr.meta?.target?.[0],
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        code: 'NOT_FOUND',
      });
    }
  }

  // Erro genérico
  console.error('[ERROR]', err);
  return res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
