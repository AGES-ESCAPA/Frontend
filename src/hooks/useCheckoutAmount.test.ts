import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';
import { useCheckoutAmount } from './useCheckoutAmount';

vi.mock('@services/courseService', () => ({
  courseService: {
    getPublicCourseById: vi.fn(),
  },
}));

const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000004';

const buildDetails = (price: number | null): PublicCourseDetails => ({
  id: COURSE_ID,
  title: 'Hospitalidade de Luxo',
  shortDescription: null,
  description: null,
  category: null,
  level: null,
  durationTime: null,
  price,
  deadline: null,
  thumbnailUrl: null,
  teaserVideoUrl: null,
  rating: null,
  reviewsCount: null,
  studentsCount: null,
  instructor: null,
  learningObjectives: null,
  materials: null,
  modules: null,
});

describe('useCheckoutAmount', () => {
  beforeEach(() => {
    getPublicCourseByIdMock.mockReset();
  });

  it('should start loading and expose the course price once it is fetched', async () => {
    getPublicCourseByIdMock.mockResolvedValue(buildDetails(167));

    const { result } = renderHook(() => useCheckoutAmount(COURSE_ID));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.amount).toBe(167);
    expect(result.current.courseTitle).toBe('Hospitalidade de Luxo');
    expect(getPublicCourseByIdMock).toHaveBeenCalledWith(COURSE_ID, expect.any(AbortSignal));
  });

  it('should treat a course without a price as free', async () => {
    getPublicCourseByIdMock.mockResolvedValue(buildDetails(null));

    const { result } = renderHook(() => useCheckoutAmount(COURSE_ID));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.amount).toBe(0);
  });

  it('should expose the API error message when the request fails', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new Error('Course not found'));

    const { result } = renderHook(() => useCheckoutAmount(COURSE_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.amount).toBeNull();
    expect(result.current.errorMessage).toBe('Course not found');
  });

  it('should report an error without calling the API when there is no course id', async () => {
    const { result } = renderHook(() => useCheckoutAmount(''));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Curso não encontrado.');
    expect(getPublicCourseByIdMock).not.toHaveBeenCalled();
  });
});
