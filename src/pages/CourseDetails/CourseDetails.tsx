import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { CourseDetailModal } from '@components/course/CourseDetailModal/CourseDetailModal';
import { CourseHeader } from '@components/course/CourseHeader/CourseHeader';
import { CourseMaterials } from '@components/course/CourseMaterials/CourseMaterials';
import { CurriculumAccordion } from '@components/course/CurriculumAccordion/CurriculumAccordion';
import { TeaserPlayer } from '@components/course/TeaserPlayer/TeaserPlayer';
import { usePublicCourseDetails } from '@hooks/usePublicCourseDetails';
import { Home } from '@pages/Home/Home';
import styles from './CourseDetails.module.css';

export const CourseDetails = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { course, status, errorMessage } = usePublicCourseDetails(courseId);
  const curriculumRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return undefined;

    background.inert = true;
    return () => {
      background.inert = false;
    };
  }, []);

  const handleClose = () => {
    navigate('/');
  };

  const handleViewFreeLessons = () => {
    curriculumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div ref={backgroundRef} className={styles.background} aria-hidden="true">
        <Home />
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
            <TeaserPlayer src={course.teaserUrl} title={course.title} />
            {course.modules.length > 0 ? (
              <section
                ref={curriculumRef}
                aria-labelledby="curriculum-title"
                className={styles.curriculum}
              >
                <h2 id="curriculum-title">Currículo do Curso</h2>
                <CurriculumAccordion modules={course.modules} />
              </section>
            ) : null}
            {course.materials.length > 0 ? <CourseMaterials materials={course.materials} /> : null}
          </>
        )}
      </CourseDetailModal>
    </>
  );
};
