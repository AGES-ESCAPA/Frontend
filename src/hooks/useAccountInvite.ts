import { useEffect, useState } from 'react';
import { AuthServiceError, authService } from '@services/authService';
import type { AccountInvite } from '@/types/auth';
import type { LoadStatus } from './usePublicCourses';

export type AccountInviteErrorStatus = 404 | 410 | null;

export interface UseAccountInviteResult {
  invite: AccountInvite | null;
  status: LoadStatus;
  errorStatus: AccountInviteErrorStatus;
  errorMessage: string | null;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

const toErrorStatus = (error: unknown): AccountInviteErrorStatus => {
  if (error instanceof AuthServiceError && (error.status === 404 || error.status === 410)) {
    return error.status;
  }

  return null;
};

export const useAccountInvite = (token: string): UseAccountInviteResult => {
  const [invite, setInvite] = useState<AccountInvite | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorStatus, setErrorStatus] = useState<AccountInviteErrorStatus>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInvite(null);
      setStatus('error');
      setErrorStatus(404);
      setErrorMessage('Convite não encontrado.');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorStatus(null);
    setErrorMessage(null);

    void authService
      .getInvite(token, controller.signal)
      .then((data) => {
        setInvite(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setInvite(null);
        setStatus('error');
        setErrorStatus(toErrorStatus(error));
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar o convite.',
        );
      });

    return () => controller.abort();
  }, [token]);

  return { invite, status, errorStatus, errorMessage };
};
