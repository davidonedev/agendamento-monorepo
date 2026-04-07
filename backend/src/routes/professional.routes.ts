import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { listAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointment.controller';
import { listServices, createService, updateService, deleteService } from '../controllers/service.controller';
import { listProducts } from '../controllers/product.controller';
import { prisma } from '../config/database';
import { AppError, AuthRequest } from '../types';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Rotas para profissionais autenticados
router.use(authenticate, authorize('professional'));

// GET /api/professional/appointments — lista agendamentos próprios
router.get('/appointments', listAppointments);

// POST /api/professional/appointments — criar agendamento
router.post('/appointments', createAppointment);

// PATCH /api/professional/appointments/:id/status
router.patch('/appointments/:id/status', updateAppointmentStatus);

// GET    /api/professional/services       — serviços do tenant
// POST   /api/professional/services       — criar serviço
// PATCH  /api/professional/services/:id   — editar serviço
// DELETE /api/professional/services/:id   — remover serviço
router.get('/services', listServices);
router.post('/services', createService);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// GET /api/professional/products — produtos (para alertas de estoque)
router.get('/products', listProducts);

// GET /api/professional/me — dados do profissional autenticado
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { professionalId, tenantId } = (req as AuthRequest).user;
    if (!professionalId) return next(new AppError('Profissional não identificado', 400));

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, tenantId },
      include: { services: { include: { service: true } } },
    });

    if (!professional) return next(new AppError('Profissional não encontrado', 404));

    res.json({ success: true, data: professional });
  } catch (err) { next(err); }
});

// GET /api/professional/tenant — dados públicos do tenant do profissional
router.get('/tenant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return next(new AppError('Tenant não encontrado', 404));

    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// GET /api/professional/clients — clientes do tenant deste profissional
router.get('/clients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const clients = await prisma.client.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: clients });
  } catch (err) { next(err); }
});

// GET /api/professional/professionals — lista de profissionais do tenant (para criar agendamentos)
router.get('/professionals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = (req as AuthRequest).user;
    if (!tenantId) return next(new AppError('Tenant não identificado', 400));

    const professionals = await prisma.professional.findMany({
      where: { tenantId },
      include: { services: { include: { service: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: professionals });
  } catch (err) { next(err); }
});

// PATCH /api/professional/me — atualiza dias e horários do próprio profissional
const updateMeSchema = z.object({
  workingDays:       z.array(z.number().int().min(0).max(6)).optional(),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  bio:               z.string().max(500).optional(),
  specialty:         z.string().max(100).optional(),
  avatar:            z.string().optional(),
  photoUrl:          z.string().optional(),
});

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { professionalId, tenantId } = (req as AuthRequest).user;
    if (!professionalId) return next(new AppError('Profissional não identificado', 400));

    const data = updateMeSchema.parse(req.body);

    if (
      data.workingHoursStart &&
      data.workingHoursEnd &&
      data.workingHoursStart >= data.workingHoursEnd
    ) {
      return next(new AppError('Horário de início deve ser anterior ao horário de fim', 400));
    }

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, tenantId },
    });
    if (!professional) return next(new AppError('Profissional não encontrado', 404));

    const updated = await prisma.professional.update({
      where: { id: professionalId },
      data: {
        ...(data.workingDays       !== undefined && { workingDays: data.workingDays }),
        ...(data.workingHoursStart !== undefined && { workingHoursStart: data.workingHoursStart }),
        ...(data.workingHoursEnd   !== undefined && { workingHoursEnd: data.workingHoursEnd }),
        ...(data.bio               !== undefined && { bio: data.bio }),
        ...(data.specialty         !== undefined && { specialty: data.specialty }),
        ...(data.avatar            !== undefined && { avatar: data.avatar }),
        ...(data.photoUrl          !== undefined && { photoUrl: data.photoUrl }),
      },
      include: { services: { include: { service: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export { router as professionalRoutes };
