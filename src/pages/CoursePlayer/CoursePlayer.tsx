import { Link, useParams } from 'react-router-dom';
import { Button } from '@components/ui';
import { LessonVideoPlayer } from '@components/course/LessonVideoPlayer/LessonVideoPlayer';
import { AuthenticatedLayout } from '@components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '@components/layout/Sidebar/sidebarMenuPresets';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import { mockUser } from '@pages/MyCourses/mockCourses';
import styles from './CoursePlayer.module.css';

export const CoursePlayer = () => {
  const { courseId = '', lessonId = '' } = useParams<{
    courseId: string;
    lessonId: string;
  }>();

  const { lesson, status, errorStatus, errorMessage, retry } = useStudentLesson(courseId, lessonId);

  const courseDetailsPath = `/cursos/${courseId}`;

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <section className={styles.lesson} aria-busy="true" aria-label="Carregando aula">
          <header className={styles.header}>
            <div className={`${styles.skeleton} ${styles.skeletonBreadcrumb}`} />
            <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeleton} ${styles.skeletonDescription}`} />
          </header>

          <div className={`${styles.skeleton} ${styles.playerSkeleton}`} aria-hidden="true" />
        </section>
      );
    }

    if (status === 'error' && errorStatus === 403) {
      return (
        <section className={styles.stateContainer}>
          <h1>Acesso à aula indisponível</h1>

          <p>{errorMessage ?? 'Você não possui acesso a esta aula.'}</p>

          <Link className={styles.courseLink} to={courseDetailsPath}>
            Ver detalhes do curso
          </Link>
        </section>
      );
    }

    if (status === 'error' && errorStatus === 404) {
      return (
        <section className={styles.stateContainer}>
          <h1>Aula não encontrada</h1>

          <p>{errorMessage ?? 'Não foi possível encontrar a aula solicitada.'}</p>

          <Link className={styles.courseLink} to={courseDetailsPath}>
            Voltar para o curso
          </Link>
        </section>
      );
    }

    if (status === 'error') {
      return (
        <section className={styles.stateContainer}>
          <h1>Não foi possível carregar a aula</h1>

          <p>{errorMessage ?? 'Ocorreu um erro ao carregar a aula.'}</p>

          <Button label="Tentar novamente" variant="outlined" onClick={retry} />
        </section>
      );
    }

    if (!lesson) {
      return null;
    }

    return (
      <section className={styles.lesson}>
        <header className={styles.header}>
          <span className={styles.breadcrumb}>ÁREA DO ALUNO • AULA</span>

          <h1>{lesson.title}</h1>

          {lesson.description && <p>{lesson.description}</p>}
        </header>

        {lesson.type === 'video' ? (
          lesson.videoUrl ? (
            <div className={styles.playerContainer}>
              <LessonVideoPlayer src={lesson.videoUrl} title={lesson.title} />
            </div>
          ) : (
            <div className={styles.stateContainer}>
              <p>Vídeo indisponível para esta aula.</p>
            </div>
          )
        ) : (
          <div className={styles.nonVideoContent} data-testid="non-video-lesson">
            <p>O conteúdo desta aula será exibido aqui.</p>
          </div>
        )}
      </section>
    );
  };

  return (
    <AuthenticatedLayout role="student" user={mockUser} items={SIDEBAR_MENU_PRESETS.student}>
      <div className={styles.page}>{renderContent()}</div>
    </AuthenticatedLayout>
  );
};
