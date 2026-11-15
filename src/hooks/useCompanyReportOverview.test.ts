import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyReportService } from '@services/companyReportService';
import type { CompanyReportOverview } from '@/types/companyReport';
import { useCompanyReportOverview } from './useCompanyReportOverview';

vi.mock('@services/companyReportService', () => ({
  companyReportService: {
    getOverview: vi.fn(),
    listEmployeeProgress: vi.fn(),
  },
}));

const getOverviewMock = vi.mocked(companyReportService.getOverview);

const overview: CompanyReportOverview = {
  completionRate: 0,
  completionRateChange: 0,
  averageHoursPerEmployee: 0,
  certificatesThisQuarter: 0,
  weeklyEngagement: 0,
  completionByJobTitle: [],
  monthlyHours: [],
};

describe('useCompanyReportOverview', () => {
  beforeEach(() => getOverviewMock.mockReset());

  it('starts loading and exposes the overview once it arrives', async () => {
    getOverviewMock.mockResolvedValueOnce(overview);

    const { result } = renderHook(() => useCompanyReportOverview());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.overview).toEqual(overview);
    expect(result.current.errorMessage).toBeNull();
  });

  it('exposes the service message on failure and loads again on reload', async () => {
    getOverviewMock
      .mockRejectedValueOnce(new Error('Servidor fora do ar.'))
      .mockResolvedValueOnce(overview);

    const { result } = renderHook(() => useCompanyReportOverview());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Servidor fora do ar.');
    expect(result.current.overview).toBeNull();

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getOverviewMock).toHaveBeenCalledTimes(2);
  });

  it('uses a fallback message when the failure is not an Error', async () => {
    getOverviewMock.mockRejectedValueOnce('boom');

    const { result } = renderHook(() => useCompanyReportOverview());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Não foi possível carregar os indicadores da equipe.');
  });

  it('aborts the request when unmounted', () => {
    getOverviewMock.mockReturnValueOnce(new Promise(() => {}));

    const { unmount } = renderHook(() => useCompanyReportOverview());
    const signal = getOverviewMock.mock.calls[0][0];
    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
