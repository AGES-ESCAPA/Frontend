import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminOrderService } from '@services/adminOrderService';
import type { AdminOrderStats } from '@/types/order';
import { useAdminOrderStats } from './useAdminOrderStats';

vi.mock('@services/adminOrderService', () => ({
  adminOrderService: {
    stats: vi.fn(),
  },
}));

const statsMock = vi.mocked(adminOrderService.stats);

const stats: AdminOrderStats = {
  approvedCount: 18,
  approvedRevenue: 5346,
  cancelledOrRefundedCount: 3,
};

// A referência de `filters` precisa ser estável entre renderizações (o hook não a memoiza).
const corporateFilter = { type: 'CORPORATE' } as const;
const emptyFilters = {};

describe('useAdminOrderStats', () => {
  beforeEach(() => {
    statsMock.mockReset();
  });

  it('should load the totals for the given filters', async () => {
    statsMock.mockResolvedValue(stats);

    const { result } = renderHook(() => useAdminOrderStats(corporateFilter));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.stats).toEqual(stats);
    expect(statsMock).toHaveBeenCalledWith(corporateFilter, expect.any(AbortSignal));
  });

  it('should refetch when the filters change', async () => {
    statsMock.mockResolvedValue(stats);

    const { result, rerender } = renderHook(({ filters }) => useAdminOrderStats(filters), {
      initialProps: { filters: emptyFilters as Record<string, string> },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    statsMock.mockClear();

    rerender({ filters: corporateFilter });

    await waitFor(() =>
      expect(statsMock).toHaveBeenCalledWith(corporateFilter, expect.any(AbortSignal)),
    );
  });

  it('should expose an error state and allow retry', async () => {
    statsMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdminOrderStats(emptyFilters));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.stats).toBeNull();

    statsMock.mockResolvedValue(stats);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.stats).toEqual(stats);
  });
});
