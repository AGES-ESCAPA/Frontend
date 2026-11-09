import { useCallback, useEffect, useState } from 'react';
import {
  COMPANY_EMPLOYEES_PAGE_SIZE,
  companyEmployeeService,
} from '@services/companyEmployeeService';
import type { CompanyEmployee } from '@/types/companyEmployee';
import type { LoadStatus } from './usePublicCourses';

export interface UseCompanyEmployeesResult {
  employees: CompanyEmployee[];
  status: LoadStatus;
  errorMessage: string | null;
  totalElements: number;
  totalPages: number;
  reload: () => void;
}

export function useCompanyEmployees(search: string, page: number): UseCompanyEmployeesResult {
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setStatus('loading');
    setErrorMessage(null);

    void companyEmployeeService
      .listEmployees(search, page, COMPANY_EMPLOYEES_PAGE_SIZE, controller.signal)
      .then((result) => {
        if (!active) return;

        setEmployees(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;

        setEmployees([]);
        setTotalElements(0);
        setTotalPages(0);
        setErrorMessage(
          error instanceof Error ? error.message : 'Falha ao carregar colaboradores.',
        );
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [search, page, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return {
    employees,
    status,
    errorMessage,
    totalElements,
    totalPages,
    reload,
  };
}
