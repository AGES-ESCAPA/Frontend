import type { ApiResponse } from '@services/api';
import type { CertificateData } from '@/types/certificate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const NOT_FOUND_MESSAGE = 'Certificado não encontrado. Verifique o código e tente novamente.';
const GENERIC_ERROR_MESSAGE =
  'Não foi possível carregar o certificado. Tente novamente em instantes.';

const isJsonResponse = (response: Response): boolean =>
  (response.headers.get('content-type') ?? '').includes('application/json');

/**
 * Busca o certificado pelo código de verificação (US-18 backend); rejeita se
 * não existir.
 *
 * A mensagem de erro é sempre a amigável em português definida aqui, nunca a
 * mensagem técnica devolvida pela API (ex.: "Certificate not found: X"),
 * conforme pedido pela US-18 frontend.
 */
export const getCertificateByCode = async (
  verificationCode: string,
  signal?: AbortSignal,
): Promise<CertificateData> => {
  const response = await fetch(`${API_BASE_URL}/certificates/${verificationCode}`, { signal });

  if (!isJsonResponse(response)) {
    throw new Error(GENERIC_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(response.status === 404 ? NOT_FOUND_MESSAGE : GENERIC_ERROR_MESSAGE);
  }

  const json: ApiResponse<CertificateData> = await response.json();

  if (!json.data) {
    throw new Error(GENERIC_ERROR_MESSAGE);
  }

  return json.data;
};

/** URL do endpoint real (US-19) que gera o PDF do certificado para download. */
export const getCertificateDownloadUrl = (verificationCode: string): string =>
  `${API_BASE_URL}/certificates/${verificationCode}/download`;
