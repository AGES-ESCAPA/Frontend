import { useCallback, useEffect, useRef, useState } from 'react';
import { adminMetricsService } from '@services/adminMetricsService';
import type { AdminCourseMetrics } from '@/types/adminMetrics';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminCourseMetricsResult {
  metrics: AdminCourseMetrics | null;
  status: LoadStatus;
  errorMessage: string | null;
  isEmpty: boolean;
  reload: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const useAdminCourseMetrics = (): UseAdminCourseMetricsResult => {
  const [metrics, setMetrics] = useState<AdminCourseMetrics | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await adminMetricsService.getCourseMetrics(signal);
      if (signal?.aborted) return;
      setMetrics(data);
      setStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      setMetrics(null);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível carregar as métricas de cursos.',
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
  }, [load]);

  const isEmpty =
    status === 'success' &&
    (metrics === null || metrics.mostAccessedCourse === null || metrics.topCourses.length === 0);

  return { metrics, status, errorMessage, isEmpty, reload };
};
