/**
 * Cache de recursos GET (memória + sessionStorage) para mascarar micro-instabilidades
 * e acelerar a volta a telas já visitadas na mesma sessão.
 *
 * Online-first: o cache é um fallback/stale, nunca a fonte da verdade.
 */

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const MEMORY = new Map<string, CacheEntry<unknown>>();
const STORAGE_PREFIX = 'escapa:resource-cache:';
/** 30 minutos — suficiente para a sessão de estudo sem servir dados velhos demais. */
export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

const storageKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

const readSession = <T>(key: string): CacheEntry<T> | null => {
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('data' in parsed) ||
      !('fetchedAt' in parsed) ||
      typeof (parsed as CacheEntry<T>).fetchedAt !== 'number'
    ) {
      return null;
    }
    return parsed as CacheEntry<T>;
  } catch {
    return null;
  }
};

const writeSession = <T>(key: string, entry: CacheEntry<T>): void => {
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Quota ou modo privado — a memória ainda cobre a aba atual.
  }
};

const isFresh = (fetchedAt: number, maxAgeMs: number): boolean =>
  maxAgeMs > 0 && Date.now() - fetchedAt <= maxAgeMs;

export const getCachedResource = <T>(
  key: string,
  maxAgeMs: number = DEFAULT_CACHE_TTL_MS,
): T | null => {
  const memoryEntry = MEMORY.get(key) as CacheEntry<T> | undefined;
  if (memoryEntry && isFresh(memoryEntry.fetchedAt, maxAgeMs)) {
    return memoryEntry.data;
  }

  const sessionEntry = readSession<T>(key);
  if (sessionEntry && isFresh(sessionEntry.fetchedAt, maxAgeMs)) {
    MEMORY.set(key, sessionEntry);
    return sessionEntry.data;
  }

  return null;
};

export const setCachedResource = <T>(key: string, data: T): void => {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now() };
  MEMORY.set(key, entry);
  writeSession(key, entry);
};

export const clearCachedResource = (key: string): void => {
  MEMORY.delete(key);
  try {
    sessionStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
};

/** Remove todo o cache da sessão (ex.: logout). */
export const clearResourceCache = (): void => {
  MEMORY.clear();
  try {
    const toRemove: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
};

export const resourceCacheKeys = {
  studentCurriculum: (courseId: string) => `student:curriculum:${courseId}`,
  studentLesson: (courseId: string, lessonId: string) => `student:lesson:${courseId}:${lessonId}`,
  publicFeatured: () => 'public:courses:featured',
  publicCatalog: (filters: { title?: string; category?: string; level?: string }) =>
    `public:courses:catalog:${filters.title ?? ''}|${filters.category ?? ''}|${filters.level ?? ''}`,
  studentEnrollments: (params: { query?: string; status?: string; page?: number; size?: number }) =>
    `student:enrollments:${params.query ?? ''}|${params.status ?? ''}|${params.page ?? 0}|${params.size ?? 10}`,
};
