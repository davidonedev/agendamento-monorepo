// ─── Base entities ────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  isActive: boolean;
}

export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  specialty: string;
  avatar: string;    // initials fallback
  photoUrl?: string; // base64 or URL
  bio: string;
  services: string[]; // service ids
  workingHours: { start: string; end: string };
  workingDays: number[]; // 0=Sun … 6=Sat
  email?: string;    // platform login
  password?: string; // platform login
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: AppointmentStatus;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BlockedSlot {
  id: string;
  tenantId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Multi-tenant ─────────────────────────────────────────────────────────────

export type TenantPlan   = 'basic' | 'pro' | 'enterprise';
export type TenantStatus = 'active' | 'trial' | 'suspended';

export interface PlanConfig {
  id: string;
  plan: TenantPlan;
  displayName: string;
  defaultPrice: number;
  maxProfessionals: number; // -1 = ilimitado
  maxServices: number;      // -1 = ilimitado
  features: string[];
  updatedAt: string;
}

export interface Tenant {
  id: string;
  slug: string;          // URL-safe e.g. "barber-kings"
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  status: TenantStatus;
  plan: TenantPlan;
  monthlyPrice: number;  // R$ per plan
  createdAt: string;
  primaryColor: string;  // hex — client portal branding
  adminColor?: string;   // hex — admin sidebar/platform branding (falls back to primaryColor)
  logoUrl?: string;      // barbershop logo (base64 or URL)
  bannerUrl?: string;    // client portal hero banner
  isOpen: boolean;            // shown on client portal
  minAdvanceMinutes: number;  // minimum booking lead time in minutes
  // WhatsApp
  whatsappApiUrl?:   string | null;
  whatsappApiKey?:   string | null;
  whatsappInstance?: string | null;
  whatsappTemplate?: string | null;
}

export interface TenantData {
  tenant: Tenant;
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'super_admin' | 'tenant_admin' | 'professional';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  tenantId?: string;      // tenant_admin + professional
  professionalId?: string; // professional only
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type AdminTab   = 'dashboard' | 'agenda' | 'clients' | 'professionals' | 'revenue' | 'settings';
export type RevenueRange = 'day' | 'week' | 'month' | 'year' | 'custom';
