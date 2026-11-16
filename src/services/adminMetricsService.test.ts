import { setUnauthorizedHandler } from '@services/api';
import type { AdminCourseMetrics } from '@/types/adminMetrics';
import { adminMetricsOverview, zeroAdminMetricsOverview } from '@/test/adminMetricsFixtures';
import { adminMetricsService } from './adminMetricsService';

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn<typeof fetch>();
const fallback = 'Não foi possível carregar os indicadores. Tente novamente.';
const invalidResponse =
  'Não foi possível carregar os indicadores. O servidor retornou uma resposta inválida.';

describe('adminMetricsService.getOverview', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('access_token', 'metrics-token');
  });

  afterEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('unwraps the API response and sends an authenticated GET with the supplied signal', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: adminMetricsOverview, message: 'OK' }),
    );
    const controller = new AbortController();

    expect(await adminMetricsService.getOverview(controller.signal)).toEqual(adminMetricsOverview);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/admin/metrics/overview');
    expect(init?.method).toBe('GET');
    expect(init?.signal).toBe(controller.signal);
    expect(init?.body).toBeUndefined();
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer metrics-token');
    expect(headers.get('X-User-Id')).toBeNull();
  });

  it('accepts zero metrics and an envelope without a success message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: zeroAdminMetricsOverview }));
    expect(await adminMetricsService.getOverview()).toEqual(zeroAdminMetricsOverview);
  });

  it('accepts six consecutive months across a year boundary', async () => {
    const data = {
      ...zeroAdminMetricsOverview,
      activeStudentsByMonth: ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'].map(
        (month) => ({ month, activeStudents: 0 }),
      ),
    };
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data, extraMetadata: true }));
    expect(await adminMetricsService.getOverview()).toEqual(data);
  });

  it.each([
    ['an empty series', []],
    ['a shorter series', adminMetricsOverview.activeStudentsByMonth.slice(1)],
    [
      'a longer series',
      [{ month: '2026-05', activeStudents: 8000 }, ...adminMetricsOverview.activeStudentsByMonth],
    ],
    ['months out of order', [...adminMetricsOverview.activeStudentsByMonth].reverse()],
  ])('keeps the counters available with %s', async (_name, activeStudentsByMonth) => {
    const data = { ...adminMetricsOverview, activeStudentsByMonth };
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data }));
    expect(await adminMetricsService.getOverview()).toEqual(data);
  });

  it('reports network failures with status zero and a connection message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 0,
      message: 'Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente.',
    });
  });

  it('keeps the API error message for diagnosis without showing it', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Access denied: user is not ADMIN' }, 403));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 403,
      message: fallback,
      serverMessage: 'Access denied: user is not ADMIN',
    });
  });

  it.each([{}, { message: '' }, { message: '   ' }, { message: 42 }])(
    'has no server message for an HTTP error with no usable message: %j',
    async (body) => {
      fetchMock.mockResolvedValue(jsonResponse(body, 503));
      await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
        status: 503,
        message: fallback,
        serverMessage: null,
      });
    },
  );

  it('handles a non-JSON HTTP error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Unavailable</html>', { status: 502 }));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      status: 502,
      message: fallback,
      serverMessage: null,
    });
  });

  it('keeps the global unauthorized handler active', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Missing token' }, 401));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports invalid JSON as a response error rather than a network failure', async () => {
    fetchMock.mockResolvedValue(new Response('not JSON', { status: 200 }));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      status: 200,
      message: invalidResponse,
    });
  });

  it.each([
    ['null envelope', null],
    ['missing payload', { success: true }],
    ['null payload', { success: true, data: null }],
    ['unsuccessful envelope', { success: false, data: adminMetricsOverview }],
    ['missing success flag', { data: adminMetricsOverview }],
  ])('rejects a %s', async (_name, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      status: 200,
      message: invalidResponse,
    });
  });

  it.each([
    ['string count', { activeStudents: '12847' }],
    ['negative count', { activeStudents: -1 }],
    ['fractional count', { partnerCompanies: 1.5 }],
    ['unsafe count', { partnerCompanies: Number.MAX_SAFE_INTEGER + 1 }],
    ['string rate', { averageCompletionRate: '68.00' }],
    ['negative rate', { averageCompletionRate: -1 }],
    ['rate above 100', { averageCompletionRate: 101 }],
    ['null rate', { averageCompletionRate: null }],
    ['non-array series', { activeStudentsByMonth: {} }],
    [
      'null month item',
      { activeStudentsByMonth: [null, ...adminMetricsOverview.activeStudentsByMonth.slice(1)] },
    ],
    [
      'invalid month',
      {
        activeStudentsByMonth: [
          { month: '2026-13', activeStudents: 0 },
          ...adminMetricsOverview.activeStudentsByMonth.slice(1),
        ],
      },
    ],
    [
      'invalid monthly count',
      {
        activeStudentsByMonth: [
          { month: '2026-06', activeStudents: -1 },
          ...adminMetricsOverview.activeStudentsByMonth.slice(1),
        ],
      },
    ],
    ['infinite student change', { activeStudentsChange: Number.POSITIVE_INFINITY }],
    ['string company change', { partnerCompaniesChange: '7' }],
    ['missing company ranking', { topEngagedCompanies: null }],
    [
      'company without a name',
      { topEngagedCompanies: [{ companyId: 'company-1', enrollments: 1 }] },
    ],
    [
      'negative company enrollments',
      { topEngagedCompanies: [{ companyId: 'company-1', name: 'Euro Trip', enrollments: -1 }] },
    ],
  ])('rejects a payload with %s', async (_name, overrides) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: { ...adminMetricsOverview, ...overrides } }),
    );
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 200,
      message: invalidResponse,
    });
  });

  it('propagates AbortError even when no signal was supplied', async () => {
    const error = new DOMException('Cancelled', 'AbortError');
    fetchMock.mockRejectedValue(error);
    await expect(adminMetricsService.getOverview()).rejects.toBe(error);
  });

  it('propagates a rejection when its signal was aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const reason = new Error('cancelled transport');
    fetchMock.mockRejectedValue(reason);
    await expect(adminMetricsService.getOverview(controller.signal)).rejects.toBe(reason);
  });

  it('preserves cancellation while reading the success body', async () => {
    const response = jsonResponse({ success: true, data: adminMetricsOverview });
    const error = new DOMException('Cancelled', 'AbortError');
    vi.spyOn(response, 'json').mockRejectedValue(error);
    fetchMock.mockResolvedValue(response);
    await expect(adminMetricsService.getOverview()).rejects.toBe(error);
  });
});

