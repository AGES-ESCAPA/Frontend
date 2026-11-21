import type { StudentCurriculum } from '@/types/curriculum';
import { getStudentCurriculum } from '@services/curriculumService';

/** Primeira aula liberada na grade, ou a primeira da lista se nenhuma estiver AVAILABLE. */
export const getFirstAccessibleLessonId = (curriculum: StudentCurriculum): string | null => {
  const lessons = curriculum.modules.flatMap((module) => module.lessons);
  return (lessons.find((lesson) => lesson.status === 'AVAILABLE') ?? lessons[0])?.id ?? null;
};

/**
 * Rota para o aluno entrar num curso que já tem: a primeira aula disponível ou, se não houver, a
 * primeira da grade. Sem grade (ou com erro ao buscá-la), cai na página do curso, que ainda deixa
 * consultar o conteúdo.
 */
export const getCourseAccessPath = async (courseId: string): Promise<string> => {
  try {
    const curriculum = await getStudentCurriculum(courseId);
    const lessonId = getFirstAccessibleLessonId(curriculum);
    if (lessonId) return `/aluno/cursos/${courseId}/aulas/${lessonId}`;
  } catch {
    // Sem grade disponível, a página do curso ainda permite consultar o conteúdo.
  }

  return `/cursos/${courseId}`;
};
