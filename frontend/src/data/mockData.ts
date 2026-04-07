import { format, subDays, addDays } from 'date-fns';
import type { AuthUser, TenantData } from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const d = (offset: number) => format(offset >= 0 ? addDays(new Date(), offset) : subDays(new Date(), -offset), 'yyyy-MM-dd');
const today     = d(0);
const yesterday = d(-1);
const tm        = d(1);  // tomorrow
const d2        = d(2);
const d3        = d(3);

// ─── Mock auth users ──────────────────────────────────────────────────────────
export const mockUsers: AuthUser[] = [
  { id: 'u1', name: 'Admin Plataforma', email: 'super@agendepro.com',   password: '1234', role: 'super_admin' },
  { id: 'u2', name: 'Dono Barber Kings',       email: 'admin@barber-kings.com', password: '1234', role: 'tenant_admin', tenantId: 't1' },
  { id: 'u3', name: 'Dono Navalha de Ouro',    email: 'admin@navalha.com',      password: '1234', role: 'tenant_admin', tenantId: 't2' },
  { id: 'u4', name: 'Dono Barbearia Vintage',  email: 'admin@vintage.com',      password: '1234', role: 'tenant_admin', tenantId: 't3' },
];

// ─── Tenant 1 — Barber Kings (Pro, active) ───────────────────────────────────
const t1: TenantData = {
  tenant: {
    id: 't1', slug: 'barber-kings', name: 'Barber Kings',
    ownerName: 'Ricardo Almeida', email: 'admin@barber-kings.com',
    phone: '(11) 98000-1111', address: 'Av. Paulista, 1000 — São Paulo/SP',
    status: 'active', plan: 'pro', monthlyPrice: 149,
    createdAt: '2024-01-10', primaryColor: '#7c3aed', adminColor: '#1e1b4b',
    isOpen: true,
  },
  services: [
    { id: 't1-s1', tenantId: 't1', name: 'Corte Masculino',  description: 'Corte clássico ou moderno com acabamento perfeito', price: 45, duration: 30, category: 'Cabelo' },
    { id: 't1-s2', tenantId: 't1', name: 'Barba',            description: 'Modelagem e hidratação completa da barba',           price: 35, duration: 30, category: 'Barba'  },
    { id: 't1-s3', tenantId: 't1', name: 'Corte + Barba',    description: 'Combo completo com desconto especial',               price: 70, duration: 60, category: 'Combo'  },
    { id: 't1-s4', tenantId: 't1', name: 'Coloração',        description: 'Coloração completa com produtos premium',            price: 120, duration: 90, category: 'Cabelo' },
    { id: 't1-s5', tenantId: 't1', name: 'Hidratação',       description: 'Tratamento profundo de hidratação capilar',          price: 80, duration: 60, category: 'Tratamento' },
  ],
  professionals: [
    { id: 't1-p1', tenantId: 't1', name: 'Carlos Silva',   specialty: 'Barbeiro Especialista',     avatar: 'CS', bio: '10+ anos cortando cabelos clássicos e modernos.', services: ['t1-s1','t1-s2','t1-s3'], workingHours: { start: '09:00', end: '18:00' }, workingDays: [1,2,3,4,5,6], email: 'carlos@barber-kings.com', password: '1234' },
    { id: 't1-p2', tenantId: 't1', name: 'Ana Rodrigues',  specialty: 'Cabeleireira & Colorista',  avatar: 'AR', bio: 'Especialista em coloração e tratamentos premium.',  services: ['t1-s1','t1-s4','t1-s5'], workingHours: { start: '08:00', end: '17:00' }, workingDays: [1,2,3,4,5],   email: 'ana@barber-kings.com',    password: '1234' },
    { id: 't1-p3', tenantId: 't1', name: 'Marcos Lima',    specialty: 'Barbeiro & Esteticista',    avatar: 'ML', bio: 'Referência em cortes tendência e cuidados masculinos.',services: ['t1-s1','t1-s2','t1-s3'], workingHours: { start: '10:00', end: '19:00' }, workingDays: [2,3,4,5,6]   },
  ],
  clients: [
    { id: 't1-c1', tenantId: 't1', name: 'João Pereira',    email: 'joao@email.com',    phone: '(11) 99111-1111', createdAt: '2024-02-01' },
    { id: 't1-c2', tenantId: 't1', name: 'Maria Santos',    email: 'maria@email.com',   phone: '(11) 99222-2222', createdAt: '2024-02-15' },
    { id: 't1-c3', tenantId: 't1', name: 'Pedro Alves',     email: 'pedro@email.com',   phone: '(11) 99333-3333', createdAt: '2024-03-10' },
    { id: 't1-c4', tenantId: 't1', name: 'Fernanda Costa',  email: 'fer@email.com',     phone: '(11) 99444-4444', createdAt: '2024-03-20' },
    { id: 't1-c5', tenantId: 't1', name: 'Ricardo Souza',   email: 'ricas@email.com',   phone: '(11) 99555-5555', createdAt: '2024-04-05' },
    { id: 't1-c6', tenantId: 't1', name: 'Juliana Mendes',  email: 'juli@email.com',    phone: '(11) 99666-6666', createdAt: '2024-04-18' },
    { id: 't1-c7', tenantId: 't1', name: 'Bruno Carvalho',  email: 'bruno@email.com',   phone: '(11) 99777-7777', createdAt: '2024-05-02' },
    { id: 't1-c8', tenantId: 't1', name: 'Larissa Oliveira',email: 'lari@email.com',    phone: '(11) 99888-8888', createdAt: '2024-05-14' },
  ],
  appointments: [
    { id: 't1-a1',  tenantId: 't1', clientId: 't1-c1', professionalId: 't1-p1', serviceId: 't1-s1', date: today,     startTime: '09:00', endTime: '09:30', status: 'confirmed',  price: 45,  createdAt: d(-3) },
    { id: 't1-a2',  tenantId: 't1', clientId: 't1-c2', professionalId: 't1-p2', serviceId: 't1-s4', date: today,     startTime: '10:00', endTime: '11:30', status: 'confirmed',  price: 120, createdAt: d(-3) },
    { id: 't1-a3',  tenantId: 't1', clientId: 't1-c3', professionalId: 't1-p1', serviceId: 't1-s3', date: today,     startTime: '11:00', endTime: '12:00', status: 'confirmed',  price: 70,  createdAt: d(-3) },
    { id: 't1-a4',  tenantId: 't1', clientId: 't1-c4', professionalId: 't1-p3', serviceId: 't1-s2', date: today,     startTime: '14:00', endTime: '14:30', status: 'pending',    price: 35,  createdAt: today  },
    { id: 't1-a5',  tenantId: 't1', clientId: 't1-c5', professionalId: 't1-p2', serviceId: 't1-s5', date: today,     startTime: '15:00', endTime: '16:00', status: 'pending',    price: 80,  createdAt: today  },
    { id: 't1-a6',  tenantId: 't1', clientId: 't1-c6', professionalId: 't1-p1', serviceId: 't1-s2', date: tm,        startTime: '09:00', endTime: '09:30', status: 'confirmed',  price: 35,  createdAt: today  },
    { id: 't1-a7',  tenantId: 't1', clientId: 't1-c7', professionalId: 't1-p3', serviceId: 't1-s1', date: tm,        startTime: '11:00', endTime: '11:30', status: 'confirmed',  price: 45,  createdAt: today  },
    { id: 't1-a8',  tenantId: 't1', clientId: 't1-c8', professionalId: 't1-p2', serviceId: 't1-s4', date: d2,        startTime: '09:00', endTime: '10:30', status: 'confirmed',  price: 120, createdAt: today  },
    { id: 't1-a9',  tenantId: 't1', clientId: 't1-c1', professionalId: 't1-p3', serviceId: 't1-s3', date: d3,        startTime: '10:00', endTime: '11:00', status: 'confirmed',  price: 70,  createdAt: today  },
    { id: 't1-a10', tenantId: 't1', clientId: 't1-c2', professionalId: 't1-p1', serviceId: 't1-s1', date: yesterday, startTime: '14:00', endTime: '14:30', status: 'completed',  price: 45,  createdAt: d(-3) },
    { id: 't1-a11', tenantId: 't1', clientId: 't1-c3', professionalId: 't1-p2', serviceId: 't1-s5', date: yesterday, startTime: '10:00', endTime: '11:00', status: 'completed',  price: 80,  createdAt: d(-3) },
    { id: 't1-a12', tenantId: 't1', clientId: 't1-c4', professionalId: 't1-p1', serviceId: 't1-s2', date: d(-3),    startTime: '09:00', endTime: '09:30', status: 'completed',  price: 35,  createdAt: d(-7) },
    { id: 't1-a13', tenantId: 't1', clientId: 't1-c5', professionalId: 't1-p3', serviceId: 't1-s1', date: d(-5),    startTime: '14:00', endTime: '14:30', status: 'completed',  price: 45,  createdAt: d(-7) },
    { id: 't1-a14', tenantId: 't1', clientId: 't1-c6', professionalId: 't1-p2', serviceId: 't1-s4', date: d(-7),    startTime: '09:00', endTime: '10:30', status: 'completed',  price: 120, createdAt: d(-10) },
    { id: 't1-a15', tenantId: 't1', clientId: 't1-c7', professionalId: 't1-p1', serviceId: 't1-s3', date: d(-10),   startTime: '11:00', endTime: '12:00', status: 'completed',  price: 70,  createdAt: d(-14) },
    { id: 't1-a16', tenantId: 't1', clientId: 't1-c8', professionalId: 't1-p3', serviceId: 't1-s2', date: d(-12),   startTime: '15:00', endTime: '15:30', status: 'completed',  price: 35,  createdAt: d(-14) },
    { id: 't1-a17', tenantId: 't1', clientId: 't1-c1', professionalId: 't1-p2', serviceId: 't1-s5', date: d(-15),   startTime: '10:00', endTime: '11:00', status: 'completed',  price: 80,  createdAt: d(-20) },
    { id: 't1-a18', tenantId: 't1', clientId: 't1-c2', professionalId: 't1-p1', serviceId: 't1-s1', date: d(-20),   startTime: '14:00', endTime: '14:30', status: 'completed',  price: 45,  createdAt: d(-25) },
    { id: 't1-a19', tenantId: 't1', clientId: 't1-c3', professionalId: 't1-p3', serviceId: 't1-s3', date: d(-25),   startTime: '09:00', endTime: '10:00', status: 'cancelled',  price: 70,  createdAt: d(-28) },
    { id: 't1-a20', tenantId: 't1', clientId: 't1-c4', professionalId: 't1-p2', serviceId: 't1-s4', date: d(-28),   startTime: '11:00', endTime: '12:30', status: 'completed',  price: 120, createdAt: d(-30) },
  ],
  blockedSlots: [
    { id: 't1-b1', tenantId: 't1', professionalId: 't1-p1', date: today, startTime: '13:00', endTime: '14:00', reason: 'Almoço' },
    { id: 't1-b2', tenantId: 't1', professionalId: 't1-p2', date: today, startTime: '12:00', endTime: '13:00', reason: 'Intervalo' },
  ],
};

