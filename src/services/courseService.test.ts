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
});
