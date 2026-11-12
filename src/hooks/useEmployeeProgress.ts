import { useCallback, useEffect, useState } from 'react';
import { companyReportService } from '@services/companyReportService';
import type { EmployeeProgress, EmployeeProgressStatus } from '@/types/companyReport';
import type { LoadStatus } from './usePublicCourses';

export interface UseEmployeeProgressResult {
  status: LoadStatus;
  rows: EmployeeProgress[];
  totalElements: number;
  totalPages: number;
  errorMessage: string | null;
  reload: () => void;
}

const FALLBACK_MESSAGE = 'Não foi possível carregar o acompanhamento dos colaboradores.';

/**
 * Uma página do acompanhamento por colaborador. Busca, filtro e página vão para o backend, e uma
 * resposta antiga nunca sobrescreve a da combinação atual.
 */
export function useEmployeeProgress(
  search: string,
  status: EmployeeProgressStatus | null,
  page: number,
): UseEmployeeProgressResult {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [rows, setRows] = useState<EmployeeProgress[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoadStatus('loading');
    setErrorMessage(null);

    companyReportService
      .listEmployeeProgress({ search, status }, page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setRows(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setLoadStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setRows([]);
        setTotalElements(0);
        setTotalPages(0);
        setErrorMessage(error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE);
        setLoadStatus('error');
      });

    return () => controller.abort();
  }, [search, status, page, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { status: loadStatus, rows, totalElements, totalPages, errorMessage, reload };
}
