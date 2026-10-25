import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { setUnauthorizedHandler } from '@services/api';
import { getCertificateByCode } from '@services/certificateService';
import type * as CertificateService from '@services/certificateService';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import type { CertificateData } from '@/types/certificate';
import { DigitalCertificate } from './DigitalCertificate';

vi.mock('@services/certificateService', async (importOriginal) => ({
  ...(await importOriginal<typeof CertificateService>()),
  getCertificateByCode: vi.fn(),
}));

const getCertificateByCodeMock = vi.mocked(getCertificateByCode);

const VERIFICATION_CODE = 'ESC-21AGO25-7X9L2M3N';
const HEADER_FILENAME = 'certificado-do-header.pdf';

const buildCertificate = (isOwner: boolean): CertificateData => ({
  certificate: {
    conclusionDate: '2026-08-21',
    workload: 960,
    verificationCode: VERIFICATION_CODE,
  },
  student: {
    name: 'Jorge Amado',
    avatarUrl: null,
    isVerified: true,
  },
  course: {
    id: 'e0000000-0000-4000-e000-000000000002',
    title: 'Marketing Digital para Hospitalidade',
    description: 'Estratégias de marketing digital para hotéis, pousadas e operadoras de turismo',
    category: 'Marketing',
    level: 'INTERMEDIARIO',
    thumbnailUrl: null,
    durationTime: 960,
    lessonsCount: 44,
    rating: 4.7,
    reviewsCount: 98,
    instructor: 'Paulo Henrique',
    price: 249.9,
  },
  isOwner,
});

const pdfResponse = (headers: Record<string, string> = {}) =>
  new Response(new Blob(['%PDF-1.7'], { type: 'application/pdf' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${HEADER_FILENAME}"`,
      ...headers,
    },
  });

