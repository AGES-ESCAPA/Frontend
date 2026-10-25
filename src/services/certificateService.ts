import { authenticatedFetch } from '@services/api';
import type { ApiResponse } from '@services/api';
import type { CertificateData } from '@/types/certificate';
import { getApiBaseUrl } from '@services/runtimeEnv';

const API_BASE_URL = getApiBaseUrl();

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
 *
 * A rota é pública, mas vai com o token quando há sessão: é ele que faz a API
 * devolver `isOwner: true` para o dono. Token inválido é tratado como visitante.
 */
export const getCertificateByCode = async (
  verificationCode: string,
  signal?: AbortSignal,
): Promise<CertificateData> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/certificates/${encodeURIComponent(verificationCode)}`,
    { signal },
  );

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

export type CertificateTheme = 'light' | 'dark';

/** A primeira geração do PDF no backend pode levar alguns segundos. */
const DOWNLOAD_TIMEOUT_MS = 60_000;

/** `status` é `null` em falha de rede, timeout ou resposta que não é PDF. */
export class CertificateDownloadError extends Error {
  status: number | null;

  constructor(status: number | null, message: string) {
    super(message);
    this.name = 'CertificateDownloadError';
    this.status = status;
  }
}

export const getFilenameFromContentDisposition = (header: string | null): string | null => {
  if (!header) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // Valor mal codificado: tenta o `filename=` simples abaixo.
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : null;
};

/** Mesmo formato do backend: "Marketing Digital" vira "certificado-marketing-digital.pdf". */
export const buildFallbackFilename = (courseTitle?: string): string => {
  const slug = (courseTitle ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `certificado-${slug}.pdf` : 'certificado.pdf';
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revogar na hora cancela o download em alguns navegadores (ex.: Safari).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Baixa o PDF do certificado (US-19) com o token do aluno e dispara o download
 * no navegador, sem abrir nova aba. O 401 já encerra a sessão em
 * `authenticatedFetch`; aqui só se propaga o status para a tela dar o feedback.
 */
export const downloadCertificatePdf = async (
  verificationCode: string,
  theme: CertificateTheme,
  fallbackFilename = 'certificado.pdf',
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await authenticatedFetch(
        `${API_BASE_URL}/certificates/${encodeURIComponent(verificationCode)}/download?${new URLSearchParams({ theme })}`,
        { signal: controller.signal, headers: { Accept: 'application/pdf' } },
      );
    } catch {
      throw new CertificateDownloadError(null, 'Falha de rede ao baixar o certificado.');
    }

    if (!response.ok) {
      throw new CertificateDownloadError(response.status, 'A API recusou o download.');
    }

    // Não salvar como PDF uma página de erro de proxy ou um JSON.
    if (!(response.headers.get('content-type') ?? '').includes('application/pdf')) {
      throw new CertificateDownloadError(null, 'Resposta inesperada do servidor.');
    }

    const blob = await response.blob();
    const filename =
      getFilenameFromContentDisposition(response.headers.get('content-disposition')) ??
      fallbackFilename;

    saveBlob(blob, filename);
  } catch (error: unknown) {
    if (error instanceof CertificateDownloadError) throw error;
    throw new CertificateDownloadError(null, 'Falha ao ler o PDF do certificado.');
  } finally {
    clearTimeout(timeoutId);
  }
};
