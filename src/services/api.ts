const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Identificação do administrador nas rotas `/admin/**`.
 *
 * O backend ainda não tem autenticação por token: todo endpoint administrativo
 * exige o header `X-User-Id` com o UUID de um usuário ADMIN (ver guia da US-06,
 * seção 2). Enquanto o login não existir, o valor vem do ambiente com fallback
 * para o admin "Beatriz Nunes" do seed local.
 *
 * Quando o JWT entrar, basta trocar este helper por `Authorization: Bearer` —
 * nenhum serviço monta o header por conta própria.
 */
const DEFAULT_ADMIN_USER_ID = 'a0000000-0000-4000-a000-000000000001';

export const ADMIN_USER_ID: string = import.meta.env.VITE_ADMIN_USER_ID || DEFAULT_ADMIN_USER_ID;

export const adminHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-User-Id': ADMIN_USER_ID,
});

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
