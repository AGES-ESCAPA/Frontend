import { useEffect, useState } from 'react';
import { adminOrderService } from '@services/adminOrderService';
import type { AdminOrderDetails } from '@/types/order';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminOrderDetailsResult {
  order: AdminOrderDetails | null;
  status: LoadStatus;
  errorMessage: string | null;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/** Carrega o detalhe de um pedido por `id`. Com `orderId` nulo, não faz requisição. */
export const useAdminOrderDetails = (orderId: string | null): UseAdminOrderDetailsResult => {
  const [order, setOrder] = useState<AdminOrderDetails | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (orderId === null) {
      setOrder(null);
      setStatus('loading');
      setErrorMessage(null);
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void adminOrderService
      .get(orderId, controller.signal)
      .then((details) => {
        setOrder(details);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setOrder(null);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar o pedido.',
        );
      });

    return () => controller.abort();
  }, [orderId]);

  return { order, status, errorMessage };
};
