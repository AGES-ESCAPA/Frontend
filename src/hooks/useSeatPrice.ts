import { useCallback, useEffect, useState } from 'react';
import { getSeatPrice } from '@services/orderService';
import type { LoadStatus } from './usePublicCourses';

export interface UseSeatPriceResult {
  seatPrice: number | null;
  status: LoadStatus;
  errorMessage: string | null;
  retry: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/** Valor de um assento, carregado só no checkout de assentos (`enabled`). */
export const useSeatPrice = (enabled: boolean): UseSeatPriceResult => {
  const [seatPrice, setSeatPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void getSeatPrice(controller.signal)
      .then((price) => {
        setSeatPrice(price);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o valor dos assentos.',
        );
      });

    return () => controller.abort();
  }, [enabled, requestKey]);

  const retry = useCallback(() => setRequestKey((key) => key + 1), []);

  return { seatPrice, status, errorMessage, retry };
};
