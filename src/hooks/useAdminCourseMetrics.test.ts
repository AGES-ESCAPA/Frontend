import { act, renderHook, waitFor } from '@testing-library/react';
import { adminMetricsService } from '@services/adminMetricsService';
import type { AdminCourseMetrics } from '@/types/adminMetrics';
import { useAdminCourseMetrics } from './useAdminCourseMetrics';

vi.mock('@services/adminMetricsService', () => ({
  adminMetricsService: {
    getCourseMetrics: vi.fn(),
  },
}));

const MOCK_METRICS: AdminCourseMetrics = {
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

describe('useAdminCourseMetrics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state and resolves with course metrics', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockResolvedValue(MOCK_METRICS);

    const { result } = renderHook(() => useAdminCourseMetrics());

    expect(result.current.status).toBe('loading');
    expect(result.current.metrics).toBeNull();
    expect(result.current.isEmpty).toBe(false);

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.metrics).toEqual(MOCK_METRICS);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isEmpty).toBe(false);
    expect(adminMetricsService.getCourseMetrics).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('marks isEmpty as true when the platform has no eligible enrollments', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockResolvedValue({
      mostAccessedCourse: null,
      topCourses: [],
      categoriesCount: 0,
      enrollmentsByCategory: [],
    });

    const { result } = renderHook(() => useAdminCourseMetrics());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.metrics?.mostAccessedCourse).toBeNull();
  });

  it('exposes the error message and retries when reload is called', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics)
      .mockRejectedValueOnce(new Error('Falha ao conectar ao servidor.'))
      .mockResolvedValueOnce(MOCK_METRICS);

    const { result } = renderHook(() => useAdminCourseMetrics());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Falha ao conectar ao servidor.');
    expect(result.current.metrics).toBeNull();

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.metrics).toEqual(MOCK_METRICS);
    expect(result.current.errorMessage).toBeNull();
    expect(adminMetricsService.getCourseMetrics).toHaveBeenCalledTimes(2);
  });

  it('uses the default fallback message when rejected with a non-Error value', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockRejectedValueOnce('unexpected rejection');

    const { result } = renderHook(() => useAdminCourseMetrics());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Não foi possível carregar as métricas de cursos.');
  });

  it('aborts the in-flight request on unmount and ignores aborted responses', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolvePending!: (value: AdminCourseMetrics) => void;

    vi.mocked(adminMetricsService.getCourseMetrics).mockImplementation((signal) => {
      capturedSignal = signal;
      return new Promise<AdminCourseMetrics>((resolve) => {
        resolvePending = resolve;
      });
    });

    const { unmount } = renderHook(() => useAdminCourseMetrics());

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);

    act(() => {
      resolvePending(MOCK_METRICS);
    });
  });

  it('ignores AbortError rejections without switching to error state', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError'),
    );

    const { result } = renderHook(() => useAdminCourseMetrics());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.errorMessage).toBeNull();
  });
});
