import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCertificateByCode } from '@services/certificateService';
import type { CertificateData } from '@/types/certificate';
import { DigitalCertificate } from './DigitalCertificate';

vi.mock('@services/certificateService', () => ({
  getCertificateByCode: vi.fn(),
  getCertificateDownloadUrl: (verificationCode: string) => `/mock-download/${verificationCode}`,
}));

const getCertificateByCodeMock = vi.mocked(getCertificateByCode);

const buildCertificate = (isOwner: boolean): CertificateData => ({
  certificate: {
    conclusionDate: '2026-08-21',
    workload: 960,
    verificationCode: 'ESC-21AGO25-7X9L2M3N',
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

const renderPage = (verificationCode = 'ESC-21AGO25-7X9L2M3N') =>
  render(
    <MemoryRouter initialEntries={[`/certificados/${verificationCode}`]}>
      <Routes>
        <Route path="/certificados/:verificationCode" element={<DigitalCertificate />} />
      </Routes>
    </MemoryRouter>,
  );

describe('DigitalCertificate', () => {
  beforeEach(() => {
    getCertificateByCodeMock.mockReset();
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
    expect(screen.getByText('ESC-21AGO25-7X9L2M3N')).toBeInTheDocument();
    expect(getCertificateByCodeMock).toHaveBeenCalledWith(
      'ESC-21AGO25-7X9L2M3N',
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

  it('hides the sidebar and the action buttons when isOwner is false (public view)', async () => {
    getCertificateByCodeMock.mockResolvedValue(buildCertificate(false));
    renderPage();

    await screen.findByRole('heading', { name: 'Jorge Amado', level: 1 });

    expect(screen.queryByRole('link', { name: /meus cursos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^baixar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument();
  });
});
