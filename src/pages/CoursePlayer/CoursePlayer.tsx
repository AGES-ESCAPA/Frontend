import { Link, useParams } from 'react-router-dom';
import { Button } from '@components/ui';
import { LessonVideoPlayer } from '@components/course/LessonVideoPlayer/LessonVideoPlayer';
import { AuthenticatedLayout } from '@components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '@components/layout/Sidebar/sidebarMenuPresets';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import { mockUser } from '@pages/MyCourses/mockCourses';
import styles from './CoursePlayer.module.css';
import { LessonContent } from '@components/ui/LessonContent/LessonContent';
import { LessonReferences } from '@components/ui/ReferenceAndExternalLinks/ReferenceAndExternalLinks';

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
          <div className={styles.layout}>
            <div className={styles.mainColumn}>
              <div className={`${styles.skeleton} ${styles.playerSkeleton}`} aria-hidden="true" />

              <header className={styles.header}>
                <div className={`${styles.skeleton} ${styles.skeletonBreadcrumb}`} />
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
              </header>

              <LessonContent isLoading />
              <LessonReferences isLoading />
            </div>
          </div>
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

          <p>Não foi possível encontrar a aula solicitada.</p>

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

    const moduleNumber = lesson.module?.order;
    const lessonNumber = lesson.order;
    const durationMinutes =
      lesson.durationInSeconds != null ? Math.round(lesson.durationInSeconds / 60) : null;

    const lessonMetadata = [
      moduleNumber != null ? `MÓDULO ${moduleNumber}` : null,
      lessonNumber != null ? `AULA ${lessonNumber}` : null,
      durationMinutes != null ? `${durationMinutes} min` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <section className={styles.lesson}>
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            {lesson.type === 'video' ? (
              lesson.videoUrl ? (
                <div className={styles.playerContainer}>
                  <LessonVideoPlayer src={lesson.videoUrl} title={lesson.title} />
                </div>
              ) : (
                <div className={styles.nonVideoContent}>
                  <p>Vídeo indisponível para esta aula.</p>
                </div>
              )
            ) : (
              <div className={styles.nonVideoContent} data-testid="non-video-lesson">
                <p>O conteúdo desta aula será exibido aqui.</p>
              </div>
            )}

            <header className={styles.header}>
              {lessonMetadata && <span className={styles.breadcrumb}>{lessonMetadata}</span>}

              <h1>{lesson.title}</h1>
            </header>

            {/* US-12: conteúdo textual da aula */}
            <LessonContent description={lesson.description} concepts={lesson.concepts} />
            <LessonReferences references={lesson.references} />

            {/* US-16: materiais complementares */}
            <section className={styles.reservedArea} data-area="Materiais" aria-label="Materiais" />
          </div>

          {/* US-13: menu lateral da aula */}
          <aside
            className={styles.sidebarColumn}
            data-area="Menu lateral"
            aria-label="Menu lateral"
          />

          {/* US-14/US-15: navegação entre aulas */}
          <nav
            className={styles.bottomNavigation}
            data-area="Navegação inferior"
            aria-label="Navegação inferior"
          />
        </div>
      </section>
    );
  };

  return (
    <AuthenticatedLayout role="student" user={mockUser} items={SIDEBAR_MENU_PRESETS.student}>
      <div className={styles.page}>{renderContent()}</div>
    </AuthenticatedLayout>
  );
};
