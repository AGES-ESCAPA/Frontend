import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminOrderService } from '@services/adminOrderService';
import type { AdminOrderPage } from '@/types/order';
import { useAdminOrders } from './useAdminOrders';

vi.mock('@services/adminOrderService', () => ({
  ADMIN_ORDERS_PAGE_SIZE: 10,
  adminOrderService: {
    list: vi.fn(),
  },
}));

const listMock = vi.mocked(adminOrderService.list);

const page: AdminOrderPage = {
  content: [
    {
      id: 'order-1',
      requester: 'Mariana Costa',
      type: 'INDIVIDUAL',
      courseTitle: 'Turismo Rural',
      seatsQuantity: null,
      purchaseDate: '2026-08-17T12:00:00',
      paymentMethod: 'CARD',
      amount: 97,
      status: 'APPROVED',
    },
  ],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
};

// A referência de `filters` precisa ser estável entre renderizações (o hook não a memoiza
// internamente — ver o comentário de `useAdminOrders`), por isso vive fora de cada `it`.
const approvedFilter = { status: 'APPROVED' } as const;
const emptyFilters = {};

describe('useAdminOrders', () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it('should load the orders page for the given filters and page', async () => {
    listMock.mockResolvedValue(page);

    const { result } = renderHook(() => useAdminOrders(approvedFilter, 0));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.orders).toEqual(page.content);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.totalElements).toBe(1);
    expect(listMock).toHaveBeenCalledWith(approvedFilter, 0, 10, expect.any(AbortSignal));
  });

  it('should refetch when the page changes', async () => {
    listMock.mockResolvedValue(page);

    const { result, rerender } = renderHook(({ filters, page: p }) => useAdminOrders(filters, p), {
      initialProps: { filters: {}, page: 0 },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    listMock.mockClear();

    rerender({ filters: {}, page: 1 });

    await waitFor(() => expect(listMock).toHaveBeenCalledWith({}, 1, 10, expect.any(AbortSignal)));
  });

  it('should expose an error state and allow retry', async () => {
    listMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdminOrders(emptyFilters, 0));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('network');
    expect(result.current.orders).toEqual([]);

    listMock.mockResolvedValue(page);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.orders).toEqual(page.content);
  });

  it('should expose an empty list when the page has no orders', async () => {
    listMock.mockResolvedValue({ ...page, content: [], totalElements: 0, totalPages: 0 });

    const { result } = renderHook(() => useAdminOrders(emptyFilters, 0));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.orders).toEqual([]);
    expect(result.current.totalElements).toBe(0);
  });
});
