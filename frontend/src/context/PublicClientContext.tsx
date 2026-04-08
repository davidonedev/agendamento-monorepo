/**
 * PublicClientContext — sessão do cliente no portal público.
 * Armazenada em localStorage por slug de tenant (isolamento multi-tenant).
 * Sem senha: o cliente "faz login" ao se cadastrar (upsert por e-mail).
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicClientSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface PublicClientContextType {
  client: PublicClientSession | null;
  login: (session: PublicClientSession) => void;
  logout: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(slug: string) {
  return `agendepro_client_${slug}`;
}

function readSession(slug: string): PublicClientSession | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as PublicClientSession) : null;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PublicClientContext = createContext<PublicClientContextType | null>(null);

export function PublicClientProvider({ children }: { children: React.ReactNode }) {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>();

  const [client, setClient] = useState<PublicClientSession | null>(
    () => readSession(tenantSlug),
  );

  const login = useCallback(
    (session: PublicClientSession) => {
      localStorage.setItem(storageKey(tenantSlug), JSON.stringify(session));
      setClient(session);
    },
    [tenantSlug],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(storageKey(tenantSlug));
    setClient(null);
  }, [tenantSlug]);

  return (
    <PublicClientContext.Provider value={{ client, login, logout }}>
      {children}
    </PublicClientContext.Provider>
  );
}

export function usePublicClient() {
  const ctx = useContext(PublicClientContext);
  if (!ctx) throw new Error('usePublicClient must be inside PublicClientProvider');
  return ctx;
}
