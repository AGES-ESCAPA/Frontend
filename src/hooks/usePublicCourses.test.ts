import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseCard, PublicCoursesPage } from '@/types/course';
import { usePublicCourses } from './usePublicCourses';

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourses: vi.fn(),
  },
}));

const getCoursesMock = vi.mocked(courseService.getCourses);

const course: PublicCourseCard = {
  id: 'course-1',
  title: 'IA Aplicada ao Turismo',
  shortDescription: 'Domine as ferramentas de IA',
  category: 'Inteligência Artificial',
  level: 'Iniciante',
  durationTime: 12,
  lessonsCount: 32,
  price: 97,
  thumbnailUrl: 'https://cdn.escapa.com.br/thumb.jpg',
  instructor: 'Dra. Mariana',
  ratingAverage: 4.8,
  reviewsCount: 56,
};

const page: PublicCoursesPage = {
  content: [course],
  pageNumber: 0,
  pageSize: 1,
  totalElements: 1,
  totalPages: 1,
};

describe('usePublicCourses', () => {
  beforeEach(() => {
    getCoursesMock.mockReset();
  });

  it('should load featured and catalog courses from the service', async () => {
    getCoursesMock.mockResolvedValue(page);

    const { result } = renderHook(() => usePublicCourses({}));

    await waitFor(() => expect(result.current.catalogStatus).toBe('success'));

    expect(result.current.featured).toEqual([course]);
    expect(result.current.catalog).toEqual([course]);
    expect(result.current.totalElements).toBe(1);
    expect(getCoursesMock).toHaveBeenCalledWith(
      expect.objectContaining({ size: 3 }),
      expect.any(AbortSignal),
    );
    expect(getCoursesMock).toHaveBeenCalledWith(
      expect.objectContaining({ size: 100 }),
      expect.any(AbortSignal),
    );
  });

  it('should send catalog filters to the public courses route', async () => {
    getCoursesMock.mockResolvedValue({ ...page, content: [] });

    renderHook(() =>
      usePublicCourses({
        title: 'IA',
        category: 'Inteligência Artificial',
        level: 'Iniciante',
      }),
    );

    await waitFor(() =>
      expect(getCoursesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'IA',
          category: 'Inteligência Artificial',
          level: 'Iniciante',
        }),
        expect.any(AbortSignal),
      ),
    );
  });

  it('should expose an error state and allow retry', async () => {
    getCoursesMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => usePublicCourses({}));

    await waitFor(() => expect(result.current.catalogStatus).toBe('error'));
    expect(result.current.featuredStatus).toBe('error');

    getCoursesMock.mockResolvedValue(page);

    await act(async () => {
      result.current.reloadAll();
    });

    await waitFor(() => expect(result.current.catalogStatus).toBe('success'));
    expect(result.current.featuredStatus).toBe('success');
  });
});
