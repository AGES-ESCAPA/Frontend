import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCertificateByCode } from '@services/certificateService';
import type { CertificateData } from '@/types/certificate';
import { useCertificate } from './useCertificate';

vi.mock('@services/certificateService', () => ({
  getCertificateByCode: vi.fn(),
}));

const getCertificateByCodeMock = vi.mocked(getCertificateByCode);

const certificate: CertificateData = {
  course: 'Marketing Digital para Hospitalidade',
  student: 'Jorge Amado',
  workload: '16 horas',
  conclusionDate: '21 de agosto de 2026',
  verificationCode: 'ESC-21AGO25-7X9L2M3N',
};

describe('useCertificate', () => {
  beforeEach(() => {
    getCertificateByCodeMock.mockReset();
  });

  it('starts loading and resolves with the certificate on success', async () => {
    getCertificateByCodeMock.mockResolvedValue(certificate);

    const { result } = renderHook(() => useCertificate(certificate.verificationCode));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.certificate).toEqual(certificate);
    expect(result.current.errorMessage).toBeNull();
    expect(getCertificateByCodeMock).toHaveBeenCalledWith(
      certificate.verificationCode,
      expect.any(AbortSignal),
    );
  });

  it('exposes the error message when the code does not match a certificate', async () => {
    getCertificateByCodeMock.mockRejectedValue(new Error('Certificado não encontrado.'));

    const { result } = renderHook(() => useCertificate('CODIGO-INEXISTENTE'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.certificate).toBeNull();
    expect(result.current.errorMessage).toBe('Certificado não encontrado.');
  });

  it('starts in the error state when no verification code is given', () => {
    const { result } = renderHook(() => useCertificate(undefined));

    expect(result.current.status).toBe('error');
    expect(result.current.certificate).toBeNull();
    expect(getCertificateByCodeMock).not.toHaveBeenCalled();
  });
});
