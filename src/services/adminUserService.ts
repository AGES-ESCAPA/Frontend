import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminUser } from '@/types/adminUser';

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
};