const courseMetrics: AdminCourseMetrics = {
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

const emptyCourseMetrics: AdminCourseMetrics = {
  mostAccessedCourse: null,
  topCourses: [],
  categoriesCount: 0,
  enrollmentsByCategory: [],
};

const courseFallback = 'Não foi possível carregar os indicadores de cursos. Tente novamente.';
const courseInvalidResponse =
  'Não foi possível carregar os indicadores de cursos. O servidor retornou uma resposta inválida.';

describe('adminMetricsService.getCourseMetrics', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('access_token', 'admin-jwt-token');
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends an authenticated GET with the supplied signal and unwraps the API response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: courseMetrics, message: 'Operation completed' }),
    );
    const controller = new AbortController();

    expect(await adminMetricsService.getCourseMetrics(controller.signal)).toEqual(courseMetrics);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/admin/metrics/courses');
    expect(init?.method).toBe('GET');
    expect(init?.signal).toBe(controller.signal);
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer admin-jwt-token');
  });

  it('accepts the empty payload of a platform without eligible enrollments', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: emptyCourseMetrics }));
    expect(await adminMetricsService.getCourseMetrics()).toEqual(emptyCourseMetrics);
  });

  it('reports network failures with status zero and a connection message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(adminMetricsService.getCourseMetrics()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 0,
      message:
        'Não foi possível carregar os indicadores de cursos. Verifique sua conexão e tente novamente.',
    });
  });

  it('keeps the API error message for diagnosis without showing it', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Access denied: user is not ADMIN' }, 403));
    await expect(adminMetricsService.getCourseMetrics()).rejects.toMatchObject({
      status: 403,
      message: courseFallback,
      serverMessage: 'Access denied: user is not ADMIN',
    });
  });

  it('handles a non-JSON HTTP error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 502 }));
    await expect(adminMetricsService.getCourseMetrics()).rejects.toMatchObject({
      status: 502,
      message: courseFallback,
      serverMessage: null,
    });
  });

  it('propagates AbortError without wrapping it', async () => {
    const error = new DOMException('Cancelled', 'AbortError');
    fetchMock.mockRejectedValue(error);
    await expect(adminMetricsService.getCourseMetrics()).rejects.toBe(error);
  });

  it.each([
    ['unsuccessful envelope', { success: false, data: courseMetrics }],
    ['null payload', { success: true, data: null }],
    ['null ranking', { success: true, data: { ...courseMetrics, topCourses: null } }],
    [
      'missing distribution',
      { success: true, data: { ...courseMetrics, enrollmentsByCategory: undefined } },
    ],
    ['string category count', { success: true, data: { ...courseMetrics, categoriesCount: '2' } }],
    [
      'ranking item without enrollments',
      {
        success: true,
        data: { ...courseMetrics, topCourses: [{ courseId: 'x', title: 'Curso' }] },
      },
    ],
    [
      'invalid leader',
      { success: true, data: { ...courseMetrics, mostAccessedCourse: { title: 'Curso' } } },
    ],
    [
      'category without percentage',
      {
        success: true,
        data: { ...courseMetrics, enrollmentsByCategory: [{ category: 'Hospitalidade' }] },
      },
    ],
  ])('rejects a response with %s instead of breaking the page', async (_name, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(adminMetricsService.getCourseMetrics()).rejects.toMatchObject({
      status: 200,
      message: courseInvalidResponse,
    });
  });
});
