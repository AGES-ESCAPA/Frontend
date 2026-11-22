import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson } from '@/types/lesson';
import { getStudentLesson, StudentLessonError } from '@services/lessonService';
import { isAbortError, isNetworkError, isTransientServiceError } from '@services/networkResilience';
import { getCachedResource, resourceCacheKeys, setCachedResource } from '@services/resourceCache';
import { useNetworkRecovery } from '@contexts/useConnectivity';
import type { LoadStatus } from './usePublicCourses';

export type StudentLessonErrorStatus = 403 | 404 | null;

export interface UseStudentLessonResult {
  lesson: Lesson | null;
  status: LoadStatus;
  errorStatus: StudentLessonErrorStatus;
  errorMessage: string | null;
  retry: () => void;
}

const readCache = (courseId: string, lessonId: string): Lesson | null =>
  courseId && lessonId
    ? getCachedResource<Lesson>(resourceCacheKeys.studentLesson(courseId, lessonId))
    : null;

export const useStudentLesson = (courseId: string, lessonId: string): UseStudentLessonResult => {
  const [lesson, setLesson] = useState<Lesson | null>(() => readCache(courseId, lessonId));
  const [status, setStatus] = useState<LoadStatus>(() =>
    readCache(courseId, lessonId) ? 'success' : 'loading',
  );
  const [errorStatus, setErrorStatus] = useState<StudentLessonErrorStatus>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const loadLesson = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) {
        // Só limpa a aula na troca de rota; refetch/retry mantém o conteúdo.
        if (!lessonRef.current) {
          setLesson(null);
          setStatus('loading');
        } else {
          setStatus('loading');
        }
        setErrorStatus(null);
        setErrorMessage(null);
      }

      try {
        const loadedLesson = await getStudentLesson(courseId, lessonId, signal);

        setCachedResource(resourceCacheKeys.studentLesson(courseId, lessonId), loadedLesson);
        setLesson(loadedLesson);
        setStatus('success');
        setErrorStatus(null);
        setErrorMessage(null);
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;

        const hasStale = lessonRef.current !== null;
        const transient =
          isNetworkError(error) ||
          isTransientServiceError(error) ||
          (error instanceof StudentLessonError && (error.status === 0 || error.status >= 500));

        if (hasStale && transient) {
          setStatus('success');
          setErrorStatus(null);
          setErrorMessage(null);
          return;
        }

        setLesson(null);
        setStatus('error');

        if (error instanceof StudentLessonError) {
          if (error.status === 403) {
            setErrorStatus(403);
          } else if (error.status === 400 || error.status === 404) {
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
      lessonRef.current = null;
      setLesson(null);
      setStatus('error');
      setErrorStatus(404);
      setErrorMessage('Aula não encontrada.');

      return undefined;
    }

    const cached = readCache(courseId, lessonId);
    // Atualiza o ref na hora para um erro transitório não reaproveitar a aula anterior.
    lessonRef.current = cached;
    setLesson(cached);
    setErrorStatus(null);
    setErrorMessage(null);
    setStatus(cached ? 'success' : 'loading');

    const controller = new AbortController();
    void loadLesson(controller.signal, Boolean(cached));

    return () => controller.abort();
  }, [loadLesson, reloadKey, courseId, lessonId]);

  useNetworkRecovery(() => {
    if (!courseId || !lessonId) return;
    const controller = new AbortController();
    void loadLesson(controller.signal, true);
  });

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
