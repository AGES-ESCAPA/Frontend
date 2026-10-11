import { useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { CourseSummary } from '@/types/course';
import { mapPublicCourseDetailsToSummary } from '@utils/mapPublicCourse';
import type { LoadStatus } from './usePublicCourses';

export interface UsePublicCourseDetailsResult {
  course: CourseSummary | null;
  status: LoadStatus;
  errorMessage: string | null;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const usePublicCourseDetails = (courseId: string): UsePublicCourseDetailsResult => {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setStatus('error');
      setErrorMessage('Curso não encontrado.');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage(null);

    void courseService
      .getPublicCourseById(courseId, controller.signal)
      .then((details) => {
        setCourse(mapPublicCourseDetailsToSummary(details));
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error, controller.signal)) return;
        setCourse(null);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar os dados do curso.',
        );
      });

    return () => controller.abort();
  }, [courseId]);

  return { course, status, errorMessage };
};
