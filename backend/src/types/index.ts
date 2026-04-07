import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string; // userId
  role: UserRole;
  tenantId?: string;
  professionalId?: string;
}

// ─── Request com usuário autenticado ─────────────────────────────────────────
export interface AuthRequest extends Request {
  user: JwtPayload;
}

// ─── Limites de plano ─────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  basic: { professionals: 2, services: 3 },
  pro: { professionals: Infinity, services: Infinity },
  enterprise: { professionals: Infinity, services: Infinity },
} as const;

// ─── Erros de domínio ─────────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ─── Paginação ────────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers de resposta ──────────────────────────────────────────────────────
export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
