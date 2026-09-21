import { useCallback, useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { AdminCourseListItem, AdminCourseRow } from '@/types/course';
import { formatCourseVersion, toCourseCode } from '@utils/formatters';
import type { LoadStatus } from './usePublicCourses';

export interface UseAdminCoursesResult {
  courses: AdminCourseRow[];
  status: LoadStatus;
  errorMessage: string | null;
  reload: () => void;
  archiveCourse: (courseId: string) => Promise<void>;
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

const toRow = (item: AdminCourseListItem): AdminCourseRow => ({
  id: item.id,
  code: toCourseCode(item.title),
  title: item.title,
  price: item.price ?? 0,
  status: item.status,
  version: formatCourseVersion(item.majorVersion, item.minorVersion),
});

export const useAdminCourses = (): UseAdminCoursesResult => {
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const items = await courseService.listAdminCourses(signal);
      setCourses(items.map(toRow));
      setStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      setCourses([]);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível carregar os cursos.',
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  const archiveCourse = useCallback(async (courseId: string) => {
    await courseService.archiveCourse(courseId);
    setCourses((current) => current.filter((course) => course.id !== courseId));
  }, []);

  return { courses, status, errorMessage, reload, archiveCourse };
};
