import { adminMetricsService, getCourseMetrics } from './adminMetricsService';
import type { AdminCourseMetrics } from '@/types/adminMetrics';

const MOCK_METRICS_RESPONSE: AdminCourseMetrics = {
  mostAccessedCourse: {
    courseId: 'e0000000-0000-4000-e000-000000000001',
    title: 'Turismo de Aventura',
    enrollments: 4820,
  },
  topCourses: [
    {
      courseId: 'e0000000-0000-4000-e000-000000000001',
      title: 'Turismo de Aventura',
      enrollments: 4820,
    },
  ],
  categoriesCount: 2,
  enrollmentsByCategory: [
    { category: 'Hospitalidade', percentage: 66.67 },
    { category: 'Inteligência Artificial', percentage: 33.33 },
  ],
};

describe('adminMetricsService.getCourseMetrics', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'admin-jwt-token');
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests GET /admin/metrics/courses with Bearer token and AbortSignal and unwraps ApiResponse.data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: MOCK_METRICS_RESPONSE,
          message: 'Operation completed successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const controller = new AbortController();
    const result = await adminMetricsService.getCourseMetrics(controller.signal);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/v1/admin/metrics/courses');
    expect(init.signal).toBe(controller.signal);

    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer admin-jwt-token');
    expect(result).toEqual(MOCK_METRICS_RESPONSE);
  });

  it('returns the empty metrics payload when the platform has no eligible enrollments', async () => {
    const emptyPayload: AdminCourseMetrics = {
      mostAccessedCourse: null,
      topCourses: [],
      categoriesCount: 0,
      enrollmentsByCategory: [],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: undefined,
        json: async () => ({ success: true, data: emptyPayload }),
      } as unknown as Response),
    );

    await expect(getCourseMetrics()).resolves.toEqual(emptyPayload);
  });

  it('throws the backend ApiError message on HTTP 403 or 500 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 403,
            error: 'Forbidden',
            message: 'Acesso restrito a administradores.',
            path: '/api/v1/admin/metrics/courses',
            timestamp: '2026-11-11T18:00:00Z',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    await expect(getCourseMetrics()).rejects.toThrow('Acesso restrito a administradores.');
  });

  it('falls back to the default message when an HTTP error response has no message field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 500 }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(getCourseMetrics()).rejects.toThrow(
      'Não foi possível carregar as métricas de cursos.',
    );
  });

  it('throws the friendly fallback message when a network error occurs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(getCourseMetrics()).rejects.toThrow(
      'Não foi possível carregar as métricas de cursos.',
    );
  });

  it('rethrows AbortError without wrapping when the request is cancelled', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(getCourseMetrics()).rejects.toBe(abortError);
  });

  it('throws the fallback message when the response is not JSON or the envelope is invalid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, data: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCourseMetrics()).rejects.toThrow(
      'Não foi possível carregar as métricas de cursos.',
    );
    await expect(getCourseMetrics()).rejects.toThrow(
      'Não foi possível carregar as métricas de cursos.',
    );
  });
});
