import { useEffect, useState } from 'react';
import { getCertificateByCode } from '@services/certificateService';
import type { CertificateData } from '@/types/certificate';
import type { LoadStatus } from './usePublicCourses';

export interface UseCertificateResult {
  certificate: CertificateData | null;
  status: LoadStatus;
  errorMessage: string | null;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const useCertificate = (verificationCode: string | undefined): UseCertificateResult => {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!verificationCode) {
      setCertificate(null);
      setStatus('error');
      setErrorMessage('Código de verificação não informado.');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void getCertificateByCode(verificationCode, controller.signal)
      .then((data) => {
        setCertificate(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setCertificate(null);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar o certificado.',
        );
      });

    return () => controller.abort();
  }, [verificationCode]);

  return { certificate, status, errorMessage };
};
