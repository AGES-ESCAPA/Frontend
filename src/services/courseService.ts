import { toApiLevel } from '@utils/mapPublicCourse';
import type { PublicCoursesPage, PublicCoursesQuery } from '@/types/course';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const PUBLIC_COURSES_PATH = '/public/courses';

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

export const courseService = {
  async getCourses(
    query: PublicCoursesQuery = {},
    signal?: AbortSignal,
  ): Promise<PublicCoursesPage> {
    const response = await fetch(buildPublicCoursesUrl(query), { signal });

    if (!response.ok || !isJsonResponse(response)) {
      throw new Error('Falha ao buscar os cursos publicados');
    }

    return (await response.json()) as PublicCoursesPage;
  },
};
