import { useEffect, useRef, useState } from 'react';
import { getVimeoVideoDuration } from '@services/vimeoService';
import { isVimeoVideoUrl } from '@utils/vimeo';

export type VimeoDurationStatus = 'idle' | 'loading' | 'success' | 'error';

/** Espera o usuário parar de digitar antes de consultar o Vimeo. */
export const VIMEO_DURATION_DEBOUNCE_MS = 500;

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

/**
 * Busca a duração quando `videoUrl` é um vídeo do Vimeo e entrega o valor em
 * `onDuration`. Cada mudança de URL cancela a consulta anterior.
 */
export const useVimeoDuration = (
  videoUrl: string,
  enabled: boolean,
  onDuration: (seconds: number) => void,
): VimeoDurationStatus => {
  const [status, setStatus] = useState<VimeoDurationStatus>('idle');

  const onDurationRef = useRef(onDuration);

  useEffect(() => {
    onDurationRef.current = onDuration;
  });

  useEffect(() => {
    const url = videoUrl.trim();

    if (!enabled || !isVimeoVideoUrl(url)) {
      setStatus('idle');
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      setStatus('loading');

      void getVimeoVideoDuration(url, controller.signal)
        .then((seconds) => {
          onDurationRef.current(seconds);
          setStatus('success');
        })
        .catch((error: unknown) => {
          if (isAbortError(error, controller.signal)) return;
          setStatus('error');
        });
    }, VIMEO_DURATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [videoUrl, enabled]);

  return status;
};
