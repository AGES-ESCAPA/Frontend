import { useCallback, useEffect, useState } from 'react';
import { companyEmployeeService } from '@services/companyEmployeeService';
import type { CompanySeats } from '@/types/companyEmployee';
import type { LoadStatus } from './usePublicCourses';

export interface UseCompanySeatsResult {
  seats: CompanySeats | null;
  status: LoadStatus;
  errorMessage: string | null;
  reload: () => void;
}

export function useCompanySeats(): UseCompanySeatsResult {
  const [seats, setSeats] = useState<CompanySeats | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setStatus('loading');
    setErrorMessage(null);

    void companyEmployeeService
      .getSeats(controller.signal)
      .then((result) => {
        if (!active) return;

        setSeats(result);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;

        setSeats(null);
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar as vagas.');
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { seats, status, errorMessage, reload };
}
