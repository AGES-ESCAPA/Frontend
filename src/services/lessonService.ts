/**
 * services/lessonService.ts
 *
 * Comunicação com a API de aulas (TSK-05-BACK). As telas e o modal nunca
 * chamam `fetch` diretamente: elas usam estas funções.
 */
import { authenticatedFetch } from '@services/api';
import type { ApiResponse } from '@services/api';
import type {
  Lesson,
  LessonPayload,
  LessonReference,
  LessonResource,
  LessonType,
} from '@/types/lesson';
import { getApiBaseUrl } from '@services/runtimeEnv';

const API_BASE_URL = getApiBaseUrl();

type ApiLessonType = 'VIDEO' | 'TEXT' | 'FILE';

interface CreateContentRequest {
  title: string;
  type: ApiLessonType;
  url: string | null;
  durationMinutes: number | null;
  description: string | null;
  isFree: boolean;
  resources: LessonResource[];
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
  resources: LessonResource[] | null;
}

interface StudentLessonResponse {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: ApiLessonType;
  url: string | null;
  durationMinutes: number | null;
  isFree: boolean;
  order: number;
  resources: LessonResource[] | null;
  concepts: string[];
  references: LessonReference[];
  module: {
    id: string;
    title: string;
    order: number;
  };
}

export class StudentLessonError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'StudentLessonError';
    this.status = status;
  }
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
  resources: payload.resources.map(({ id, type, title, url }) => ({ id, type, title, url })),
});

const parseResources = (resources: ContentResponse['resources']): LessonResource[] =>
  resources ?? [];

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

const mapStudentLessonToLesson = (content: StudentLessonResponse): Lesson => {
  const type = toLessonType(content.type);

  return {
    id: content.id,
    moduleId: content.module.id,
    module: {
      id: content.module.id,
      title: content.module.title,
      order: content.module.order,
    },
    order: content.order,
    title: content.title,
    description: content.description ?? '',
    type,
    videoUrl: type === 'video' ? content.url : null,
    durationInSeconds: content.durationMinutes != null ? content.durationMinutes * 60 : null,
    // Aula de texto guarda o artigo em `description` (ver resolveContentDescription).
    textContent: type === 'text' ? (content.description ?? '') : null,
    fileUrl: type === 'file' ? content.url : null,
    isFreeSample: Boolean(content.isFree),
    resources: parseResources(content.resources),
    concepts: content.concepts,
    references: content.references,
  };
};

const extractErrorMessage = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return null;
  }

  const { message } = data as {
    message?: unknown;
  };

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

export const getStudentLesson = async (
  courseId: string,
  lessonId: string,
  signal?: AbortSignal,
): Promise<Lesson> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/student/courses/${courseId}/lessons/${lessonId}`,
    {
      method: 'GET',
      signal,
    },
  );

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);

    throw new StudentLessonError(
      response.status,
      extractErrorMessage(errorData) ?? 'Não foi possível carregar a aula.',
    );
  }

  const json: ApiResponse<StudentLessonResponse> = await response.json();

  return mapStudentLessonToLesson(json.data);
};

/** Aula completa no formato do admin, usada para preencher o modal de edição. */
export const getAdminLesson = async (moduleId: string, lessonId: string): Promise<Lesson> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/modules/${moduleId}/contents/${lessonId}`,
    { method: 'GET' },
  );

  return parseLessonResponse(response, 'Não foi possível carregar a aula.');
};

/** Envia o arquivo em `multipart/form-data` ao storage e devolve a URL pública. */
export const uploadLessonFile = async (file: File): Promise<string> => {
  const body = new FormData();
  body.append('file', file);

  const response = await authenticatedFetch(`${API_BASE_URL}/admin/contents/files`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);

    throw new Error(extractErrorMessage(errorData) ?? 'Não foi possível enviar o arquivo da aula.');
  }

  const json: ApiResponse<{ url: string }> = await response.json();

  return json.data.url;
};

/**
 * Sobe os arquivos escolhidos no navegador e troca `fileUrl`/`resource.url`
 * pelas URLs definitivas do storage.
 */
const resolveUploads = async (payload: LessonPayload): Promise<LessonPayload> => {
  if (payload.uploads.length === 0) return payload;

  const uploadedUrls = await Promise.all(
    payload.uploads.map(async (upload) => ({
      resourceId: upload.resourceId,
      url: await uploadLessonFile(upload.file),
    })),
  );
  const urlOf = (resourceId?: string) =>
    uploadedUrls.find((uploaded) => uploaded.resourceId === resourceId)?.url;

  return {
    ...payload,
    fileUrl: payload.type === 'file' ? (urlOf(undefined) ?? payload.fileUrl) : payload.fileUrl,
    resources: payload.resources.map((resource) => ({
      ...resource,
      url: urlOf(resource.id) ?? resource.url,
    })),
  };
};

export const createLesson = async (payload: LessonPayload): Promise<Lesson> => {
  const resolved = await resolveUploads(payload);
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/modules/${payload.moduleId}/contents`,
    {
      method: 'POST',
      body: JSON.stringify(buildCreateContentRequest(resolved)),
    },
  );

  return parseLessonResponse(response, 'Não foi possível criar a aula.');
};

export const updateLesson = async (lessonId: string, payload: LessonPayload): Promise<Lesson> => {
  const resolved = await resolveUploads(payload);
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/contents/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(buildCreateContentRequest(resolved)),
  });

  return parseLessonResponse(response, 'Não foi possível salvar as alterações da aula.');
};
