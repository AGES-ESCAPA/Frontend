import { useCallback, useEffect, useRef, useState } from 'react';
import { courseService } from '@services/courseService';
import type { PublicCourseCard, PublicCoursesQuery } from '@/types/course';
import { isAbortError } from '@services/networkResilience';
import { getCachedResource, resourceCacheKeys, setCachedResource } from '@services/resourceCache';
import { useNetworkRecovery } from '@contexts/useConnectivity';

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

interface CatalogCachePayload {
  content: PublicCourseCard[];
  totalElements: number;
}

export const usePublicCourses = (filters: CatalogFilters): UsePublicCoursesResult => {
  const [featured, setFeatured] = useState<PublicCourseCard[]>(
    () => getCachedResource<PublicCourseCard[]>(resourceCacheKeys.publicFeatured()) ?? [],
  );
  const [featuredStatus, setFeaturedStatus] = useState<LoadStatus>(() =>
    getCachedResource(resourceCacheKeys.publicFeatured()) ? 'success' : 'loading',
  );
  const [catalog, setCatalog] = useState<PublicCourseCard[]>(
    () =>
      getCachedResource<CatalogCachePayload>(resourceCacheKeys.publicCatalog(filters))?.content ??
      [],
  );
  const [totalElements, setTotalElements] = useState(
    () =>
      getCachedResource<CatalogCachePayload>(resourceCacheKeys.publicCatalog(filters))
        ?.totalElements ?? 0,
  );
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>(() =>
    getCachedResource(resourceCacheKeys.publicCatalog(filters)) ? 'success' : 'loading',
  );

  const featuredRef = useRef(featured);
  const catalogRef = useRef(catalog);
  featuredRef.current = featured;
  catalogRef.current = catalog;

  const loadFeatured = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!silent) setFeaturedStatus('loading');

    try {
      const page = await courseService.getCourses(
        { featured: true, page: 0, size: FEATURED_SIZE },
        signal,
      );
      if (signal?.aborted) return;
      setCachedResource(resourceCacheKeys.publicFeatured(), page.content);
      setFeatured(page.content);
      setFeaturedStatus('success');
    } catch (error: unknown) {
      if (isAbortError(error, signal)) return;
      if (featuredRef.current.length > 0) {
        setFeaturedStatus('success');
        return;
      }
      if (!silent) setFeaturedStatus('error');
    }
  }, []);

  const loadCatalog = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) setCatalogStatus('loading');

      const catalogFilters = {
        title: filters.title,
        category: filters.category,
        level: filters.level,
      };
      const query: PublicCoursesQuery = {
        ...catalogFilters,
        page: 0,
        size: CATALOG_SIZE,
      };

      try {
        const page = await courseService.getCourses(query, signal);
        if (signal?.aborted) return;
        setCachedResource(resourceCacheKeys.publicCatalog(catalogFilters), {
          content: page.content,
          totalElements: page.totalElements,
        });
        setCatalog(page.content);
        setTotalElements(page.totalElements);
        setCatalogStatus('success');
      } catch (error: unknown) {
        if (isAbortError(error, signal)) return;
        if (catalogRef.current.length > 0) {
          setCatalogStatus('success');
          return;
        }
        if (!silent) setCatalogStatus('error');
      }
    },
    [filters.category, filters.level, filters.title],
  );

  useEffect(() => {
    const cached = getCachedResource<PublicCourseCard[]>(resourceCacheKeys.publicFeatured());
    if (cached) {
      setFeatured(cached);
      setFeaturedStatus('success');
    }
    const controller = new AbortController();
    void loadFeatured(controller.signal, Boolean(cached));
    return () => controller.abort();
  }, [loadFeatured]);

  useEffect(() => {
    const catalogFilters = {
      title: filters.title,
      category: filters.category,
      level: filters.level,
    };
    const cached = getCachedResource<CatalogCachePayload>(
      resourceCacheKeys.publicCatalog(catalogFilters),
    );
    if (cached) {
      setCatalog(cached.content);
      setTotalElements(cached.totalElements);
      setCatalogStatus('success');
    } else {
      setCatalog([]);
      setTotalElements(0);
      setCatalogStatus('loading');
    }
    const controller = new AbortController();
    void loadCatalog(controller.signal, Boolean(cached));
    return () => controller.abort();
  }, [loadCatalog, filters.title, filters.category, filters.level]);

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

  useNetworkRecovery(() => {
    void loadFeatured(undefined, true);
    void loadCatalog(undefined, true);
  });

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
