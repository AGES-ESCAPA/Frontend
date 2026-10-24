import { getStudentCurriculum } from '@services/curriculumService';

/**
 * Rota para o aluno entrar num curso que já tem: a primeira aula disponível ou, se não houver, a
 * primeira da grade. Sem grade (ou com erro ao buscá-la), cai na página do curso, que ainda deixa
 * consultar o conteúdo.
 */
export const getCourseAccessPath = async (courseId: string): Promise<string> => {
  try {
    const curriculum = await getStudentCurriculum(courseId);
    const lessons = curriculum.modules.flatMap((module) => module.lessons);
    const nextLesson = lessons.find((lesson) => lesson.status === 'AVAILABLE') ?? lessons[0];
    if (nextLesson) return `/aluno/cursos/${courseId}/aulas/${nextLesson.id}`;
  } catch {
    // Sem grade disponível, a página do curso ainda permite consultar o conteúdo.
  }

  return `/cursos/${courseId}`;
};
