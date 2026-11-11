import { useCallback, useEffect, useState } from 'react';
import { getCompanyCourses } from '@services/companyCourseService';
import type { CompanyCourse } from '@/types/course';
import type { LoadStatus } from './usePublicCourses';

export interface UseCompanyCoursesResult {
  courses: CompanyCourse[];
  status: LoadStatus;
  reload: () => void;
}

/** Cursos comprados pela empresa. Com `enabled` falso (aluno, admin) não chama a API. */
export const useCompanyCourses = (enabled: boolean): UseCompanyCoursesResult => {
  const [courses, setCourses] = useState<CompanyCourse[]>([]);
  const [status, setStatus] = useState<LoadStatus>(enabled ? 'loading' : 'success');

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setStatus('loading');

    try {
      const data = await getCompanyCourses();
      if (isCancelled()) return;
      setCourses(data);
      setStatus('success');
    } catch {
      if (isCancelled()) return;
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    void load(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { courses, status, reload };
};
