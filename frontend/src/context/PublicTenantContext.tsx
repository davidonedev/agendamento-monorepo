/**
 * PublicTenantContext — portal do cliente (sem autenticação).
 * Carrega dados públicos do tenant por slug via API.
 * Expõe a mesma interface que antes para BookingFlow e ServicesPage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Appointment, Client, Product, TenantData } from '../types';

import {
  getPublicTenantApi,
  getPublicServicesApi,
  getPublicProfessionalsApi,
  createPublicBookingApi,
  type PublicBookingPayload,
} from '../services/public.service';
import { listPublicProductsApi } from '../services/products.service';

interface PublicTenantContextType {
  data: TenantData;
  products: Product[];
  loading: boolean;
  // Retorna array de agendamentos criados (um por serviço selecionado)
  addAppointment: (payload: PublicBookingPayload) => Promise<Appointment[]>;
  addClient: (client: Client) => void;
  getSlug: () => string;
}

const PublicTenantContext = createContext<PublicTenantContextType | null>(null);

export function PublicTenantProvider({ children }: { children: React.ReactNode }) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const [data, setData]         = useState<TenantData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;

    setLoading(true);
    setNotFound(false);
    setSuspended(false);

    Promise.all([
      getPublicTenantApi(tenantSlug),
      getPublicServicesApi(tenantSlug),
      getPublicProfessionalsApi(tenantSlug),
      listPublicProductsApi(tenantSlug),
    ])
      .then(([tenant, services, professionals, prods]) => {
        if (tenant.status === 'suspended') {
          setSuspended(true);
          return;
        }
        setData({
          tenant,
          services,
          professionals,
          clients: [],
          appointments: [],
          blockedSlots: [],
        });
        setProducts(prods);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-xl font-semibold">Barbearia não encontrada</p>
        <p className="text-sm">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  if (suspended) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-destructive">Estabelecimento inativo</p>
        <p className="text-sm text-muted-foreground">
          Este estabelecimento está temporariamente indisponível para agendamentos.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-xl font-semibold">Algo deu errado</p>
        <p className="text-sm">Não foi possível carregar o portal. Tente novamente.</p>
      </div>
    );
  }

  const addAppointment = async (payload: PublicBookingPayload): Promise<Appointment[]> => {
    const { appointments } = await createPublicBookingApi(tenantSlug!, payload);
    setData((prev) =>
      prev ? { ...prev, appointments: [...prev.appointments, ...appointments] } : prev,
    );
    return appointments;
  };

  // Mantido por compatibilidade — o backend cria o cliente automaticamente no booking
  const addClient = (_client: Client) => { /* no-op: backend gerencia */ };

  return (
    <PublicTenantContext.Provider
      value={{ data, products, loading, addAppointment, addClient, getSlug: () => tenantSlug! }}
    >
      {children}
    </PublicTenantContext.Provider>
  );
}

export function usePublicTenant() {
  const ctx = useContext(PublicTenantContext);
  if (!ctx) throw new Error('usePublicTenant must be inside PublicTenantProvider');
  return ctx;
}
