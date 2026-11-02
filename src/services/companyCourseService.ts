import { api, authenticatedFetch } from './api';
import type { ApiResponse } from './api';

/** Ids dos cursos que a empresa logada já comprou (ativos ou vencidos; cancelados ficam de fora). */
export const getCompanyAcquiredCourseIds = async (): Promise<string[]> => {
  const response = await authenticatedFetch(`${api.baseUrl}/company/courses/acquired`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar cursos da empresa: ${response.statusText}`);
  }

  const json: ApiResponse<string[]> = await response.json();
  return json.data;
};
