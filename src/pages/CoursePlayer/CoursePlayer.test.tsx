import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentCurriculum } from '@/types/curriculum';
import type { Lesson } from '@/types/lesson';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import { getStudentCurriculum, StudentCurriculumError } from '@services/curriculumService';
import { CoursePlayer } from './CoursePlayer';

vi.mock('@/hooks/useStudentLesson', () => ({
  useStudentLesson: vi.fn(),
}));

vi.mock('@services/curriculumService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getStudentCurriculum: vi.fn(),
}));

vi.mock('@components/course/LessonVideoPlayer/LessonVideoPlayer', () => ({
  LessonVideoPlayer: ({ src, title }: { src: string; title: string }) => (
    <div data-testid="lesson-video-player">
      {title} - {src}
    </div>
  ),
}));

const useStudentLessonMock = vi.mocked(useStudentLesson);

const getStudentCurriculumMock = vi.mocked(getStudentCurriculum);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const LESSON_ID = '02000000-0000-4000-9000-000000000182';

const NEXT_LESSON_ID = '02000000-0000-4000-9000-000000000183';

const MODULE_ID = '01000000-0000-4000-9000-000000000018';

const curriculum: StudentCurriculum = {
  courseId: COURSE_ID,
  completedLessons: 1,
  totalLessons: 3,
  modules: [
    {
      id: MODULE_ID,
      title: 'Módulo 1',
      locked: false,
      completedLessons: 1,
      totalLessons: 2,
      lessons: [
        { id: LESSON_ID, title: 'Introdução ao curso', durationMinutes: 10, status: 'COMPLETED' },
        {
          id: NEXT_LESSON_ID,
          title: 'Mapeando a jornada do hóspede',
          durationMinutes: 12,
          status: 'AVAILABLE',
        },
      ],
    },
    {
      id: '01000000-0000-4000-9000-000000000019',
      title: 'Módulo 2',
      locked: true,
      completedLessons: 0,
      totalLessons: 1,
      lessons: [
        {
          id: '02000000-0000-4000-9000-000000000184',
          title: 'Parcerias locais',
          durationMinutes: 8,
          status: 'LOCKED',
        },
      ],
    },
  ],
};

const lesson: Lesson = {
  id: LESSON_ID,
  moduleId: MODULE_ID,
  module: {
    id: MODULE_ID,
    title: 'Módulo 1',
    order: 1,
  },
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
    <MemoryRouter initialEntries={[`/aluno/cursos/${COURSE_ID}/aulas/${LESSON_ID}`]}>
      <Routes>
        <Route path="/aluno/cursos/:courseId/aulas/:lessonId" element={<CoursePlayer />} />
        <Route path="/cursos/:courseId" element={<p>Detalhes do curso</p>} />
      </Routes>
    </MemoryRouter>,
  );

const mockSuccessfulLesson = (currentLesson: Lesson = lesson) => {
  useStudentLessonMock.mockReturnValue({
    lesson: currentLesson,
    status: 'success',
    errorStatus: null,
    errorMessage: null,
    retry: retryMock,
  });
};

