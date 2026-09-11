/**
 * services/lessonService.ts
 *
 * Comunicação com a API de aulas (TSK-05-BACK). As telas e o modal nunca
 * chamam `fetch` diretamente: elas usam estas funções.
 */
import type { Lesson, LessonPayload } from '@/types/lesson';
import type { ApiResponse } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LessonRequest {
  body: BodyInit;
  headers?: HeadersInit;
}

/**
 * Sem arquivos locais o corpo é JSON puro. Com arquivos, vira `multipart`
 * com os campos da aula em `lesson` — o `Content-Type` fica a cargo do
 * navegador, que precisa incluir o boundary.
 */
const buildRequest = (payload: LessonPayload): LessonRequest => {
  const { uploads, ...lesson } = payload;

  if (uploads.length === 0) {
    return {
      body: JSON.stringify(lesson),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const formData = new FormData();
  formData.append('lesson', JSON.stringify(lesson));
  uploads.forEach((upload) => {
    const field = upload.resourceId ? `resources[${upload.resourceId}]` : 'file';
    formData.append(field, upload.file, upload.file.name);
  });

  return { body: formData };
};

const extractErrorMessage = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null || !('message' in data)) return null;

  const { message } = data as { message?: unknown };
  return typeof message === 'string' ? message : null;
};

const parseLessonResponse = async (response: Response, fallback: string): Promise<Lesson> => {
  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(errorData) ?? fallback);
  }

  const json: ApiResponse<Lesson> = await response.json();
  return json.data;
};

export const createLesson = async (payload: LessonPayload): Promise<Lesson> => {
  const { body, headers } = buildRequest(payload);
  const response = await fetch(`${API_BASE_URL}/modules/${payload.moduleId}/lessons`, {
    method: 'POST',
    headers,
    body,
  });

  return parseLessonResponse(response, 'Não foi possível criar a aula.');
};

export const updateLesson = async (lessonId: string, payload: LessonPayload): Promise<Lesson> => {
  const { body, headers } = buildRequest(payload);
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    method: 'PUT',
    headers,
    body,
  });

  return parseLessonResponse(response, 'Não foi possível salvar as alterações da aula.');
};
