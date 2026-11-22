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
export const NO_SEATS_AVAILABLE_MESSAGE =
  'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.';

export const EMAIL_IN_USE_MESSAGE = 'Este e-mail já está cadastrado.';
export const EMPLOYEE_NOT_FOUND_MESSAGE =
  'Colaborador não encontrado. Ele pode ter sido desvinculado da empresa.';

type ErrorContext = 'resendInvite' | 'updateEmployee';

const NETWORK_ERROR =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function getErrorMessage(
  status: number,
  serverMessage?: string | null,
  context?: ErrorContext,
): string {
  switch (status) {
    case 400:
      return serverMessage ?? 'Não foi possível processar a solicitação.';

    case 401:
      return 'Sua sessão não está válida. Entre novamente para continuar.';

    case 403:
      return 'Você não tem permissão para acessar os dados desta empresa.';

    case 404:
      if (context === 'updateEmployee') return EMPLOYEE_NOT_FOUND_MESSAGE;
      return 'Não foi possível encontrar os dados da empresa.';

    case 409: {
      const normalized = (serverMessage ?? '').toLowerCase();

      // Na edição, o único conflito possível é o e-mail em uso por outra conta.
      if (context === 'updateEmployee') {
        return EMAIL_IN_USE_MESSAGE;
      }

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
        return EMAIL_IN_USE_MESSAGE;
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

/** O gestor só escolhe entre ativo e inativo; quem não tem senha continua PENDING no backend. */
export type EditableEmployeeStatus = Exclude<CompanyEmployeeStatus, 'PENDING'>;

export interface CompanyEmployeeUpdateInput {
  name: string;
  email: string;
  jobTitle: string;
  status: EditableEmployeeStatus;
}

export interface CompanyEmployeeUpdateResponse extends CompanyEmployee {
  /** Nulo quando a edição não gerou convite; senão, se o e-mail do novo convite foi enviado. */
  inviteSent: boolean | null;
}

export interface ResendInviteResponse {
  id: string;
  email: string;
  inviteSent: boolean;
}

export interface EmployeeCourseAssignment {
  courseId: string;
  title: string;
  category: string | null;
  assigned: boolean;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  errorContext?: ErrorContext,
  options?: { allowNullData?: boolean },
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

  if (!body || body.success !== true || (body.data == null && !options?.allowNullData)) {
    throw new CompanyEmployeeServiceError(response.status, 'Resposta inválida do servidor.');
  }

  return body.data;
}

export const companyEmployeeService = {
  unlinkEmployee(id: string): Promise<CompanySeats> {
    return request<CompanySeats>(`/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

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

  updateEmployee(
    id: string,
    input: CompanyEmployeeUpdateInput,
  ): Promise<CompanyEmployeeUpdateResponse> {
    return request<CompanyEmployeeUpdateResponse>(
      `/employees/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          jobTitle: input.jobTitle,
          status: input.status,
        }),
      },
      'updateEmployee',
    );
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

  listEmployeeCourses(
    employeeId: string,
    signal?: AbortSignal,
  ): Promise<EmployeeCourseAssignment[]> {
    return request<EmployeeCourseAssignment[]>(
      `/employees/${encodeURIComponent(employeeId)}/courses`,
      { signal },
    );
  },

  assignEmployeeCourse(employeeId: string, courseId: string): Promise<null> {
    return request<null>(
      `/employees/${encodeURIComponent(employeeId)}/courses/${encodeURIComponent(courseId)}`,
      { method: 'POST' },
      undefined,
      { allowNullData: true },
    );
  },

  revokeEmployeeCourse(employeeId: string, courseId: string): Promise<null> {
    return request<null>(
      `/employees/${encodeURIComponent(employeeId)}/courses/${encodeURIComponent(courseId)}`,
      { method: 'DELETE' },
      undefined,
      { allowNullData: true },
    );
  },
};
