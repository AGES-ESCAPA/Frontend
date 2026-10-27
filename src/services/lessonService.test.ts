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
      const request = fetchMock.mock.calls[0][1] as RequestInit;
      expect(new Headers(request.headers).get('authorization')).toBeNull();

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

    it('should upload the selected file first and save the lesson with the returned URL', async () => {
      const storedUrl = 'http://localhost:9000/escapa-media/contents/abc.pdf';
      const file = new File(['conteudo'], 'apostila.pdf', { type: 'application/pdf' });
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { url: storedUrl } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
                moduleId: payload.moduleId,
                title: 'Apostila',
                type: 'FILE',
                url: storedUrl,
                durationMinutes: null,
                description: null,
                isFree: false,
                order: 4,
                resources: null,
              },
            }),
        });

      vi.stubGlobal('fetch', fetchMock);

      const lesson = await createLesson({
        ...payload,
        title: 'Apostila',
        type: 'file',
        videoUrl: null,
        durationInSeconds: null,
        fileUrl: null,
        uploads: [{ file }],
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/contents/files');
      const uploadRequest = fetchMock.mock.calls[0][1] as RequestInit;
      expect(uploadRequest.method).toBe('POST');
      expect((uploadRequest.body as FormData).get('file')).toBe(file);

      const createRequest = fetchMock.mock.calls[1][1] as RequestInit;
      expect(JSON.parse(String(createRequest.body))).toEqual(
        expect.objectContaining({ type: 'FILE', url: storedUrl }),
      );
      expect(lesson.fileUrl).toBe(storedUrl);
    });

    it('should upload complementary files and send their stored URLs', async () => {
      const storedUrl = 'http://localhost:9000/escapa-media/contents/planilha.xlsx';
      const file = new File(['x'], 'planilha.xlsx');
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { url: storedUrl } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
                moduleId: payload.moduleId,
                title: payload.title,
                type: 'VIDEO',
                url: payload.videoUrl,
                durationMinutes: 13,
                description: null,
                isFree: true,
                order: 5,
                resources: null,
              },
            }),
        });

      vi.stubGlobal('fetch', fetchMock);

      await createLesson({
        ...payload,
        resources: [{ id: 'resource-1', type: 'file', title: 'Planilha', url: '' }],
        uploads: [{ resourceId: 'resource-1', file }],
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/contents/files');
      const createRequest = fetchMock.mock.calls[1][1] as RequestInit;
      expect(JSON.parse(String(createRequest.body))).toEqual(
        expect.objectContaining({ type: 'VIDEO', url: payload.videoUrl }),
      );
    });

    it('should not create the lesson when the file upload fails', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Unsupported file type: virus.exe' }),
      });

      vi.stubGlobal('fetch', fetchMock);

      await expect(
        createLesson({
          ...payload,
          type: 'file',
          videoUrl: null,
          durationInSeconds: null,
          uploads: [{ file: new File(['x'], 'virus.exe') }],
        }),
      ).rejects.toThrow('Unsupported file type: virus.exe');
      expect(fetchMock).toHaveBeenCalledTimes(1);
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

      const request = fetchMock.mock.calls[0][1] as RequestInit;
      expect(request.method).toBe('GET');
      expect(new Headers(request.headers).get('authorization')).toBeNull();

      expect(lesson).toEqual({
        id: LESSON_ID,
        moduleId: MODULE_ID,
        module: {
          id: MODULE_ID,
          title: 'Módulo 1',
          order: 1,
        },
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

    it('should expose the article of a text lesson as textContent', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: LESSON_ID,
                title: 'Quiz',
                description: 'Texto do artigo.',
                type: 'TEXT',
                url: null,
                durationMinutes: 16,
                isFree: false,
                order: 8,
                resources: null,
                module: { id: MODULE_ID, title: 'Módulo 2', order: 2 },
              },
            }),
        }),
      );

      const lesson = await getStudentLesson(COURSE_ID, LESSON_ID);

      expect(lesson.type).toBe('text');
      expect(lesson.textContent).toBe('Texto do artigo.');
      expect(lesson.videoUrl).toBeNull();
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

      const request = getStudentLesson(COURSE_ID, LESSON_ID);

      await expect(request).rejects.toBeInstanceOf(StudentLessonError);
      await expect(request).rejects.toMatchObject({
        status: 403,
        message: 'Acesso à aula indisponível.',
      });
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

      const request = getStudentLesson(COURSE_ID, LESSON_ID);

      await expect(request).rejects.toBeInstanceOf(StudentLessonError);
      await expect(request).rejects.toMatchObject({
        status: 404,
        message: 'Aula não encontrada.',
      });
    });

    it('should propagate a network error', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      vi.stubGlobal('fetch', fetchMock);

      await expect(getStudentLesson(COURSE_ID, LESSON_ID)).rejects.toThrow('Failed to fetch');
    });
  });
});
