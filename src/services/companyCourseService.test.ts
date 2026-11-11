import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanyCourse } from '@/types/course';

import { getCompanyAcquiredCourseIds, getCompanyCourses } from './companyCourseService';

// Simula apenas o fetch nativo; authenticatedFetch continua sendo executado normalmente.
const fetchMock = vi.spyOn(globalThis, 'fetch');

const response = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const course: CompanyCourse = {
  id: 'course-1',
  title: 'Atendimento de Excelência',
  shortDescription: 'Boas práticas de recepção',
  thumbnailUrl: null,
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 120,
  lessonsCount: 15,
  instructorName: 'Marina Souza',
  rating: 4.8,
  acquiredAt: '2026-10-01',
  employeesWithAccess: 12,
};

const requestedUrl = (): string => String(fetchMock.mock.calls[0][0]);

describe('companyCourseService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('lista os cursos da empresa com os colaboradores com acesso', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: [course] }));

    await expect(getCompanyCourses()).resolves.toEqual([course]);
    expect(requestedUrl()).toMatch(/\/company\/courses$/);
  });

  it('devolve lista vazia quando a empresa não comprou cursos', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: [] }));

    await expect(getCompanyCourses()).resolves.toEqual([]);
  });

  it('falha quando a listagem de cursos da empresa responde erro', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: false }, 500));

    await expect(getCompanyCourses()).rejects.toThrow('Falha ao buscar cursos da empresa');
  });

  it('lista os ids dos cursos adquiridos', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: ['course-1', 'course-2'] }));

    await expect(getCompanyAcquiredCourseIds()).resolves.toEqual(['course-1', 'course-2']);
    expect(requestedUrl()).toMatch(/\/company\/courses\/acquired$/);
  });

  it('falha quando a lista de ids responde erro', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: false }, 500));

    await expect(getCompanyAcquiredCourseIds()).rejects.toThrow(
      'Falha ao buscar cursos da empresa',
    );
  });
});
