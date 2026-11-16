import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type {
  CompanyReportOverview,
  EmployeeProgressFilters,
  EmployeeProgressPage,
} from '@/types/companyReport';

const REPORTS_URL = `${getApiBaseUrl()}/company/reports`;
export const EMPLOYEE_PROGRESS_PAGE_SIZE = 8;

const OVERVIEW_ERROR_MESSAGE = 'Não foi possível carregar os indicadores da equipe.';
const EMPLOYEES_ERROR_MESSAGE = 'Não foi possível carregar o acompanhamento dos colaboradores.';
const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
const INVALID_RESPONSE_MESSAGE = 'O servidor retornou uma resposta inválida.';
const UNAUTHORIZED_MESSAGE = 'Sua sessão expirou. Entre novamente para ver o relatório da equipe.';
const FORBIDDEN_MESSAGE = 'Você não tem permissão para ver o relatório desta empresa.';
const RETRY_HINT = 'Tente novamente em instantes.';

/**
 * Mensagem exibida ao gestor para um status HTTP de erro. Só a validação (400/422) repassa a
 * `message` da API, que descreve o parâmetro recusado; nos outros casos o texto do backend é
 * técnico (ex.: "Resource not found: /api/v1/...") e dá lugar a uma mensagem do bloco.
 */
const getHttpErrorMessage = async (response: Response, blockMessage: string): Promise<string> => {
  const { status } = response;

  if (status === 401) return UNAUTHORIZED_MESSAGE;
  if (status === 403) return FORBIDDEN_MESSAGE;
  if (status === 400 || status === 422) {
    return (await readApiErrorMessage(response)) ?? `${blockMessage} ${RETRY_HINT}`;
  }

  return `${blockMessage} ${RETRY_HINT}`;
};

export class CompanyReportServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CompanyReportServiceError';
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isNullableString = (value: unknown): boolean => value === null || typeof value === 'string';

const isOverview = (value: unknown): value is CompanyReportOverview =>
  isRecord(value) &&
  isNumber(value.completionRate) &&
  isNumber(value.completionRateChange) &&
  isNumber(value.averageHoursPerEmployee) &&
  isCount(value.certificatesThisQuarter) &&
  isNumber(value.weeklyEngagement) &&
  (value.weeklyEngagementChange == null || isNumber(value.weeklyEngagementChange)) &&
  Array.isArray(value.completionByJobTitle) &&
  value.completionByJobTitle.every(
    (item) => isRecord(item) && typeof item.jobTitle === 'string' && isNumber(item.completionRate),
  ) &&
  Array.isArray(value.monthlyHours) &&
  value.monthlyHours.every(
    (item) => isRecord(item) && typeof item.month === 'string' && isNumber(item.averageHours),
  );

const isEmployeeProgressPage = (value: unknown): value is EmployeeProgressPage =>
  isRecord(value) &&
  Array.isArray(value.content) &&
  value.content.every(
    (row) =>
      isRecord(row) &&
      typeof row.userId === 'string' &&
      typeof row.name === 'string' &&
      isNullableString(row.avatarUrl) &&
      typeof row.courseId === 'string' &&
      typeof row.course === 'string' &&
      isNumber(row.progress) &&
      isNullableString(row.lastAccessAt) &&
      typeof row.certificateIssued === 'boolean',
  ) &&
  isCount(value.pageNumber) &&
  isCount(value.pageSize) &&
  isCount(value.totalElements) &&
  isCount(value.totalPages);

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (isRecord(error) && error.name === 'AbortError');

async function request<T>(
  path: string,
  isData: (value: unknown) => value is T,
  errorMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await authenticatedFetch(`${REPORTS_URL}${path}`, { method: 'GET', signal });
  } catch (error: unknown) {
    if (isAbortError(error, signal)) throw error;
    throw new CompanyReportServiceError(0, NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new CompanyReportServiceError(
      response.status,
      await getHttpErrorMessage(response, errorMessage),
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (error: unknown) {
    if (isAbortError(error, signal)) throw error;
    throw new CompanyReportServiceError(response.status, INVALID_RESPONSE_MESSAGE);
  }

  if (!isRecord(body) || body.success !== true || !isData(body.data)) {
    throw new CompanyReportServiceError(response.status, INVALID_RESPONSE_MESSAGE);
  }

  return body.data;
}

export const companyReportService = {
  /** Indicadores, conclusão por cargo e horas mensais da empresa do token. */
  getOverview(signal?: AbortSignal): Promise<CompanyReportOverview> {
    return request('/overview', isOverview, OVERVIEW_ERROR_MESSAGE, signal);
  },

  /** Uma página do acompanhamento por colaborador e curso, já filtrada pelo backend. */
  listEmployeeProgress(
    { search, status }: EmployeeProgressFilters,
    page = 0,
    signal?: AbortSignal,
    size = EMPLOYEE_PROGRESS_PAGE_SIZE,
  ): Promise<EmployeeProgressPage> {
    const params = new URLSearchParams();
    const term = search.trim();

    if (term) params.set('search', term);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));

    return request(
      `/employees?${params.toString()}`,
      isEmployeeProgressPage,
      EMPLOYEES_ERROR_MESSAGE,
      signal,
    );
  },
};
