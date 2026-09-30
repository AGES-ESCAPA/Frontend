/**
 * services/certificateService.ts
 *
 * Sem endpoint de detalhes do certificado no backend ainda (só o download em
 * PDF, na US-19): esta US usa dados mockados, atrás de uma função assíncrona
 * para já simular carregamento e falha. Trocar pela chamada real é um ajuste
 * só neste arquivo, sem tocar a página ou o hook que a consome.
 */
import type { CertificateData } from '@/types/certificate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MOCK_DELAY_MS = 400;

const MOCK_CERTIFICATES: Record<string, CertificateData> = {
  'ESC-21AGO25-7X9L2M3N': {
    course: 'Marketing Digital para Hospitalidade',
    student: 'Jorge Amado',
    workload: '16 horas',
    conclusionDate: '21 de agosto de 2026',
    verificationCode: 'ESC-21AGO25-7X9L2M3N',
  },
  'ESC-2026-IA-0001': {
    course: 'IA Aplicada ao Turismo',
    student: 'Diego Martins',
    workload: '14 horas',
    conclusionDate: '18 de março de 2026',
    verificationCode: 'ESC-2026-IA-0001',
  },
};

/** Busca o certificado pelo código de verificação; rejeita se não existir. */
export const getCertificateByCode = (
  verificationCode: string,
  signal?: AbortSignal,
): Promise<CertificateData> =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const certificate = MOCK_CERTIFICATES[verificationCode];
      if (certificate) {
        resolve(certificate);
      } else {
        reject(new Error('Certificado não encontrado. Verifique o código e tente novamente.'));
      }
    }, MOCK_DELAY_MS);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/** URL do endpoint real (US-19) que gera o PDF do certificado para download. */
export const getCertificateDownloadUrl = (verificationCode: string): string =>
  `${API_BASE_URL}/certificates/${verificationCode}/download`;
