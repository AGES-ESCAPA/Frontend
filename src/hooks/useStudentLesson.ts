import { useCallback, useEffect, useState } from 'react';
import type { Lesson } from '@/types/lesson';
import { getStudentLesson, StudentLessonError } from '@services/lessonService';
import type { LoadStatus } from './usePublicCourses';

export type StudentLessonErrorStatus = 403 | 404 | null;

export interface UseStudentLessonResult {
  lesson: Lesson | null;
  status: LoadStatus;
  errorStatus: StudentLessonErrorStatus;
  errorMessage: string | null;
  retry: () => void;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const useStudentLesson = (courseId: string, lessonId: string): UseStudentLessonResult => {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const [status, setStatus] = useState<LoadStatus>('loading');

  const [errorStatus, setErrorStatus] = useState<StudentLessonErrorStatus>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const loadLesson = useCallback(
    async (signal?: AbortSignal) => {
      setLesson(null);
      setStatus('loading');
      setErrorStatus(null);
      setErrorMessage(null);

      try {
        const loadedLesson = await getStudentLesson(courseId, lessonId, signal);

        setLesson(loadedLesson);
        setStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;

        setLesson(null);
        setStatus('error');

        if (error instanceof StudentLessonError) {
          if (error.status === 403) {
            setErrorStatus(403);
          } else if (error.status === 404) {
            setErrorStatus(404);
          }

          setErrorMessage(error.message);
          return;
        }

        setErrorStatus(null);
        setErrorMessage('Não foi possível carregar a aula. Tente novamente.');
      }
    },
    [courseId, lessonId],
  );

  useEffect(() => {
    if (!courseId || !lessonId) {
      setLesson(null);
      setStatus('error');
      setErrorStatus(404);
      setErrorMessage('Aula não encontrada.');

      return undefined;
    }

    const controller = new AbortController();

    void loadLesson(controller.signal);

    return () => controller.abort();
  }, [loadLesson, reloadKey, courseId, lessonId]);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return {
    lesson,
    status,
    errorStatus,
    errorMessage,
    retry,
  };
};
