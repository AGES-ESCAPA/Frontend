import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { OrderServiceError, getSeatPrice } from '@services/orderService';
import { useSeatPrice } from './useSeatPrice';

vi.mock('@services/orderService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getSeatPrice: vi.fn(),
}));

const getSeatPriceMock = vi.mocked(getSeatPrice);

describe('useSeatPrice', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load the seat price', async () => {
    getSeatPriceMock.mockResolvedValue(79);

    const { result } = renderHook(() => useSeatPrice(true));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.seatPrice).toBe(79);
    expect(getSeatPriceMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('should not ask for the price when it is not a seats checkout', () => {
    renderHook(() => useSeatPrice(false));

    expect(getSeatPriceMock).not.toHaveBeenCalled();
  });

  it('should expose the error and load again on retry', async () => {
    getSeatPriceMock
      .mockRejectedValueOnce(new OrderServiceError(0, 'Sem conexão.'))
      .mockResolvedValueOnce(85);

    const { result } = renderHook(() => useSeatPrice(true));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Sem conexão.');

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.seatPrice).toBe(85);
  });

  it('should ignore the answer of a request cancelled on unmount', async () => {
    getSeatPriceMock.mockImplementation(
      (signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const { result, unmount } = renderHook(() => useSeatPrice(true));
    unmount();

    expect(result.current.status).toBe('loading');
    expect(result.current.errorMessage).toBeNull();
  });
});
