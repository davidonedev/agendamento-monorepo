import { Router } from 'express';
import { login, me, updateMe, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', authenticate, me);

// PATCH /api/auth/me
router.patch('/me', authenticate, updateMe);

// PUT /api/auth/password
router.put('/password', authenticate, changePassword);

export { router as authRoutes };
