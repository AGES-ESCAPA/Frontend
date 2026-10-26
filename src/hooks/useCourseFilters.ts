import { useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { PublicCourseFilters } from '@/types/course';

const EMPTY_FILTERS: PublicCourseFilters = { categories: [], levels: [] };

export const useCourseFilters = (): PublicCourseFilters => {
  const [filters, setFilters] = useState<PublicCourseFilters>(EMPTY_FILTERS);

  useEffect(() => {
    const controller = new AbortController();

    courseService
      .getCourseFilters(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setFilters(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFilters(EMPTY_FILTERS);
      });

    return () => controller.abort();
  }, []);

  return filters;
};
