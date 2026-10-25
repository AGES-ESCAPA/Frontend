import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFallbackFilename,
  getCertificateByCode,
  getFilenameFromContentDisposition,
} from './certificateService';

describe('certificateService', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('sends the session token when loading the certificate so the API can resolve isOwner', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { isOwner: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCertificateByCode('ESC-1')).resolves.toEqual({ isOwner: true });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer jwt-token');
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
});
