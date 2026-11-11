import { api, authenticatedFetch } from './api';
import type { ApiResponse } from './api';
import type { CompanyCourse } from '@/types/course';

/** Ids dos cursos que a empresa logada já comprou (ativos ou vencidos; cancelados ficam de fora). */
export const getCompanyAcquiredCourseIds = async (): Promise<string[]> => {
  const response = await authenticatedFetch(`${api.baseUrl}/company/courses/acquired`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar cursos da empresa: ${response.statusText}`);
  }

  const json: ApiResponse<string[]> = await response.json();
  return json.data;
};

/** Cursos ativos que a empresa logada comprou, com a quantidade de colaboradores que têm acesso a cada um. */
export const getCompanyCourses = async (): Promise<CompanyCourse[]> => {
  const response = await authenticatedFetch(`${api.baseUrl}/company/courses`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar cursos da empresa: ${response.statusText}`);
  }

  const json: ApiResponse<CompanyCourse[]> = await response.json();
  return json.data ?? [];
};
