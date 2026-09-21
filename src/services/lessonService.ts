/**
 * services/lessonService.ts
 *
 * Comunicação com a API de aulas (TSK-05-BACK). As telas e o modal nunca
 * chamam `fetch` diretamente: elas usam estas funções.
 */
import type { Lesson, LessonPayload, LessonResource, LessonType } from '@/types/lesson';
import { adminHeaders } from '@services/api';
import type { ApiResponse } from '@services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiLessonType = 'VIDEO' | 'TEXT' | 'FILE';

interface CreateContentRequest {
  title: string;
  type: ApiLessonType;
  url: string | null;
  durationMinutes: number | null;
  description: string | null;
  isFree: boolean;
}

interface ContentResponse {
  id: string;
  moduleId: string;
  title: string;
  type: ApiLessonType;
  url: string | null;
  durationMinutes: number | null;
  description: string | null;
  isFree: boolean;
  order: number;
  resources: string | LessonResource[] | null;
}

const toApiLessonType = (type: LessonType): ApiLessonType => type.toUpperCase() as ApiLessonType;

const toLessonType = (type: ApiLessonType): LessonType => type.toLowerCase() as LessonType;

const secondsToMinutes = (seconds: number | null): number | null => {
  if (seconds == null || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds / 60));
};

const resolveContentUrl = (payload: LessonPayload): string | null => {
  if (payload.type === 'video') return payload.videoUrl;
  if (payload.type === 'file') return payload.fileUrl;
  return null;
};

const resolveContentDescription = (payload: LessonPayload): string | null => {
  if (payload.type === 'text') return payload.textContent;
  return payload.description || null;
};

const buildCreateContentRequest = (payload: LessonPayload): CreateContentRequest => ({
  title: payload.title,
  type: toApiLessonType(payload.type),
  url: resolveContentUrl(payload),
  durationMinutes: payload.type === 'video' ? secondsToMinutes(payload.durationInSeconds) : null,
  description: resolveContentDescription(payload),
  isFree: payload.isFreeSample,
});

const parseResources = (resources: ContentResponse['resources']): LessonResource[] => {
  if (Array.isArray(resources)) return resources;
  if (!resources) return [];

  try {
    const parsed: unknown = JSON.parse(resources);
    return Array.isArray(parsed) ? (parsed as LessonResource[]) : [];
  } catch {
    return [];
  }
};

const mapContentToLesson = (content: ContentResponse): Lesson => {
  const type = toLessonType(content.type);

  return {
    id: content.id,
    moduleId: content.moduleId,
    title: content.title,
    description: content.description ?? '',
    type,
    videoUrl: type === 'video' ? content.url : null,
    durationInSeconds: content.durationMinutes != null ? content.durationMinutes * 60 : null,
    textContent: type === 'text' ? content.description : null,
    fileUrl: type === 'file' ? content.url : null,
    isFreeSample: Boolean(content.isFree),
    resources: parseResources(content.resources),
    order: content.order,
  };
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

  const json: ApiResponse<ContentResponse> = await response.json();
  return mapContentToLesson(json.data);
};

export const createLesson = async (payload: LessonPayload): Promise<Lesson> => {
  const response = await fetch(`${API_BASE_URL}/admin/modules/${payload.moduleId}/contents`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(buildCreateContentRequest(payload)),
  });

  return parseLessonResponse(response, 'Não foi possível criar a aula.');
};

export const updateLesson = async (lessonId: string, payload: LessonPayload): Promise<Lesson> => {
  const response = await fetch(`${API_BASE_URL}/admin/contents/${lessonId}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(buildCreateContentRequest(payload)),
  });

  return parseLessonResponse(response, 'Não foi possível salvar as alterações da aula.');
};
