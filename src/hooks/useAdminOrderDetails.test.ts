import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminOrderService } from '@services/adminOrderService';
import { AdminOrderServiceError } from '@services/adminOrderService';
import type { AdminOrderDetails } from '@/types/order';
import { useAdminOrderDetails } from './useAdminOrderDetails';

vi.mock('@services/adminOrderService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  adminOrderService: {
    get: vi.fn(),
  },
}));

const getMock = vi.mocked(adminOrderService.get);

const details: AdminOrderDetails = {
  id: 'order-1',
  type: 'INDIVIDUAL',
  buyer: {
    id: 'buyer-1',
    name: 'Ana Paula Ferreira',
    email: 'ana@email.com',
    document: '123',
    phone: '11999999999',
  },
  item: { type: 'COURSE', courseId: 'course-1', courseTitle: 'Turismo Rural', seatsQuantity: null },
  amount: 97,
  paymentMethod: 'PIX',
  installments: null,
  status: 'APPROVED',
  createdAt: '2026-08-17T12:00:00',
  statusHistory: [],
  collaboratorsWithAccessCount: null,
};

describe('useAdminOrderDetails', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('should not fetch when orderId is null', () => {
    const { result } = renderHook(() => useAdminOrderDetails(null));

    expect(result.current.status).toBe('loading');
    expect(result.current.order).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('should load the order details for the given id', async () => {
    getMock.mockResolvedValue(details);

    const { result } = renderHook(() => useAdminOrderDetails('order-1'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.order).toEqual(details);
    expect(getMock).toHaveBeenCalledWith('order-1', expect.any(AbortSignal));
  });

  it('should expose the 404 message when the order does not exist', async () => {
    getMock.mockRejectedValue(new AdminOrderServiceError(404, 'Pedido não encontrado.'));

    const { result } = renderHook(() => useAdminOrderDetails('missing-order'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Pedido não encontrado.');
    expect(result.current.order).toBeNull();
  });

  it('should reload when the orderId changes', async () => {
    getMock.mockResolvedValue(details);
    const { result, rerender } = renderHook(({ id }) => useAdminOrderDetails(id), {
      initialProps: { id: 'order-1' as string | null },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    const other: AdminOrderDetails = { ...details, id: 'order-2' };
    getMock.mockResolvedValue(other);
    rerender({ id: 'order-2' });

    await waitFor(() => expect(result.current.order?.id).toBe('order-2'));
  });
});
