import { api, getAuthHeaders } from './api';
import type { ApiResponse, User } from './api';

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export const authService = {
  async login(email: string, password = '123'): Promise<LoginResponse> {
    const response = await fetch(`${api.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Falha no login: ${response.statusText}`);
    }

    const json: ApiResponse<LoginResponse> = await response.json();
    return json.data;
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${api.baseUrl}/users/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar perfil: ${response.statusText}`);
    }

    const json: ApiResponse<User> = await response.json();
    return json.data;
  },
};
