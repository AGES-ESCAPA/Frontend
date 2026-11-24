import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { SidebarRole } from '@components/layout';
import { CourseDetailModal } from '@components/course/CourseDetailModal/CourseDetailModal';
import { CourseHeader } from '@components/course/CourseHeader/CourseHeader';
import { CourseInstructor } from '@components/course/CourseInstructor/CourseInstructor';
import { CourseMaterials } from '@components/course/CourseMaterials/CourseMaterials';
import { CurriculumAccordion } from '@components/course/CurriculumAccordion/CurriculumAccordion';
import { VideoPlayer } from '@components/course/VideoPlayer/VideoPlayer';
import { useOptionalAuth } from '@contexts/useAuth';
import { usePublicCourseDetails } from '@hooks/usePublicCourseDetails';
import { Courses } from '@pages/Courses/Courses';
import { Home } from '@pages/Home/Home';
import type { UserRole } from '@/types/auth';
import styles from './CourseDetails.module.css';

const getLayoutRole = (role: UserRole | undefined): SidebarRole => {
  if (role === 'ADMIN') return 'admin';
  if (role === 'COMPANY') return 'company';
  return 'student';
};

const getCatalogPath = (role: UserRole | undefined): string => {
  if (role === 'COMPANY') return '/empresa/cursos';
  if (role === 'ADMIN') return '/admin/cursos';
  if (role === 'EMPLOYEE') return '/meus-cursos';
  return '/aluno/cursos';
};

const resolveClosePath = (from: unknown, role: UserRole | undefined): string => {
  if (typeof from === 'string' && from.startsWith('/')) return from;
  if (role) return getCatalogPath(role);
  return '/';
};

/** Preferência pelo catálogo de origem; senão o perfil da sessão. */
const resolveBackdropRole = (from: unknown, role: UserRole | undefined): SidebarRole => {
  if (typeof from === 'string') {
    if (from.startsWith('/empresa')) return 'company';
    if (from.startsWith('/admin')) return 'admin';
    if (from.startsWith('/aluno')) return 'student';
  }
  return getLayoutRole(role);
};

export const CourseDetails = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useOptionalAuth();
  const { course, status, errorMessage } = usePublicCourseDetails(courseId);
  const curriculumRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(auth?.isAuthenticated && auth.user);
  const isRestoring = Boolean(auth?.isRestoring);
  const from = (location.state as { from?: unknown } | null)?.from;
  const backdropRole = resolveBackdropRole(from, auth?.user?.role);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return undefined;

    background.inert = true;
    return () => {
      background.inert = false;
    };
  }, [isAuthenticated, isRestoring]);

  // Aberto a partir do catálogo logado, fechar volta para ele; acesso direto
  // com sessão cai no catálogo do perfil; visitante volta à Home.
  const handleClose = () => {
    navigate(resolveClosePath(from, isAuthenticated ? auth?.user?.role : undefined));
  };

  const handleViewFreeLessons = () => {
    curriculumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderBackground = () => {
    if (isAuthenticated) {
      // Mesmo padrão da Home no visitante: catálogo real atrás do modal.
      return <Courses layoutRole={backdropRole} />;
    }

    // Evita flash de "Entrar" / "Começar Agora" enquanto a sessão restaura.
    if (isRestoring) {
      return <div className={styles.authenticatedBackdrop} aria-hidden="true" />;
    }

    return <Home />;
  };

  return (
    <>
      <div ref={backgroundRef} className={styles.background} aria-hidden="true">
        {renderBackground()}
      </div>
      <CourseDetailModal onClose={handleClose}>
        {status === 'loading' && (
          <p className={styles.status} role="status">
            Carregando curso...
          </p>
        )}

        {status === 'error' && (
          <p className={styles.status} role="alert">
            {errorMessage ?? 'Curso não encontrado.'}
          </p>
        )}

        {status === 'success' && course && (
          <>
            <CourseHeader course={course} onViewFreeLessons={handleViewFreeLessons} />
            <section className={styles.teaser} aria-labelledby="teaser-title">
              <h2 id="teaser-title">Conheça o curso</h2>
              <VideoPlayer
                src={course.teaserUrl}
                title={course.title}
                ariaLabel={`Teaser do curso ${course.title}`}
                unavailableMessage="Vídeo não disponível para esse curso"
              />
            </section>
            {course.modules.length > 0 ? (
              <section
                ref={curriculumRef}
                aria-labelledby="curriculum-title"
                className={styles.curriculum}
              >
                <h2 id="curriculum-title">Currículo do Curso</h2>
                <CurriculumAccordion courseId={course.id} modules={course.modules} />
              </section>
            ) : null}
            {course.instructor.name ? <CourseInstructor instructor={course.instructor} /> : null}
            {course.materials.length > 0 ? <CourseMaterials materials={course.materials} /> : null}
          </>
        )}
      </CourseDetailModal>
    </>
  );
};
