import { useCallback, useEffect, useState } from 'react';
import { adminUserService } from '@services/adminUserService';
import type { AdminUser } from '@/types/adminUser';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminUsersResult {
  users: AdminUser[];
  status: LoadStatus;
  errorMessage: string | null;
  reload: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/** Lista os usuários da plataforma para a Gestão de Usuários. */
export const useAdminUsers = (): UseAdminUsersResult => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await adminUserService.list(signal);
      setUsers(result);
      setStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      setUsers([]);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível carregar os usuários.',
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { users, status, errorMessage, reload };
};
