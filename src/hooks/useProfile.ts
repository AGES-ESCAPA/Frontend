import { useCallback, useEffect, useState } from 'react';
import { profileService } from '@services/profileService';
import type { UserProfile } from '@/types/profile';
import type { LoadStatus } from './usePublicCourses';

export interface UseProfileResult {
  profile: UserProfile | null;
  status: LoadStatus;
  errorMessage: string | null;
  /** Busca os dados de novo (ex.: botão "Tentar novamente"). */
  reload: () => void;
  /** Troca os dados exibidos pelo que a API devolveu ao salvar. */
  setProfile: (profile: UserProfile) => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const useProfile = (): UseProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void profileService
      .getProfile(controller.signal)
      .then((data) => {
        setProfile(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar seus dados.',
        );
      });

    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => setRequestKey((key) => key + 1), []);

  return { profile, status, errorMessage, reload, setProfile };
};
