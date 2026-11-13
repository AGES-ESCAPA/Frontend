import { useCallback, useEffect, useRef, useState } from 'react';
import { companyEmployeeService } from '@services/companyEmployeeService';
import type { CompanySeats } from '@/types/companyEmployee';
import type { LoadStatus } from './usePublicCourses';

export interface UseCompanySeatsResult {
  seats: CompanySeats | null;
  status: LoadStatus;
  errorMessage: string | null;
  reload: () => void;
  applySeats: (updated: CompanySeats) => void;
}

export function useCompanySeats(): UseCompanySeatsResult {
  const [seats, setSeats] = useState<CompanySeats | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestId = useRef(0);
  const currentRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;
    currentRequest.current = controller;

    setStatus('loading');
    setErrorMessage(null);

    void companyEmployeeService
      .getSeats(controller.signal)
      .then((result) => {
        if (controller.signal.aborted || id !== requestId.current) return;

        setSeats(result);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return;

        setSeats(null);
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar as vagas.');
        setStatus('error');
      });

    return () => {
      controller.abort();
      if (currentRequest.current === controller) currentRequest.current = null;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const applySeats = useCallback((updated: CompanySeats) => {
    requestId.current += 1;
    currentRequest.current?.abort();
    setSeats(updated);
    setStatus('success');
    setErrorMessage(null);
  }, []);

  return { seats, status, errorMessage, reload, applySeats };
}
