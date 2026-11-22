import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { authenticatedFetch } from '@services/api';
import type { AdminOrderDetails, AdminOrderPage } from '@/types/order';
import { AdminOrderServiceError, adminOrderService } from './adminOrderService';

vi.mock('@services/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  authenticatedFetch: vi.fn(),
}));

const authenticatedFetchMock = vi.mocked(authenticatedFetch);

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const summaryPage: AdminOrderPage = {
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

const details: AdminOrderDetails = {
  id: 'order-1',
  type: 'CORPORATE',
  buyer: {
    id: 'buyer-1',
    name: 'Pousada Vista Mar LTDA',
    email: 'rh@vistamar.com.br',
    document: '12345678000191',
    phone: '51999990001',
  },
  item: {
    type: 'COURSE',
    courseId: 'course-1',
    courseTitle: 'Inovação em Destinos',
    seatsQuantity: null,
  },
  amount: 97,
  paymentMethod: 'CARD',
  installments: 1,
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
  collaboratorsWithAccessCount: 4,
};

describe('adminOrderService.list', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should fetch the orders page with filters, page and size as query params', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: summaryPage }));

    const result = await adminOrderService.list(
      {
        type: 'INDIVIDUAL',
        courseId: 'course-1',
        from: '2026-01-01',
        to: '2026-02-01',
        status: 'APPROVED',
      },
      1,
      20,
    );

    expect(result).toEqual(summaryPage);
    const [url] = authenticatedFetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toMatch(/\/admin\/orders$/);
    expect(parsed.searchParams.get('type')).toBe('INDIVIDUAL');
    expect(parsed.searchParams.get('courseId')).toBe('course-1');
    expect(parsed.searchParams.get('from')).toBe('2026-01-01');
    expect(parsed.searchParams.get('to')).toBe('2026-02-01');
    expect(parsed.searchParams.get('status')).toBe('APPROVED');
    expect(parsed.searchParams.get('page')).toBe('1');
    expect(parsed.searchParams.get('size')).toBe('20');
  });

  it('should send the search term to the API', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: summaryPage }));

    await adminOrderService.list({ search: 'PED-1A2B' }, 0, 10);

    const [url] = authenticatedFetchMock.mock.calls[0];
    expect(new URL(String(url)).searchParams.get('search')).toBe('PED-1A2B');
  });

  it('should omit empty filters from the query string', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: summaryPage }));

    await adminOrderService.list({}, 0, 10);

    const [url] = authenticatedFetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.searchParams.has('type')).toBe(false);
    expect(parsed.searchParams.has('courseId')).toBe(false);
    expect(parsed.searchParams.has('status')).toBe(false);
    expect(parsed.searchParams.has('search')).toBe(false);
  });

  it('should throw with the API message when the response is not ok', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse(
        { status: 403, error: 'Forbidden', message: 'Access denied: user is not ADMIN' },
        403,
      ),
    );

    const error = await adminOrderService.list({}, 0, 10).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(403);
    expect((error as AdminOrderServiceError).message).toBe('Access denied: user is not ADMIN');
  });

  it('should report a network failure with status 0', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await adminOrderService.list({}, 0, 10).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(0);
    expect((error as AdminOrderServiceError).message).toContain('conexão');
  });
});

describe('adminOrderService.stats', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should fetch the totals with the filters and without pagination params', async () => {
    const stats = { approvedCount: 12, approvedRevenue: 3540.5, cancelledOrRefundedCount: 3 };
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: stats }));

    const result = await adminOrderService.stats({ type: 'CORPORATE', from: '2026-01-01' });

    expect(result).toEqual(stats);
    const [url] = authenticatedFetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toMatch(/\/admin\/orders\/stats$/);
    expect(parsed.searchParams.get('type')).toBe('CORPORATE');
    expect(parsed.searchParams.get('from')).toBe('2026-01-01');
    expect(parsed.searchParams.has('page')).toBe(false);
    expect(parsed.searchParams.has('size')).toBe(false);
  });

  it('should throw with the API message when the response is not ok', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse(
        { status: 403, error: 'Forbidden', message: 'Access denied: user is not ADMIN' },
        403,
      ),
    );

    const error = await adminOrderService.stats({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(403);
  });
});

describe('adminOrderService.get', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should fetch the order details by id', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: details }));

    const result = await adminOrderService.get('order-1');

    expect(result).toEqual(details);
    const [url] = authenticatedFetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/admin\/orders\/order-1$/);
  });

  it('should throw a 404 error when the order does not exist', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse({ status: 404, error: 'Not Found', message: 'Order not found: order-404' }, 404),
    );

    const error = await adminOrderService.get('order-404').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(404);
    expect((error as AdminOrderServiceError).message).toBe('Pedido não encontrado.');
  });

  it('should report a network failure with status 0', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await adminOrderService.get('order-1').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(0);
  });
});

describe('adminOrderService.cancel', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should post cancel and return the updated status', async () => {
    const payload = {
      id: 'order-1',
      status: 'CANCELLED',
      statusHistory: [
        {
          status: 'APPROVED',
          changedBy: null,
          reason: null,
          createdAt: '2026-08-17T12:00:00',
        },
        {
          status: 'CANCELLED',
          changedBy: 'admin-1',
          reason: null,
          createdAt: '2026-08-18T09:00:00',
        },
      ],
    };
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: payload }));

    const result = await adminOrderService.cancel('order-1');

    expect(result).toEqual(payload);
    const [url, init] = authenticatedFetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/admin\/orders\/order-1\/cancel$/);
    expect(init).toMatchObject({ method: 'POST' });
  });

  it('should throw a conflict message when cancel is rejected', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 409,
          error: 'Conflict',
          message: 'Somente pedidos aprovados podem ser cancelados.',
        },
        409,
      ),
    );

    const error = await adminOrderService.cancel('order-1').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminOrderServiceError);
    expect((error as AdminOrderServiceError).status).toBe(409);
    expect((error as AdminOrderServiceError).message).toBe(
      'Somente pedidos aprovados podem ser cancelados.',
    );
  });
});

describe('adminOrderService.refund', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should post refund and return the updated status', async () => {
    const payload = {
      id: 'order-1',
      status: 'REFUNDED',
      statusHistory: [
        {
          status: 'CANCELLED',
          changedBy: 'admin-1',
          reason: null,
          createdAt: '2026-08-18T09:00:00',
        },
        {
          status: 'REFUNDED',
          changedBy: 'admin-1',
          reason: null,
          createdAt: '2026-08-19T10:00:00',
        },
      ],
    };
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: payload }));

    const result = await adminOrderService.refund('order-1');

    expect(result).toEqual(payload);
    const [url, init] = authenticatedFetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/admin\/orders\/order-1\/refund$/);
    expect(init).toMatchObject({ method: 'POST' });
  });
});
