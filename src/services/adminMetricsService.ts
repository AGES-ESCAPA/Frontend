import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminMetricsOverview } from '@/types/adminMetrics';

const OVERVIEW_URL = `${getApiBaseUrl()}/admin/metrics/overview`;
const HTTP_ERROR_MESSAGE = 'Não foi possível carregar os indicadores. Tente novamente.';
const NETWORK_ERROR_MESSAGE =
  'Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente.';
const INVALID_RESPONSE_MESSAGE =
  'Não foi possível carregar os indicadores. O servidor retornou uma resposta inválida.';

export class AdminMetricsServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminMetricsServiceError';
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const monthIndex = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1;
};

const isMonthlySeries = (value: unknown): boolean => {
  if (!Array.isArray(value) || value.length !== 6) return false;
  let previousIndex: number | null = null;
  for (const item of value) {
    if (!isRecord(item) || !isCount(item.activeStudents)) return false;
    const index = monthIndex(item.month);
    if (index === null || (previousIndex !== null && index !== previousIndex + 1)) return false;
    previousIndex = index;
  }
  return true;
};

const isOverviewResponse = (
  value: unknown,
): value is Pick<ApiResponse<AdminMetricsOverview>, 'success' | 'data'> => {
  if (!isRecord(value) || value.success !== true || !isRecord(value.data)) return false;
  const { data } = value;
  return (
    isCount(data.activeStudents) &&
    isCount(data.partnerCompanies) &&
    typeof data.averageCompletionRate === 'number' &&
    Number.isFinite(data.averageCompletionRate) &&
    data.averageCompletionRate >= 0 &&
    data.averageCompletionRate <= 100 &&
    isMonthlySeries(data.activeStudentsByMonth)
  );
};

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (isRecord(error) && error.name === 'AbortError');

export const adminMetricsService = {
  async getOverview(signal?: AbortSignal): Promise<AdminMetricsOverview> {
    let response: Response;
    try {
      response = await authenticatedFetch(OVERVIEW_URL, { method: 'GET', signal });
    } catch (error: unknown) {
      if (isAbortError(error, signal)) throw error;
      throw new AdminMetricsServiceError(0, NETWORK_ERROR_MESSAGE);
    }

    if (!response.ok) {
      throw new AdminMetricsServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? HTTP_ERROR_MESSAGE,
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error: unknown) {
      if (isAbortError(error, signal)) throw error;
      throw new AdminMetricsServiceError(response.status, INVALID_RESPONSE_MESSAGE);
    }

    if (!isOverviewResponse(json)) {
      throw new AdminMetricsServiceError(response.status, INVALID_RESPONSE_MESSAGE);
    }
    return json.data;
  },
};
