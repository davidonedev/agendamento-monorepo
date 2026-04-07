import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { superRoutes } from './super.routes';
import { adminRoutes } from './admin.routes';
import { professionalRoutes } from './professional.routes';
import { publicRoutes } from './public.routes';

const router = Router();

// POST /api/auth/*
router.use('/auth', authRoutes);

// /api/super/* — super admin
router.use('/super', superRoutes);

// /api/admin/* — tenant admin
router.use('/admin', adminRoutes);

// /api/professional/* — professional
router.use('/professional', professionalRoutes);

// /api/public/:slug/* — portal público (sem auth)
router.use('/public', publicRoutes);

export { router };
