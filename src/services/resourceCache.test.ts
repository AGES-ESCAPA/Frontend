import { afterEach, describe, expect, it } from 'vitest';
import {
  clearCachedResource,
  clearResourceCache,
  DEFAULT_CACHE_TTL_MS,
  getCachedResource,
  resourceCacheKeys,
  setCachedResource,
} from './resourceCache';

describe('resourceCache', () => {
  afterEach(() => {
    clearResourceCache();
    sessionStorage.clear();
  });

  it('stores and reads a resource from memory and sessionStorage', () => {
    const key = resourceCacheKeys.studentCurriculum('course-1');
    setCachedResource(key, { courseId: 'course-1', modules: [] });

    expect(getCachedResource(key)).toEqual({ courseId: 'course-1', modules: [] });
    expect(sessionStorage.getItem(`escapa:resource-cache:${key}`)).toContain('course-1');
  });

  it('returns null for expired entries', () => {
    const key = resourceCacheKeys.publicFeatured();
    setCachedResource(key, [{ id: '1' }]);

    expect(getCachedResource(key, 0)).toBeNull();
  });

  it('clears all cached resources', () => {
    setCachedResource(resourceCacheKeys.publicFeatured(), []);
    setCachedResource(resourceCacheKeys.studentLesson('c', 'l'), { id: 'l' });

    clearResourceCache();

    expect(getCachedResource(resourceCacheKeys.publicFeatured())).toBeNull();
    expect(getCachedResource(resourceCacheKeys.studentLesson('c', 'l'))).toBeNull();
  });

  it('removes a single cached entry', () => {
    const key = resourceCacheKeys.studentCurriculum('course-2');
    setCachedResource(key, { courseId: 'course-2' });

    clearCachedResource(key);

    expect(getCachedResource(key)).toBeNull();
    expect(sessionStorage.getItem(`escapa:resource-cache:${key}`)).toBeNull();
  });

  it('hydrates memory from sessionStorage when the entry is still fresh', () => {
    const key = resourceCacheKeys.publicCatalog({ title: 'ia', category: 'tech' });
    const entry = { data: [{ id: 'course-x' }], fetchedAt: Date.now() };
    sessionStorage.setItem(`escapa:resource-cache:${key}`, JSON.stringify(entry));

    expect(getCachedResource<typeof entry.data>(key, DEFAULT_CACHE_TTL_MS)).toEqual([
      { id: 'course-x' },
    ]);
  });

  it('ignores malformed sessionStorage payloads', () => {
    const key = resourceCacheKeys.studentEnrollments({ page: 1 });
    sessionStorage.setItem(`escapa:resource-cache:${key}`, '{invalid-json');

    expect(getCachedResource(key)).toBeNull();
  });

  it('drops stale entries from memory and sessionStorage', () => {
    const key = resourceCacheKeys.publicFeatured();
    const past = Date.now() - DEFAULT_CACHE_TTL_MS - 1;
    sessionStorage.setItem(
      `escapa:resource-cache:${key}`,
      JSON.stringify({ data: [{ id: 'old' }], fetchedAt: past }),
    );

    expect(getCachedResource(key)).toBeNull();
  });

  it('ignores session entries without a valid fetchedAt timestamp', () => {
    const key = resourceCacheKeys.studentLesson('course-1', 'lesson-1');
    sessionStorage.setItem(
      `escapa:resource-cache:${key}`,
      JSON.stringify({ data: { id: 'lesson-1' }, fetchedAt: 'invalid' }),
    );

    expect(getCachedResource(key)).toBeNull();
  });
});
