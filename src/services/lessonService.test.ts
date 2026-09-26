import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LessonPayload } from '@/types/lesson';
import { createLesson, getStudentLesson, StudentLessonError } from './lessonService';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';
const LESSON_ID = '02000000-0000-4000-9000-000000000182';
const MODULE_ID = '01000000-0000-4000-9000-000000000018';

const payload: LessonPayload = {
  moduleId: '11111111-1111-4111-8111-111111111111',
  title: '1.3 Formulários e Validação em HTML',
  description: 'Resumo da aula.',
  type: 'video',
  videoUrl: 'https://youtube.com/watch?v=1',
  durationInSeconds: 760,
  textContent: null,
  fileUrl: null,
  isFreeSample: true,
  resources: [],
  uploads: [],
};

describe('lessonService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('createLesson', () => {
    it('should POST the lesson as admin content and map the response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
              moduleId: payload.moduleId,
              title: payload.title,
              type: 'VIDEO',
              url: payload.videoUrl,
              durationMinutes: 13,
              description: payload.description,
              isFree: true,
              order: 3,
              resources: null,
            },
          }),
      });

      vi.stubGlobal('fetch', fetchMock);

      const lesson = await createLesson(payload);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(String(fetchMock.mock.calls[0][0])).toContain(
        `/admin/modules/${payload.moduleId}/contents`,
      );

      expect(fetchMock.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': 'a0000000-0000-4000-a000-000000000001',
          },
          body: JSON.stringify({
            title: payload.title,
            type: 'VIDEO',
            url: payload.videoUrl,
            durationMinutes: 13,
            description: payload.description,
            isFree: true,
          }),
        }),
      );

      expect(lesson).toEqual(
        expect.objectContaining({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
          moduleId: payload.moduleId,
          title: payload.title,
          type: 'video',
          videoUrl: payload.videoUrl,
          durationInSeconds: 780,
          isFreeSample: true,
        }),
      );
    });
  });

  describe('getStudentLesson', () => {
    it('should GET the student lesson and map the response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: LESSON_ID,
              courseId: COURSE_ID,
              title: 'Introdução ao curso',
              description: 'Descrição da aula.',
              type: 'VIDEO',
              url: 'https://example.com/aula.mp4',
              durationMinutes: 10,
              isFree: false,
              order: 2,
              resources: null,
              module: {
                id: MODULE_ID,
                title: 'Módulo 1',
                order: 1,
              },
            },
          }),
      });

      vi.stubGlobal('fetch', fetchMock);

      const lesson = await getStudentLesson(COURSE_ID, LESSON_ID);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(String(fetchMock.mock.calls[0][0])).toContain(
        `/student/courses/${COURSE_ID}/lessons/${LESSON_ID}`,
      );

      expect(fetchMock.mock.calls[0][1]).toEqual({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'b0000000-0000-4000-b000-000000000001',
        },
      });

      expect(lesson).toEqual({
        id: LESSON_ID,
        moduleId: MODULE_ID,
        title: 'Introdução ao curso',
        description: 'Descrição da aula.',
        type: 'video',
        videoUrl: 'https://example.com/aula.mp4',
        durationInSeconds: 600,
        textContent: null,
        fileUrl: null,
        isFreeSample: false,
        resources: [],
        order: 2,
      });
    });

    it('should throw StudentLessonError when access is denied', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            status: 403,
            error: 'Forbidden',
            message: 'Acesso à aula indisponível.',
          }),
      });

      vi.stubGlobal('fetch', fetchMock);

      try {
        await getStudentLesson(COURSE_ID, LESSON_ID);

        throw new Error('Expected getStudentLesson to throw an error.');
      } catch (error) {
        expect(error).toBeInstanceOf(StudentLessonError);

        expect(error).toMatchObject({
          status: 403,
          message: 'Acesso à aula indisponível.',
        });
      }
    });

    it('should throw StudentLessonError when the lesson is not found', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            status: 404,
            error: 'Not Found',
            message: 'Aula não encontrada.',
          }),
      });

      vi.stubGlobal('fetch', fetchMock);

      try {
        await getStudentLesson(COURSE_ID, LESSON_ID);

        throw new Error('Expected getStudentLesson to throw an error.');
      } catch (error) {
        expect(error).toBeInstanceOf(StudentLessonError);

        expect(error).toMatchObject({
          status: 404,
          message: 'Aula não encontrada.',
        });
      }
    });

    it('should propagate a network error', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      vi.stubGlobal('fetch', fetchMock);

      await expect(getStudentLesson(COURSE_ID, LESSON_ID)).rejects.toThrow('Failed to fetch');
    });
  });
});
