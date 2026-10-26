import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch } from '@services/api';
import type { PlacedOrder } from '@/types/order';
import { OrderServiceError, createOrder, getSeatPrice } from './orderService';

vi.mock('@services/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  authenticatedFetch: vi.fn(),
}));

const authenticatedFetchMock = vi.mocked(authenticatedFetch);

const order: PlacedOrder = {
  orderId: '67f8851a-c299-40cd-8de2-df0823075075',
  status: 'APPROVED',
  itemType: 'COURSE',
  courseId: 'e0000000-0000-4000-e000-000000000003',
  seatsQuantity: null,
  amount: 117,
  paymentMethod: 'CARD',
  installments: 3,
  createdAt: '2026-10-24T15:32:49.461540389',
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const payload = {
  itemType: 'COURSE',
  courseId: order.courseId as string,
  paymentMethod: 'CARD',
  installments: 3,
} as const;

describe('createOrder', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should post the order to the orders endpoint and return the approved order', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: order, message: 'ok' }, 201),
    );

    const result = await createOrder(payload);

    expect(result).toEqual(order);
    const [url, init] = authenticatedFetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/orders$/);
    expect(init?.method).toBe('POST');
  });

  it('should send only the item, the payment method and the installments', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: order }, 201));

    await createOrder(payload);

    const [, init] = authenticatedFetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      itemType: 'COURSE',
      courseId: order.courseId,
      paymentMethod: 'CARD',
      installments: 3,
    });
  });

  it('should send a seats purchase without a course', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: order }, 201));

    await createOrder({
      itemType: 'SEATS',
      seatsQuantity: 10,
      paymentMethod: 'CARD',
      installments: 1,
    });

    const [, init] = authenticatedFetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      itemType: 'SEATS',
      seatsQuantity: 10,
      paymentMethod: 'CARD',
      installments: 1,
    });
  });

  it.each([
    [400, 'Não foi possível processar a compra. Confira os dados e tente novamente.'],
    [401, 'Sua sessão expirou. Entre novamente para concluir a compra.'],
    [403, 'Seu perfil não pode realizar esta compra.'],
    [404, 'Curso não encontrado.'],
    [409, 'Você já tem acesso ativo a este curso.'],
    [500, 'Não foi possível concluir a compra. Tente novamente em instantes.'],
  ])('should explain a %i response in Portuguese', async (status, message) => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse({ status, error: 'x', message: 'English message from the API' }, status),
    );

    const error = await createOrder(payload).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OrderServiceError);
    expect((error as OrderServiceError).status).toBe(status);
    expect((error as OrderServiceError).message).toBe(message);
  });

  it('should report a network failure with status 0', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await createOrder(payload).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OrderServiceError);
    expect((error as OrderServiceError).status).toBe(0);
    expect((error as OrderServiceError).message).toContain('Verifique sua conexão');
  });
});

describe('getSeatPrice', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should read the seat price from the orders endpoint', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: { seatPrice: 79 } }),
    );

    await expect(getSeatPrice()).resolves.toBe(79);
    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/orders\/seat-price$/),
      expect.objectContaining({ signal: undefined }),
    );
  });

  it('should report an API failure in Portuguese with its status', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ message: 'x' }, 500));

    const error = await getSeatPrice().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OrderServiceError);
    expect((error as OrderServiceError).status).toBe(500);
    expect((error as OrderServiceError).message).toBe(
      'Não foi possível carregar o valor dos assentos.',
    );
  });

  it('should report a network failure with status 0', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await getSeatPrice().catch((caught: unknown) => caught);

    expect((error as OrderServiceError).status).toBe(0);
    expect((error as OrderServiceError).message).toMatch(/Verifique sua conexão/);
  });
});
