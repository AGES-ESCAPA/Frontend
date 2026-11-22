import { useCallback, useEffect, useState } from 'react';
import { courseService } from '@services/courseService';
import type { PublicCourseCard, PublicCoursesQuery } from '@/types/course';

export type LoadStatus = 'loading' | 'success' | 'error';

export interface CatalogFilters {
  title?: string;
  category?: string;
  level?: string;
}

export interface UsePublicCoursesResult {
  featured: PublicCourseCard[];
  featuredStatus: LoadStatus;
  catalog: PublicCourseCard[];
  catalogStatus: LoadStatus;
  totalElements: number;
  reloadFeatured: () => void;
  reloadCatalog: () => void;
  reloadAll: () => void;
}

const FEATURED_SIZE = 3;
const CATALOG_SIZE = 100;
/** Mantém destaques e catálogo alinhados a publicações/arquivamentos sem F5. */
const CATALOG_POLL_INTERVAL_MS = 60_000;

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const usePublicCourses = (filters: CatalogFilters): UsePublicCoursesResult => {
  const [featured, setFeatured] = useState<PublicCourseCard[]>([]);
  const [featuredStatus, setFeaturedStatus] = useState<LoadStatus>('loading');
  const [catalog, setCatalog] = useState<PublicCourseCard[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>('loading');

  const loadFeatured = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!silent) setFeaturedStatus('loading');

    try {
      const page = await courseService.getCourses(
        { featured: true, page: 0, size: FEATURED_SIZE },
        signal,
      );
      if (signal?.aborted) return;
      setFeatured(page.content);
      setFeaturedStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      if (!silent) setFeaturedStatus('error');
    }
  }, []);

  const loadCatalog = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) setCatalogStatus('loading');

      const query: PublicCoursesQuery = {
        title: filters.title,
        category: filters.category,
        level: filters.level,
        page: 0,
        size: CATALOG_SIZE,
      };

      try {
        const page = await courseService.getCourses(query, signal);
        if (signal?.aborted) return;
        setCatalog(page.content);
        setTotalElements(page.totalElements);
        setCatalogStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;
        if (!silent) setCatalogStatus('error');
      }
    },
    [filters.category, filters.level, filters.title],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadFeatured(controller.signal);
    return () => controller.abort();
  }, [loadFeatured]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCatalog(controller.signal);
    return () => controller.abort();
  }, [loadCatalog]);

  // Atualiza em segundo plano para qualquer visitante com a página aberta.
  useEffect(() => {
    const refreshInBackground = () => {
      void loadFeatured(undefined, true);
      void loadCatalog(undefined, true);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshInBackground();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshInBackground();
    }, CATALOG_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [loadCatalog, loadFeatured]);

  const reloadFeatured = useCallback(() => {
    void loadFeatured();
  }, [loadFeatured]);

  const reloadCatalog = useCallback(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const reloadAll = useCallback(() => {
    void loadFeatured();
    void loadCatalog();
  }, [loadCatalog, loadFeatured]);

  return {
    featured,
    featuredStatus,
    catalog,
    catalogStatus,
    totalElements,
    reloadFeatured,
    reloadCatalog,
    reloadAll,
  };
};
