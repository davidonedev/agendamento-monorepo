import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../types';
import { generateTimeSlots } from '../services/schedule.service';

// ─── Dados de login — tenants + usuários para a tela de login ────────────────
export async function getLoginData(_req: Request, res: Response, next: NextFunction) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: { not: 'suspended' } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        professionals: {
          select: {
            id: true,
            name: true,
            specialty: true,
            users: { select: { email: true } },
          },
        },
      },
    });

    res.json({ success: true, data: tenants });
  } catch (err) {
    next(err);
  }
}

// ─── Dados públicos do tenant por slug ───────────────────────────────────────
export async function getTenantBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
        bannerUrl: true,
        isOpen: true,
        status: true,
        address: true,
        phone: true,
        minAdvanceMinutes: true,
      },
    });

    if (!tenant) return next(new AppError('Barbearia não encontrada', 404));

    if (tenant.status === 'suspended') {
      return next(new AppError('Esta barbearia está temporariamente indisponível', 503));
    }

    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ─── Serviços públicos ────────────────────────────────────────────────────────
export async function getPublicServices(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Barbearia não encontrada', 404));
    }

    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
}

// ─── Profissionais públicos ───────────────────────────────────────────────────
export async function getPublicProfessionals(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { serviceId } = req.query as { serviceId?: string };

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Barbearia não encontrada', 404));
    }

    const professionals = await prisma.professional.findMany({
      where: {
        tenantId: tenant.id,
        ...(serviceId && {
          services: { some: { serviceId } },
        }),
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        avatar: true,
        photoUrl: true,
        bio: true,
        workingDays: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        services: { include: { service: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: professionals });
  } catch (err) {
    next(err);
  }
}

// ─── Slots disponíveis (suporta múltiplos serviços) ───────────────────────────
const availabilitySchema = z.object({
  professionalId: z.string(),
  // aceita serviceId único (legado) ou serviceIds separados por vírgula
  serviceId:  z.string().optional(),
  serviceIds: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
});

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const parsed = availabilitySchema.parse(req.query);
    const { professionalId, date } = parsed;

    // Determinar lista de IDs de serviço
    const rawIds = parsed.serviceIds
      ? parsed.serviceIds.split(',').map(s => s.trim()).filter(Boolean)
      : parsed.serviceId
      ? [parsed.serviceId]
      : [];

    if (rawIds.length === 0) {
      return next(new AppError('serviceId ou serviceIds obrigatório', 400));
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true, isOpen: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Barbearia não encontrada', 404));
    }

    if (!tenant.isOpen) {
      return res.json({ success: true, data: [] });
    }

    const [professional, services] = await Promise.all([
      prisma.professional.findFirst({ where: { id: professionalId, tenantId: tenant.id } }),
      prisma.service.findMany({ where: { id: { in: rawIds }, tenantId: tenant.id } }),
    ]);

    if (!professional) return next(new AppError('Profissional não encontrado', 404));
    if (services.length !== rawIds.length) return next(new AppError('Um ou mais serviços não encontrados', 404));

    // Duração total = soma das durações de todos os serviços selecionados
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

    // Verificar dia da semana
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    if (!professional.workingDays.includes(dayOfWeek)) {
      return res.json({ success: true, data: [] });
    }

    // Buscar agendamentos e bloqueios do dia
    const [appointments, blockedSlots] = await Promise.all([
      prisma.appointment.findMany({
        where: { tenantId: tenant.id, professionalId, date, status: { notIn: ['cancelled'] } },
        select: { startTime: true, endTime: true },
      }),
      prisma.blockedSlot.findMany({
        where: { tenantId: tenant.id, professionalId, date },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const occupiedSlots = [...appointments, ...blockedSlots];

    // Gera slots a cada 15 min; o filtro abaixo exclui os que não têm
    // totalDuration minutos livres consecutivos a partir daquele ponto.
    const SLOT_STEP = 15;
    const allSlots = generateTimeSlots(
      professional.workingHoursStart,
      professional.workingHoursEnd,
      totalDuration,
      SLOT_STEP,
    );

    const available = allSlots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number);
      const slotEnd = h * 60 + m + totalDuration;
      const endTime = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;
      return !occupiedSlots.some((occ) => slot < occ.endTime && endTime > occ.startTime);
    });

    res.json({ success: true, data: available });
  } catch (err) {
    next(err);
  }
}

