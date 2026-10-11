import { Button } from '@components/ui';
import { CourseNavigationSidebar } from '@components/course/CourseNavigationSidebar';
import type { StudentCurriculumLoadError } from '@/hooks/useStudentCurriculum';
import type { StudentCurriculum } from '@/types/curriculum';
import styles from './LessonMenu.module.css';

export interface LessonMenuProps {
  data: StudentCurriculum | null;
  isLoading: boolean;
  error: StudentCurriculumLoadError | null;
  onRetry: () => void;
  currentLessonId?: string;
  buildLessonHref: (lessonId: string) => string;
}

const TITLE = 'Conteúdo do curso';
const SKELETON_MODULES = 3;

// Sem acesso ao curso ou curso/aula inexistente: a própria tela já mostra o
// erro (US-11), então o menu apenas não é exibido.
const HIDDEN_ERROR_STATUSES = new Set([400, 403, 404]);

const LessonMenuSkeleton = () => (
  <div
    className={styles.skeleton}
    role="status"
    aria-busy="true"
    aria-label="Carregando conteúdo do curso"
  >
    <h2 className={styles.title}>{TITLE}</h2>

    <div className={styles.section} aria-hidden="true">
      <span className={`${styles.bone} ${styles.progressLabelBone}`} />
      <span className={`${styles.bone} ${styles.progressBarBone}`} />
    </div>

    {Array.from({ length: SKELETON_MODULES }, (_, index) => (
      <div key={index} className={styles.section} aria-hidden="true">
        <span className={`${styles.bone} ${styles.moduleTitleBone}`} />
        <span className={`${styles.bone} ${styles.moduleMetaBone}`} />
      </div>
    ))}
  </div>
);

/**
 * Menu de aulas da Sala de Aula (US-13) com os estados da integração: carrega
 * com skeleton, mostra o erro com "Tentar novamente" sem afetar o player e,
 * com os dados, renderiza o `CourseNavigationSidebar`.
 */
export const LessonMenu = ({
  data,
  isLoading,
  error,
  onRetry,
  currentLessonId,
  buildLessonHref,
}: LessonMenuProps) => {
  // Durante um refetch os dados atuais continuam na tela até a resposta chegar.
  if (data) {
    return (
      <CourseNavigationSidebar
        completedLessons={data.completedLessons}
        totalLessons={data.totalLessons}
        modules={data.modules}
        currentLessonId={currentLessonId}
        buildLessonHref={buildLessonHref}
      />
    );
  }

  if (isLoading) {
    return <LessonMenuSkeleton />;
  }

  if (!error || (error.status !== null && HIDDEN_ERROR_STATUSES.has(error.status))) {
    return null;
  }

  return (
    <div className={styles.error} role="alert">
      <h2 className={styles.title}>{TITLE}</h2>

      <div className={styles.errorBody}>
        <p className={styles.errorMessage}>Não foi possível carregar o conteúdo do curso.</p>
        <Button label="Tentar novamente" variant="outlined" onClick={onRetry} />
      </div>
    </div>
  );
};
