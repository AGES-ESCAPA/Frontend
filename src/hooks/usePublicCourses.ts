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

const isAbortError = (error: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const usePublicCourses = (filters: CatalogFilters): UsePublicCoursesResult => {
  const [featured, setFeatured] = useState<PublicCourseCard[]>([]);
  const [featuredStatus, setFeaturedStatus] = useState<LoadStatus>('loading');
  const [catalog, setCatalog] = useState<PublicCourseCard[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>('loading');

  const loadFeatured = useCallback(async (signal?: AbortSignal) => {
    setFeaturedStatus('loading');

    try {
      const page = await courseService.getCourses({ page: 0, size: FEATURED_SIZE }, signal);
      setFeatured(page.content);
      setFeaturedStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      setFeaturedStatus('error');
    }
  }, []);

  const loadCatalog = useCallback(
    async (signal?: AbortSignal) => {
      setCatalogStatus('loading');

      const query: PublicCoursesQuery = {
        title: filters.title,
        category: filters.category,
        level: filters.level,
        page: 0,
        size: CATALOG_SIZE,
      };

      try {
        const page = await courseService.getCourses(query, signal);
        setCatalog(page.content);
        setTotalElements(page.totalElements);
        setCatalogStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;
        setCatalogStatus('error');
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
