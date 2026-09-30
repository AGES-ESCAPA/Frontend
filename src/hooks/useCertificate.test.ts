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
  isOwner: false,
};

describe('useCertificate', () => {
  beforeEach(() => {
    getCertificateByCodeMock.mockReset();
  });

  it('starts loading and resolves with the certificate on success', async () => {
    getCertificateByCodeMock.mockResolvedValue(certificate);

    const { result } = renderHook(() => useCertificate(certificate.certificate.verificationCode));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.certificate).toEqual(certificate);
    expect(result.current.errorMessage).toBeNull();
    expect(getCertificateByCodeMock).toHaveBeenCalledWith(
      certificate.certificate.verificationCode,
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
