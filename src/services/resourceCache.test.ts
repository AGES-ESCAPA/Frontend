import { afterEach, describe, expect, it } from 'vitest';
import {
  clearResourceCache,
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
});
