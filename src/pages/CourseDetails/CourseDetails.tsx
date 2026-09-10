import { useNavigate, useParams } from 'react-router-dom';
import { CourseDetailModal } from '@components/course/CourseDetailModal/CourseDetailModal';
import { CourseHeader } from '@components/course/CourseHeader/CourseHeader';
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
        {course ? <CourseHeader course={course} /> : <p>Curso não encontrado.</p>}
      </CourseDetailModal>
    </>
  );
};
