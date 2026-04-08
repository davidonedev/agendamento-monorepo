import { Router } from 'express';
import {
  getLoginData,
  getTenantBySlug,
  getPublicServices,
  getPublicProfessionals,
  getAvailableSlots,
  createPublicBooking,
  loginPublicClient,
  registerPublicClient,
  registerPublicProfessional,
  googleAuthPublicClient,
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

// POST /api/public/:slug/login/client — login público de cliente (por e-mail)
router.post('/:slug/login/client', loginPublicClient);

// POST /api/public/:slug/register/client — cadastro público de cliente
router.post('/:slug/register/client', registerPublicClient);

// POST /api/public/:slug/register/professional — cadastro público de profissional
router.post('/:slug/register/professional', registerPublicProfessional);

// POST /api/public/:slug/auth/google — login ou cadastro via Google
router.post('/:slug/auth/google', googleAuthPublicClient);

export { router as publicRoutes };
