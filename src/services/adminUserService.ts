import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminUser, AdminUserDetail, AdminUserUpdatePayload } from '@/types/adminUser';

const API_BASE_URL = getApiBaseUrl();
const USERS_URL = `${API_BASE_URL}/users`;

export class AdminUserServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminUserServiceError';
    this.status = status;
  }
}

const NETWORK_ERROR_MESSAGE =
  'Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.';

const DETAIL_NETWORK_ERROR_MESSAGE =
  'Não foi possível carregar o detalhe do usuário. Verifique sua conexão e tente novamente.';

export const adminUserService = {
  async list(signal?: AbortSignal): Promise<AdminUser[]> {
    let response: Response;
    try {
      response = await authenticatedFetch(USERS_URL, { signal });
    } catch {
      throw new AdminUserServiceError(0, NETWORK_ERROR_MESSAGE);
    }

    if (!response.ok) {
      throw new AdminUserServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível carregar os usuários.',
      );
    }

    const json: ApiResponse<AdminUser[]> = await response.json();
    return json.data;
  },

  async getById(id: string, signal?: AbortSignal): Promise<AdminUserDetail> {
    let response: Response;
    try {
      response = await authenticatedFetch(`${USERS_URL}/${id}`, { signal });
    } catch {
      throw new AdminUserServiceError(0, DETAIL_NETWORK_ERROR_MESSAGE);
    }

    if (!response.ok) {
      throw new AdminUserServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível carregar o detalhe do usuário.',
      );
    }

    const json: ApiResponse<AdminUserDetail> = await response.json();
    return json.data;
  },

  async update(
    id: string,
    payload: AdminUserUpdatePayload,
    signal?: AbortSignal,
  ): Promise<AdminUserDetail> {
    let response: Response;
    try {
      response = await authenticatedFetch(`${USERS_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
    } catch {
      throw new AdminUserServiceError(
        0,
        'Não foi possível salvar os dados do usuário. Verifique sua conexão e tente novamente.',
      );
    }

    if (!response.ok) {
      throw new AdminUserServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível salvar os dados do usuário.',
      );
    }

    const json: ApiResponse<AdminUserDetail> = await response.json();
    return json.data;
  },

  async requestEmailChange(
    id: string,
    email: string,
    signal?: AbortSignal,
  ): Promise<AdminUserDetail> {
    let response: Response;
    try {
      response = await authenticatedFetch(`${USERS_URL}/${id}/email-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal,
      });
    } catch {
      throw new AdminUserServiceError(
        0,
        'Não foi possível solicitar a troca de e-mail. Verifique sua conexão e tente novamente.',
      );
    }

    if (!response.ok) {
      throw new AdminUserServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível solicitar a troca de e-mail.',
      );
    }

    const json: ApiResponse<AdminUserDetail> = await response.json();
    return json.data;
  },

  async deactivate(id: string, signal?: AbortSignal): Promise<AdminUserDetail> {
    let response: Response;
    try {
      response = await authenticatedFetch(`${USERS_URL}/${id}/deactivate`, {
        method: 'POST',
        signal,
      });
    } catch {
      throw new AdminUserServiceError(
        0,
        'Não foi possível bloquear o usuário. Verifique sua conexão e tente novamente.',
      );
    }

    if (!response.ok) {
      throw new AdminUserServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível bloquear o usuário.',
      );
    }

    const json: ApiResponse<AdminUserDetail> = await response.json();
    return json.data;
  },
};
