/**
 * ProfessionalContext — portal do profissional.
 * Carrega agendamentos, serviços e dados do tenant via API.
 * Expõe a mesma interface que antes para os componentes.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Appointment, Client, Professional, Service, Tenant } from '../types';
import { useAuth } from './AuthContext';

import {
  listProfAppointmentsApi,
  createProfAppointmentApi,
  updateProfAppointmentStatusApi,
  type CreateAppointmentPayload,
} from '../services/appointments.service';
import { listProfServicesApi, createProfServiceApi, updateProfServiceApi, deleteProfServiceApi } from '../services/services.service';
import type { ServicePayload } from '../services/services.service';
import { updateProfessionalMeApi, type UpdateMePayload } from '../services/professionals.service';
import { api } from '../lib/api';

interface ProfessionalContextType {
  professional: Professional;
  appointments: Appointment[];
  clients: Client[];
  allClients: Client[];
  services: Service[];
  tenant: Tenant;
  loading: boolean;
  refresh: () => Promise<void>;
  addAppointment:          (payload: CreateAppointmentPayload) => Promise<Appointment>;
  updateAppointmentStatus: (apptId: string, status: Appointment['status']) => Promise<void>;
  cancelAppointment:       (apptId: string) => Promise<void>;
  updateMySchedule:        (payload: UpdateMePayload) => Promise<void>;
  addService:    (payload: ServicePayload) => Promise<Service>;
  updateService: (id: string, patch: Partial<ServicePayload>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

const ProfessionalContext = createContext<ProfessionalContextType | null>(null);

export function ProfessionalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allClients, setAllClients]     = useState<Client[]>([]);
  const [services, setServices]         = useState<Service[]>([]);
  const [tenant, setTenant]             = useState<Tenant | null>(null);
  const [loading, setLoading]           = useState(true);

  const normalizeProfessional = (p: Record<string, unknown>): Professional => {
    const services = (p.services as { serviceId: string }[] | undefined) ?? [];
    return {
      id: p.id as string,
      tenantId: p.tenantId as string,
      name: p.name as string,
      specialty: p.specialty as string,
      avatar: (p.avatar as string) ?? '',
      photoUrl: p.photoUrl as string | undefined,
      bio: (p.bio as string) ?? '',
      services: services.map((s) => s.serviceId),
      workingHours: {
        start: (p.workingHoursStart as string) ?? '08:00',
        end: (p.workingHoursEnd as string) ?? '18:00',
      },
      workingDays: (p.workingDays as number[]) ?? [1, 2, 3, 4, 5],
    };
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [apts, svcs, profRaw, t, cls] = await Promise.all([
        listProfAppointmentsApi(),
        listProfServicesApi(),
        api.get<Record<string, unknown>>('/professional/me'),
        api.get<Tenant>('/professional/tenant'),
        api.get<Client[]>('/professional/clients'),
      ]);
      setAppointments(apts);
      setServices(svcs);
      setProfessional(normalizeProfessional(profRaw));
      setTenant(t);
      setAllClients(cls);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'professional') refresh();
  }, [user, refresh]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!professional || !tenant) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Profissional não encontrado.
      </div>
    );
  }

  // Clientes que têm agendamentos com este profissional
  const clientIds = new Set(appointments.map((a) => a.clientId));
  const clients = allClients.filter((c) => clientIds.has(c.id));

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const addAppointment = async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const appt = await createProfAppointmentApi(payload);
    setAppointments((prev) => [...prev, appt]);
    return appt;
  };

  const updateAppointmentStatus = async (apptId: string, status: Appointment['status']) => {
    await updateProfAppointmentStatusApi(apptId, status);
    setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, status } : a)));
  };

  const cancelAppointment = (apptId: string) => updateAppointmentStatus(apptId, 'cancelled');

  const updateMySchedule = async (payload: UpdateMePayload) => {
    const updated = await updateProfessionalMeApi(payload);
    setProfessional(updated);
  };

  const addService = async (payload: ServicePayload): Promise<Service> => {
    const svc = await createProfServiceApi(payload);
    setServices((prev) => [...prev, svc]);
    return svc;
  };

  const updateService = async (id: string, patch: Partial<ServicePayload>) => {
    const updated = await updateProfServiceApi(id, patch);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteService = async (id: string) => {
    await deleteProfServiceApi(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <ProfessionalContext.Provider
      value={{
        professional,
        appointments,
        clients,
        allClients,
        services,
        tenant,
        loading,
        refresh,
        addAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        updateMySchedule,
        addService,
        updateService,
        deleteService,
      }}
    >
      {children}
    </ProfessionalContext.Provider>
  );
}

export function useProfessional() {
  const ctx = useContext(ProfessionalContext);
  if (!ctx) throw new Error('useProfessional must be inside ProfessionalProvider');
  return ctx;
}
