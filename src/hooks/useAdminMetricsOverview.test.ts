import { createElement, StrictMode } from 'react';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { adminMetricsService, AdminMetricsServiceError } from '@services/adminMetricsService';
import type * as AdminMetricsServiceModule from '@services/adminMetricsService';
import type { AdminMetricsOverview } from '@/types/adminMetrics';
import { adminMetricsOverview, zeroAdminMetricsOverview } from '@/test/adminMetricsFixtures';
import { useAdminMetricsOverview } from './useAdminMetricsOverview';

vi.mock('@services/adminMetricsService', async (importOriginal) => ({
  ...(await importOriginal<typeof AdminMetricsServiceModule>()),
  adminMetricsService: { getOverview: vi.fn() },
}));

const getOverviewMock = vi.mocked(adminMetricsService.getOverview);
const fallback = 'Não foi possível carregar os indicadores. Tente novamente.';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('useAdminMetricsOverview', () => {
  beforeEach(() => {
    getOverviewMock.mockReset();
  });

  it('starts loading with null data and an AbortSignal', () => {
    getOverviewMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAdminMetricsOverview());
    expect(result.current).toMatchObject({ status: 'loading', data: null, errorMessage: null });
    expect(getOverviewMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it.each([adminMetricsOverview, zeroAdminMetricsOverview])(
    'publishes a successful overview with activeStudents=$activeStudents',
    async (data) => {
      getOverviewMock.mockResolvedValue(data);
      const { result } = renderHook(() => useAdminMetricsOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(result.current.data).toEqual(data);
      expect(result.current.errorMessage).toBeNull();
    },
  );

  it.each([
    [new AdminMetricsServiceError(0, 'Verifique sua conexão.'), 'Verifique sua conexão.'],
    [
      new AdminMetricsServiceError(401, 'Missing token'),
      'Sua sessão expirou. Entre novamente para consultar os indicadores.',
    ],
    [
      new AdminMetricsServiceError(403, 'Access denied'),
      'Você não tem permissão para consultar os indicadores.',
    ],
    [new AdminMetricsServiceError(503, 'Internal error'), fallback],
    [new AdminMetricsServiceError(200, 'Resposta inválida.'), 'Resposta inválida.'],
    [new AdminMetricsServiceError(400, '   '), fallback],
    [new Error('Technical error'), fallback],
    ['unknown rejection', fallback],
  ])('exposes a comprehensible error for %s', async (error, expected) => {
    getOverviewMock.mockRejectedValue(error);
    const { result } = renderHook(() => useAdminMetricsOverview());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeNull();
    expect(result.current.errorMessage).toBe(expected);
  });

  it('retries with a new signal, clears the error and recovers', async () => {
    const retry = deferred<AdminMetricsOverview>();
    getOverviewMock
      .mockRejectedValueOnce(new AdminMetricsServiceError(0, 'Sem conexão.'))
      .mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useAdminMetricsOverview());
    await waitFor(() => expect(result.current.status).toBe('error'));
    const initialSignal = getOverviewMock.mock.calls[0][0];
    const reload = result.current.reload;
    act(() => result.current.reload());
    const retrySignal = getOverviewMock.mock.calls[1][0];
    expect(initialSignal?.aborted).toBe(true);
    expect(retrySignal).toBeInstanceOf(AbortSignal);
    expect(retrySignal).not.toBe(initialSignal);
    expect(retrySignal?.aborted).toBe(false);
    expect(result.current).toMatchObject({ status: 'loading', data: null, errorMessage: null });
    await act(async () => retry.resolve(adminMetricsOverview));
    expect(result.current).toMatchObject({
      status: 'success',
      data: adminMetricsOverview,
      errorMessage: null,
    });
    expect(result.current.reload).toBe(reload);
  });

  it('clears previous values while reloading and aborts the retry on unmount', async () => {
    getOverviewMock
      .mockResolvedValueOnce(adminMetricsOverview)
      .mockReturnValueOnce(new Promise(() => {}));
    const { result, unmount } = renderHook(() => useAdminMetricsOverview());
    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => result.current.reload());
    expect(result.current).toMatchObject({ status: 'loading', data: null, errorMessage: null });
    const signal = getOverviewMock.mock.calls[1][0];
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('aborts the initial request on unmount', () => {
    getOverviewMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useAdminMetricsOverview());
    const signal = getOverviewMock.mock.calls[0][0];
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores an obsolete request that later %ss after the retry succeeds',
    async (settlement) => {
      const oldRequest = deferred<AdminMetricsOverview>();
      getOverviewMock
        .mockReturnValueOnce(oldRequest.promise)
        .mockResolvedValueOnce(zeroAdminMetricsOverview);
      const { result } = renderHook(() => useAdminMetricsOverview());
      const oldSignal = getOverviewMock.mock.calls[0][0];
      act(() => result.current.reload());
      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(oldSignal?.aborted).toBe(true);
      await act(async () => {
        if (settlement === 'resolve') oldRequest.resolve(adminMetricsOverview);
        else oldRequest.reject(new Error('Late error'));
      });
      expect(result.current).toMatchObject({
        status: 'success',
        data: zeroAdminMetricsOverview,
        errorMessage: null,
      });
    },
  );

  it('ignores an AbortError rather than showing a failure', async () => {
    getOverviewMock.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    const { result } = renderHook(() => useAdminMetricsOverview());
    await act(async () => {});
    expect(result.current).toMatchObject({ status: 'loading', data: null, errorMessage: null });
  });

  it('restarts the cancelled effect in StrictMode', async () => {
    getOverviewMock.mockResolvedValue(adminMetricsOverview);
    const { result } = renderHook(() => useAdminMetricsOverview(), {
      wrapper: ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children),
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getOverviewMock).toHaveBeenCalledTimes(2);
    expect(getOverviewMock.mock.calls[0][0]?.aborted).toBe(true);
    expect(getOverviewMock.mock.calls[1][0]?.aborted).toBe(false);
    expect(result.current.data).toEqual(adminMetricsOverview);
  });
});
