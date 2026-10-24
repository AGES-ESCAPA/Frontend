import { useEffect, useState } from 'react';
import { courseService, CourseRequestError } from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';

type CheckoutStatus = 'loading' | 'success' | 'not-found' | 'error';

export const useCheckoutCourse = (courseId: string) => {
  const [course, setCourse] = useState<PublicCourseDetails | null>(null);
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setStatus('not-found');
      return;
    }

    const controller = new AbortController();

    setStatus('loading');
    setErrorMessage(null);
    setCourse(null);

    void courseService
      .getPublicCourseById(courseId, controller.signal)
      .then((details) => {
        if (controller.signal.aborted) return;

        setCourse(details);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setStatus(
          error instanceof CourseRequestError && error.status === 404 ? 'not-found' : 'error',
        );

        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar o curso.',
        );
      });

    return () => controller.abort();
  }, [courseId, attempt]);

  return {
    course,
    status,
    errorMessage,
    retry: () => setAttempt((value) => value + 1),
  };
};
