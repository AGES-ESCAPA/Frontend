import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminCourseMetrics, AdminMetricsOverview } from '@/types/adminMetrics';

const ADMIN_METRICS_URL = `${getApiBaseUrl()}/admin/metrics`;

interface ErrorMessages {
  http: string;
  network: string;
  invalidResponse: string;
}

const OVERVIEW_ERRORS: ErrorMessages = {
  http: 'Não foi possível carregar os indicadores. Tente novamente.',
  network: 'Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente.',
  invalidResponse:
    'Não foi possível carregar os indicadores. O servidor retornou uma resposta inválida.',
};

const COURSE_METRICS_ERRORS: ErrorMessages = {
  http: 'Não foi possível carregar os indicadores de cursos. Tente novamente.',
  network:
    'Não foi possível carregar os indicadores de cursos. Verifique sua conexão e tente novamente.',
  invalidResponse:
    'Não foi possível carregar os indicadores de cursos. O servidor retornou uma resposta inválida.',
};

export class AdminMetricsServiceError extends Error {
  readonly status: number;
  /** Mensagem original da API, só para diagnóstico: vem em inglês e não é exibida na tela. */
  readonly serverMessage: string | null;

  constructor(status: number, message: string, serverMessage: string | null = null) {
    super(message);
    this.name = 'AdminMetricsServiceError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isPercentage = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

/** Variação mensal: número finito, inclusive negativo ou acima de 100. */
const isChange = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isEngagedCompany = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.companyId === 'string' &&
  value.companyId.trim() !== '' &&
  typeof value.name === 'string' &&
  isCount(value.enrollments);

const isMonth = (value: unknown): boolean =>
  typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

/**
 * Valida só o formato de cada mês. Quantidade e sequência ficam com o gráfico: uma série diferente
 * do esperado não pode derrubar os cards de alunos e empresas, que vêm na mesma resposta.
 */
const isMonthlySeries = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every((item) => isRecord(item) && isMonth(item.month) && isCount(item.activeStudents));

const isOverview = (data: Record<string, unknown>): boolean =>
  isCount(data.activeStudents) &&
  isCount(data.partnerCompanies) &&
  isPercentage(data.averageCompletionRate) &&
  isMonthlySeries(data.activeStudentsByMonth) &&
  isChange(data.activeStudentsChange) &&
  isChange(data.partnerCompaniesChange) &&
  Array.isArray(data.topEngagedCompanies) &&
  data.topEngagedCompanies.every(isEngagedCompany);

const isRankedCourse = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.courseId === 'string' &&
  typeof value.title === 'string' &&
  isCount(value.enrollments);

const isCategoryShare = (value: unknown): boolean =>
  isRecord(value) && typeof value.category === 'string' && isPercentage(value.percentage);

/** Formato mínimo para a seção renderizar sem quebrar: listas nulas viram erro com nova tentativa. */
const isCourseMetrics = (data: Record<string, unknown>): boolean =>
  (data.mostAccessedCourse === null || isRankedCourse(data.mostAccessedCourse)) &&
  Array.isArray(data.topCourses) &&
  data.topCourses.every(isRankedCourse) &&
  isCount(data.categoriesCount) &&
  Array.isArray(data.enrollmentsByCategory) &&
  data.enrollmentsByCategory.every(isCategoryShare);

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (isRecord(error) && error.name === 'AbortError');

/** GET autenticado que desembrulha o `ApiResponse` e valida o `data` antes de devolvê-lo. */
async function getMetrics<T>(
  path: string,
  errors: ErrorMessages,
  isValidData: (data: Record<string, unknown>) => boolean,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await authenticatedFetch(`${ADMIN_METRICS_URL}${path}`, { method: 'GET', signal });
  } catch (error: unknown) {
    if (isAbortError(error, signal)) throw error;
    throw new AdminMetricsServiceError(0, errors.network);
  }

  if (!response.ok) {
    throw new AdminMetricsServiceError(
      response.status,
      errors.http,
      await readApiErrorMessage(response),
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error: unknown) {
    if (isAbortError(error, signal)) throw error;
    throw new AdminMetricsServiceError(response.status, errors.invalidResponse);
  }

  if (!isRecord(json) || json.success !== true || !isRecord(json.data) || !isValidData(json.data)) {
    throw new AdminMetricsServiceError(response.status, errors.invalidResponse);
  }
  return (json as unknown as ApiResponse<T>).data;
}

export const adminMetricsService = {
  getOverview(signal?: AbortSignal): Promise<AdminMetricsOverview> {
    return getMetrics<AdminMetricsOverview>('/overview', OVERVIEW_ERRORS, isOverview, signal);
  },

  getCourseMetrics(signal?: AbortSignal): Promise<AdminCourseMetrics> {
    return getMetrics<AdminCourseMetrics>(
      '/courses',
      COURSE_METRICS_ERRORS,
      isCourseMetrics,
      signal,
    );
  },
};
