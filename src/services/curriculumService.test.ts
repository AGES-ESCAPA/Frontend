import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStudentCurriculum, StudentCurriculumError } from './curriculumService';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const curriculumResponse = {
  courseId: COURSE_ID,
  completedLessons: 1,
  totalLessons: 3,
  modules: [
    {
      moduleId: '01000000-0000-4000-9000-000000000018',
      title: 'Módulo 1',
      order: 1,
      locked: false,
      completedLessons: 1,
      totalLessons: 2,
      lessons: [
        {
          lessonId: '02000000-0000-4000-9000-000000000183',
          title: 'Mapeando a jornada do hóspede',
          order: 2,
          type: 'VIDEO',
          durationMinutes: null,
          status: 'AVAILABLE',
        },
        {
          lessonId: '02000000-0000-4000-9000-000000000182',
          title: 'Introdução ao curso',
          order: 1,
          type: 'VIDEO',
          durationMinutes: 10,
          status: 'COMPLETED',
        },
      ],
    },
    {
      moduleId: '01000000-0000-4000-9000-000000000019',
      title: 'Módulo 2',
      order: 2,
      locked: true,
      completedLessons: 0,
      totalLessons: 1,
      lessons: [
        {
          lessonId: '02000000-0000-4000-9000-000000000184',
          title: 'Parcerias locais',
          order: 1,
          type: 'TEXT',
          durationMinutes: 8,
          status: 'LOCKED',
        },
      ],
    },
  ],
};

describe('curriculumService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getStudentCurriculum', () => {
    it('should GET the student curriculum and map it keeping the received order', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: curriculumResponse }),
      });

      vi.stubGlobal('fetch', fetchMock);

      const controller = new AbortController();

      const curriculum = await getStudentCurriculum(COURSE_ID, controller.signal);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(String(fetchMock.mock.calls[0][0])).toContain(
        `/student/courses/${COURSE_ID}/curriculum`,
      );

      expect(fetchMock.mock.calls[0][1]).toEqual({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'b0000000-0000-4000-b000-000000000001',
        },
        signal: controller.signal,
      });

      expect(curriculum).toEqual({
        courseId: COURSE_ID,
        completedLessons: 1,
        totalLessons: 3,
        modules: [
          {
            id: '01000000-0000-4000-9000-000000000018',
            title: 'Módulo 1',
            locked: false,
            completedLessons: 1,
            totalLessons: 2,
            lessons: [
              {
                id: '02000000-0000-4000-9000-000000000183',
                title: 'Mapeando a jornada do hóspede',
                durationMinutes: 0,
                status: 'AVAILABLE',
              },
              {
                id: '02000000-0000-4000-9000-000000000182',
                title: 'Introdução ao curso',
                durationMinutes: 10,
                status: 'COMPLETED',
              },
            ],
          },
          {
            id: '01000000-0000-4000-9000-000000000019',
            title: 'Módulo 2',
            locked: true,
            completedLessons: 0,
            totalLessons: 1,
            lessons: [
              {
                id: '02000000-0000-4000-9000-000000000184',
                title: 'Parcerias locais',
                durationMinutes: 8,
                status: 'LOCKED',
              },
            ],
          },
        ],
      });
    });

    it('should throw a StudentCurriculumError with the status and the API message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ status: 403, message: 'Matrícula inativa.' }),
        }),
      );

      const request = getStudentCurriculum(COURSE_ID);

      await expect(request).rejects.toBeInstanceOf(StudentCurriculumError);

      await expect(request).rejects.toMatchObject({
        status: 403,
        message: 'Matrícula inativa.',
      });
    });

    it('should use a fallback message when the error body is not JSON', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 502,
          json: () => Promise.reject(new SyntaxError('Unexpected token <')),
        }),
      );

      await expect(getStudentCurriculum(COURSE_ID)).rejects.toMatchObject({
        status: 502,
        message: 'Não foi possível carregar o conteúdo do curso.',
      });
    });
  });
});
