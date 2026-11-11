import { setUnauthorizedHandler } from '@services/api';
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

  it('reports network failures with status zero and a connection message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 0,
      message: 'Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente.',
    });
  });

  it('preserves the HTTP status and API error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Access denied: user is not ADMIN' }, 403));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      name: 'AdminMetricsServiceError',
      status: 403,
      message: 'Access denied: user is not ADMIN',
    });
  });

  it.each([{}, { message: '' }, { message: '   ' }, { message: 42 }])(
    'uses a fallback for an HTTP error with no usable message: %j',
    async (body) => {
      fetchMock.mockResolvedValue(jsonResponse(body, 503));
      await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
        status: 503,
        message: fallback,
      });
    },
  );

  it('handles a non-JSON HTTP error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Unavailable</html>', { status: 502 }));
    await expect(adminMetricsService.getOverview()).rejects.toMatchObject({
      status: 502,
      message: fallback,
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
    ['empty series', { activeStudentsByMonth: [] }],
    [
      'incomplete series',
      { activeStudentsByMonth: adminMetricsOverview.activeStudentsByMonth.slice(1) },
    ],
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
      'duplicate month',
      {
        activeStudentsByMonth: [
          adminMetricsOverview.activeStudentsByMonth[1],
          ...adminMetricsOverview.activeStudentsByMonth.slice(1),
        ],
      },
    ],
    [
      'unordered months',
      { activeStudentsByMonth: [...adminMetricsOverview.activeStudentsByMonth].reverse() },
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
