import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearCourseRatingSkipped,
  markCourseRatingSkipped,
  wasCourseRatingSkipped,
} from './courseRatingPrompt';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';
const STORAGE_KEY = `course-rating-skipped:${COURSE_ID}`;

describe('courseRatingPrompt', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should mark, detect and clear a skipped rating in sessionStorage', () => {
    expect(wasCourseRatingSkipped(COURSE_ID)).toBe(false);

    markCourseRatingSkipped(COURSE_ID);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('1');
    expect(wasCourseRatingSkipped(COURSE_ID)).toBe(true);

    clearCourseRatingSkipped(COURSE_ID);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(wasCourseRatingSkipped(COURSE_ID)).toBe(false);
  });

  it('should treat storage failures as not skipped when reading', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(wasCourseRatingSkipped(COURSE_ID)).toBe(false);
  });

  it('should ignore storage failures when marking or clearing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => markCourseRatingSkipped(COURSE_ID)).not.toThrow();
    expect(() => clearCourseRatingSkipped(COURSE_ID)).not.toThrow();
  });
});
