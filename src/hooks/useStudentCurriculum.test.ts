import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentCurriculum } from '@/types/curriculum';
import { getStudentCurriculum, StudentCurriculumError } from '@services/curriculumService';
import { useStudentCurriculum } from './useStudentCurriculum';

vi.mock('@services/curriculumService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getStudentCurriculum: vi.fn(),
}));

const getStudentCurriculumMock = vi.mocked(getStudentCurriculum);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const OTHER_COURSE_ID = 'e0000000-0000-4000-e000-000000000006';

const curriculum: StudentCurriculum = {
  courseId: COURSE_ID,
  completedLessons: 1,
  totalLessons: 2,
  modules: [
    {
      id: '01000000-0000-4000-9000-000000000018',
      title: 'Módulo 1',
      locked: false,
      completedLessons: 1,
      totalLessons: 2,
      lessons: [
        {
          id: '02000000-0000-4000-9000-000000000182',
          title: 'Introdução ao curso',
          durationMinutes: 10,
          status: 'COMPLETED',
        },
        {
          id: '02000000-0000-4000-9000-000000000183',
          title: 'Mapeando a jornada do hóspede',
          durationMinutes: 12,
          status: 'AVAILABLE',
        },
      ],
    },
  ],
};

const completedCurriculum: StudentCurriculum = {
  ...curriculum,
  completedLessons: 2,
  modules: [
    {
      ...curriculum.modules[0],
      completedLessons: 2,
      lessons: curriculum.modules[0].lessons.map((lesson) => ({
        ...lesson,
        status: 'COMPLETED',
      })),
    },
  ],
};

describe('useStudentCurriculum', () => {
  beforeEach(() => {
    getStudentCurriculumMock.mockReset();
  });

  it('should load the curriculum of the course', async () => {
    getStudentCurriculumMock.mockResolvedValue(curriculum);

    const { result } = renderHook(() => useStudentCurriculum(COURSE_ID));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(curriculum);

    expect(result.current.error).toBeNull();

    expect(getStudentCurriculumMock).toHaveBeenCalledWith(COURSE_ID, expect.any(AbortSignal));
  });

  it('should expose the HTTP status when the API answers with an error', async () => {
    getStudentCurriculumMock.mockRejectedValue(
      new StudentCurriculumError(500, 'Internal Server Error'),
    );

    const { result } = renderHook(() => useStudentCurriculum(COURSE_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();

    expect(result.current.error).toEqual({ status: 500, message: 'Internal Server Error' });
  });

  it('should expose a network error without status', async () => {
    getStudentCurriculumMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useStudentCurriculum(COURSE_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toEqual({
      status: null,
      message: 'Não foi possível carregar o conteúdo do curso.',
    });
  });

  it('should update statuses and counters on refetch, keeping the current data meanwhile', async () => {
    getStudentCurriculumMock.mockResolvedValueOnce(curriculum);

    const { result } = renderHook(() => useStudentCurriculum(COURSE_ID));

    await waitFor(() => expect(result.current.data).toEqual(curriculum));

    let resolveRefetch: (value: StudentCurriculum) => void = () => {};

    getStudentCurriculumMock.mockReturnValueOnce(
      new Promise<StudentCurriculum>((resolve) => {
        resolveRefetch = resolve;
      }),
    );

    act(() => result.current.refetch());

    expect(result.current.isLoading).toBe(true);

    expect(result.current.data).toEqual(curriculum);

    await act(async () => resolveRefetch(completedCurriculum));

    expect(result.current.isLoading).toBe(false);

    expect(result.current.data?.completedLessons).toBe(2);

    expect(result.current.data?.modules[0].lessons[1].status).toBe('COMPLETED');

    expect(getStudentCurriculumMock).toHaveBeenCalledTimes(2);
  });

  it('should recover from an error on refetch', async () => {
    getStudentCurriculumMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(curriculum);

    const { result } = renderHook(() => useStudentCurriculum(COURSE_ID));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.data).toEqual(curriculum));

    expect(result.current.error).toBeNull();
  });

  it('should not request again when re-rendered with the same course', async () => {
    getStudentCurriculumMock.mockResolvedValue(curriculum);

    const { result, rerender } = renderHook(({ courseId }) => useStudentCurriculum(courseId), {
      initialProps: { courseId: COURSE_ID },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ courseId: COURSE_ID });

    expect(getStudentCurriculumMock).toHaveBeenCalledTimes(1);
  });

  it('should load the new curriculum when the course changes', async () => {
    getStudentCurriculumMock.mockResolvedValue(curriculum);

    const { result, rerender } = renderHook(({ courseId }) => useStudentCurriculum(courseId), {
      initialProps: { courseId: COURSE_ID },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ courseId: OTHER_COURSE_ID });

    await waitFor(() =>
      expect(getStudentCurriculumMock).toHaveBeenLastCalledWith(
        OTHER_COURSE_ID,
        expect.any(AbortSignal),
      ),
    );

    expect(getStudentCurriculumMock).toHaveBeenCalledTimes(2);
  });

  it('should not request without a course id', () => {
    const { result } = renderHook(() => useStudentCurriculum(''));

    expect(result.current.isLoading).toBe(false);

    expect(getStudentCurriculumMock).not.toHaveBeenCalled();
  });
});
