import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getMyTenant, getDashboard, updateSettings, getRevenue } from '../controllers/tenant.controller';
import { listProfessionals, getProfessional, createProfessional, updateProfessional, deleteProfessional } from '../controllers/professional.controller';
import { listServices, createService, updateService, deleteService } from '../controllers/service.controller';
import { listClients, getClient, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { listAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from '../controllers/appointment.controller';
import { listBlockedSlots, createBlockedSlot, deleteBlockedSlot } from '../controllers/blockedSlot.controller';
import { listProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../controllers/product.controller';
import { listCategories, createCategory, deleteCategory } from '../controllers/productCategory.controller';
import { listServiceCategories, createServiceCategory, deleteServiceCategory } from '../controllers/serviceCategory.controller';
import { listAbsentClients } from '../controllers/reminder.controller';

const router = Router();

// Todas as rotas admin exigem autenticação + role tenant_admin
router.use(authenticate, authorize('tenant_admin'));

// ─── Tenant ───────────────────────────────────────────────────────────────────
router.get('/me', getMyTenant);
router.get('/dashboard', getDashboard);
router.patch('/settings', updateSettings);
router.get('/revenue', getRevenue);

// ─── Profissionais ────────────────────────────────────────────────────────────
router.get('/professionals', listProfessionals);
router.post('/professionals', createProfessional);
router.get('/professionals/:id', getProfessional);
router.patch('/professionals/:id', updateProfessional);
router.delete('/professionals/:id', deleteProfessional);

// ─── Serviços ─────────────────────────────────────────────────────────────────
router.get('/services', listServices);
router.post('/services', createService);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// ─── Clientes ─────────────────────────────────────────────────────────────────
router.get('/clients', listClients);
router.post('/clients', createClient);
router.get('/clients/:id', getClient);
router.patch('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);

// ─── Agendamentos ─────────────────────────────────────────────────────────────
router.get('/appointments', listAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

// ─── Horários bloqueados ──────────────────────────────────────────────────────
router.get('/blocked-slots', listBlockedSlots);
router.post('/blocked-slots', createBlockedSlot);
router.delete('/blocked-slots/:id', deleteBlockedSlot);

// ─── Produtos ─────────────────────────────────────────────────────────────────
router.get('/products', listProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', adjustStock);

// ─── Categorias de produtos ───────────────────────────────────────────────────
router.get('/product-categories', listCategories);

// ─── Lembretes ────────────────────────────────────────────────────────────────
router.get('/reminders/absent-clients', listAbsentClients);
router.post('/product-categories', createCategory);
router.delete('/product-categories/:id', deleteCategory);

// ─── Categorias de serviços ───────────────────────────────────────────────────
router.get('/service-categories', listServiceCategories);
router.post('/service-categories', createServiceCategory);
router.delete('/service-categories/:id', deleteServiceCategory);

export { router as adminRoutes };
