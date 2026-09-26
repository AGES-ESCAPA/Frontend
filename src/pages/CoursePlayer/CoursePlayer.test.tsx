import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lesson } from '@/types/lesson';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import { CoursePlayer } from './CoursePlayer';

vi.mock('@/hooks/useStudentLesson', () => ({
  useStudentLesson: vi.fn(),
}));

vi.mock('@components/course/LessonVideoPlayer/LessonVideoPlayer', () => ({
  LessonVideoPlayer: ({ src, title }: { src: string; title: string }) => (
    <div data-testid="lesson-video-player">
      {title} - {src}
    </div>
  ),
}));

const useStudentLessonMock = vi.mocked(useStudentLesson);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const LESSON_ID = '02000000-0000-4000-9000-000000000182';

const lesson: Lesson = {
  id: LESSON_ID,
  moduleId: '01000000-0000-4000-9000-000000000018',
  title: 'Introdução ao curso',
  description: 'Descrição da aula.',
  type: 'video',
  videoUrl: 'https://example.com/aula.mp4',
  durationInSeconds: 600,
  textContent: null,
  fileUrl: null,
  isFreeSample: false,
  resources: [],
  order: 2,
};

const retryMock = vi.fn();

const renderCoursePlayer = () =>
  render(
    <MemoryRouter initialEntries={[`/courses/${COURSE_ID}/lessons/${LESSON_ID}`]}>
      <Routes>
        <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
        <Route path="/cursos/:courseId" element={<p>Detalhes do curso</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('CoursePlayer', () => {
  beforeEach(() => {
    useStudentLessonMock.mockReset();
    retryMock.mockReset();
  });

  it('should render the loading skeleton', () => {
    useStudentLessonMock.mockReturnValue({
      lesson: null,
      status: 'loading',
      errorStatus: null,
      errorMessage: null,
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(screen.getByLabelText('Carregando aula')).toBeInTheDocument();

    expect(screen.queryByTestId('lesson-video-player')).not.toBeInTheDocument();
  });

  it('should render the lesson video from the API data', () => {
    useStudentLessonMock.mockReturnValue({
      lesson,
      status: 'success',
      errorStatus: null,
      errorMessage: null,
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(
      screen.getByRole('heading', {
        name: lesson.title,
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(lesson.description)).toBeInTheDocument();

    expect(screen.getByTestId('lesson-video-player')).toHaveTextContent(lesson.title);

    expect(screen.getByTestId('lesson-video-player')).toHaveTextContent(lesson.videoUrl ?? '');
  });

  it('should render the access denied state and link to the course details', async () => {
    const user = userEvent.setup();

    useStudentLessonMock.mockReturnValue({
      lesson: null,
      status: 'error',
      errorStatus: 403,
      errorMessage: 'Acesso à aula indisponível.',
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(
      screen.getByRole('heading', {
        name: 'Acesso à aula indisponível',
      }),
    ).toBeInTheDocument();

    const link = screen.getByRole('link', {
      name: 'Ver detalhes do curso',
    });

    expect(link).toHaveAttribute('href', `/cursos/${COURSE_ID}`);

    await user.click(link);

    expect(screen.getByText('Detalhes do curso')).toBeInTheDocument();
  });

  it('should render the lesson not found state', () => {
    useStudentLessonMock.mockReturnValue({
      lesson: null,
      status: 'error',
      errorStatus: 404,
      errorMessage: 'Aula não encontrada.',
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(
      screen.getByRole('heading', {
        name: 'Aula não encontrada',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'Voltar para o curso',
      }),
    ).toHaveAttribute('href', `/cursos/${COURSE_ID}`);
  });

  it('should allow retry after a generic error', async () => {
    const user = userEvent.setup();

    useStudentLessonMock.mockReturnValue({
      lesson: null,
      status: 'error',
      errorStatus: null,
      errorMessage: 'Não foi possível carregar a aula. Tente novamente.',
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(
      screen.getByRole('heading', {
        name: 'Não foi possível carregar a aula',
      }),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', {
      name: 'Tentar novamente',
    });

    await user.click(retryButton);

    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it('should not render the video player for a non-video lesson', () => {
    const textLesson: Lesson = {
      ...lesson,
      type: 'text',
      videoUrl: null,
      textContent: 'Conteúdo textual da aula.',
    };

    useStudentLessonMock.mockReturnValue({
      lesson: textLesson,
      status: 'success',
      errorStatus: null,
      errorMessage: null,
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(screen.queryByTestId('lesson-video-player')).not.toBeInTheDocument();

    expect(screen.getByTestId('non-video-lesson')).toBeInTheDocument();
  });
});
