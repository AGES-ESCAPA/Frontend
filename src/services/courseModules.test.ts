import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminCourseModule } from '@/types/module';
import { courseModulesApi } from './courseModules';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000001';
const FIRST_MODULE_ID = '01000000-0000-4000-9000-000000000001';
const SECOND_MODULE_ID = '01000000-0000-4000-9000-000000000002';
const ADMIN_ID = 'a0000000-0000-4000-a000-000000000001';

const modules: AdminCourseModule[] = [
  {
    id: FIRST_MODULE_ID,
    title: 'Fundamentos do Atendimento',
    order: 1,
    totalContents: 1,
    totalDurationMinutes: 12,
    contents: [
      {
        id: '02000000-0000-4000-9000-000000000001',
        title: 'A jornada do hospede',
        type: 'VIDEO',
        order: 1,
      },
    ],
  },
  {
    id: SECOND_MODULE_ID,
    title: 'Situacoes Criticas',
    order: 2,
    totalContents: 0,
    totalDurationMinutes: 0,
    contents: [],
  },
];

const okJson = (data: unknown, message = 'Operation completed successfully') =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data, message }),
  });

const errorJson = (status: number, message: string) =>
  vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: () =>
      Promise.resolve({
        status,
        error: 'Error',
        message,
        path: '/api/v1/admin',
        timestamp: '2026-09-13T18:42:11.123Z',
      }),
  });

const lastCall = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls[0] as [string, RequestInit];

describe('courseModulesApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should GET the course modules sending the admin header', async () => {
    const fetchMock = okJson(modules);
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseModulesApi.listModules(COURSE_ID);

    const [url, init] = lastCall(fetchMock);
    expect(url).toContain(`/admin/courses/${COURSE_ID}/modules`);
    expect(init.method).toBeUndefined();
    expect((init.headers as Record<string, string>)['X-User-Id']).toBe(ADMIN_ID);
    expect(result).toEqual(modules);
  });

  it('should POST only the title when creating a module', async () => {
    const created = { ...modules[1], id: '01000000-0000-4000-9000-000000000003', order: 3 };
    const fetchMock = okJson(created, 'Module created successfully');
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseModulesApi.createModule(COURSE_ID, 'Novo módulo');

    const [url, init] = lastCall(fetchMock);
    expect(url).toContain(`/admin/courses/${COURSE_ID}/modules`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Novo módulo' }));
    expect((init.headers as Record<string, string>)['X-User-Id']).toBe(ADMIN_ID);
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(result.order).toBe(3);
  });

  it('should PUT the new title on /admin/modules/:id', async () => {
    const renamed = { ...modules[0], title: 'Fundamentos revisados' };
    const fetchMock = okJson(renamed);
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseModulesApi.updateModuleTitle(
      FIRST_MODULE_ID,
      'Fundamentos revisados',
    );

    const [url, init] = lastCall(fetchMock);
    expect(url).toContain(`/admin/modules/${FIRST_MODULE_ID}`);
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ title: 'Fundamentos revisados' }));
    expect(result.title).toBe('Fundamentos revisados');
  });

  it('should PUT every module id on reorder and return the server order', async () => {
    const reordered = [
      { ...modules[1], order: 1 },
      { ...modules[0], order: 2 },
    ];
    const fetchMock = okJson(reordered);
    vi.stubGlobal('fetch', fetchMock);

    const result = await courseModulesApi.reorderModules(COURSE_ID, [
      SECOND_MODULE_ID,
      FIRST_MODULE_ID,
    ]);

    const [url, init] = lastCall(fetchMock);
    expect(url).toContain(`/admin/courses/${COURSE_ID}/modules/reorder`);
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ moduleIds: [SECOND_MODULE_ID, FIRST_MODULE_ID] }));
    expect(result.map((module) => module.id)).toEqual([SECOND_MODULE_ID, FIRST_MODULE_ID]);
    expect(result.map((module) => module.order)).toEqual([1, 2]);
  });

  it('should surface the API message when reorder is rejected with 400', async () => {
    vi.stubGlobal(
      'fetch',
      errorJson(400, 'moduleIds must contain every module of the course exactly once'),
    );

    await expect(courseModulesApi.reorderModules(COURSE_ID, [FIRST_MODULE_ID])).rejects.toThrow(
      'moduleIds must contain every module of the course exactly once',
    );
  });

  it('should surface the API message when the user is not ADMIN', async () => {
    vi.stubGlobal('fetch', errorJson(403, 'Access denied: user is not ADMIN'));

    await expect(courseModulesApi.listModules(COURSE_ID)).rejects.toThrow(
      'Access denied: user is not ADMIN',
    );
  });

  it('should DELETE the module and resolve on 204 without a body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error('no body')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(courseModulesApi.deleteModule(FIRST_MODULE_ID)).resolves.toBeUndefined();

    const [url, init] = lastCall(fetchMock);
    expect(url).toContain(`/admin/modules/${FIRST_MODULE_ID}`);
    expect(init.method).toBe('DELETE');
    expect((init.headers as Record<string, string>)['X-User-Id']).toBe(ADMIN_ID);
  });

  it('should fall back to a friendly message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('not json')),
      }),
    );

    await expect(courseModulesApi.deleteModule(FIRST_MODULE_ID)).rejects.toThrow(
      'Não foi possível excluir o módulo.',
    );
  });
});
