import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicCoursesPage } from '@/types/course';
import { CourseRequestError, courseService, PUBLIC_COURSES_PATH } from './courseService';

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

  it('should derive filters from the published catalog', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(page),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(courseService.getCourseFilters()).resolves.toEqual({
      categories: ['Hospitalidade'],
      levels: ['INICIANTE'],
    });
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain(PUBLIC_COURSES_PATH);
    expect(requestedUrl).not.toContain('/filters');
    expect(requestedUrl).toContain('size=100');
  });

  it('should throw CourseRequestError when a public course responds with an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Course not found' }),
      }),
    );

    const error = await courseService
      .getPublicCourseById('missing-course')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CourseRequestError);
    expect((error as CourseRequestError).status).toBe(404);
    expect((error as CourseRequestError).message).toBe('Course not found');
  });

  it('should throw when the public course payload has no data field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: false, message: 'Curso indisponível' }),
      }),
    );

    await expect(courseService.getPublicCourseById('course-1')).rejects.toThrow(
      'Curso indisponível',
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
              instructorName: 'Dra. Mariana',
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
    expect(new Headers(init.headers).get('authorization')).toBeNull();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Atendimento de Excelencia em Hospedagem');
  });

  it('should call GET /api/v1/admin/courses/:id and return the course detail', async () => {
    const courseDetail = {
      id: 'e0000000-0000-4000-e000-000000000001',
      title: 'Atendimento de Excelência em Hospedagem',
      category: 'Hospitalidade',
      level: 'INICIANTE',
      featured: false,
      description: 'Descrição',
      shortDescription: 'Resumo',
      thumbnailUrl: null,
      teaserVideoUrl: null,
      durationTime: 40,
      deadline: null,
      price: 199.9,
      status: 'DRAFT',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: courseDetail }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.getCourseById(courseDetail.id);

    expect(String(fetchMock.mock.calls[0][0])).toContain(`/admin/courses/${courseDetail.id}`);
    expect(result.title).toBe(courseDetail.title);
  });

  it('should surface the API message when getCourseById is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Course not found' }),
      }),
    );

    await expect(courseService.getCourseById('missing')).rejects.toThrow('Course not found');
  });

  it('should throw when admin categories respond with HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
      }),
    );

    await expect(courseService.listCourseCategories()).rejects.toThrow(
      'Não foi possível carregar as categorias.',
    );
  });

  it('should surface the API message when categories cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Service Unavailable' }),
      }),
    );

    await expect(courseService.listCourseCategories()).rejects.toThrow('Service Unavailable');
  });

  it('should throw when thumbnail upload succeeds without a url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: {} }),
      }),
    );

    await expect(
      courseService.uploadCourseThumbnail(new File(['x'], 'capa.png', { type: 'image/png' })),
    ).rejects.toThrow('Não foi possível enviar a imagem de capa.');
  });

  it('should throw when listAdminCourses receives a non-json response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/plain' },
      }),
    );

    await expect(courseService.listAdminCourses()).rejects.toThrow(
      'Não foi possível carregar os cursos.',
    );
  });

  it('should throw when listAdminCourses returns an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Access denied' }),
      }),
    );

    await expect(courseService.listAdminCourses()).rejects.toThrow('Access denied');
  });

  it('should sort catalog levels using the backend rank', async () => {
    const multiLevelPage: PublicCoursesPage = {
      ...page,
      content: [
        { ...page.content[0], level: 'AVANCADO' },
        { ...page.content[0], id: 'e0000000-0000-4000-e000-000000000002', level: 'INTERMEDIARIO' },
        page.content[0],
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(multiLevelPage),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(courseService.getCourseFilters()).resolves.toEqual({
      categories: ['Hospitalidade'],
      levels: ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'],
    });
  });

  it('should call GET /api/v1/admin/courses/categories and return the registered names', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: ['Hospitalidade', 'Marketing'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.listCourseCategories();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/categories');
    expect(new Headers(init.headers).get('authorization')).toBeNull();
    expect(result).toEqual(['Hospitalidade', 'Marketing']);
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

  it('should upload the cover as multipart and return the public url', async () => {
    const file = new File(['capa'], 'capa.png', { type: 'image/png' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          data: { url: 'https://cdn.escapa.com/courses/capa.png' },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(courseService.uploadCourseThumbnail(file)).resolves.toBe(
      'https://cdn.escapa.com/courses/capa.png',
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/thumbnail');
    expect(init.method).toBe('POST');
    expect((init.body as FormData).get('file')).toBe(file);
    expect(new Headers(init.headers).get('content-type')).toBeNull();
  });

  it('should read course rules from the unwrapped payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          requireSequentialProgress: false,
          enforceDeadlineBlock: true,
          version: '1.4',
          prerequisites: [{ courseId: 'pre-1', courseTitle: 'Segurança da Informação' }],
          changeLog: [],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const rules = await courseService.getCourseRules('e0000000-0000-4000-e000-000000000001');

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/e0000000-0000-4000-e000-000000000001/rules');
    expect(rules.version).toBe('1.4');
    expect(rules.prerequisites[0].courseTitle).toBe('Segurança da Informação');
    expect(rules.enforceDeadlineBlock).toBe(true);
  });

  it('should save progress rules with PUT /progress-rules', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          requireSequentialProgress: false,
          enforceDeadlineBlock: false,
          version: '0.1',
          prerequisites: [],
          changeLog: [],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.updateProgressRules('e0000000-0000-4000-e000-000000000001', {
      requireSequentialProgress: false,
      enforceDeadlineBlock: false,
      minQuizPassPercentage: 70,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/e0000000-0000-4000-e000-000000000001/progress-rules');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({
      requireSequentialProgress: false,
      enforceDeadlineBlock: false,
      minQuizPassPercentage: 70,
    });
  });

  it('should search prerequisites and encode the query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve([{ id: 'pre-2', title: 'Gestão de eventos' }]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await courseService.searchCoursePrerequisites(
      'e0000000-0000-4000-e000-000000000001',
      'gestão',
    );

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/prerequisites/search?');
    expect(url).toContain('query=gest%C3%A3o');
    expect(results[0].title).toBe('Gestão de eventos');
  });

  it('should publish with the notify flag in the body', async () => {
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

    await courseService.publishCourse('e0000000-0000-4000-e000-000000000001', {
      notifyEnrolledStudents: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ notifyEnrolledStudents: true });
  });

  it('should surface the API message when archive is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Course already archived' }),
      }),
    );

    await expect(courseService.archiveCourse('course-1')).rejects.toThrow(
      'Course already archived',
    );
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

  const courseId = 'e0000000-0000-4000-e000-000000000001';
  const coursePayload = {
    title: 'Novo curso',
    category: 'Hospitalidade',
    level: 'INICIANTE' as const,
    featured: false,
    description: 'Descrição completa',
    shortDescription: 'Resumo',
    thumbnailUrl: '',
    teaserVideoUrl: null,
    durationTime: 480,
    deadline: null,
    price: 199.9,
    status: 'DRAFT' as const,
  };
  const courseDetail = {
    id: courseId,
    ...coursePayload,
    level: 'INICIANTE',
    thumbnailUrl: null,
    instructorName: null,
    majorVersion: 0,
    minorVersion: 1,
  };

  it('should call POST /api/v1/admin/courses to create a course', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: courseDetail }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.createCourse(coursePayload);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses');
    expect(url).not.toMatch(/\/admin\/courses\/.+/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(coursePayload);
    expect(result.id).toBe(courseId);
  });

  it('should surface the API message when create is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'title must not be blank' }),
      }),
    );

    await expect(courseService.createCourse(coursePayload)).rejects.toThrow(
      'title must not be blank',
    );
  });

  it('should call PUT /api/v1/admin/courses/:id to update a course', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          data: { ...courseDetail, title: 'Título atualizado' },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseService.updateCourse(courseId, {
      ...coursePayload,
      title: 'Título atualizado',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/admin/courses/${courseId}`);
    expect(init.method).toBe('PUT');
    expect(result.title).toBe('Título atualizado');
  });

  it('should surface the API message when update is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Course not found' }),
      }),
    );

    await expect(courseService.updateCourse(courseId, coursePayload)).rejects.toThrow(
      'Course not found',
    );
  });

  it('should call POST /api/v1/admin/courses/:id/prerequisites to add a prerequisite', async () => {
    const prerequisiteId = 'e0000000-0000-4000-e000-000000000002';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.addCoursePrerequisite(courseId, prerequisiteId);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/admin/courses/${courseId}/prerequisites`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ prerequisiteCourseId: prerequisiteId });
  });

  it('should surface the API message when add prerequisite is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Prerequisite would create a cycle' }),
      }),
    );

    await expect(
      courseService.addCoursePrerequisite(courseId, 'e0000000-0000-4000-e000-000000000002'),
    ).rejects.toThrow('Prerequisite would create a cycle');
  });

  it('should call DELETE on the prerequisite relationship', async () => {
    const prerequisiteId = 'e0000000-0000-4000-e000-000000000002';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.removeCoursePrerequisite(courseId, prerequisiteId);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/admin/courses/${courseId}/prerequisites/${prerequisiteId}`);
    expect(init.method).toBe('DELETE');
  });

  it('should surface the API message when remove prerequisite is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Prerequisite not found' }),
      }),
    );

    await expect(courseService.removeCoursePrerequisite(courseId, 'missing-pre')).rejects.toThrow(
      'Prerequisite not found',
    );
  });

  it('should surface the API message when unarchive is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Course is not archived' }),
      }),
    );

    await expect(courseService.unarchiveCourse('course-1')).rejects.toThrow(
      'Course is not archived',
    );
  });

  it('should call POST /api/v1/admin/courses/:id/unarchive to restore a course', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, data: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await courseService.unarchiveCourse('e0000000-0000-4000-e000-000000000003');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/admin/courses/e0000000-0000-4000-e000-000000000003/unarchive');
    expect(init.method).toBe('POST');
  });
});
