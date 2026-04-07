import { Router } from 'express';
import {
  getLoginData,
  getTenantBySlug,
  getPublicServices,
  getPublicProfessionals,
  getAvailableSlots,
  createPublicBooking,
} from '../controllers/public.controller';
import { getPublicProducts } from '../controllers/product.controller';

const router = Router();

// GET /api/public/login-data — tenants + usuários para a tela de login
router.get('/login-data', getLoginData);

// GET /api/public/:slug — dados do tenant
router.get('/:slug', getTenantBySlug);

// GET /api/public/:slug/services — serviços disponíveis
router.get('/:slug/services', getPublicServices);

// GET /api/public/:slug/professionals — profissionais disponíveis (filtro por serviceId)
router.get('/:slug/professionals', getPublicProfessionals);

// GET /api/public/:slug/availability — slots disponíveis
router.get('/:slug/availability', getAvailableSlots);

// POST /api/public/:slug/booking — criar agendamento
router.post('/:slug/booking', createPublicBooking);

// GET /api/public/:slug/products — produtos para upsell
router.get('/:slug/products', getPublicProducts);

export { router as publicRoutes };
