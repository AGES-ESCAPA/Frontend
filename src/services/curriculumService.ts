/**
 * services/curriculumService.ts
 *
 * Grade de aulas do curso para o aluno (US-13). As telas nunca chamam `fetch`
 * diretamente: elas usam estas funções.
 */
import type { CurriculumLessonStatus, StudentCurriculum } from '@/types/curriculum';
import { readApiErrorMessage, studentHeaders } from '@services/api';
import type { ApiResponse } from '@services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CurriculumLessonResponse {
  lessonId: string;
  title: string;
  order: number | null;
  type: string;
  durationMinutes: number | null;
  status: CurriculumLessonStatus;
}

interface CurriculumModuleResponse {
  moduleId: string;
  title: string;
  order: number | null;
  locked: boolean;
  completedLessons: number;
  totalLessons: number;
  lessons: CurriculumLessonResponse[];
}

interface StudentCurriculumResponse {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  modules: CurriculumModuleResponse[];
}

export class StudentCurriculumError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'StudentCurriculumError';
    this.status = status;
  }
}

// Mantém a ordem recebida: o backend já devolve módulos e aulas na ordem
// definida pelo administrador.
const mapStudentCurriculum = (data: StudentCurriculumResponse): StudentCurriculum => ({
  courseId: data.courseId,
  completedLessons: data.completedLessons,
  totalLessons: data.totalLessons,
  modules: data.modules.map((courseModule) => ({
    id: courseModule.moduleId,
    title: courseModule.title,
    locked: courseModule.locked,
    completedLessons: courseModule.completedLessons,
    totalLessons: courseModule.totalLessons,
    lessons: courseModule.lessons.map((lesson) => ({
      id: lesson.lessonId,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes ?? 0,
      status: lesson.status,
    })),
  })),
});

/** `GET /student/courses/{courseId}/curriculum` (AGES-ESCAPA/Backend#35). */
export const getStudentCurriculum = async (
  courseId: string,
  signal?: AbortSignal,
): Promise<StudentCurriculum> => {
  const response = await fetch(`${API_BASE_URL}/student/courses/${courseId}/curriculum`, {
    method: 'GET',
    headers: studentHeaders(),
    signal,
  });

  if (!response.ok) {
    throw new StudentCurriculumError(
      response.status,
      (await readApiErrorMessage(response)) ?? 'Não foi possível carregar o conteúdo do curso.',
    );
  }

  const json: ApiResponse<StudentCurriculumResponse> = await response.json();

  return mapStudentCurriculum(json.data);
};
