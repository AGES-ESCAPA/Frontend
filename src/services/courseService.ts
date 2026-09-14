import { adminHeaders } from '@services/api';
import type { ApiResponse } from '@services/api';
import { toApiLevel } from '@utils/mapPublicCourse';
import type {
  AdminCourseListItem,
  CourseDetail,
  CoursePayload,
  PublicCourseDetails,
  PublicCoursesPage,
  PublicCoursesQuery,
} from '@/types/course';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const PUBLIC_COURSES_PATH = '/public/courses';

const ADMIN_COURSES_URL = `${API_BASE}/admin/courses`;

const buildPublicCoursesUrl = (query: PublicCoursesQuery = {}): string => {
  const params = new URLSearchParams();

  if (query.title) params.set('title', query.title);
  if (query.category) params.set('category', query.category);
  if (query.level) params.set('level', toApiLevel(query.level));
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.size !== undefined) params.set('size', String(query.size));

  const search = params.toString();
  return `${API_BASE}${PUBLIC_COURSES_PATH}${search ? `?${search}` : ''}`;
};

const isJsonResponse = (response: Response): boolean => {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
};

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

const getPublicCourseById = async (
  id: string,
  signal?: AbortSignal,
): Promise<PublicCourseDetails> => {
  const response = await fetch(`${API_BASE}${PUBLIC_COURSES_PATH}/${id}`, { signal });

  if (!isJsonResponse(response)) {
    throw new Error('Não foi possível carregar os dados do curso.');
  }

  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, 'Não foi possível carregar os dados do curso.'),
    );
  }

  const json: ApiResponse<PublicCourseDetails> = await response.json();

  if (!json.data) {
    throw new Error(json.message || 'Não foi possível carregar os dados do curso.');
  }

  return json.data;
};

const getCourses = async (
  query: PublicCoursesQuery = {},
  signal?: AbortSignal,
): Promise<PublicCoursesPage> => {
  const response = await fetch(buildPublicCoursesUrl(query), { signal });

  if (!response.ok || !isJsonResponse(response)) {
    throw new Error('Falha ao buscar os cursos publicados');
  }

  return (await response.json()) as PublicCoursesPage;
};

const readCourse = async (response: Response, fallback: string): Promise<CourseDetail> => {
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, fallback));
  }

  const json: ApiResponse<CourseDetail> = await response.json();
  return json.data;
};

export const getCourseById = async (id: string): Promise<CourseDetail> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}`, { headers: adminHeaders() });
  return readCourse(response, 'Não foi possível carregar os dados do curso.');
};

export const createCourse = async (payload: CoursePayload): Promise<CourseDetail> => {
  const response = await fetch(ADMIN_COURSES_URL, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });

  return readCourse(response, 'Não foi possível cadastrar o curso.');
};

export const updateCourse = async (id: string, payload: CoursePayload): Promise<CourseDetail> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });

  return readCourse(response, 'Não foi possível salvar as alterações do curso.');
};

export const publishCourse = async (id: string): Promise<CourseDetail> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}/publish`, {
    method: 'POST',
    headers: adminHeaders(),
  });

  return readCourse(response, 'Não foi possível publicar o curso.');
};

const listAdminCourses = async (signal?: AbortSignal): Promise<AdminCourseListItem[]> => {
  const response = await fetch(ADMIN_COURSES_URL, { headers: adminHeaders(), signal });

  if (!isJsonResponse(response)) {
    throw new Error('Não foi possível carregar os cursos.');
  }

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Não foi possível carregar os cursos.'));
  }

  const json: ApiResponse<AdminCourseListItem[]> = await response.json();
  return json.data ?? [];
};

const archiveCourse = async (id: string): Promise<void> => {
  const response = await fetch(`${ADMIN_COURSES_URL}/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Não foi possível arquivar o curso.'));
  }
};

export const courseService = {
  getCourses,
  getPublicCourseById,
  getCourseById,
  createCourse,
  updateCourse,
  publishCourse,
  listAdminCourses,
  archiveCourse,
};
