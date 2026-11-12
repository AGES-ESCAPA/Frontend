import { useCallback, useEffect, useRef, useState } from 'react';
import { adminMetricsService, AdminMetricsServiceError } from '@services/adminMetricsService';
import type { AdminMetricsOverview } from '@/types/adminMetrics';

type AdminMetricsOverviewState =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'success'; data: AdminMetricsOverview; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string };

export type UseAdminMetricsOverviewResult = AdminMetricsOverviewState & { reload: () => void };

const LOADING_STATE = { status: 'loading', data: null, errorMessage: null } as const;
const FALLBACK_MESSAGE = 'Não foi possível carregar os indicadores. Tente novamente.';

const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof AdminMetricsServiceError)) return FALLBACK_MESSAGE;
  if (error.status === 401) {
    return 'Sua sessão expirou. Entre novamente para consultar os indicadores.';
  }
  if (error.status === 403) return 'Você não tem permissão para consultar os indicadores.';
  if (error.status >= 400) return FALLBACK_MESSAGE;
  return error.message.trim() ? error.message : FALLBACK_MESSAGE;
};

const isAbortError = (error: unknown): boolean =>
  error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError';

export const useAdminMetricsOverview = (): UseAdminMetricsOverviewResult => {
  const [state, setState] = useState<AdminMetricsOverviewState>(LOADING_STATE);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState(LOADING_STATE);

    try {
      const data = await adminMetricsService.getOverview(controller.signal);
      // Mocks ou transportes que ignoram abort também não podem publicar respostas antigas.
      if (controller.signal.aborted) return;
      setState({ status: 'success', data, errorMessage: null });
    } catch (error: unknown) {
      if (controller.signal.aborted || isAbortError(error)) return;
      setState({ status: 'error', data: null, errorMessage: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { ...state, reload };
};
