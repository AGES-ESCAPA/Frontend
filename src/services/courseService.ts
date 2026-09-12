import type { ApiResponse } from '@services/api';
import type { CourseDetail, CoursePayload } from '@/types/course';

const ADMIN_COURSES_URL = `${import.meta.env.VITE_API_BASE_URL}/admin/courses`;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);

  if (body !== null && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message?: unknown };
    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }

  return fallback;
};

const readCourse = async (response: Response, fallback: string): Promise<CourseDetail> => {
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, fallback));
  }

  const json: ApiResponse<CourseDetail> = await response.json();
  return json.data;
};

export const getCourseById = async (id: string): Promise<CourseDetail> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}`);
  return readCourse(response, 'Não foi possível carregar os dados do curso.');
};

export const createCourse = async (payload: CoursePayload): Promise<CourseDetail> => {
  const response = await fetch(ADMIN_COURSES_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  return readCourse(response, 'Não foi possível cadastrar o curso.');
};

export const updateCourse = async (id: string, payload: CoursePayload): Promise<CourseDetail> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  return readCourse(response, 'Não foi possível salvar as alterações do curso.');
};
