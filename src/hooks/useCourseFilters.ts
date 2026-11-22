import { useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { PublicCourseFilters } from '@/types/course';

const EMPTY_FILTERS: PublicCourseFilters = { categories: [], levels: [] };
const FILTERS_POLL_INTERVAL_MS = 60_000;

export const useCourseFilters = (): PublicCourseFilters => {
  const [filters, setFilters] = useState<PublicCourseFilters>(EMPTY_FILTERS);

  useEffect(() => {
    let controller = new AbortController();

    const load = () => {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;

      courseService
        .getCourseFilters(signal)
        .then((result) => {
          if (!signal.aborted) setFilters(result);
        })
        .catch(() => {
          if (!signal.aborted) setFilters((current) => current);
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, FILTERS_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, []);

  return filters;
};
