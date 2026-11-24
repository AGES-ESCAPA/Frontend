import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StudentCourseCardResponse } from './enrollmentService';
import { getStudentEnrollments } from './enrollmentService';

const card: StudentCourseCardResponse = {
  courseId: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência',
  instructor: 'Beatriz Nunes',
  thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
  durationTime: 480,
  lessonsCount: 5,
  progressPercentage: 40,
  enrollmentStatus: 'IN_PROGRESS',
};

const page = {
  content: [card],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
};

describe('enrollmentService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should GET enrollments with query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: page }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getStudentEnrollments({
      query: 'hotel',
      status: 'IN_PROGRESS',
      page: 1,
      size: 20,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/student/enrollments');
    expect(url).toContain('query=hotel');
    expect(url).toContain('status=IN_PROGRESS');
    expect(url).toContain('page=1');
    expect(url).toContain('size=20');
    expect(result).toEqual(page);
  });

  it('should call the base URL without query string when params are empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: page }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getStudentEnrollments();

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:8080/api/v1/student/enrollments',
    );
  });

  it('should throw when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(getStudentEnrollments()).rejects.toThrow(
      'Falha ao buscar matrículas: Internal Server Error',
    );
  });
});
