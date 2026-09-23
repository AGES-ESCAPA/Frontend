import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLesson } from './lessonService';
import type { LessonPayload } from '@/types/lesson';

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
