import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseReviewError, rateCourse } from './courseReviewService';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

describe('courseReviewService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the rating and returns the saved review', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { courseId: COURSE_ID, rating: 4 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(rateCourse(COURSE_ID, 4)).resolves.toEqual({
      courseId: COURSE_ID,
      rating: 4,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/student/courses/${COURSE_ID}/review`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ rating: 4 }),
      }),
    );
  });

  it('rejects ratings outside 1–5 before calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(rateCourse(COURSE_ID, 0)).rejects.toBeInstanceOf(CourseReviewError);
    await expect(rateCourse(COURSE_ID, 6)).rejects.toBeInstanceOf(CourseReviewError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps API failures to CourseReviewError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Only students who completed the course can rate it' }),
      }),
    );

    await expect(rateCourse(COURSE_ID, 5)).rejects.toMatchObject({
      name: 'CourseReviewError',
      status: 403,
    });
  });
});
