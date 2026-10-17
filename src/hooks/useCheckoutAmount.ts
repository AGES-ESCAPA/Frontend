import { useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { LoadStatus } from './usePublicCourses';

export interface UseCheckoutAmountResult {
  /** Valor do curso, disponível quando `status` é `success`. */
  amount: number | null;
  status: LoadStatus;
  errorMessage: string | null;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/** Busca o valor do curso que está sendo comprado, para o total e o botão de pagar. */
export const useCheckoutAmount = (courseId: string): UseCheckoutAmountResult => {
  const [amount, setAmount] = useState<number | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setAmount(null);
      setStatus('error');
      setErrorMessage('Curso não encontrado.');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void courseService
      .getPublicCourseById(courseId, controller.signal)
      .then((details) => {
        setAmount(details.price ?? 0);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setAmount(null);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar os dados do curso.',
        );
      });

    return () => controller.abort();
  }, [courseId]);

  return { amount, status, errorMessage };
};