// ─── Criar agendamento público (suporta múltiplos serviços) ──────────────────
const publicBookingSchema = z.object({
  professionalId: z.string(),
  // Aceita serviceId único (legado) OU serviceIds (múltiplos)
  serviceId:  z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato: HH:mm').transform(t => t.slice(0, 5)),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  data => data.serviceId || (data.serviceIds && data.serviceIds.length > 0),
  { message: 'serviceId ou serviceIds é obrigatório' },
);

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export async function createPublicBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const data = publicBookingSchema.parse(req.body);

    // Normalizar para array de serviceIds
    const serviceIds = data.serviceIds ?? (data.serviceId ? [data.serviceId] : []);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true, isOpen: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Barbearia não encontrada', 404));
    }

    if (!tenant.isOpen) {
      return next(new AppError('Esta barbearia está fechada para novos agendamentos', 403));
    }

    const [professional, services] = await Promise.all([
      prisma.professional.findFirst({ where: { id: data.professionalId, tenantId: tenant.id } }),
      prisma.service.findMany({ where: { id: { in: serviceIds }, tenantId: tenant.id } }),
    ]);

    if (!professional) return next(new AppError('Profissional não encontrado', 404));
    if (services.length !== serviceIds.length) {
      return next(new AppError('Um ou mais serviços não encontrados neste tenant', 404));
    }

    // Ordenar serviços na mesma ordem do array enviado para manter sequência previsível
    const orderedServices = serviceIds.map(id => services.find(s => s.id === id)!);

    // Calcular duração total do bloco
    const totalDuration = orderedServices.reduce((sum, s) => sum + s.duration, 0);
    const blockEndTime  = addMinutes(data.startTime, totalDuration);

    // Upsert do cliente (fora da transaction — sem lock necessário)
    const client = await prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: data.clientEmail } },
      update: { name: data.clientName, phone: data.clientPhone },
      create: { tenantId: tenant.id, name: data.clientName, email: data.clientEmail, phone: data.clientPhone },
    });

    // Criar agendamentos em transação — verifica conflito DENTRO da transaction
    // para evitar race condition entre dois clientes selecionando o mesmo horário.
    const appointments = await prisma.$transaction(async (tx) => {
      // Re-verifica conflito dentro da transaction (leitura consistente)
      const conflictAppt = await tx.appointment.findFirst({
        where: {
          tenantId:       tenant.id,
          professionalId: data.professionalId,
          date:           data.date,
          status:         { notIn: ['cancelled'] },
          AND: [
            { startTime: { lt: blockEndTime } },
            { endTime:   { gt: data.startTime } },
          ],
        },
      });
      if (conflictAppt) {
        throw new AppError(
          'Horário não disponível. Por favor escolha outro horário.',
          409,
          'SCHEDULE_CONFLICT',
        );
      }

      const blockedConflict = await tx.blockedSlot.findFirst({
        where: {
          tenantId:       tenant.id,
          professionalId: data.professionalId,
          date:           data.date,
          AND: [
            { startTime: { lt: blockEndTime } },
            { endTime:   { gt: data.startTime } },
          ],
        },
      });
      if (blockedConflict) {
        throw new AppError(
          'Horário não disponível (bloqueado). Por favor escolha outro horário.',
          409,
          'SCHEDULE_BLOCKED',
        );
      }

      // Tudo livre — criar um agendamento por serviço encadeando os horários
      const created = [];
      let currentStart = data.startTime;

      for (const svc of orderedServices) {
        const endTime = addMinutes(currentStart, svc.duration);

        const appt = await tx.appointment.create({
          data: {
            tenantId:       tenant.id,
            clientId:       client.id,
            professionalId: data.professionalId,
            serviceId:      svc.id,
            date:           data.date,
            startTime:      currentStart,
            endTime,
            price:          svc.price,
            notes:          data.notes,
            status:         'pending',
          },
          include: { client: true, professional: true, service: true },
        });

        created.push(appt);
        currentStart = endTime;
      }

      return created;
    });

    res.status(201).json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
}

