import { describe, expect, it } from 'vitest';
import type { AdminOrderDetails } from '@/types/order';
import { mapAdminOrderDetailsToOrderRow, toOrderCode } from './mapAdminOrder';

const baseDetails: AdminOrderDetails = {
  id: '11111111-2222-3333-4444-555555555555',
  type: 'INDIVIDUAL',
  buyer: {
    id: 'buyer-1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    document: '12345678900',
    phone: '11987654321',
  },
  item: {
    type: 'COURSE',
    courseId: 'course-1',
    courseTitle: 'Escape Room Design Avançado',
    seatsQuantity: null,
  },
  amount: 297,
  paymentMethod: 'PIX',
  installments: null,
  status: 'APPROVED',
  createdAt: '2026-08-17T12:00:00',
  statusHistory: [
    {
      id: 'h1',
      status: 'APPROVED',
      changedBy: null,
      reason: null,
      createdAt: '2026-08-17T12:00:00',
    },
  ],
  collaboratorsWithAccessCount: null,
};

describe('toOrderCode', () => {
  it('should derive a short, stable code from the order id', () => {
    expect(toOrderCode('11111111-2222-3333-4444-555555555555')).toBe('PED-55555555');
  });

  it('should not collide for seed ids that share the same prefix', () => {
    expect(toOrderCode('05000000-0000-4000-9000-000000000012')).toBe('PED-00000012');
    expect(toOrderCode('05000000-0000-4000-9000-000000000013')).toBe('PED-00000013');
  });
});

describe('mapAdminOrderDetailsToOrderRow', () => {
  it('should map an individual course order', () => {
    const row = mapAdminOrderDetailsToOrderRow(baseDetails);

    expect(row).toEqual({
      id: baseDetails.id,
      code: 'PED-55555555',
      clientName: 'Ana Paula Ferreira',
      clientEmail: 'ana.ferreira@email.com',
      clientPhone: '11987654321',
      clientDocument: '12345678900',
      type: 'INDIVIDUAL',
      courseId: 'course-1',
      courseName: 'Escape Room Design Avançado',
      seats: 1,
      paymentMethod: 'PIX',
      total: 297,
      createdAt: '2026-08-17T12:00:00',
      status: 'APPROVED',
      statusHistory: [
        { status: 'APPROVED', date: '2026-08-17T12:00:00', description: 'Pagamento aprovado.' },
      ],
    });
  });

  it('should mark a corporate course order with corporateKind "course"', () => {
    const row = mapAdminOrderDetailsToOrderRow({ ...baseDetails, type: 'CORPORATE' });

    expect(row.corporateKind).toBe('course');
  });

  it('should mark a corporate seats order with corporateKind "seats" and a placeholder course name', () => {
    const row = mapAdminOrderDetailsToOrderRow({
      ...baseDetails,
      type: 'CORPORATE',
      item: { type: 'SEATS', courseId: null, courseTitle: null, seatsQuantity: 10 },
    });

    expect(row.corporateKind).toBe('seats');
    expect(row.courseId).toBe('');
    expect(row.courseName).toBe('Assentos corporativos');
    expect(row.seats).toBe(10);
  });

  it('should not set corporateKind for individual orders', () => {
    const row = mapAdminOrderDetailsToOrderRow(baseDetails);

    expect(row.corporateKind).toBeUndefined();
  });

  it('should fall back to a default description when a history entry has no reason', () => {
    const row = mapAdminOrderDetailsToOrderRow({
      ...baseDetails,
      status: 'CANCELLED',
      statusHistory: [
        ...baseDetails.statusHistory,
        {
          id: 'h2',
          status: 'CANCELLED',
          changedBy: 'admin-1',
          reason: null,
          createdAt: '2026-08-18T12:00:00',
        },
      ],
    });

    expect(row.statusHistory[1]).toEqual({
      status: 'CANCELLED',
      date: '2026-08-18T12:00:00',
      description: 'Pedido cancelado pelo administrador.',
    });
  });

  it('should use the reason from the API when present', () => {
    const row = mapAdminOrderDetailsToOrderRow({
      ...baseDetails,
      status: 'CANCELLED',
      statusHistory: [
        {
          id: 'h2',
          status: 'CANCELLED',
          changedBy: 'admin-1',
          reason: 'Cliente desistiu.',
          createdAt: '2026-08-18T12:00:00',
        },
      ],
    });

    expect(row.statusHistory[0].description).toBe('Cliente desistiu.');
  });

  it('should handle a buyer-less response with empty strings', () => {
    const row = mapAdminOrderDetailsToOrderRow({ ...baseDetails, buyer: null });

    expect(row.clientName).toBe('');
    expect(row.clientEmail).toBe('');
    expect(row.clientPhone).toBe('');
    expect(row.clientDocument).toBe('');
  });
});
