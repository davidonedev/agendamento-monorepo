import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { env } from '../config/env';
import { generateTimeSlots } from '../services/schedule.service';
import { sendVerificationEmail } from '../services/email.service';
import {
  sendWhatsappMessage,
  interpolateTemplate,
  normalizePhone,
  DEFAULT_WHATSAPP_TEMPLATE,
} from '../services/whatsapp.service';

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
      select: { id: true, name: true, email: true, phone: true, passwordHash: true, emailVerified: true },
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

    if (!client.emailVerified) {
      return next(new AppError(
        'Você precisa verificar seu e-mail antes de entrar. Verifique sua caixa de entrada.',
        403,
        'EMAIL_NOT_VERIFIED',
      ));
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
      select: {
        id: true, name: true, status: true,
        whatsappApiUrl: true, whatsappApiKey: true,
        whatsappInstance: true, whatsappTemplate: true,
      },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const existing = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      return next(new AppError('Este e-mail já está cadastrado neste estabelecimento. Faça login.', 409, 'EMAIL_IN_USE'));
    }

    if (data.phone) {
      const normalizedPhone = data.phone.replace(/\D/g, '');
      const existingPhone = await prisma.client.findFirst({
        where: { tenantId: tenant.id, phone: { contains: normalizedPhone.slice(-8) } },
        select: { id: true },
      });
      if (existingPhone) {
        return next(new AppError(
          'Este telefone já está cadastrado neste estabelecimento. Faça login.',
          409,
          'PHONE_IN_USE',
        ));
      }
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const client = await prisma.client.create({
      data: {
        tenantId:      tenant.id,
        name:          data.name,
        email:         data.email,
        phone:         data.phone,
        passwordHash,
        emailVerified: false,
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Gera token de verificação (expira em 24 h)
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.clientEmailToken.create({
      data: { clientId: client.id, token, expiresAt },
    });

    const verifyUrl = `${env.APP_URL}/${slug}/verify-email?token=${token}`;

    // Envia via WhatsApp se o cliente tiver telefone, senão cai para e-mail
    if (client.phone) {
      const template = tenant.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
      const text = interpolateTemplate(template, {
        clientName:       client.name,
        tenantName:       tenant.name,
        verificationLink: verifyUrl,
        date: '', time: '', professional: '', services: '', total: '',
      });
      sendWhatsappMessage(tenant, client.phone, text)
        .catch(err => console.error('[whatsapp] Falha ao enviar verificação:', err));
    } else {
      sendVerificationEmail({
        to:         client.email,
        clientName: client.name,
        tenantName: tenant.name,
        verifyUrl,
      }).catch(err => console.error('[email] Falha ao enviar verificação:', err));
    }

    res.status(201).json({
      success: true,
      data: { message: 'Cadastro iniciado. Verifique seu WhatsApp para ativar sua conta.' },
    });
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

// ─── Verificação de e-mail do cliente ────────────────────────────────────────
export async function verifyClientEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug }  = req.params;
    const { token } = req.query as { token?: string };

    if (!token) return next(new AppError('Token obrigatório', 400));

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const record = await prisma.clientEmailToken.findUnique({
      where: { token },
      include: { client: { select: { id: true, tenantId: true, name: true, email: true, phone: true, emailVerified: true } } },
    });

    if (!record) {
      return next(new AppError('Link de verificação inválido ou expirado.', 400, 'INVALID_TOKEN'));
    }
    if (record.usedAt) {
      return next(new AppError('Este link já foi utilizado.', 400, 'TOKEN_USED'));
    }
    if (record.expiresAt < new Date()) {
      return next(new AppError('Link de verificação expirado. Solicite um novo.', 400, 'TOKEN_EXPIRED'));
    }
    if (record.client.tenantId !== tenant.id) {
      return next(new AppError('Link de verificação inválido.', 400, 'INVALID_TOKEN'));
    }

    // Marca como verificado + token como usado em uma única transação
    await prisma.$transaction([
      prisma.client.update({
        where: { id: record.clientId },
        data:  { emailVerified: true },
      }),
      prisma.clientEmailToken.update({
        where: { id: record.id },
        data:  { usedAt: new Date() },
      }),
    ]);

    const { client } = record;
    res.json({
      success: true,
      data: { id: client.id, name: client.name, email: client.email, phone: client.phone },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Reenviar e-mail de verificação ──────────────────────────────────────────
const resendVerificationSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export async function resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { email } = resendVerificationSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true, name: true, status: true,
        whatsappApiUrl: true, whatsappApiKey: true,
        whatsappInstance: true, whatsappTemplate: true,
      },
    });
    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const client = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      select: { id: true, name: true, email: true, phone: true, emailVerified: true },
    });

    // Resposta genérica para não vazar se o e-mail existe
    if (!client || client.emailVerified) {
      return res.json({ success: true, data: { message: 'Se o contato estiver cadastrado, você receberá um novo link.' } });
    }

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.clientEmailToken.create({
      data: { clientId: client.id, token, expiresAt },
    });

    const verifyUrl = `${env.APP_URL}/${slug}/verify-email?token=${token}`;

    if (client.phone) {
      const template = tenant.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
      const text = interpolateTemplate(template, {
        clientName:       client.name,
        tenantName:       tenant.name,
        verificationLink: verifyUrl,
        date: '', time: '', professional: '', services: '', total: '',
      });
      sendWhatsappMessage(tenant, client.phone, text)
        .catch(err => console.error('[whatsapp] Falha ao reenviar verificação:', err));
    } else {
      sendVerificationEmail({
        to:         client.email,
        clientName: client.name,
        tenantName: tenant.name,
        verifyUrl,
      }).catch(err => console.error('[email] Falha ao reenviar verificação:', err));
    }

    res.json({ success: true, data: { message: 'Novo link de verificação enviado.' } });
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

