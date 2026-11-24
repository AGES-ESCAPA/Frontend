import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithRetry,
  isAbortError,
  isIdempotentMethod,
  isNetworkError,
  isTransientServiceError,
  sleep,
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
    expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    expect(isNetworkError('offline')).toBe(false);
    expect(isTransientServiceError({ status: 0, message: 'offline' })).toBe(true);
    expect(isTransientServiceError({ status: 503, message: 'unavailable' })).toBe(true);
    expect(isTransientServiceError({ status: 404, message: 'missing' })).toBe(false);
  });

  it('recognizes abort errors from the signal or DOMException', () => {
    const controller = new AbortController();
    const abortError = new DOMException('Aborted', 'AbortError');
    controller.abort(abortError);
    expect(isAbortError(abortError, controller.signal)).toBe(true);
    expect(isAbortError(new Error('other'), controller.signal)).toBe(true);
  });

  it('rejects sleep when the signal aborts', async () => {
    const controller = new AbortController();
    const promise = sleep(500, controller.signal);
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(DOMException);
  });

  it('treats only GET and HEAD as idempotent for retry', () => {
    expect(isIdempotentMethod()).toBe(true);
    expect(isIdempotentMethod({ method: 'HEAD' })).toBe(true);
    expect(isIdempotentMethod({ method: 'post' })).toBe(false);
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

  it('retries GET fetch when the server returns a retryable status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 503, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchWithRetry('/public/courses');
    await vi.advanceTimersByTimeAsync(200);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when shouldRetry returns false', async () => {
    const operation = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      withRetry(operation, {
        maxAttempts: 3,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('Failed to fetch');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('throws the last error after exhausting all attempts', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const promise = withRetry(operation, { maxAttempts: 2, baseDelayMs: 50 });
    const assertion = expect(promise).rejects.toThrow('Failed to fetch');
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
