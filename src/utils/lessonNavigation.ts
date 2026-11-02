import type { CurriculumLesson, StudentCurriculum } from '@/types/curriculum';

export interface LessonNeighbors {
  current: CurriculumLesson | null;
  /** Aula anterior na ordem do curso, ou `null` na primeira aula. */
  previous: CurriculumLesson | null;
  /** Aula seguinte na ordem do curso, ou `null` na última aula. */
  next: CurriculumLesson | null;
}

/**
 * Localiza a aula atual na grade do curso (US-14) e devolve as vizinhas,
 * atravessando módulos. A ordem é a recebida do backend.
 */
export const findLessonNeighbors = (
  curriculum: StudentCurriculum | null,
  lessonId: string,
): LessonNeighbors => {
  const lessons = curriculum?.modules.flatMap((courseModule) => courseModule.lessons) ?? [];
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);

  if (index === -1) {
    return { current: null, previous: null, next: null };
  }

  return {
    current: lessons[index],
    previous: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
  };
};
