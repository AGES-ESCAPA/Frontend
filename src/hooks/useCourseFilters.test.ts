import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseFilters } from '@/types/course';
import { useCourseFilters } from './useCourseFilters';

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourseFilters: vi.fn(),
  },
}));

const getCourseFiltersMock = vi.mocked(courseService.getCourseFilters);

const filters: PublicCourseFilters = {
  categories: ['Hospitalidade', 'Marketing'],
  levels: ['Iniciante', 'Avançado'],
};

describe('useCourseFilters', () => {
  beforeEach(() => {
    getCourseFiltersMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads filter options on mount', async () => {
    getCourseFiltersMock.mockResolvedValue(filters);

    const { result } = renderHook(() => useCourseFilters());

    await waitFor(() => expect(result.current).toEqual(filters));
    expect(getCourseFiltersMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('keeps the current filters when the request fails', async () => {
    getCourseFiltersMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useCourseFilters());

    await waitFor(() => expect(getCourseFiltersMock).toHaveBeenCalled());
    expect(result.current).toEqual({ categories: [], levels: [] });
  });

  it('reloads filters when the tab becomes visible again', async () => {
    const updated: PublicCourseFilters = {
      categories: ['Turismo'],
      levels: ['Intermediário'],
    };
    getCourseFiltersMock.mockResolvedValueOnce(filters).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useCourseFilters());
    await waitFor(() => expect(result.current).toEqual(filters));

    getCourseFiltersMock.mockClear();

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(result.current).toEqual(updated));
    expect(getCourseFiltersMock).toHaveBeenCalled();
  });

  it('polls filters on an interval while the tab is visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      getCourseFiltersMock.mockResolvedValue(filters);

      renderHook(() => useCourseFilters());
      await vi.waitFor(() => expect(getCourseFiltersMock).toHaveBeenCalledTimes(1));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_001);
      });

      await vi.waitFor(() => expect(getCourseFiltersMock).toHaveBeenCalledTimes(2));
    } finally {
      vi.useRealTimers();
    }
  });
});
