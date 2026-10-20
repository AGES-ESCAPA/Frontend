import { getApiBaseUrl } from '@services/runtimeEnv';
import { readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import type { AuthUser } from '@/types/auth';

const API_BASE_URL = getApiBaseUrl();

interface LoginResponse {
  accessToken?: string;
  token?: string;
  user: AuthUser;
}

export class AuthServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

const getResponseData = async <T>(response: Response, fallback: string): Promise<T> => {
  if (!response.ok) {
    throw new AuthServiceError(response.status, (await readApiErrorMessage(response)) ?? fallback);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
};

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await getResponseData<LoginResponse>(
      response,
      'Não foi possível entrar na conta.',
    );
    const token = data.accessToken ?? data.token;

    if (!token) {
      throw new AuthServiceError(500, 'A resposta de autenticação não contém um token.');
    }

    return { token, user: data.user };
  },

  async getCurrentUser(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return getResponseData<AuthUser>(response, 'Não foi possível restaurar a sessão.');
  },
};