// ─── Tenant 2 — Navalha de Ouro (Basic, active) ──────────────────────────────
const t2: TenantData = {
  tenant: {
    id: 't2', slug: 'navalha-de-ouro', name: 'Navalha de Ouro',
    ownerName: 'Felipe Gomes', email: 'admin@navalha.com',
    phone: '(21) 98000-2222', address: 'Rua das Laranjeiras, 250 — Rio de Janeiro/RJ',
    status: 'active', plan: 'basic', monthlyPrice: 79,
    createdAt: '2024-03-05', primaryColor: '#d97706', adminColor: '#78350f',
    isOpen: true,
  },
  services: [
    { id: 't2-s1', tenantId: 't2', name: 'Corte Tradicional', description: 'Corte clássico com navalha e acabamento perfeito', price: 40, duration: 30, category: 'Cabelo' },
    { id: 't2-s2', tenantId: 't2', name: 'Barba Completa',     description: 'Modelagem, aparagem e hidratação da barba',        price: 30, duration: 30, category: 'Barba'  },
    { id: 't2-s3', tenantId: 't2', name: 'Combo Ouro',         description: 'Corte + barba com navalha quente',                 price: 60, duration: 60, category: 'Combo'  },
  ],
  professionals: [
    { id: 't2-p1', tenantId: 't2', name: 'Felipe Gomes',    specialty: 'Mestre Barbeiro',   avatar: 'FG', bio: '15 anos de tradição no corte com navalha.',    services: ['t2-s1','t2-s2','t2-s3'], workingHours: { start: '09:00', end: '18:00' }, workingDays: [1,2,3,4,5,6] },
    { id: 't2-p2', tenantId: 't2', name: 'Thiago Ramos',    specialty: 'Barbeiro',          avatar: 'TR', bio: 'Especialista em barbas e acabamentos precisos.',  services: ['t2-s1','t2-s2','t2-s3'], workingHours: { start: '10:00', end: '19:00' }, workingDays: [2,3,4,5,6]   },
  ],
  clients: [
    { id: 't2-c1', tenantId: 't2', name: 'Lucas Ferreira',  email: 'lucas@email.com',  phone: '(21) 99100-1111', createdAt: '2024-03-10' },
    { id: 't2-c2', tenantId: 't2', name: 'Camila Nunes',    email: 'camila@email.com', phone: '(21) 99100-2222', createdAt: '2024-03-20' },
    { id: 't2-c3', tenantId: 't2', name: 'Diego Martins',   email: 'diego@email.com',  phone: '(21) 99100-3333', createdAt: '2024-04-01' },
    { id: 't2-c4', tenantId: 't2', name: 'Priscila Lima',   email: 'pri@email.com',    phone: '(21) 99100-4444', createdAt: '2024-04-15' },
    { id: 't2-c5', tenantId: 't2', name: 'Henrique Dias',   email: 'henri@email.com',  phone: '(21) 99100-5555', createdAt: '2024-05-01' },
  ],
  appointments: [
    { id: 't2-a1', tenantId: 't2', clientId: 't2-c1', professionalId: 't2-p1', serviceId: 't2-s1', date: today,     startTime: '09:00', endTime: '09:30', status: 'confirmed',  price: 40, createdAt: d(-2) },
    { id: 't2-a2', tenantId: 't2', clientId: 't2-c2', professionalId: 't2-p2', serviceId: 't2-s3', date: today,     startTime: '10:00', endTime: '11:00', status: 'confirmed',  price: 60, createdAt: d(-2) },
    { id: 't2-a3', tenantId: 't2', clientId: 't2-c3', professionalId: 't2-p1', serviceId: 't2-s2', date: tm,        startTime: '09:00', endTime: '09:30', status: 'confirmed',  price: 30, createdAt: today  },
    { id: 't2-a4', tenantId: 't2', clientId: 't2-c4', professionalId: 't2-p2', serviceId: 't2-s1', date: yesterday, startTime: '14:00', endTime: '14:30', status: 'completed',  price: 40, createdAt: d(-3) },
    { id: 't2-a5', tenantId: 't2', clientId: 't2-c5', professionalId: 't2-p1', serviceId: 't2-s3', date: d(-5),    startTime: '11:00', endTime: '12:00', status: 'completed',  price: 60, createdAt: d(-7) },
    { id: 't2-a6', tenantId: 't2', clientId: 't2-c1', professionalId: 't2-p2', serviceId: 't2-s2', date: d(-8),    startTime: '09:00', endTime: '09:30', status: 'completed',  price: 30, createdAt: d(-10) },
    { id: 't2-a7', tenantId: 't2', clientId: 't2-c2', professionalId: 't2-p1', serviceId: 't2-s1', date: d(-12),   startTime: '10:00', endTime: '10:30', status: 'completed',  price: 40, createdAt: d(-14) },
    { id: 't2-a8', tenantId: 't2', clientId: 't2-c3', professionalId: 't2-p2', serviceId: 't2-s3', date: d(-18),   startTime: '14:00', endTime: '15:00', status: 'cancelled',  price: 60, createdAt: d(-20) },
  ],
  blockedSlots: [
    { id: 't2-b1', tenantId: 't2', professionalId: 't2-p1', date: today, startTime: '13:00', endTime: '14:00', reason: 'Almoço' },
  ],
};

