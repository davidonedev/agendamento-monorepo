import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';
import { checkConflict } from '../services/schedule.service';

const createAppointmentSchema = z.object({
  // Fornece clientId de um cliente existente OU os dados para criar um novo
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato: HH:mm').transform(t => t.slice(0, 5)),
  notes: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
});

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  professionalId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
});

// ─── Extrai e valida o tenantId do token JWT ──────────────────────────────────
function resolveTenantId(req: Request, next: NextFunction): string | null {
  const tenantId = (req as AuthRequest).user.tenantId;
  if (!tenantId) {
    next(new AppError('Tenant não identificado no token', 400, 'MISSING_TENANT'));
    return null;
  }
  return tenantId;
}

// ─── Listar agendamentos ──────────────────────────────────────────────────────
export async function listAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as AuthRequest).user;
    const tenantId = resolveTenantId(req, next);
    if (!tenantId) return;

    const { date, startDate, endDate, professionalId, status } = querySchema.parse(req.query);

    // Sempre filtra pelo tenant do usuário autenticado — nunca aceita tenantId externo
    const where: Record<string, unknown> = { tenantId };

    if (date) {
      where.date = date;
    } else if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    if (status) where.status = status;

    if (authUser.role === 'professional') {
      // Professional obrigatoriamente só vê seus próprios agendamentos
      if (!authUser.professionalId) {
        return next(new AppError('Profissional não identificado no token', 400, 'MISSING_PROFESSIONAL'));
      }
      where.professionalId = authUser.professionalId;
    } else if (professionalId) {
      // tenant_admin filtrando por profissional — valida que pertence ao tenant
      const profExists = await prisma.professional.findFirst({
        where: { id: professionalId, tenantId },
        select: { id: true },
      });
      if (!profExists) {
        return next(new AppError('Profissional não encontrado neste tenant', 404));
      }
      where.professionalId = professionalId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        professional: true,
        service: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
}

// ─── Buscar agendamento por ID ────────────────────────────────────────────────
export async function getAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as AuthRequest).user;
    const tenantId = resolveTenantId(req, next);
    if (!tenantId) return;

    const { id } = req.params;

    const where: Record<string, unknown> = { id, tenantId };

    // Professional só acessa o próprio
    if (authUser.role === 'professional') {
      if (!authUser.professionalId) {
        return next(new AppError('Profissional não identificado no token', 400, 'MISSING_PROFESSIONAL'));
      }
      where.professionalId = authUser.professionalId;
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: { client: true, professional: true, service: true },
    });

    if (!appointment) return next(new AppError('Agendamento não encontrado', 404));

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

// ─── Criar agendamento ────────────────────────────────────────────────────────
export async function createAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = resolveTenantId(req, next);
    if (!tenantId) return;

    const data = createAppointmentSchema.parse(req.body);

    // Busca serviço garantindo que pertence ao tenant do usuário
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, tenantId },
    });
    if (!service) return next(new AppError('Serviço não encontrado', 404));

    // Busca profissional garantindo que pertence ao tenant do usuário
    const professional = await prisma.professional.findFirst({
      where: { id: data.professionalId, tenantId },
    });
    if (!professional) return next(new AppError('Profissional não encontrado', 404));

    // Calcula endTime com base na duração do serviço
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + service.duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Verifica conflito de horário (agendamentos + bloqueios)
    const conflict = await checkConflict({
      tenantId,
      professionalId: data.professionalId,
      date: data.date,
      startTime: data.startTime,
      endTime,
    });
    if (conflict) {
      return next(new AppError('Conflito de horário: já existe agendamento neste período', 409, 'SCHEDULE_CONFLICT'));
    }

    // Resolve o cliente — usa existente ou cria novo, sempre dentro do tenant
    let clientId = data.clientId;
    if (!clientId) {
      if (!data.clientName || !data.clientEmail) {
        return next(new AppError('Informe clientId ou os dados do novo cliente (clientName, clientEmail)', 400));
      }
      const client = await prisma.client.upsert({
        where: { tenantId_email: { tenantId, email: data.clientEmail } },
        update: { name: data.clientName, phone: data.clientPhone },
        create: { tenantId, name: data.clientName, email: data.clientEmail, phone: data.clientPhone },
      });
      clientId = client.id;
    } else {
      // Garante que o clientId pertence ao mesmo tenant
      const client = await prisma.client.findFirst({
        where: { id: clientId, tenantId },
        select: { id: true },
      });
      if (!client) return next(new AppError('Cliente não encontrado neste tenant', 404));
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        price: service.price,
        notes: data.notes,
        status: 'pending',
      },
      include: { client: true, professional: true, service: true },
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

// ─── Atualizar status ─────────────────────────────────────────────────────────
export async function updateAppointmentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as AuthRequest).user;
    const tenantId = resolveTenantId(req, next);
    if (!tenantId) return;

    const { id } = req.params;

    // Busca sempre com tenantId — nunca um ID solto sem escopo de tenant
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });
    if (!existing) return next(new AppError('Agendamento não encontrado', 404));

    // Professional só altera seus próprios agendamentos
    if (authUser.role === 'professional') {
      if (!authUser.professionalId) {
        return next(new AppError('Profissional não identificado no token', 400, 'MISSING_PROFESSIONAL'));
      }
      if (existing.professionalId !== authUser.professionalId) {
        return next(new AppError('Acesso negado a este agendamento', 403, 'FORBIDDEN'));
      }
    }

    const { status } = updateStatusSchema.parse(req.body);

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { client: true, professional: true, service: true },
    });

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

// ─── Deletar agendamento ──────────────────────────────────────────────────────
export async function deleteAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = resolveTenantId(req, next);
    if (!tenantId) return;

    const { id } = req.params;

    // Busca com tenantId para garantir isolamento — sem isso um id solto
    // apagaria registros de qualquer tenant se tenantId fosse undefined
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) return next(new AppError('Agendamento não encontrado', 404));

    await prisma.appointment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
