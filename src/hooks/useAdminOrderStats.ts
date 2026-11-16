import { useCallback, useEffect, useState } from 'react';
import { adminOrderService } from '@services/adminOrderService';
import type { AdminOrderFilters, AdminOrderStats } from '@/types/order';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminOrderStatsResult {
  stats: AdminOrderStats | null;
  status: LoadStatus;
  reload: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/**
 * Totais da Gestão de Pedidos para os filtros, somando todas as páginas: só refaz a busca quando
 * `filters` muda. O chamador deve passar `filters` memoizado (ex.: `useMemo`).
 */
export const useAdminOrderStats = (filters: AdminOrderFilters): UseAdminOrderStatsResult => {
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setStatus('loading');

      try {
        setStats(await adminOrderService.stats(filters, signal));
        setStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;
        setStats(null);
        setStatus('error');
      }
    },
    [filters],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { stats, status, reload };
};