describe('CoursePlayer', () => {
  beforeEach(() => {
    useStudentLessonMock.mockReset();
    retryMock.mockReset();
    getStudentCurriculumMock.mockReset();
    // Por padrão o menu fica carregando; os testes do menu definem a resposta.
    getStudentCurriculumMock.mockReturnValue(new Promise<StudentCurriculum>(() => {}));
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
    mockSuccessfulLesson();

    renderCoursePlayer();

    expect(
      screen.getByRole('heading', {
        name: lesson.title,
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(screen.getByTestId('lesson-video-player')).toHaveTextContent(lesson.title);

    expect(screen.getByTestId('lesson-video-player')).toHaveTextContent(lesson.videoUrl ?? '');
  });

  it('should render the dynamic lesson metadata below the player', () => {
    mockSuccessfulLesson();

    renderCoursePlayer();

    const player = screen.getByTestId('lesson-video-player');

    const heading = screen.getByRole('heading', {
      name: lesson.title,
      level: 1,
    });

    const metadata = screen.getByText('MÓDULO 1 · AULA 2 · 10 min');

    const header = heading.closest('header');

    expect(header).not.toBeNull();

    expect(within(header!).getByText('MÓDULO 1 · AULA 2 · 10 min')).toBeInTheDocument();

    expect(metadata).toBeInTheDocument();

    expect(player.compareDocumentPosition(header!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should not render the lesson description in the header', () => {
    mockSuccessfulLesson();

    renderCoursePlayer();

    const heading = screen.getByRole('heading', {
      name: lesson.title,
      level: 1,
    });

    const header = heading.closest('header');

    expect(header).not.toBeNull();

    expect(within(header!).queryByText(lesson.description)).not.toBeInTheDocument();

    expect(screen.getByText('Sobre esta aula')).toBeInTheDocument();
    expect(screen.getByText(lesson.description)).toBeInTheDocument();
  });

  it('should reserve the areas for the other user stories', () => {
    mockSuccessfulLesson();

    renderCoursePlayer();

    const areaNames = ['Materiais', 'Navegação inferior'];

    for (const areaName of areaNames) {
      const area = document.querySelector(`[data-area="${areaName}"]`);

      expect(area).not.toBeNull();

      expect(area).toHaveAttribute('aria-label', areaName);

      expect(area).toBeEmptyDOMElement();
    }

    expect(document.querySelector('[data-area="Menu lateral"]')).toHaveAttribute(
      'aria-label',
      'Menu lateral',
    );
  });

  it('should render the lesson concepts and references when provided by the API', () => {
    const lessonWithSupplements: Lesson = {
      ...lesson,
      concepts: ['React', 'Hooks'],
      references: [{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }],
    };

    mockSuccessfulLesson(lessonWithSupplements);

    renderCoursePlayer();

    expect(screen.getByText('Sobre esta aula')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Referências e links externos')).toBeInTheDocument();
    expect(screen.getByText('MDN Web Docs')).toBeInTheDocument();
  });

  it('should not render the content or references sections when the lesson has none', () => {
    const emptyLesson: Lesson = {
      ...lesson,
      description: '',
      concepts: [],
      references: [],
    };

    mockSuccessfulLesson(emptyLesson);

    renderCoursePlayer();

    expect(screen.queryByText('Sobre esta aula')).not.toBeInTheDocument();
    expect(screen.queryByText('Referências e links externos')).not.toBeInTheDocument();
  });

  it('should render the content and references skeletons while loading', () => {
    useStudentLessonMock.mockReturnValue({
      lesson: null,
      status: 'loading',
      errorStatus: null,
      errorMessage: null,
      retry: retryMock,
    });

    renderCoursePlayer();

    expect(screen.getByTestId('lesson-content-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-references-skeleton')).toBeInTheDocument();
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

    mockSuccessfulLesson(textLesson);

    renderCoursePlayer();

    expect(screen.queryByTestId('lesson-video-player')).not.toBeInTheDocument();

    expect(screen.getByTestId('non-video-lesson')).toBeInTheDocument();
  });

  describe('lesson menu (US-13)', () => {
    const getLessonMenu = () =>
      screen.getByRole('complementary', {
        name: 'Menu lateral',
      });

    it('should show a skeleton in the menu while the curriculum loads', () => {
      mockSuccessfulLesson();

      renderCoursePlayer();

      expect(
        within(getLessonMenu()).getByRole('status', {
          name: 'Carregando conteúdo do curso',
        }),
      ).toBeInTheDocument();

      expect(screen.getByTestId('lesson-video-player')).toBeInTheDocument();
    });

    it('should fill the progress, modules and lessons from the API', async () => {
      getStudentCurriculumMock.mockResolvedValue(curriculum);
      mockSuccessfulLesson();

      renderCoursePlayer();

      const menu = getLessonMenu();

      expect(await within(menu).findByText('1/3')).toBeInTheDocument();

      expect(getStudentCurriculumMock).toHaveBeenCalledWith(COURSE_ID, expect.any(AbortSignal));

      expect(within(menu).getByRole('button', { name: /Módulo 1/ })).toBeInTheDocument();

      expect(within(menu).getByRole('button', { name: /Módulo 2/ })).toBeInTheDocument();

      expect(
        within(menu).getByRole('link', {
          name: /Mapeando a jornada do hóspede/,
        }),
      ).toHaveAttribute('href', `/aluno/cursos/${COURSE_ID}/aulas/${NEXT_LESSON_ID}`);
    });

    it('should not request the curriculum again when moving to another lesson of the course', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock.mockResolvedValue(curriculum);
      mockSuccessfulLesson();

      renderCoursePlayer();

      const nextLessonLink = await within(getLessonMenu()).findByRole('link', {
        name: /Mapeando a jornada do hóspede/,
      });

      await user.click(nextLessonLink);

      await waitFor(() =>
        expect(
          within(getLessonMenu()).getByRole('link', {
            name: /Mapeando a jornada do hóspede/,
          }),
        ).toHaveAttribute('aria-current', 'page'),
      );

      expect(getStudentCurriculumMock).toHaveBeenCalledTimes(1);
    });

    it('should show an error with retry inside the menu without affecting the player', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock
        .mockRejectedValueOnce(new StudentCurriculumError(500, 'Internal Server Error'))
        .mockResolvedValueOnce(curriculum);
      mockSuccessfulLesson();

      renderCoursePlayer();

      const menu = getLessonMenu();

      expect(await within(menu).findByRole('alert')).toHaveTextContent(
        'Não foi possível carregar o conteúdo do curso.',
      );

      expect(screen.getByTestId('lesson-video-player')).toBeInTheDocument();

      await user.click(within(menu).getByRole('button', { name: 'Tentar novamente' }));

      expect(await within(menu).findByText('1/3')).toBeInTheDocument();

      expect(getStudentCurriculumMock).toHaveBeenCalledTimes(2);
    });

    it('should hide the menu when the student has no access to the course', async () => {
      getStudentCurriculumMock.mockRejectedValue(new StudentCurriculumError(403, 'Acesso negado.'));
      mockSuccessfulLesson();

      renderCoursePlayer();

      await waitFor(() => expect(getLessonMenu()).toBeEmptyDOMElement());

      expect(screen.getByTestId('lesson-video-player')).toBeInTheDocument();
    });
  });
});
