import { Router } from 'express';
import {
  getLoginData,
  getTenantBySlug,
  getPublicServices,
  getPublicProfessionals,
  getAvailableSlots,
  createPublicBooking,
<<<<<<< HEAD
=======
<<<<<<< Updated upstream
=======
>>>>>>> dev
  loginPublicClient,
  registerPublicClient,
  registerPublicProfessional,
  googleAuthPublicClient,
<<<<<<< HEAD
=======
  getClientAppointments,
  cancelPublicAppointment,
  registerBusiness,
  verifyClientEmail,
  resendVerificationEmail,
  registerAndBook,
>>>>>>> Stashed changes
>>>>>>> dev
} from '../controllers/public.controller';
import { getPublicProducts } from '../controllers/product.controller';

const router = Router();

// GET /api/public/login-data — tenants + usuários para a tela de login
router.get('/login-data', getLoginData);

// POST /api/public/register/business — cria tenant + tenant_admin (cadastro público)
router.post('/register/business', registerBusiness);

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

<<<<<<< HEAD
=======
<<<<<<< Updated upstream
=======
>>>>>>> dev
// POST /api/public/:slug/login/client — login público de cliente (por e-mail)
router.post('/:slug/login/client', loginPublicClient);

// POST /api/public/:slug/register/client — cadastro público de cliente
router.post('/:slug/register/client', registerPublicClient);

<<<<<<< HEAD
=======
// POST /api/public/:slug/register-and-book — cadastro + agendamento combinados (novo cliente)
router.post('/:slug/register-and-book', registerAndBook);

>>>>>>> dev
// POST /api/public/:slug/register/professional — cadastro público de profissional
router.post('/:slug/register/professional', registerPublicProfessional);

// POST /api/public/:slug/auth/google — login ou cadastro via Google
router.post('/:slug/auth/google', googleAuthPublicClient);

<<<<<<< HEAD
=======
// GET  /api/public/:slug/my-appointments?clientId=xxx — agendamentos do cliente
router.get('/:slug/my-appointments', getClientAppointments);

// PATCH /api/public/:slug/appointments/:id/cancel — cancelar (regra de 1h)
router.patch('/:slug/appointments/:id/cancel', cancelPublicAppointment);

// GET  /api/public/:slug/verify-email?token=xxx — verificar e-mail do cliente
router.get('/:slug/verify-email', verifyClientEmail);

// POST /api/public/:slug/resend-verification — reenviar e-mail de verificação
router.post('/:slug/resend-verification', resendVerificationEmail);

>>>>>>> Stashed changes
>>>>>>> dev
export { router as publicRoutes };
