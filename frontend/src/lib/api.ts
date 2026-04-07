// ─── Cliente HTTP base ────────────────────────────────────────────────────────
// Centraliza todas as chamadas à API REST.
// - Lê o token JWT do sessionStorage automaticamente
// - Lança erros estruturados com mensagem vinda do backend

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';

const SESSION_KEY = 'agendepro_session';

interface Session {
  token: string;
}

function getToken(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    return session.token ?? null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: unknown) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Erro tipado da API ───────────────────────────────────────────────────────
export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      body.error ?? `Erro ${res.status}`,
      res.status,
      body.code,
      body.details
    );
  }

  // Todos os endpoints retornam { success: true, data: T }
  return (body.data ?? body) as T;
}

// ─── Métodos HTTP ─────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};
