import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  authenticatedFetch,
  authHeaders,
  readApiErrorMessage,
  setUnauthorizedHandler,
} from './api';

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

  it('merges custom headers into the authenticated request', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await authenticatedFetch('/student/enrollments', {
      headers: { 'X-Custom': '1' },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('x-custom')).toBe('1');
    expect(headers.get('content-type')).toBe('application/json');
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

  it('retries a GET after a retryable HTTP status and succeeds on the last attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const promise = authenticatedFetch('/student/enrollments');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws immediately when the abort signal is already set', async () => {
    const controller = new AbortController();
    controller.abort('cancelled');
    vi.stubGlobal('fetch', vi.fn());

    await expect(
      authenticatedFetch('/student/enrollments', { signal: controller.signal }),
    ).rejects.toBeDefined();
  });

  it('returns the last retryable response when all GET attempts are exhausted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 503 });
    vi.stubGlobal('fetch', fetchMock);

    const promise = authenticatedFetch('/student/enrollments');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);
    const response = await promise;

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('authHeaders', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns only Content-Type when there is no access token', () => {
    expect(authHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });
});

describe('readApiErrorMessage', () => {
  it('reads a non-empty message from the API error envelope', async () => {
    const response = new Response(
      JSON.stringify({ status: 400, error: 'Bad Request', message: 'Validation failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );

    await expect(readApiErrorMessage(response)).resolves.toBe('Validation failed');
  });

  it('returns null when the body is not JSON', async () => {
    const response = new Response('not json', { status: 500 });

    await expect(readApiErrorMessage(response)).resolves.toBeNull();
  });

  it('returns null when the message is empty or missing', async () => {
    const response = new Response(JSON.stringify({ message: '   ' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(readApiErrorMessage(response)).resolves.toBeNull();
  });
});

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the health payload from GET /health', async () => {
    const health = { status: 'UP', service: 'escapa-api' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: health }),
      }),
    );

    await expect(api.getHealth()).resolves.toEqual(health);
    expect(fetch).toHaveBeenCalledWith(`${api.baseUrl}/health`);
  });

  it('throws when the health check returns a non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, statusText: 'Service Unavailable' }),
    );

    await expect(api.getHealth()).rejects.toThrow('Failed to check health: Service Unavailable');
  });

  it('lists users from GET /users', async () => {
    const users = [{ id: '1', name: 'Ana', email: 'ana@escapa.com', role: 'ADMIN' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: users }),
      }),
    );

    await expect(api.getUsers()).resolves.toEqual(users);
  });

  it('throws when listing users fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, statusText: 'Forbidden' }));

    await expect(api.getUsers()).rejects.toThrow('Failed to fetch users: Forbidden');
  });

  it('falls back to statusText when create user error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('invalid json')),
      }),
    );

    await expect(
      api.createUser({ name: 'Ana', email: 'ana@escapa.com', role: 'STUDENT' }),
    ).rejects.toThrow('Failed to create user: Bad Request');
  });

  it('creates a user and surfaces the API validation message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'email must be valid' }),
      }),
    );

    await expect(
      api.createUser({ name: 'Ana', email: 'invalid', role: 'STUDENT' }),
    ).rejects.toThrow('email must be valid');
  });

  it('returns the created user on POST /users', async () => {
    const created = { id: '2', name: 'Bruno', email: 'bruno@escapa.com', role: 'STUDENT' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: created }),
      }),
    );

    await expect(
      api.createUser({ name: 'Bruno', email: 'bruno@escapa.com', role: 'STUDENT' }),
    ).resolves.toEqual(created);
  });
});

describe('setUnauthorizedHandler', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('unsubscribes the handler so 401 no longer triggers it', async () => {
    const onUnauthorized = vi.fn();
    const unsubscribe = setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    await authenticatedFetch('/auth/me');
    expect(onUnauthorized).toHaveBeenCalledOnce();

    unsubscribe();
    await authenticatedFetch('/auth/me');
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