const errorResponse = (status: number) =>
  new Response(JSON.stringify({ status, message: 'erro técnico' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const renderPage = (verificationCode = VERIFICATION_CODE) =>
  render(
    <MemoryRouter initialEntries={[`/certificados/${verificationCode}`]}>
      <Routes>
        <Route path="/certificados/:verificationCode" element={<DigitalCertificate />} />
        <Route path="/login" element={<h1>Página de login</h1>} />
      </Routes>
    </MemoryRouter>,
  );

const sessionValue = (isAuthenticated: boolean): AuthContextValue => ({
  user: isAuthenticated
    ? { id: 'user-2', name: 'Maria Visitante', email: 'maria@email.com', role: 'STUDENT' }
    : null,
  isAuthenticated,
  isRestoring: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
});

const pageWithSession = (isAuthenticated: boolean) => (
  <AuthContext.Provider value={sessionValue(isAuthenticated)}>
    <MemoryRouter initialEntries={[`/certificados/${VERIFICATION_CODE}`]}>
      <Routes>
        <Route path="/certificados/:verificationCode" element={<DigitalCertificate />} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>
);

const renderOwnerPage = async () => {
  getCertificateByCodeMock.mockResolvedValue(buildCertificate(true));
  renderPage();
  return screen.findByRole('button', { name: /^baixar$/i });
};

const downloadCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url: new URL(url, 'http://localhost'), headers: new Headers(init.headers) };
};

describe('DigitalCertificate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let downloadedFilenames: string[];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let openSpy: MockInstance<typeof window.open>;

  beforeEach(() => {
    getCertificateByCodeMock.mockReset();
    localStorage.setItem('access_token', 'jwt-token');

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // O jsdom não implementa URLs de blob.
    createObjectURL = vi.fn(() => 'blob:certificado');
    revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    downloadedFilenames = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedFilenames.push(this.download);
    });
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    setUnauthorizedHandler(null);
    delete document.documentElement.dataset.theme;
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
    // O teste de compartilhar substitui o clipboard; remove para não vazar entre testes.
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  describe('PDF download', () => {
    it('downloads the PDF with auth in the dark theme, named by Content-Disposition, without a new tab', async () => {
      fetchMock.mockResolvedValue(pdfResponse());
      fireEvent.click(await renderOwnerPage());

      await waitFor(() => expect(downloadedFilenames).toEqual([HEADER_FILENAME]));
      const { url, headers } = downloadCall(fetchMock);
      expect(url.pathname).toMatch(new RegExp(`/certificates/${VERIFICATION_CODE}/download$`));
      expect(url.searchParams.get('theme')).toBe('dark');
      expect(headers.get('authorization')).toBe('Bearer jwt-token');
      // O Blob de `Response.blob()` vem do Node, não do jsdom: `instanceof Blob` falha.
      const [savedBlob] = createObjectURL.mock.calls[0] as [Blob];
      expect(savedBlob.type).toBe('application/pdf');
      expect(savedBlob.size).toBeGreaterThan(0);
      expect(openSpy).not.toHaveBeenCalled();
      await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:certificado'), {
        timeout: 2000,
      });
    });

    it('sends theme=light when the screen uses the light theme', async () => {
      document.documentElement.dataset.theme = 'light';
      fetchMock.mockResolvedValue(pdfResponse());
      fireEvent.click(await renderOwnerPage());

      await waitFor(() => expect(downloadedFilenames).toEqual([HEADER_FILENAME]));
      expect(downloadCall(fetchMock).url.searchParams.get('theme')).toBe('light');
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('sends dark for any theme other than light (the API only accepts both)', async () => {
      document.documentElement.dataset.theme = 'system';
      fetchMock.mockResolvedValue(pdfResponse());
      fireEvent.click(await renderOwnerPage());

      await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
      expect(downloadCall(fetchMock).url.searchParams.get('theme')).toBe('dark');
    });

    it('reads the encoded filename* from Content-Disposition', async () => {
      fetchMock.mockResolvedValue(
        pdfResponse({
          'Content-Disposition':
            'attachment; filename="x.pdf"; filename*=UTF-8\'\'certificado-gest%C3%A3o.pdf',
        }),
      );
      fireEvent.click(await renderOwnerPage());

      await waitFor(() => expect(downloadedFilenames).toEqual(['certificado-gestão.pdf']));
    });

    it('falls back to the course slug when Content-Disposition is not exposed', async () => {
      const response = pdfResponse();
      response.headers.delete('Content-Disposition');
      fetchMock.mockResolvedValue(response);
      fireEvent.click(await renderOwnerPage());

      await waitFor(() =>
        expect(downloadedFilenames).toEqual([
          'certificado-marketing-digital-para-hospitalidade.pdf',
        ]),
      );
    });

    it('neither downloads nor breaks the screen when the response is not a PDF', async () => {
      fetchMock.mockResolvedValue(
        new Response('<html>erro do proxy</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );
      fireEvent.click(await renderOwnerPage());

      expect(
        await screen.findByText('Não foi possível baixar o certificado. Tente novamente.'),
      ).toBeInTheDocument();
      expect(downloadedFilenames).toEqual([]);
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Jorge Amado', level: 1 })).toBeInTheDocument();
    });

    it('shows loading during the request and sends a single request on repeated clicks', async () => {
      let release: (response: Response) => void = () => {};
      fetchMock.mockReturnValue(
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
      );
      const button = await renderOwnerPage();

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      const loadingButton = await screen.findByRole('button', { name: 'Baixando…' });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(loadingButton);
      expect(fetchMock).toHaveBeenCalledOnce();

      release(pdfResponse());

      const idleButton = await screen.findByRole('button', { name: /^baixar$/i });
      expect(idleButton).toBeEnabled();
      expect(idleButton).toHaveAttribute('aria-busy', 'false');
      expect(downloadedFilenames).toEqual([HEADER_FILENAME]);
    });

    it('restores the button after an error and allows retrying', async () => {
      fetchMock.mockResolvedValueOnce(errorResponse(500)).mockResolvedValueOnce(pdfResponse());
      fireEvent.click(await renderOwnerPage());

      expect(
        await screen.findByText('Não foi possível baixar o certificado. Tente novamente.'),
      ).toBeInTheDocument();
      const button = await screen.findByRole('button', { name: /^baixar$/i });
      expect(button).toBeEnabled();

      fireEvent.click(button);

      await waitFor(() => expect(downloadedFilenames).toEqual([HEADER_FILENAME]));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      [403, 'Este certificado não pertence à sua conta.'],
      [404, 'Certificado não encontrado ou curso ainda não concluído.'],
      [503, 'Estamos gerando muitos certificados agora. Tente novamente em instantes.'],
      [400, 'Não foi possível baixar o certificado. Tente novamente.'],
      [500, 'Não foi possível baixar o certificado. Tente novamente.'],
    ])('shows the right toast for status %i', async (status, message) => {
      fetchMock.mockResolvedValue(errorResponse(status));
      fireEvent.click(await renderOwnerPage());

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /^baixar$/i })).toBeEnabled();
      expect(downloadedFilenames).toEqual([]);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('shows the generic toast on network failure', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      fireEvent.click(await renderOwnerPage());

      expect(
        await screen.findByText('Não foi possível baixar o certificado. Tente novamente.'),
      ).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /^baixar$/i })).toBeEnabled();
    });

    it('on 401 ends the session through the default flow and offers going back to login', async () => {
      const onUnauthorized = vi.fn();
      setUnauthorizedHandler(onUnauthorized);
      fetchMock.mockResolvedValue(errorResponse(401));
      fireEvent.click(await renderOwnerPage());

      expect(
        await screen.findByText('Sua sessão expirou. Faça login novamente.'),
      ).toBeInTheDocument();
      expect(onUnauthorized).toHaveBeenCalledOnce();

      fireEvent.click(screen.getByRole('button', { name: 'Fazer login' }));

      expect(await screen.findByRole('heading', { name: 'Página de login' })).toBeInTheDocument();
    });

    it('does not render the download button when isOwner is false', async () => {
      getCertificateByCodeMock.mockResolvedValue(buildCertificate(false));
      renderPage();

      await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 });

      expect(screen.queryByRole('button', { name: /baixar/i })).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('loads and renders the real certificate data from the API on success', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(false));
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Marketing Digital para Hospitalidade', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/21 de agosto de 2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/16h/).length).toBeGreaterThan(0);
    expect(screen.getByText(VERIFICATION_CODE)).toBeInTheDocument();
    expect(getCertificateByCodeMock).toHaveBeenCalledWith(
      VERIFICATION_CODE,
      expect.any(AbortSignal),
    );
  });

  it('copies the public verification link when sharing, even from the logged-in route', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const certificate = buildCertificate(true);
    getCertificateByCodeMock.mockResolvedValue(certificate);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /^compartilhar$/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/certificados/${certificate.certificate.verificationCode}`,
      );
    });
    expect(await screen.findByText(/link copiado/i)).toBeInTheDocument();
  });

  it('shows a friendly error message when the certificate fails to load', async () => {
    getCertificateByCodeMock.mockRejectedValue(new Error('Certificado não encontrado.'));
    renderPage('CODIGO-INEXISTENTE');

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar o certificado/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Certificado não encontrado.')).toBeInTheDocument();
  });

  it('shows the sidebar, the authenticated navbar and the action buttons when isOwner is true', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(true));
    renderPage();

    await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 });

    expect(screen.getByRole('link', { name: /meus cursos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^baixar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^compartilhar$/i })).toBeInTheDocument();
  });

  it('hides the sidebar and every action button when isOwner is false (public view)', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(false));
    renderPage();

    await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 });

    expect(screen.queryByRole('link', { name: /meus cursos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^baixar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument();
  });

  it('shows the authenticated layout without action buttons to a logged-in user who is not the owner', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(false));
    render(pageWithSession(true));

    await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 });

    expect(screen.getByRole('link', { name: /meus cursos/i })).toBeInTheDocument();
    expect(screen.getAllByText('Maria Visitante').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^baixar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument();
  });

  it('falls back to the public view when the session ends while the page is open', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(true));
    const { rerender } = render(pageWithSession(true));

    expect(await screen.findByRole('button', { name: /^baixar$/i })).toBeInTheDocument();

    rerender(pageWithSession(false));

    expect(screen.queryByRole('button', { name: /^baixar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /meus cursos/i })).not.toBeInTheDocument();
  });
});