// ─── Listar agendamentos do cliente no portal público ─────────────────────────
export async function getClientAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug }    = req.params;
    const { clientId } = req.query as { clientId?: string };

    if (!clientId) return next(new AppError('clientId é obrigatório', 400));

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    // Verifica que o cliente pertence a este tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!client) return next(new AppError('Cliente não encontrado', 404));

    const appointments = await prisma.appointment.findMany({
      where:   { tenantId: tenant.id, clientId },
      include: { professional: { select: { id: true, name: true, specialty: true } },
                 service:      { select: { id: true, name: true, duration: true, price: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
}

// ─── Cancelar agendamento pelo cliente — regra: até 1h de antecedência ────────
const cancelBookingSchema = z.object({
  clientId: z.string().uuid('clientId inválido'),
});

export async function cancelPublicAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, id } = req.params;
    const { clientId } = cancelBookingSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId: tenant.id, clientId },
    });
    if (!appointment) return next(new AppError('Agendamento não encontrado', 404));

    if (appointment.status === 'cancelled') {
      return next(new AppError('Agendamento já foi cancelado.', 400, 'ALREADY_CANCELLED'));
    }
    if (appointment.status === 'completed') {
      return next(new AppError('Agendamentos concluídos não podem ser cancelados.', 400, 'ALREADY_COMPLETED'));
    }

    // Regra de negócio: cancelamento permitido apenas até 1 hora antes do início.
    // Trata data/hora como horário de Brasília (UTC-3).
    const apptDatetime = new Date(`${appointment.date}T${appointment.startTime}:00.000-03:00`);
    const now          = new Date();
    const diffMinutes  = (apptDatetime.getTime() - now.getTime()) / 60_000;

    if (diffMinutes < 60) {
      return next(new AppError(
        'O prazo de cancelamento encerrou. Com menos de 1 hora de antecedência só é possível reagendar.',
        400,
        'CANCELLATION_WINDOW_EXPIRED',
      ));
    }

    await prisma.appointment.update({
      where: { id },
      data:  { status: 'cancelled' },
    });

    res.json({ success: true, data: { message: 'Agendamento cancelado com sucesso.' } });
  } catch (err) {
    next(err);
  }
}

