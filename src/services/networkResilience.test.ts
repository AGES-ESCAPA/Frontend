import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithRetry,
  isNetworkError,
  isTransientServiceError,
  withRetry,
} from './networkResilience';

describe('networkResilience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('detects Failed to fetch as a network error', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isTransientServiceError({ status: 0, message: 'offline' })).toBe(true);
    expect(isTransientServiceError({ status: 503, message: 'unavailable' })).toBe(true);
    expect(isTransientServiceError({ status: 404, message: 'missing' })).toBe(false);
  });

  it('retries transient failures with backoff and then succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(operation, { maxAttempts: 3, baseDelayMs: 100 });
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry when the signal aborts', async () => {
    const controller = new AbortController();
    const operation = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new TypeError('Failed to fetch');
    });

    const promise = withRetry(operation, {
      maxAttempts: 3,
      baseDelayMs: 100,
      signal: controller.signal,
    });

    await expect(promise).rejects.toSatisfy(
      (error: unknown) => error instanceof DOMException || error instanceof TypeError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries GET fetch on network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ status: 200, ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchWithRetry('/public/courses', { cache: 'no-store' });
    await vi.advanceTimersByTimeAsync(200);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST fetch on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithRetry('/orders', { method: 'POST', body: '{}' })).rejects.toThrow(
      'Failed to fetch',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
