import { useCallback, useEffect, useState } from 'react';
import { ADMIN_ORDERS_PAGE_SIZE, adminOrderService } from '@services/adminOrderService';
import type { AdminOrderFilters, AdminOrderSummary } from '@/types/order';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminOrdersResult {
  orders: AdminOrderSummary[];
  status: LoadStatus;
  errorMessage: string | null;
  totalPages: number;
  totalElements: number;
  reload: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/**
 * Lista pedidos para a Gestão de Pedidos. Refaz a busca quando `filters` ou `page` mudam; o
 * chamador deve passar `filters` memoizado (ex.: `useMemo`), para não refazer a busca a cada
 * renderização.
 */
export const useAdminOrders = (filters: AdminOrderFilters, page: number): UseAdminOrdersResult => {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const result = await adminOrderService.list(filters, page, ADMIN_ORDERS_PAGE_SIZE, signal);
        setOrders(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;
        setOrders([]);
        setTotalPages(0);
        setTotalElements(0);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar os pedidos.',
        );
      }
    },
    [filters, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { orders, status, errorMessage, totalPages, totalElements, reload };
};
