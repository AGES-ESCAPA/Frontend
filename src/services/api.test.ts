import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch, authHeaders, setUnauthorizedHandler } from './api';

describe('authenticatedFetch', () => {
  afterEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(null);
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
});
