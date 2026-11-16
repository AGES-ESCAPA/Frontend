/**
 * Avaliação (1 a 5 estrelas) que o aluno dá a um curso concluído.
 */
import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';

const API_BASE_URL = getApiBaseUrl();

export class CourseReviewError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CourseReviewError';
    this.status = status;
  }
}

export interface CourseReviewResponse {
  courseId: string;
  rating: number;
}

const messageForStatus = (status: number): string => {
  switch (status) {
    case 403:
      return 'Só é possível avaliar um curso depois de concluí-lo.';
    case 404:
      return 'Curso não encontrado.';
    default:
      return 'Não foi possível salvar a avaliação. Tente novamente.';
  }
};

/** `PUT /student/courses/{courseId}/review` — nota de 1 a 5; avaliar de novo substitui a anterior. */
export const rateCourse = async (
  courseId: string,
  rating: number,
): Promise<CourseReviewResponse> => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new CourseReviewError(400, 'A nota deve ser um número inteiro entre 1 e 5.');
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/student/courses/${courseId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ rating }),
  });

  if (!response.ok) {
    throw new CourseReviewError(
      response.status,
      (await readApiErrorMessage(response)) ?? messageForStatus(response.status),
    );
  }

  const json: ApiResponse<CourseReviewResponse> = await response.json();
  return json.data;
};
