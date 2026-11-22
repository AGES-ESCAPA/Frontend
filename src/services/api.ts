import { getApiBaseUrl } from '@services/runtimeEnv';
import {
  isAbortError,
  isIdempotentMethod,
  RETRYABLE_HTTP_STATUS,
  sleep,
} from '@services/networkResilience';

const API_BASE_URL = getApiBaseUrl();

/** Chave única usada para persistir a sessão do usuário autenticado. */
const ACCESS_TOKEN_KEY = 'access_token';

/** Tentativas totais (1 + retries) para GET/HEAD sob instabilidade. */
const IDEMPOTENT_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): (() => void) => {
  onUnauthorized = handler;
  return () => {
    if (onUnauthorized === handler) onUnauthorized = null;
  };
};

export const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildAuthenticatedInit = (init: RequestInit = {}): RequestInit => {
  const headers = new Headers(authHeaders());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  // Com FormData o navegador define o Content-Type com o boundary do multipart.
  if (init.body instanceof FormData) headers.delete('Content-Type');
  return { ...init, headers };
};

/**
 * Fetch autenticado. Em GET/HEAD, reintenta falhas de rede e 5xx/429 para
 * que micro-instabilidades não cheguem à UI.
 */
export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> => {
  const idempotent = isIdempotentMethod(init);
  const maxAttempts = idempotent ? IDEMPOTENT_MAX_ATTEMPTS : 1;
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (init.signal?.aborted) {
      throw init.signal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    try {
      const response = await fetch(input, buildAuthenticatedInit(init));

      if (response.status === 401) {
        onUnauthorized?.();
        return response;
      }

      if (
        idempotent &&
        attempt < maxAttempts &&
        RETRYABLE_HTTP_STATUS.has(response.status) &&
        !init.signal?.aborted
      ) {
        lastResponse = response;
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), init.signal);
        continue;
      }

      return response;
    } catch (error: unknown) {
      lastError = error;
      if (!idempotent || isAbortError(error, init.signal) || attempt >= maxAttempts) {
        throw error;
      }
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), init.signal);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError;
};

/** Envelope de sucesso devolvido pela API (`{ success, data, message }`). */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/** Envelope de erro devolvido pela API em qualquer status 4xx/5xx. */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

/**
 * Lê a `message` do envelope de erro da API. Devolve `null` quando o corpo não
 * é JSON ou não segue o formato esperado, para o chamador usar um fallback.
 */
export const readApiErrorMessage = async (response: Response): Promise<string | null> => {
  const body: unknown = await response.json().catch(() => null);

  if (body !== null && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message?: unknown };
    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }

  return null;
};

export interface HealthResponse {
  status: string;
  service: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const api = {
  baseUrl: API_BASE_URL,

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Failed to check health: ${response.statusText}`);
    }
    const json: ApiResponse<HealthResponse> = await response.json();
    return json.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    const json: ApiResponse<User[]> = await response.json();
    return json.data;
  },

  async createUser(user: { name: string; email: string; role: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to create user: ${response.statusText}`);
    }
    const json: ApiResponse<User> = await response.json();
    return json.data;
  },
};
