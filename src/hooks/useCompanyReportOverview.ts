import { useCallback, useEffect, useState } from 'react';
import { companyReportService } from '@services/companyReportService';
import type { CompanyReportOverview } from '@/types/companyReport';
import type { LoadStatus } from './usePublicCourses';

export interface UseCompanyReportOverviewResult {
  status: LoadStatus;
  overview: CompanyReportOverview | null;
  errorMessage: string | null;
  reload: () => void;
}

const FALLBACK_MESSAGE = 'Não foi possível carregar os indicadores da equipe.';

/** Indicadores e gráficos do Dashboard de Engajamento da empresa logada. */
export function useCompanyReportOverview(): UseCompanyReportOverviewResult {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [overview, setOverview] = useState<CompanyReportOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setStatus('loading');
    setErrorMessage(null);

    companyReportService
      .getOverview(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setOverview(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setOverview(null);
        setErrorMessage(error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE);
        setStatus('error');
      });

    return () => controller.abort();
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { status, overview, errorMessage, reload };
}