// ─── Tenant 3 — Barbearia Vintage (Basic, suspended) ─────────────────────────
const t3: TenantData = {
  tenant: {
    id: 't3', slug: 'barbearia-vintage', name: 'Barbearia Vintage',
    ownerName: 'Marcos Andrade', email: 'admin@vintage.com',
    phone: '(31) 98000-3333', address: 'Rua da Bahia, 500 — Belo Horizonte/MG',
    status: 'suspended', plan: 'basic', monthlyPrice: 79,
    createdAt: '2024-05-01', primaryColor: '#16a34a', adminColor: '#14532d',
    isOpen: false,
  },
  services: [
    { id: 't3-s1', tenantId: 't3', name: 'Corte Vintage', description: 'Corte estilo retrô com acabamento caprichado', price: 50, duration: 45, category: 'Cabelo' },
    { id: 't3-s2', tenantId: 't3', name: 'Bigode & Barba', description: 'Modelagem completa de bigode e barba',         price: 35, duration: 30, category: 'Barba'  },
    { id: 't3-s3', tenantId: 't3', name: 'Pacote Retrô',   description: 'Corte vintage + barba + bigode',               price: 75, duration: 75, category: 'Combo'  },
  ],
  professionals: [
    { id: 't3-p1', tenantId: 't3', name: 'Marcos Andrade', specialty: 'Barbeiro Clássico', avatar: 'MA', bio: 'Fã de estilos retrô e técnicas tradicionais.', services: ['t3-s1','t3-s2','t3-s3'], workingHours: { start: '09:00', end: '17:00' }, workingDays: [1,2,3,4,5] },
    { id: 't3-p2', tenantId: 't3', name: 'Gustavo Pinto',  specialty: 'Barbeiro',          avatar: 'GP', bio: 'Especialista em cortes vintage dos anos 60.',    services: ['t3-s1','t3-s3'],          workingHours: { start: '10:00', end: '18:00' }, workingDays: [3,4,5,6]   },
  ],
  clients: [
    { id: 't3-c1', tenantId: 't3', name: 'André Costa',    email: 'andre@email.com',  phone: '(31) 99200-1111', createdAt: '2024-05-10' },
    { id: 't3-c2', tenantId: 't3', name: 'Beatriz Souza',  email: 'bea@email.com',    phone: '(31) 99200-2222', createdAt: '2024-05-15' },
    { id: 't3-c3', tenantId: 't3', name: 'Caio Rezende',   email: 'caio@email.com',   phone: '(31) 99200-3333', createdAt: '2024-05-20' },
  ],
  appointments: [
    { id: 't3-a1', tenantId: 't3', clientId: 't3-c1', professionalId: 't3-p1', serviceId: 't3-s1', date: d(-10), startTime: '09:00', endTime: '09:45', status: 'completed',  price: 50, createdAt: d(-14) },
    { id: 't3-a2', tenantId: 't3', clientId: 't3-c2', professionalId: 't3-p2', serviceId: 't3-s3', date: d(-12), startTime: '10:00', endTime: '11:15', status: 'completed',  price: 75, createdAt: d(-14) },
    { id: 't3-a3', tenantId: 't3', clientId: 't3-c3', professionalId: 't3-p1', serviceId: 't3-s2', date: d(-15), startTime: '14:00', endTime: '14:30', status: 'cancelled',  price: 35, createdAt: d(-17) },
  ],
  blockedSlots: [],
};

// ─── Master export ────────────────────────────────────────────────────────────
export const mockPlatformData: TenantData[] = [t1, t2, t3];
