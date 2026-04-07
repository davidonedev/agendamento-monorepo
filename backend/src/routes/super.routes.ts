import { Router } from 'express';
import {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getPlatformMetrics,
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

export { router as superRoutes };
