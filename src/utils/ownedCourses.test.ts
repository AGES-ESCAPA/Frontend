import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudentEnrollments } from '@services/enrollmentService';
import type { StudentCourseCardResponse } from '@services/enrollmentService';
import { loadOwnedCourseIds } from './ownedCourses';

vi.mock('@services/enrollmentService', () => ({ getStudentEnrollments: vi.fn() }));

const getEnrollmentsMock = vi.mocked(getStudentEnrollments);

const enrollment = (
  courseId: string,
  enrollmentStatus: StudentCourseCardResponse['enrollmentStatus'],
): StudentCourseCardResponse => ({
  courseId,
  title: courseId,
  instructor: null,
  thumbnailUrl: null,
  durationTime: null,
  lessonsCount: 0,
  progressPercentage: null,
  enrollmentStatus,
});

describe('loadOwnedCourseIds', () => {
  beforeEach(() => getEnrollmentsMock.mockReset());

  it('reads every page and keeps only enrollments that count as acquired', async () => {
    getEnrollmentsMock
      .mockResolvedValueOnce({
        content: [enrollment('curso-1', 'IN_PROGRESS'), enrollment('curso-2', 'COMPLETED')],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 4,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [enrollment('curso-3', 'EXPIRED'), enrollment('curso-4', 'PENDING')],
        pageNumber: 1,
        pageSize: 50,
        totalElements: 4,
        totalPages: 2,
      });

    const ids = await loadOwnedCourseIds();

    expect([...ids]).toEqual(['curso-1', 'curso-2', 'curso-3']);
    expect(getEnrollmentsMock).toHaveBeenNthCalledWith(2, { page: 1, size: 50 });
  });
});
