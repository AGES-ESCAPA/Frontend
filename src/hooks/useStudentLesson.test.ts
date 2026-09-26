import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lesson } from '@/types/lesson';
import { getStudentLesson, StudentLessonError } from '@services/lessonService';
import { useStudentLesson } from './useStudentLesson';

vi.mock('@services/lessonService', () => ({
  getStudentLesson: vi.fn(),
  StudentLessonError: class StudentLessonError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.name = 'StudentLessonError';
      this.status = status;
    }
  },
}));

const getStudentLessonMock = vi.mocked(getStudentLesson);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const LESSON_ID = '02000000-0000-4000-9000-000000000182';

const lesson: Lesson = {
  id: LESSON_ID,
  moduleId: '01000000-0000-4000-9000-000000000018',
  title: 'Introdução ao curso',
  description: 'Descrição da aula.',
  type: 'video',
  videoUrl: 'https://example.com/aula.mp4',
  durationInSeconds: 600,
  textContent: null,
  fileUrl: null,
  isFreeSample: false,
  resources: [],
  order: 2,
};

describe('useStudentLesson', () => {
  beforeEach(() => {
    getStudentLessonMock.mockReset();
  });

  it('should load the student lesson', async () => {
    getStudentLessonMock.mockResolvedValue(lesson);

    const { result } = renderHook(() => useStudentLesson(COURSE_ID, LESSON_ID));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(getStudentLessonMock).toHaveBeenCalledWith(
      COURSE_ID,
      LESSON_ID,
      expect.any(AbortSignal),
    );

    expect(result.current.lesson).toEqual(lesson);
    expect(result.current.errorStatus).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('should expose the 403 error when access is denied', async () => {
    getStudentLessonMock.mockRejectedValue(
      new StudentLessonError(403, 'Acesso à aula indisponível.'),
    );

    const { result } = renderHook(() => useStudentLesson(COURSE_ID, LESSON_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.lesson).toBeNull();
    expect(result.current.errorStatus).toBe(403);
    expect(result.current.errorMessage).toBe('Acesso à aula indisponível.');
  });

  it('should expose the 404 error when the lesson is not found', async () => {
    getStudentLessonMock.mockRejectedValue(new StudentLessonError(404, 'Aula não encontrada.'));

    const { result } = renderHook(() => useStudentLesson(COURSE_ID, LESSON_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.lesson).toBeNull();
    expect(result.current.errorStatus).toBe(404);
    expect(result.current.errorMessage).toBe('Aula não encontrada.');
  });

  it('should expose a generic error and allow retry after a network failure', async () => {
    getStudentLessonMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(lesson);

    const { result } = renderHook(() => useStudentLesson(COURSE_ID, LESSON_ID));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.lesson).toBeNull();
    expect(result.current.errorStatus).toBeNull();
    expect(result.current.errorMessage).toBe('Não foi possível carregar a aula. Tente novamente.');

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(getStudentLessonMock).toHaveBeenCalledTimes(2);
    expect(result.current.lesson).toEqual(lesson);
    expect(result.current.errorStatus).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });
});
