import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type {
  CompanyEmployeePage,
  CompanyEmployeeStatus,
  CompanySeats,
} from '@/types/companyEmployee';

const COMPANY_URL = `${getApiBaseUrl()}/company`;
export const COMPANY_EMPLOYEES_PAGE_SIZE = 10;
export const NO_SEATS_AVAILABLE_MESSAGE =
  'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.';

const NETWORK_ERROR =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function getErrorMessage(
  status: number,
  serverMessage?: string | null,
  context?: 'resendInvite',
): string {
  switch (status) {
    case 400:
      return serverMessage ?? 'Não foi possível processar a solicitação.';

    case 401:
      return 'Sua sessão não está válida. Entre novamente para continuar.';

    case 403:
      return 'Você não tem permissão para acessar os dados desta empresa.';

    case 404:
      return 'Não foi possível encontrar os dados da empresa.';

    case 409: {
      const normalized = (serverMessage ?? '').toLowerCase();

      if (context === 'resendInvite') {
        return 'Somente colaboradores pendentes podem receber um novo convite.';
      }

      if (
        (normalized.includes('no free seat') || normalized.includes('all')) &&
        normalized.includes('seat')
      ) {
        return NO_SEATS_AVAILABLE_MESSAGE;
      }

      if (
        normalized.includes('email already registered') ||
        normalized.includes('e-mail já está cadastrado') ||
        normalized.includes('email já está cadastrado')
      ) {
        return 'Este e-mail já está cadastrado.';
      }

      if (normalized.includes('is not pending')) {
        return 'Somente colaboradores pendentes podem receber um novo convite.';
      }

      return 'Este e-mail já está cadastrado ou a solicitação conflita com os dados existentes.';
    }

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

export interface CompanyEmployeeInput {
  name: string;
  email: string;
}

export interface CompanyEmployeeCreateResponse {
  id: string;
  name: string;
  email: string;
  status: CompanyEmployeeStatus;
  assignedCourses: number;
  avatarUrl: string | null;
  inviteSent: boolean;
}

export interface ResendInviteResponse {
  id: string;
  email: string;
  inviteSent: boolean;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  errorContext?: 'resendInvite',
): Promise<T> {
  let response: Response;

  try {
    response = await authenticatedFetch(`${COMPANY_URL}${path}`, init);
  } catch (error: unknown) {
    if (init.signal?.aborted) throw error;

    throw new CompanyEmployeeServiceError(0, NETWORK_ERROR);
  }

  if (!response.ok) {
    const serverMessage = await readApiErrorMessage(response);
    throw new CompanyEmployeeServiceError(
      response.status,
      getErrorMessage(response.status, serverMessage, errorContext),
    );
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
    return request<CompanySeats>('/seats', { signal });
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

    return request<CompanyEmployeePage>(`/employees?${params.toString()}`, { signal });
  },

  createEmployee(input: CompanyEmployeeInput): Promise<CompanyEmployeeCreateResponse> {
    return request<CompanyEmployeeCreateResponse>('/employees', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
      }),
    });
  },

  resendInvite(employeeId: string): Promise<ResendInviteResponse> {
    return request<ResendInviteResponse>(
      `/employees/${encodeURIComponent(employeeId)}/invite`,
      {
        method: 'POST',
      },
      'resendInvite',
    );
  },
};
