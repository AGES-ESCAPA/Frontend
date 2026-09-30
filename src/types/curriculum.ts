/**
 * types/curriculum.ts
 *
 * Grade de aulas do curso para o aluno (US-13), usada pelo menu lateral da
 * Sala de Aula. O formato já é o que o `CourseNavigationSidebar` recebe.
 */

/** Status de uma aula para o aluno, calculado pelo backend. */
export type CurriculumLessonStatus = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export interface CurriculumLesson {
  id: string;
  title: string;
  /** Duração em minutos; `0` quando a aula não tem duração cadastrada. */
  durationMinutes: number;
  status: CurriculumLessonStatus;
}

export interface CurriculumModule {
  id: string;
  title: string;
  /** `true` quando todas as aulas do módulo estão bloqueadas. */
  locked: boolean;
  completedLessons: number;
  totalLessons: number;
  lessons: CurriculumLesson[];
}

export interface StudentCurriculum {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  modules: CurriculumModule[];
}
