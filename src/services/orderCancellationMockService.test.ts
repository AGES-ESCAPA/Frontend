import { describe, expect, it } from 'vitest';
import type { OrderRow } from '@components/ui/OrderDetailModal/Orderdetail.constants';
import { createOrderCancellationMockService } from './orderCancellationMockService';

const makeOrder = (overrides: Partial<OrderRow> = {}): OrderRow => ({
  id: '1',
  code: 'PED-00142',
  clientName: 'Ana Paula Ferreira',
  clientEmail: 'ana.ferreira@email.com',
  clientPhone: '',
  clientDocument: '',
  type: 'INDIVIDUAL',
  courseId: 'curso-design',
  courseName: 'Escape Room Design Avançado',
  seats: 1,
  paymentMethod: 'Pix',
  total: 297,
  createdAt: '2026-08-17T12:00:00.000Z',
  status: 'APPROVED',
  statusHistory: [
    { status: 'APPROVED', date: '2026-08-17T12:00:00.000Z', description: 'Pagamento aprovado.' },
  ],
  ...overrides,
});

describe('orderCancellationMockService', () => {
  it('revokes access while preserving learner progress and supports later refund', () => {
    const service = createOrderCancellationMockService([makeOrder()], {
      enrollmentProgress: { '1': 42 },
      now: () => new Date('2026-08-18T12:00:00.000Z'),
    });

    const cancellation = service.executeAction('1', 'cancel', 'APPROVED');

    expect(cancellation.order.status).toBe('CANCELLED');
    expect(cancellation.order.statusHistory).toHaveLength(2);
    expect(cancellation.enrollmentAccess).toEqual({ isGranted: false, progressPercent: 42 });
    expect(service.getEnrollmentAccess('1')).toEqual({
      isGranted: false,
      progressPercent: 42,
    });

    const refund = service.executeAction('1', 'refund', 'CANCELLED');

    expect(refund.order.status).toBe('REFUNDED');
    expect(refund.order.statusHistory).toHaveLength(3);
    expect(refund.enrollmentAccess).toEqual({ isGranted: false, progressPercent: 42 });
  });

  it('rejects a stale status with a 409 conflict and does not update the order', () => {
    const service = createOrderCancellationMockService([makeOrder()]);
    service.executeAction('1', 'cancel', 'APPROVED');

    expect(() => service.executeAction('1', 'cancel', 'APPROVED')).toThrow(
      expect.objectContaining({ status: 409 }),
    );
    expect(service.listOrders()[0].status).toBe('CANCELLED');
  });

  it('rejects cancellation when corporate seats are occupied', () => {
    const order = makeOrder({
      type: 'CORPORATE',
      corporateKind: 'seats',
      seats: 5,
    });
    const service = createOrderCancellationMockService([order], {
      occupiedCorporateSeats: { '1': 2 },
    });

    expect(() => service.executeAction('1', 'cancel', 'APPROVED')).toThrow(
      expect.objectContaining({
        status: 409,
        message: expect.stringContaining('2 de 5 assentos estão em uso'),
      }),
    );
    expect(service.listOrders()[0].status).toBe('APPROVED');
  });
});
