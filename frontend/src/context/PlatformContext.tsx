/**
 * PlatformContext — usado exclusivamente pelo Super Admin.
 * Carrega a lista de tenants da API e expõe mutações de status/plano.
 * TenantContext, ProfessionalContext e PublicTenantContext têm seus próprios
 * fetch independentes — não dependem mais deste context.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TenantData, TenantStatus, PlanConfig, TenantPlan } from '../types';
import {
  listTenantsApi,
  getPlatformMetricsApi,
  createTenantApi,
  updateTenantApi,
  deleteTenantApi,
  listPlanConfigsApi,
  updatePlanConfigApi,
  type TenantWithCounts,
  type PlatformMetrics,
  type CreateTenantPayload,
  type UpdatePlanConfigPayload,
} from '../services/super.service';

interface PlatformContextType {
  tenants: TenantWithCounts[];
  metrics: PlatformMetrics | null;
  planConfigs: PlanConfig[];
  loading: boolean;
  error: string | null;
  refreshTenants: () => Promise<void>;
  // CRUD tenants
  createTenant: (payload: CreateTenantPayload) => Promise<void>;
  updateTenant: (id: string, payload: Partial<Omit<CreateTenantPayload, 'adminPassword'>> & { status?: TenantStatus }) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  updateTenantStatus: (tenantId: string, status: TenantStatus) => Promise<void>;
  // CRUD planos
  updatePlanConfig: (plan: TenantPlan, payload: UpdatePlanConfigPayload) => Promise<void>;
  // retrocompatibilidade
  allData: TenantData[];
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<TenantWithCounts[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, metricsData, plans] = await Promise.all([
        listTenantsApi(),
        getPlatformMetricsApi(),
        listPlanConfigsApi(),
      ]);
      setTenants(data);
      setMetrics(metricsData);
      setPlanConfigs(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega a lista ao montar — o provider só é montado dentro do SuperGuard
  // (usuário já autenticado como super_admin)
  useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  const createTenant = async (payload: CreateTenantPayload) => {
    await createTenantApi(payload);
    await refreshTenants();
  };

  const updateTenant = async (
    id: string,
    payload: Partial<Omit<CreateTenantPayload, 'adminPassword'>> & { status?: TenantStatus }
  ) => {
    const updated = await updateTenantApi(id, payload);
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const deleteTenant = async (id: string) => {
    await deleteTenantApi(id);
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTenantStatus = async (tenantId: string, status: TenantStatus) => {
    await updateTenantApi(tenantId, { status });
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status } : t)));
  };

  const updatePlanConfig = async (plan: TenantPlan, payload: UpdatePlanConfigPayload) => {
    const updated = await updatePlanConfigApi(plan, payload);
    setPlanConfigs((prev) => prev.map((p) => (p.plan === plan ? updated : p)));
  };

  // allData: retrocompatibilidade — mapeia tenants para TenantData vazio
  // Os componentes que precisam de dados completos devem usar seus próprios contexts
  const allData: TenantData[] = tenants.map((t) => ({
    tenant: t,
    professionals: [],
    services: [],
    clients: [],
    appointments: [],
    blockedSlots: [],
  }));

  return (
    <PlatformContext.Provider
      value={{ tenants, metrics, planConfigs, loading, error, refreshTenants, createTenant, updateTenant, deleteTenant, updateTenantStatus, updatePlanConfig, allData }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be inside PlatformProvider');
  return ctx;
}
