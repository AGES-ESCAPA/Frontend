import { authenticatedFetch } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { CompanyEmployeePage, CompanySeats } from '@/types/companyEmployee';

const COMPANY_URL = `${getApiBaseUrl()}/company`;
export const COMPANY_EMPLOYEES_PAGE_SIZE = 10;

const NETWORK_ERROR =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Não foi possível processar a solicitação.';

    case 401:
      return 'Sua sessão não está válida. Entre novamente para continuar.';

    case 403:
      return 'Você não tem permissão para acessar os dados desta empresa.';

    case 404:
      return 'Não foi possível encontrar os dados da empresa.';

    case 429:
      return 'Muitas solicitações realizadas. Aguarde um momento e tente novamente.';

    default:
      if (status >= 500) {
        return 'O servidor está indisponível no momento. Tente novamente mais tarde.';
      }

      return 'Não foi possível carregar os dados da empresa.';
  }
}

export class CompanyEmployeeServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CompanyEmployeeServiceError';
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await authenticatedFetch(`${COMPANY_URL}${path}`, { signal });
  } catch (error: unknown) {
    if (signal?.aborted) throw error;

    throw new CompanyEmployeeServiceError(0, NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new CompanyEmployeeServiceError(response.status, getErrorMessage(response.status));
  }

  let body: ApiResponse<T>;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new CompanyEmployeeServiceError(response.status, 'Resposta inválida do servidor.');
  }

  if (!body || body.success !== true || body.data == null) {
    throw new CompanyEmployeeServiceError(response.status, 'Resposta inválida do servidor.');
  }

  return body.data;
}

export const companyEmployeeService = {
  getSeats(signal?: AbortSignal): Promise<CompanySeats> {
    return request<CompanySeats>('/seats', signal);
  },

  listEmployees(
    search = '',
    page = 0,
    size = COMPANY_EMPLOYEES_PAGE_SIZE,
    signal?: AbortSignal,
  ): Promise<CompanyEmployeePage> {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set('search', search.trim());
    }

    params.set('page', String(page));
    params.set('size', String(size));

    return request<CompanyEmployeePage>(`/employees?${params.toString()}`, signal);
  },
};
