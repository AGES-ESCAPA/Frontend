import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { AdminCourseMetrics } from '@/types/adminMetrics';

const ADMIN_METRICS_URL = `${getApiBaseUrl()}/admin/metrics`;
const COURSE_METRICS_ERROR_FALLBACK = 'Não foi possível carregar as métricas de cursos.';

const isJsonResponse = (response: Response): boolean => {
  const contentType = response.headers?.get?.('content-type') ?? '';
  return contentType === '' || contentType.includes('application/json');
};

export const getCourseMetrics = async (signal?: AbortSignal): Promise<AdminCourseMetrics> => {
  let response: Response;

  try {
    response = await authenticatedFetch(`${ADMIN_METRICS_URL}/courses`, { signal });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(COURSE_METRICS_ERROR_FALLBACK);
  }

  if (!isJsonResponse(response)) {
    throw new Error(COURSE_METRICS_ERROR_FALLBACK);
  }

  if (!response.ok) {
    const apiMessage = await readApiErrorMessage(response);
    throw new Error(apiMessage ?? COURSE_METRICS_ERROR_FALLBACK);
  }

  const json: ApiResponse<AdminCourseMetrics> = await response.json();
  if (!json?.success || !json.data) {
    throw new Error(COURSE_METRICS_ERROR_FALLBACK);
  }

  return json.data;
};

export const adminMetricsService = {
  getCourseMetrics,
};