// ─── Cadastro + Agendamento combinados (primeiro acesso do cliente) ───────────
const registerAndBookSchema = z.object({
  // Dados do cliente
  name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  email:    z.string().email('E-mail inválido'),
  phone:    z.string()
    .min(1, 'Telefone é obrigatório')
    .refine(v => v.replace(/\D/g, '').length >= 10, { message: 'Telefone deve ter ao menos 10 dígitos (com DDD)' }),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  // Dados do agendamento
  professionalId: z.string().min(1, 'Profissional é obrigatório'),
  serviceIds:     z.array(z.string().min(1)).min(1, 'Selecione ao menos um serviço'),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
  startTime:      z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário inválido (formato: HH:MM)').transform(t => t.slice(0, 5)),
  notes:          z.string().max(500).optional(),
});

export async function registerAndBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    let data: z.infer<typeof registerAndBookSchema>;
    try {
      data = registerAndBookSchema.parse(req.body);
    } catch (validationErr) {
      console.error('[registerAndBook] Validation failed. Body received:', JSON.stringify(req.body, null, 2));
      throw validationErr;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true, name: true, status: true, isOpen: true,
        minAdvanceMinutes: true,
        whatsappApiUrl: true, whatsappApiKey: true,
        whatsappInstance: true, whatsappTemplate: true,
      },
    });

    if (!tenant || tenant.status === 'suspended') {
      return next(new AppError('Estabelecimento não encontrado', 404));
    }
    if (!tenant.isOpen) {
      return next(new AppError('Este estabelecimento está fechado para novos agendamentos.', 403));
    }

    // Verifica duplicidade de e-mail
    const existing = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
      select: { id: true },
    });
    if (existing) {
      return next(new AppError(
        'Este e-mail já tem cadastro neste estabelecimento. Faça login para agendar.',
        409,
        'EMAIL_IN_USE',
      ));
    }

    // Verifica duplicidade de telefone
    const normalizedPhone = data.phone.replace(/\D/g, '');
    const existingPhone = await prisma.client.findFirst({
      where: { tenantId: tenant.id, phone: { contains: normalizedPhone.slice(-8) } },
      select: { id: true },
    });
    if (existingPhone) {
      return next(new AppError(
        'Este telefone já tem cadastro neste estabelecimento. Faça login para agendar.',
        409,
        'PHONE_IN_USE',
      ));
    }

    // Busca profissional e serviços em paralelo
    const [professional, services] = await Promise.all([
      prisma.professional.findFirst({ where: { id: data.professionalId, tenantId: tenant.id } }),
      prisma.service.findMany({ where: { id: { in: data.serviceIds }, tenantId: tenant.id } }),
    ]);

    if (!professional) return next(new AppError('Profissional não encontrado.', 404));
    if (services.length !== data.serviceIds.length) {
      return next(new AppError('Um ou mais serviços não encontrados.', 404));
    }

    const orderedServices = data.serviceIds.map(id => services.find(s => s.id === id)!);
    const totalDuration   = orderedServices.reduce((s, v) => s + v.duration, 0);
    const totalPrice      = orderedServices.reduce((s, v) => s + v.price,    0);
    const blockEndTime    = addMinutes(data.startTime, totalDuration);

    // Cria cliente + token + agendamentos em transação
    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    const token        = crypto.randomBytes(32).toString('hex');
    const expiresAt    = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { client, appointments } = await prisma.$transaction(async (tx) => {
      // Verifica conflito de horário
      const conflictAppt = await tx.appointment.findFirst({
        where: {
          tenantId:       tenant.id,
          professionalId: data.professionalId,
          date:           data.date,
          status:         { notIn: ['cancelled'] },
          AND: [{ startTime: { lt: blockEndTime } }, { endTime: { gt: data.startTime } }],
        },
      });
      if (conflictAppt) {
        throw new AppError('Horário não disponível. Por favor escolha outro horário.', 409, 'SCHEDULE_CONFLICT');
      }

      const blockedConflict = await tx.blockedSlot.findFirst({
        where: {
          tenantId:       tenant.id,
          professionalId: data.professionalId,
          date:           data.date,
          AND: [{ startTime: { lt: blockEndTime } }, { endTime: { gt: data.startTime } }],
        },
      });
      if (blockedConflict) {
        throw new AppError('Horário bloqueado. Por favor escolha outro horário.', 409, 'SCHEDULE_BLOCKED');
      }

      // Cria o cliente
      const newClient = await tx.client.create({
        data: {
          tenantId:      tenant.id,
          name:          data.name,
          email:         data.email,
          phone:         data.phone,
          passwordHash,
          emailVerified: false,
        },
        select: { id: true, name: true, email: true, phone: true },
      });

      // Token de verificação
      await tx.clientEmailToken.create({
        data: { clientId: newClient.id, token, expiresAt },
      });

      // Cria agendamentos encadeando horários
      const created = [];
      let currentStart = data.startTime;

      for (const svc of orderedServices) {
        const endTime = addMinutes(currentStart, svc.duration);
        const appt = await tx.appointment.create({
          data: {
            tenantId:       tenant.id,
            clientId:       newClient.id,
            professionalId: data.professionalId,
            serviceId:      svc.id,
            date:           data.date,
            startTime:      currentStart,
            endTime,
            price:          svc.price,
            notes:          data.notes,
            status:         'pending',
          },
        });
        created.push(appt);
        currentStart = endTime;
      }

      return { client: newClient, appointments: created };
    });

    // Monta e envia a mensagem WhatsApp com o link de verificação + resumo do agendamento
    const verifyUrl = `${env.APP_URL}/${slug}/verify-email?token=${token}`;

    // Formata data em PT-BR (YYYY-MM-DD → DD/MM/YYYY dia da semana)
    const [year, month, day] = data.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const serviceNames = orderedServices.map(s => s.name).join(', ');
    const totalFormatted = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const template = tenant.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
    const text = interpolateTemplate(template, {
      clientName:       client.name,
      tenantName:       tenant.name,
      date:             dateFormatted,
      time:             data.startTime,
      professional:     professional.name,
      services:         serviceNames,
      total:            totalFormatted,
      verificationLink: verifyUrl,
    });

    sendWhatsappMessage(tenant, client.phone!, text)
      .catch(err => console.error('[whatsapp] Falha ao enviar mensagem de verificação:', err));

    res.status(201).json({
      success: true,
      data: {
        appointments,
        message: 'Agendamento criado! Verifique seu WhatsApp para ativar sua conta.',
        phone: normalizePhone(client.phone!),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Registro público de negócio (cria tenant + tenant_admin) ─────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

async function findUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i    = 2;
  while (await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

const businessRegisterSchema = z.object({
  ownerName:    z.string().min(2,  'Nome muito curto').max(100),
  email:        z.string().email('E-mail inválido'),
  password:     z.string().min(6,  'Senha deve ter ao menos 6 caracteres'),
  phone:        z.string().optional(),
  businessName: z.string().min(2,  'Nome do estabelecimento muito curto').max(120),
  address:      z.string().optional(),
  slug:         z.string().min(2).max(60)
                  .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens')
                  .optional(),
});

export async function registerBusiness(req: Request, res: Response, next: NextFunction) {
  try {
    const data = businessRegisterSchema.parse(req.body);

    // E-mail não pode estar em uso
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return next(new AppError('Este e-mail já está em uso. Faça login ou use outro e-mail.', 409, 'EMAIL_IN_USE'));
    }

    // Slug único
    const baseSlug = data.slug ?? slugify(data.businessName);
    if (!baseSlug) {
      return next(new AppError('Não foi possível gerar um link para o estabelecimento.', 400));
    }
    const slug = await findUniqueSlug(baseSlug);

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name:        data.businessName,
          ownerName:   data.ownerName,
          email:       data.email,
          phone:       data.phone,
          address:     data.address ?? '',
          status:      'trial',
          plan:        'basic',
          monthlyPrice: 0,
        },
      });

      await tx.user.create({
        data: {
          name:         data.ownerName,
          email:        data.email,
          passwordHash,
          role:         'tenant_admin',
          tenantId:     tenant.id,
        },
      });
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Conta criada com sucesso! Faça login para começar.',
        slug,
      },
    });
  } catch (err) {
    next(err);
  }
}
