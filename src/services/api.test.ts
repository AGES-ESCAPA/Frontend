import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch, authHeaders, setUnauthorizedHandler } from './api';

describe('authenticatedFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(null);
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds the access token and never sends the provisional user header', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await authenticatedFetch('/admin/courses');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer jwt-token');
    expect(headers.get('x-user-id')).toBeNull();
    expect(authHeaders()).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-token',
    });
  });

  it('lets the browser set the multipart Content-Type when the body is FormData', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await authenticatedFetch('/me/avatar', { method: 'PUT', body: new FormData() });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('content-type')).toBeNull();
    expect(headers.get('authorization')).toBe('Bearer jwt-token');
  });

  it('notifies the session when an authenticated request receives 401', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    await authenticatedFetch('/student/enrollments');

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('retries a GET after a transient network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const promise = authenticatedFetch('/student/enrollments');
    await vi.advanceTimersByTimeAsync(200);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a POST after a network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      authenticatedFetch('/student/lessons/complete', { method: 'POST', body: '{}' }),
    ).rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
