import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicCoursesPage } from '@/types/course';
import { courseService, PUBLIC_COURSES_PATH } from './courseService';

const page: PublicCoursesPage = {
  content: [
    {
      id: 'e0000000-0000-4000-e000-000000000001',
      title: 'Atendimento de Excelência em Hospedagem',
      shortDescription: 'A jornada do hospede...',
      category: 'Hospitalidade',
      level: 'INICIANTE',
      durationTime: 480,
      lessonsCount: 5,
      price: 249.9,
      thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
      instructor: 'Beatriz Nunes',
      ratingAverage: 4.5,
      reviewsCount: 2,
    },
  ],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
};

describe('courseService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should call GET /api/v1/public/courses with backend level values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(page),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.getCourses({
      category: 'Hospitalidade',
      level: 'Iniciante',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain(PUBLIC_COURSES_PATH);
    expect(requestedUrl).toContain('category=Hospitalidade');
    expect(requestedUrl).toContain('level=INICIANTE');
    expect(result.content[0].id).toBe('e0000000-0000-4000-e000-000000000001');
    expect(result.totalElements).toBe(1);
  });

  it('should include the search title when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(page),
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.getCourses({ title: 'Atendimento' });

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain('title=Atendimento');
  });

  it('should throw when the response is HTML instead of JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        json: () => Promise.resolve('<!doctype html>'),
      }),
    );

    await expect(courseService.getCourses()).rejects.toThrow(
      'Falha ao buscar os cursos publicados',
    );
  });

  it('should throw when the API responds with an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(courseService.getCourses()).rejects.toThrow(
      'Falha ao buscar os cursos publicados',
    );
  });

  it('should call GET /api/v1/public/courses/:id and return the payload data', async () => {
    const details = {
      id: 'e0000000-0000-4000-e000-000000000001',
      title: 'Atendimento de Excelência em Hospedagem',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: details }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.getPublicCourseById(details.id);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`${PUBLIC_COURSES_PATH}/${details.id}`);
    expect(result.title).toBe(details.title);
  });

  it('should call GET /api/v1/admin/courses with the admin header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              id: 'e0000000-0000-4000-e000-000000000001',
              title: 'Atendimento de Excelencia em Hospedagem',
              category: 'Hospitalidade',
              price: 249.9,
              status: 'PUBLISHED',
              majorVersion: 1,
              minorVersion: 2,
            },
          ],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.listAdminCourses();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses');
    expect(url).not.toMatch(/\/admin\/courses\/.+/);
    expect((init.headers as Record<string, string>)['X-User-Id']).toBe(
      'a0000000-0000-4000-a000-000000000001',
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Atendimento de Excelencia em Hospedagem');
  });

  it('should call POST /api/v1/admin/courses/:id/publish to publish a course', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          data: { id: 'e0000000-0000-4000-e000-000000000001', status: 'PUBLISHED' },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.publishCourse('e0000000-0000-4000-e000-000000000001');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/e0000000-0000-4000-e000-000000000001/publish');
    expect(init.method).toBe('POST');
    expect(result.status).toBe('PUBLISHED');
  });

  it('should surface the API validation message when publish is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            message: 'Cannot publish course due to missing requirements: instructorId',
          }),
      }),
    );

    await expect(
      courseService.publishCourse('e0000000-0000-4000-e000-000000000001'),
    ).rejects.toThrow('Cannot publish course due to missing requirements: instructorId');
  });

  it('should call DELETE /api/v1/admin/courses/:id to archive a course', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.archiveCourse('e0000000-0000-4000-e000-000000000003');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/e0000000-0000-4000-e000-000000000003');
    expect(init.method).toBe('DELETE');
  });
});
