import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type {
  CompanyEmployee,
  CompanyEmployeePage,
  CompanyEmployeeStatus,
  CompanySeats,
} from '@/types/companyEmployee';

const COMPANY_URL = `${getApiBaseUrl()}/company`;
export const COMPANY_EMPLOYEES_PAGE_SIZE = 10;

const NETWORK_ERROR =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function getErrorMessage(status: number, serverMessage?: string | null): string {
  switch (status) {
    case 400:
      return 'Não foi possível processar a solicitação.';

    case 401:
      return 'Sua sessão não está válida. Entre novamente para continuar.';

    case 403:
      return 'Você não tem permissão para acessar os dados desta empresa.';

    case 404:
      return 'Não foi possível encontrar os dados da empresa.';

    case 409:
      if (serverMessage?.toLocaleLowerCase().includes('vagas')) {
        return 'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.';
      }
      if (serverMessage?.toLocaleLowerCase().includes('e-mail já está cadastrado')) {
        return 'Este e-mail já está cadastrado.';
      }

      return 'Este e-mail já está cadastrado ou a solicitação conflita com os dados existentes.';

    case 503:
      return serverMessage?.toLocaleLowerCase().includes('convite')
        ? serverMessage
        : 'O serviço de convites está indisponível. Tente novamente mais tarde.';

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
  jobTitle: string;
}

export interface CompleteInvitationInput {
  token: string;
  password: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      getErrorMessage(response.status, serverMessage),
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

  createEmployee(input: CompanyEmployeeInput): Promise<CompanyEmployee> {
    return request<CompanyEmployee>('/employees', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateEmployee(
    employeeId: string,
    input: CompanyEmployeeInput & { status: CompanyEmployeeStatus },
  ): Promise<CompanyEmployee> {
    return request<CompanyEmployee>(`/employees/${encodeURIComponent(employeeId)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  resendInvitation(employeeId: string): Promise<CompanyEmployee> {
    return request<CompanyEmployee>(`/employees/${encodeURIComponent(employeeId)}/invitation`, {
      method: 'POST',
    });
  },

  async completeInvitation(input: CompleteInvitationInput): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/company-invitations/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      throw new CompanyEmployeeServiceError(0, NETWORK_ERROR);
    }

    if (!response.ok) {
      const serverMessage = await readApiErrorMessage(response);
      throw new CompanyEmployeeServiceError(
        response.status,
        response.status === 400 && serverMessage
          ? serverMessage
          : getErrorMessage(response.status, serverMessage),
      );
    }

    const body = (await response.json().catch(() => null)) as ApiResponse<null> | null;
    if (!body || body.success !== true || body.data !== null) {
      throw new CompanyEmployeeServiceError(response.status, 'Resposta inválida do servidor.');
    }
  },
};
