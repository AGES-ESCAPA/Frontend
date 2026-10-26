import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminOrderDetails, AdminOrderFilters, AdminOrderPage } from '@/types/order';

const API_BASE_URL = getApiBaseUrl();
const ADMIN_ORDERS_URL = `${API_BASE_URL}/admin/orders`;

export const ADMIN_ORDERS_PAGE_SIZE = 10;

export class AdminOrderServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminOrderServiceError';
    this.status = status;
  }
}

const NETWORK_ERROR_MESSAGE =
  'Não foi possível carregar os pedidos. Verifique sua conexão e tente novamente.';

const buildListUrl = (filters: AdminOrderFilters, page: number, size: number): string => {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.courseId) params.set('courseId', filters.courseId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(page));
  params.set('size', String(size));

  return `${ADMIN_ORDERS_URL}?${params.toString()}`;
};

export const adminOrderService = {
  async list(
    filters: AdminOrderFilters = {},
    page = 0,
    size: number = ADMIN_ORDERS_PAGE_SIZE,
    signal?: AbortSignal,
  ): Promise<AdminOrderPage> {
    let response: Response;
    try {
      response = await authenticatedFetch(buildListUrl(filters, page, size), { signal });
    } catch {
      throw new AdminOrderServiceError(0, NETWORK_ERROR_MESSAGE);
    }

    if (!response.ok) {
      throw new AdminOrderServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível carregar os pedidos.',
      );
    }

    const json: ApiResponse<AdminOrderPage> = await response.json();
    return json.data;
  },

  async get(id: string, signal?: AbortSignal): Promise<AdminOrderDetails> {
    let response: Response;
    try {
      response = await authenticatedFetch(`${ADMIN_ORDERS_URL}/${id}`, { signal });
    } catch {
      throw new AdminOrderServiceError(0, NETWORK_ERROR_MESSAGE);
    }

    if (response.status === 404) {
      throw new AdminOrderServiceError(404, 'Pedido não encontrado.');
    }

    if (!response.ok) {
      throw new AdminOrderServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível carregar o pedido.',
      );
    }

    const json: ApiResponse<AdminOrderDetails> = await response.json();
    return json.data;
  },
};
