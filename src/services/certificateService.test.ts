import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFallbackFilename,
  CertificateDownloadError,
  downloadCertificatePdf,
  getCertificateByCode,
  getFilenameFromContentDisposition,
} from './certificateService';
import { authenticatedFetch } from './api';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  authenticatedFetch: vi.fn(),
}));

const authenticatedFetchMock = vi.mocked(authenticatedFetch);

describe('certificateService', () => {
  afterEach(() => {
    localStorage.clear();
    authenticatedFetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the session token when loading the certificate so the API can resolve isOwner', async () => {
    authenticatedFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { isOwner: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getCertificateByCode('ESC-1')).resolves.toEqual({ isOwner: true });

    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/ESC-1'),
      expect.any(Object),
    );
  });

  it.each([
    ['attachment; filename="certificado-a.pdf"', 'certificado-a.pdf'],
    ['attachment; filename=certificado-b.pdf', 'certificado-b.pdf'],
    ["attachment; filename*=UTF-8''certificado-%C3%A7.pdf", 'certificado-ç.pdf'],
    [null, null],
    ['inline', null],
  ])('reads the filename from Content-Disposition %s', (header, expected) => {
    expect(getFilenameFromContentDisposition(header)).toBe(expected);
  });

  it('builds the fallback filename from the course title', () => {
    expect(buildFallbackFilename('Gestão de Hotéis & Pousadas')).toBe(
      'certificado-gestao-de-hoteis-pousadas.pdf',
    );
    expect(buildFallbackFilename()).toBe('certificado.pdf');
  });

  it('maps certificate lookup failures to friendly messages', async () => {
    authenticatedFetchMock.mockResolvedValueOnce(
      new Response('not-json', { status: 500, headers: { 'Content-Type': 'text/plain' } }),
    );
    await expect(getCertificateByCode('ESC-404')).rejects.toThrow(
      'Não foi possível carregar o certificado.',
    );

    authenticatedFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Certificate not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await expect(getCertificateByCode('ESC-404')).rejects.toThrow(
      'Certificado não encontrado. Verifique o código e tente novamente.',
    );
  });

  it('downloads a PDF and triggers a browser save', async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = Object.assign(document.createElement('a'), { click, remove });
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:pdf');
    globalThis.URL.revokeObjectURL = vi.fn();

    authenticatedFetchMock.mockResolvedValueOnce(
      new Response(new Blob(['pdf']), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="certificado.pdf"',
        },
      }),
    );

    await downloadCertificatePdf('ESC-1', 'light', 'certificado.pdf');

    expect(click).toHaveBeenCalled();
    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/ESC-1/download?theme=light'),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/pdf' }) }),
    );
  });

  it('throws CertificateDownloadError when the response is not a PDF', async () => {
    authenticatedFetchMock.mockResolvedValueOnce(
      new Response('error page', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    );

    await expect(downloadCertificatePdf('ESC-1', 'dark')).rejects.toBeInstanceOf(
      CertificateDownloadError,
    );
  });

  it('rejects lookup when success payload has no data', async () => {
    authenticatedFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getCertificateByCode('ESC-EMPTY')).rejects.toThrow(
      'Não foi possível carregar o certificado.',
    );
  });

  it('maps network and HTTP failures during download', async () => {
    authenticatedFetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(downloadCertificatePdf('ESC-1', 'light')).rejects.toMatchObject({
      name: 'CertificateDownloadError',
      status: null,
      message: 'Falha de rede ao baixar o certificado.',
    });

    authenticatedFetchMock.mockResolvedValueOnce(new Response('Denied', { status: 403 }));
    await expect(downloadCertificatePdf('ESC-1', 'light')).rejects.toMatchObject({
      status: 403,
      message: 'A API recusou o download.',
    });
  });

  it('falls back to plain filename when filename* decoding fails', () => {
    expect(
      getFilenameFromContentDisposition(
        "attachment; filename*=UTF-8''%E0%A4%A; filename=backup.pdf",
      ),
    ).toBe('backup.pdf');
  });
});
