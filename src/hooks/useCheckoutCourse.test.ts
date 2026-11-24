import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseRequestError, courseService } from '@services/courseService';
import type * as CourseServiceModule from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';
import { useCheckoutCourse } from './useCheckoutCourse';

vi.mock('@services/courseService', async (importOriginal) => {
  const actual = await importOriginal<typeof CourseServiceModule>();
  return {
    ...actual,
    courseService: {
      getPublicCourseById: vi.fn(),
    },
  };
});

const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);

const details: PublicCourseDetails = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência',
  shortDescription: 'Resumo',
  description: 'Descrição',
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 480,
  price: 249.9,
  deadline: null,
  thumbnailUrl: null,
  teaserVideoUrl: null,
  rating: 4.5,
  reviewsCount: 2,
  studentsCount: 80,
  instructor: {
    id: 'inst-1',
    name: 'Beatriz Nunes',
    headline: 'Especialista',
    bio: null,
    avatarUrl: null,
  },
  learningObjectives: [],
  materials: [],
  modules: [],
};

describe('useCheckoutCourse', () => {
  beforeEach(() => {
    getPublicCourseByIdMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marks not-found when courseId is empty', async () => {
    const { result } = renderHook(() => useCheckoutCourse(''));

    await waitFor(() => expect(result.current.status).toBe('not-found'));
    expect(result.current.course).toBeNull();
    expect(getPublicCourseByIdMock).not.toHaveBeenCalled();
  });

  it('loads course details on success', async () => {
    getPublicCourseByIdMock.mockResolvedValue(details);

    const { result } = renderHook(() => useCheckoutCourse(details.id));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.course).toEqual(details);
    expect(getPublicCourseByIdMock).toHaveBeenCalledWith(details.id, expect.any(AbortSignal));
  });

  it('marks not-found when the API responds 404', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new CourseRequestError('Curso não encontrado.', 404));

    const { result } = renderHook(() => useCheckoutCourse(details.id));

    await waitFor(() => expect(result.current.status).toBe('not-found'));
    expect(result.current.course).toBeNull();
    expect(result.current.errorMessage).toBe('Curso não encontrado.');
  });

  it('exposes error for non-404 failures', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new Error('Falha de rede'));

    const { result } = renderHook(() => useCheckoutCourse(details.id));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Falha de rede');
  });

  it('uses a fallback message for unknown error values', async () => {
    getPublicCourseByIdMock.mockRejectedValue('boom');

    const { result } = renderHook(() => useCheckoutCourse(details.id));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Não foi possível carregar o curso.');
  });

  it('reloads when retry increments the attempt', async () => {
    getPublicCourseByIdMock
      .mockRejectedValueOnce(new Error('Falha'))
      .mockResolvedValueOnce(details);

    const { result } = renderHook(() => useCheckoutCourse(details.id));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getPublicCourseByIdMock).toHaveBeenCalledTimes(2);
  });

  it('aborts the in-flight request on unmount', () => {
    getPublicCourseByIdMock.mockReturnValue(new Promise(() => undefined));

    const { unmount } = renderHook(() => useCheckoutCourse(details.id));
    const signal = getPublicCourseByIdMock.mock.calls[0][1] as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
