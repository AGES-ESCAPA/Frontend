import { render, screen, waitFor } from '@testing-library/react';
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

const certificate: CertificateData = {
  course: 'Marketing Digital para Hospitalidade',
  student: 'Jorge Amado',
  workload: '16 horas',
  conclusionDate: '21 de agosto de 2026',
  verificationCode: 'ESC-21AGO25-7X9L2M3N',
};

const renderPage = (isAuthenticated: boolean, verificationCode = certificate.verificationCode) =>
  render(
    <MemoryRouter initialEntries={[`/certificados/${verificationCode}`]}>
      <Routes>
        <Route
          path="/certificados/:verificationCode"
          element={<DigitalCertificate isAuthenticated={isAuthenticated} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('DigitalCertificate', () => {
  beforeEach(() => {
    getCertificateByCodeMock.mockReset();
  });

  it('renders the certificate with the sidebar and action buttons when authenticated', async () => {
    getCertificateByCodeMock.mockResolvedValue(certificate);
    renderPage(true);

    expect(
      await screen.findByRole('heading', { name: certificate.student, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: certificate.course, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/concluído por/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /meus cursos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^baixar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^compartilhar$/i })).toBeInTheDocument();
  });

  it('renders the certificate publicly without the sidebar or action buttons', async () => {
    getCertificateByCodeMock.mockResolvedValue(certificate);
    renderPage(false);

    expect(
      await screen.findByRole('heading', { name: certificate.student, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /meus cursos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^baixar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument();
  });

  it('shows a friendly error message when the certificate fails to load', async () => {
    getCertificateByCodeMock.mockRejectedValue(new Error('Certificado não encontrado.'));
    renderPage(false, 'CODIGO-INEXISTENTE');

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar o certificado/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Certificado não encontrado.')).toBeInTheDocument();
  });
});
