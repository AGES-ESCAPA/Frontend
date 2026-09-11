import { useNavigate, useParams } from 'react-router-dom';
import { CourseDetailModal } from '@components/course/CourseDetailModal/CourseDetailModal';
import { CourseHeader } from '@components/course/CourseHeader/CourseHeader';
import { CurriculumAccordion } from '@components/course/CurriculumAccordion/CurriculumAccordion';
import { TeaserPlayer } from '@components/course/TeaserPlayer/TeaserPlayer';
import { getCourseById } from '@/data/courses';
import { Home } from '@pages/Home/Home';

export const CourseDetails = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId);

  return (
    <>
      <Home />
      <CourseDetailModal
        title={course?.title ?? 'Curso não encontrado'}
        onClose={() => navigate('/')}
      >
        {course ? (
          <>
            <CourseHeader course={course} />
            <TeaserPlayer src={course.teaserUrl} title={course.title} />
            <section aria-labelledby="curriculum-title" style={{ marginTop: 'var(--space-6)' }}>
              <h2 id="curriculum-title">Currículo do Curso</h2>
              <CurriculumAccordion modules={course.modules} />
            </section>
          </>
        ) : (
          <p>Curso não encontrado.</p>
        )}
      </CourseDetailModal>
    </>
  );
};