// ─── Login público de cliente (e-mail + senha) ───────────────────────────────
const clientLoginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export async function loginPublicClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { email, password } = clientLoginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const client = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      select: { id: true, name: true, email: true, phone: true, passwordHash: true },
    });

    if (!client) {
      return next(new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS'));
    }

    if (!client.passwordHash) {
      return next(new AppError('Esta conta usa login com Google. Clique em "Continuar com Google".', 401, 'USE_GOOGLE'));
    }

    const match = await bcrypt.compare(password, client.passwordHash);
    if (!match) {
      return next(new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS'));
    }

    res.json({ success: true, data: { id: client.id, name: client.name, email: client.email, phone: client.phone } });
  } catch (err) {
    next(err);
  }
}

// ─── Cadastro público de cliente (e-mail + senha) ────────────────────────────
const clientRegisterSchema = z.object({
  name:     z.string().min(2, 'Nome muito curto').max(100),
  email:    z.string().email('E-mail inválido'),
  phone:    z.string().optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export async function registerPublicClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const data = clientRegisterSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const existing = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
      select: { id: true },
    });

    if (existing) {
      return next(new AppError('Este e-mail já está cadastrado. Faça login.', 409, 'EMAIL_IN_USE'));
    }

    const client = await prisma.client.create({
      data: { tenantId: tenant.id, name: data.name, email: data.email, phone: data.phone, passwordHash },
      select: { id: true, name: true, email: true, phone: true },
    });

    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ─── Auth pública via Google ──────────────────────────────────────────────────
const googleAuthSchema = z.object({
  accessToken: z.string().min(1),
});

export async function googleAuthPublicClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { accessToken } = googleAuthSchema.parse(req.body);

    // Valida o token junto ao Google e obtém os dados do usuário
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return next(new AppError('Token do Google inválido ou expirado.', 401, 'GOOGLE_AUTH_FAILED'));
    }

    const profile = await googleRes.json() as { email?: string; name?: string };

    if (!profile.email) {
      return next(new AppError('Não foi possível obter o e-mail da conta Google.', 400));
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    // Upsert: cria o cliente ou retorna o existente (sem sobrescrever a senha)
    const client = await prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: profile.email } },
      update: { name: profile.name ?? undefined },
      create: { tenantId: tenant.id, name: profile.name ?? profile.email, email: profile.email },
      select: { id: true, name: true, email: true, phone: true },
    });

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ─── Cadastro público de profissional ────────────────────────────────────────
const professionalRegisterSchema = z.object({
  name:               z.string().min(2, 'Nome muito curto').max(100),
  email:              z.string().email('E-mail inválido'),
  password:           z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  specialty:          z.string().min(2, 'Especialidade obrigatória').max(100),
  bio:                z.string().max(500).optional(),
  workingHoursStart:  z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  workingHoursEnd:    z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  workingDays:        z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export async function registerPublicProfessional(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const data = professionalRegisterSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return next(new AppError('Este e-mail já está em uso', 409, 'EMAIL_IN_USE'));
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const professional = await tx.professional.create({
        data: {
          tenantId:          tenant.id,
          name:              data.name,
          specialty:         data.specialty,
          bio:               data.bio,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd:   data.workingHoursEnd,
          workingDays:       data.workingDays,
        },
      });

      const user = await tx.user.create({
        data: {
          name:           data.name,
          email:          data.email,
          passwordHash,
          role:           'professional',
          tenantId:       tenant.id,
          professionalId: professional.id,
        },
      });

      return { name: professional.name, email: user.email };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}