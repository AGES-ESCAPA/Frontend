import { useNavigate, useParams } from 'react-router-dom';
import { CourseDetailModal } from '@components/course/CourseDetailModal/CourseDetailModal';
import { Home } from '@pages/Home/Home';

export const CourseDetails = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Home />
      <CourseDetailModal title={`Detalhes do curso: ${courseId}`} onClose={() => navigate('/')}>
        <p>Conteúdo detalhado do curso selecionado.</p>
      </CourseDetailModal>
    </>
  );
};
