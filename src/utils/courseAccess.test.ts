import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudentCurriculum } from '@services/curriculumService';
import type { StudentCurriculum } from '@/types/curriculum';
import { getCourseAccessPath } from './courseAccess';

vi.mock('@services/curriculumService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getStudentCurriculum: vi.fn(),
}));

const getStudentCurriculumMock = vi.mocked(getStudentCurriculum);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000003';

const buildCurriculum = (
  lessons: Array<{ id: string; status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED' }>,
): StudentCurriculum =>
  ({
    courseId: COURSE_ID,
    completedLessons: 0,
    totalLessons: lessons.length,
    modules: [
      {
        id: 'module-1',
        title: 'Módulo 1',
        locked: false,
        completedLessons: 0,
        totalLessons: lessons.length,
        lessons: lessons.map((lesson) => ({
          id: lesson.id,
          title: `Aula ${lesson.id}`,
          durationMinutes: 10,
          status: lesson.status,
        })),
      },
    ],
  }) as StudentCurriculum;

describe('getCourseAccessPath', () => {
  beforeEach(() => {
    getStudentCurriculumMock.mockReset();
  });

  it('should open the first available lesson', async () => {
    getStudentCurriculumMock.mockResolvedValue(
      buildCurriculum([
        { id: 'lesson-1', status: 'COMPLETED' },
        { id: 'lesson-2', status: 'AVAILABLE' },
        { id: 'lesson-3', status: 'LOCKED' },
      ]),
    );

    expect(await getCourseAccessPath(COURSE_ID)).toBe(`/aluno/cursos/${COURSE_ID}/aulas/lesson-2`);
  });

  it('should fall back to the first lesson when none is available', async () => {
    getStudentCurriculumMock.mockResolvedValue(
      buildCurriculum([
        { id: 'lesson-1', status: 'COMPLETED' },
        { id: 'lesson-2', status: 'COMPLETED' },
      ]),
    );

    expect(await getCourseAccessPath(COURSE_ID)).toBe(`/aluno/cursos/${COURSE_ID}/aulas/lesson-1`);
  });

  it('should fall back to the course page when the curriculum has no lessons', async () => {
    getStudentCurriculumMock.mockResolvedValue(buildCurriculum([]));

    expect(await getCourseAccessPath(COURSE_ID)).toBe(`/cursos/${COURSE_ID}`);
  });

  it('should fall back to the course page when the curriculum cannot be loaded', async () => {
    getStudentCurriculumMock.mockRejectedValue(new Error('Network error'));

    expect(await getCourseAccessPath(COURSE_ID)).toBe(`/cursos/${COURSE_ID}`);
  });
});
