import { Router } from 'express';
import {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getPlatformMetrics,
  listUsers,
  updateUserEmail,
  forceChangePassword,
} from '../controllers/super.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de super admin exigem autenticação + role super_admin
router.use(authenticate, authorize('super_admin'));

// GET /api/super/metrics
router.get('/metrics', getPlatformMetrics);

// GET /api/super/tenants
router.get('/tenants', listTenants);

// POST /api/super/tenants
router.post('/tenants', createTenant);

// GET /api/super/tenants/:id
router.get('/tenants/:id', getTenant);

// PATCH /api/super/tenants/:id
router.patch('/tenants/:id', updateTenant);

// DELETE /api/super/tenants/:id
router.delete('/tenants/:id', deleteTenant);

// GET /api/super/users
router.get('/users', listUsers);

// PATCH /api/super/users/:id/email
router.patch('/users/:id/email', updateUserEmail);

// PUT /api/super/users/:id/password
router.put('/users/:id/password', forceChangePassword);

export { router as superRoutes };
