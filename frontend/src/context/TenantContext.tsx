/**
 * TenantContext — dados do tenant admin.
 * Carrega tudo via API real e expõe as mesmas mutações que antes,
 * agora persistindo no backend.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Appointment, BlockedSlot, Client, Product, ProductCategory, ServiceCategory, Professional, Service, Tenant, TenantData } from '../types';
import { useAuth } from './AuthContext';

import { getMyTenantApi, updateTenantSettingsApi } from '../services/tenant.service';
import { listAppointmentsApi, createAppointmentApi, updateAppointmentStatusApi, deleteAppointmentApi } from '../services/appointments.service';
import { listBlockedSlotsApi, createBlockedSlotApi, deleteBlockedSlotApi } from '../services/blockedSlots.service';
import { listClientsApi, createClientApi, updateClientApi, deleteClientApi } from '../services/clients.service';
import { listProfessionalsApi, createProfessionalApi, updateProfessionalApi, deleteProfessionalApi } from '../services/professionals.service';
import { listServicesApi, createServiceApi, updateServiceApi, deleteServiceApi } from '../services/services.service';
import { listProductsApi, createProductApi, updateProductApi, deleteProductApi, adjustStockApi } from '../services/products.service';
import type { ProductPayload } from '../services/products.service';
import { listCategoriesApi, createCategoryApi, deleteCategoryApi } from '../services/productCategories.service';
import { listServiceCategoriesApi, createServiceCategoryApi, deleteServiceCategoryApi } from '../services/serviceCategories.service';
import type { TenantSettingsPayload } from '../services/tenant.service';
import type { CreateProfessionalPayload } from '../services/professionals.service';
import type { ServicePayload } from '../services/services.service';
import type { ClientPayload } from '../services/clients.service';
import type { CreateAppointmentPayload } from '../services/appointments.service';
import type { BlockedSlotPayload } from '../services/blockedSlots.service';

export const PLAN_LIMITS: Record<string, { professionals: number; services: number }> = {
  basic:      { professionals: 2,       services: 3       },
  pro:        { professionals: Infinity, services: Infinity },
  enterprise: { professionals: Infinity, services: Infinity },
};

interface TenantContextType extends TenantData {
  loading: boolean;
  refresh: () => Promise<void>;
  canAddProfessional: boolean;
  canAddService: boolean;

  // Appointments
  addAppointment:          (payload: CreateAppointmentPayload) => Promise<Appointment>;
  updateAppointmentStatus: (apptId: string, status: Appointment['status']) => Promise<void>;
  cancelAppointment:       (apptId: string) => Promise<void>;

  // Blocked slots
  addBlockedSlot:    (payload: BlockedSlotPayload) => Promise<BlockedSlot>;
  removeBlockedSlot: (slotId: string) => Promise<void>;

  // Clients
  addClient:    (payload: ClientPayload) => Promise<Client>;
  updateClient: (clientId: string, patch: Partial<ClientPayload>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;

  // Professionals
  addProfessional:    (payload: CreateProfessionalPayload) => Promise<Professional>;
  updateProfessional: (profId: string, patch: Partial<CreateProfessionalPayload>) => Promise<void>;
  deleteProfessional: (profId: string) => Promise<void>;

  // Services
  addService:    (payload: ServicePayload) => Promise<Service>;
  updateService: (id: string, patch: Partial<ServicePayload>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Products
  products:       Product[];
  addProduct:     (payload: ProductPayload) => Promise<Product>;
  updateProduct:  (id: string, patch: Partial<ProductPayload>) => Promise<void>;
  deleteProduct:  (id: string) => Promise<void>;
  adjustStock:    (id: string, delta: number) => Promise<void>;
  lowStockProducts: Product[];

  // Product categories
  productCategories:    ProductCategory[];
  addProductCategory:   (name: string) => Promise<ProductCategory>;
  deleteProductCategory:(id: string) => Promise<void>;

  // Service categories
  serviceCategories:    ServiceCategory[];
  addServiceCategory:   (name: string) => Promise<ServiceCategory>;
  deleteServiceCategory:(id: string) => Promise<void>;

  // Settings
  updateSettings: (patch: TenantSettingsPayload) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [tenant, setTenant]           = useState<Tenant | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices]       = useState<Service[]>([]);
  const [clients, setClients]         = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading]         = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, profs, svcs, cls, apts, bls, prods] = await Promise.all([
        getMyTenantApi(),
        listProfessionalsApi(),
        listServicesApi(),
        listClientsApi(),
        listAppointmentsApi(),
        listBlockedSlotsApi(),
        listProductsApi(),
      ]);
      setTenant(t);
      setProfessionals(profs);
      setServices(svcs);
      setClients(cls);
      setAppointments(apts);
      setBlockedSlots(bls);
      setProducts(prods);
      // Categorias carregadas separadamente — falha não bloqueia o portal
      listCategoriesApi().then(setProductCategories).catch(() => {});
      listServiceCategoriesApi().then(setServiceCategories).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'tenant_admin') refresh();
  }, [user, refresh]);

  if (!tenant && !loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Tenant não encontrado.
      </div>
    );
  }

  if (loading || !tenant) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const limits = PLAN_LIMITS[tenant.plan] ?? PLAN_LIMITS['basic'];

  // ─── Appointments ──────────────────────────────────────────────────────────
  const addAppointment = async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const appt = await createAppointmentApi(payload);
    setAppointments((prev) => [...prev, appt]);
    return appt;
  };

  const updateAppointmentStatus = async (apptId: string, status: Appointment['status']) => {
    await updateAppointmentStatusApi(apptId, status);
    setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, status } : a)));
  };

  const cancelAppointment = (apptId: string) => updateAppointmentStatus(apptId, 'cancelled');

  // ─── Blocked Slots ─────────────────────────────────────────────────────────
  const addBlockedSlot = async (payload: BlockedSlotPayload): Promise<BlockedSlot> => {
    const slot = await createBlockedSlotApi(payload);
    setBlockedSlots((prev) => [...prev, slot]);
    return slot;
  };

  const removeBlockedSlot = async (slotId: string) => {
    await deleteBlockedSlotApi(slotId);
    setBlockedSlots((prev) => prev.filter((b) => b.id !== slotId));
  };

  // ─── Clients ───────────────────────────────────────────────────────────────
  const addClient = async (payload: ClientPayload): Promise<Client> => {
    const client = await createClientApi(payload);
    setClients((prev) => [...prev, client]);
    return client;
  };

  const updateClient = async (clientId: string, patch: Partial<ClientPayload>) => {
    const updated = await updateClientApi(clientId, patch);
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, ...updated } : c)));
  };

  const deleteClient = async (clientId: string) => {
    await deleteClientApi(clientId);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  // ─── Professionals ─────────────────────────────────────────────────────────
  const addProfessional = async (payload: CreateProfessionalPayload): Promise<Professional> => {
    const prof = await createProfessionalApi(payload);
    setProfessionals((prev) => [...prev, prof]);
    return prof;
  };

  const updateProfessional = async (profId: string, patch: Partial<CreateProfessionalPayload>) => {
    const updated = await updateProfessionalApi(profId, patch);
    setProfessionals((prev) => prev.map((p) => (p.id === profId ? { ...p, ...updated } : p)));
  };

  const deleteProfessional = async (profId: string) => {
    await deleteProfessionalApi(profId);
    setProfessionals((prev) => prev.filter((p) => p.id !== profId));
  };

  // ─── Services ──────────────────────────────────────────────────────────────
  const addService = async (payload: ServicePayload): Promise<Service> => {
    const svc = await createServiceApi(payload);
    setServices((prev) => [...prev, svc]);
    return svc;
  };

  const updateService = async (id: string, patch: Partial<ServicePayload>) => {
    const updated = await updateServiceApi(id, patch);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteService = async (id: string) => {
    await deleteServiceApi(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // ─── Products ──────────────────────────────────────────────────────────────
  const addProduct = async (payload: ProductPayload): Promise<Product> => {
    const prod = await createProductApi(payload);
    setProducts(prev => [...prev, prod]);
    return prod;
  };

  const updateProduct = async (id: string, patch: Partial<ProductPayload>) => {
    const updated = await updateProductApi(id, patch);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const deleteProduct = async (id: string) => {
    await deleteProductApi(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = async (id: string, delta: number) => {
    const updated = await adjustStockApi(id, delta);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const lowStockProducts = products.filter(p => p.isActive && p.stock <= p.lowStockThreshold);

  // ─── Product Categories ────────────────────────────────────────────────────
  const addProductCategory = async (name: string): Promise<ProductCategory> => {
    const cat = await createCategoryApi(name);
    setProductCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    return cat;
  };

  const deleteProductCategory = async (id: string) => {
    await deleteCategoryApi(id);
    setProductCategories(prev => prev.filter(c => c.id !== id));
  };

  // ─── Service Categories ────────────────────────────────────────────────────
  const addServiceCategory = async (name: string): Promise<ServiceCategory> => {
    const cat = await createServiceCategoryApi(name);
    setServiceCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    return cat;
  };

  const deleteServiceCategory = async (id: string) => {
    await deleteServiceCategoryApi(id);
    setServiceCategories(prev => prev.filter(c => c.id !== id));
  };

  // ─── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = async (patch: TenantSettingsPayload) => {
    const updated = await updateTenantSettingsApi(patch);
    setTenant((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const ctx: TenantContextType = {
    tenant,
    professionals,
    services,
    clients,
    appointments,
    blockedSlots,
    loading,
    refresh,
    canAddProfessional: professionals.length < limits.professionals,
    canAddService: services.length < limits.services,
    addAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    addBlockedSlot,
    removeBlockedSlot,
    addClient,
    updateClient,
    deleteClient,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    addService,
    updateService,
    deleteService,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    lowStockProducts,
    productCategories,
    addProductCategory,
    deleteProductCategory,
    serviceCategories,
    addServiceCategory,
    deleteServiceCategory,
    updateSettings,
  };

  return <TenantContext.Provider value={ctx}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be inside TenantProvider');
  return ctx;
}
