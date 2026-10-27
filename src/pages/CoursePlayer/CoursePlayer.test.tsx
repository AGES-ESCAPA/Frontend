import type { ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentCurriculum } from '@/types/curriculum';
import type { Lesson } from '@/types/lesson';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import {
  completeStudentLesson,
  getStudentCurriculum,
  StudentCurriculumError,
} from '@services/curriculumService';
import { CoursePlayer } from './CoursePlayer';

vi.mock('@/hooks/useStudentLesson', () => ({
  useStudentLesson: vi.fn(),
}));

vi.mock('@services/curriculumService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getStudentCurriculum: vi.fn(),
  completeStudentLesson: vi.fn(),
}));

vi.mock('@components/course/LessonVideoPlayer/LessonVideoPlayer', () => ({
  LessonVideoPlayer: ({
    src,
    title,
    previousAction,
    nextAction,
    controlsAction,
  }: {
    src: string;
    title: string;
    previousAction?: ReactNode;
    nextAction?: ReactNode;
    controlsAction?: ReactNode;
  }) => (
    <div>
      <div data-testid="lesson-video-player">
        {title} - {src}
      </div>
      <div data-testid="player-actions">
        {previousAction}
        {nextAction}
        {controlsAction}
      </div>
    </div>
  ),
}));

const useStudentLessonMock = vi.mocked(useStudentLesson);

const getStudentCurriculumMock = vi.mocked(getStudentCurriculum);

const completeStudentLessonMock = vi.mocked(completeStudentLesson);

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
    completeStudentLessonMock.mockReset();
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

    const materials = document.querySelector('[data-area="Materiais"]');

    expect(materials).toHaveAttribute('aria-label', 'Materiais');

    expect(materials).toBeEmptyDOMElement();

    expect(document.querySelector('[data-area="Navegação inferior"]')).toHaveAttribute(
      'aria-label',
      'Navegação inferior',
    );

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

  it('should render only the formatted text for a text lesson, without the player area', () => {
    const article = 'Primeiro parágrafo.\nCom quebra de linha.\n\nSegundo parágrafo.';
    const textLesson: Lesson = {
      ...lesson,
      type: 'text',
      videoUrl: null,
      description: article,
      textContent: article,
    };

    mockSuccessfulLesson(textLesson);

    renderCoursePlayer();

    expect(screen.queryByTestId('lesson-video-player')).not.toBeInTheDocument();
    expect(screen.queryByTestId('non-video-lesson')).not.toBeInTheDocument();

    const content = screen.getByRole('article', { name: 'Conteúdo da aula' });
    const paragraphs = within(content).getAllByText(/parágrafo/);

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent('Primeiro parágrafo. Com quebra de linha.');

    // O artigo não se repete na seção "Sobre esta aula".
    expect(screen.queryByText('Sobre esta aula')).not.toBeInTheDocument();
  });

  it('should render a file lesson like a text lesson, with a link to the file', () => {
    mockSuccessfulLesson({
      ...lesson,
      type: 'file',
      videoUrl: null,
      description: 'Leia o material antes da próxima aula.',
      fileUrl: 'https://example.com/material.pdf',
    });

    renderCoursePlayer();

    expect(screen.queryByTestId('lesson-video-player')).not.toBeInTheDocument();
    expect(screen.queryByTestId('non-video-lesson')).not.toBeInTheDocument();

    const content = screen.getByRole('article', { name: 'Conteúdo da aula' });

    expect(within(content).getByText('Leia o material antes da próxima aula.')).toBeInTheDocument();
    expect(within(content).getByRole('link', { name: 'Abrir arquivo da aula' })).toHaveAttribute(
      'href',
      'https://example.com/material.pdf',
    );

    expect(screen.queryByText('Sobre esta aula')).not.toBeInTheDocument();
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

  describe('lesson completion and navigation (US-14/US-15)', () => {
    const LOCKED_LESSON_ID = '02000000-0000-4000-9000-000000000184';

    const pendingCurriculum: StudentCurriculum = {
      ...curriculum,
      completedLessons: 0,
      modules: [
        {
          ...curriculum.modules[0],
          completedLessons: 0,
          lessons: [
            { ...curriculum.modules[0].lessons[0], status: 'AVAILABLE' },
            { ...curriculum.modules[0].lessons[1], status: 'LOCKED' },
          ],
        },
        curriculum.modules[1],
      ],
    };

    const renderAt = (lessonId: string) =>
      render(
        <MemoryRouter initialEntries={[`/aluno/cursos/${COURSE_ID}/aulas/${lessonId}`]}>
          <Routes>
            <Route path="/aluno/cursos/:courseId/aulas/:lessonId" element={<CoursePlayer />} />
          </Routes>
        </MemoryRouter>,
      );

    it('should complete the lesson, refresh the menu and go to the next lesson', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock
        .mockResolvedValueOnce(pendingCurriculum)
        .mockResolvedValueOnce(curriculum);
      completeStudentLessonMock.mockResolvedValue();
      mockSuccessfulLesson();

      renderCoursePlayer();

      const completeButton = await screen.findByRole('button', { name: 'Marcar como concluída' });

      // Em aula de vídeo, os botões ficam no player e não na navegação inferior.
      expect(
        within(screen.getByTestId('player-actions')).getByRole('button', {
          name: 'Marcar como concluída',
        }),
      ).toBe(completeButton);

      expect(screen.queryByRole('button', { name: 'Aula anterior' })).not.toBeInTheDocument();

      // A próxima aula ainda está bloqueada: só o botão de concluir leva até ela.
      expect(screen.queryByRole('button', { name: /Próxima aula/ })).not.toBeInTheDocument();

      await user.click(completeButton);

      expect(completeStudentLessonMock).toHaveBeenCalledWith(COURSE_ID, LESSON_ID);

      await waitFor(() => expect(getStudentCurriculumMock).toHaveBeenCalledTimes(2));

      await waitFor(() =>
        expect(screen.getByRole('link', { name: /Mapeando a jornada do hóspede/ })).toHaveAttribute(
          'aria-current',
          'page',
        ),
      );
    });

    it('should show the error and stay on the lesson when completion fails', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock.mockResolvedValue(pendingCurriculum);
      completeStudentLessonMock.mockRejectedValue(
        new StudentCurriculumError(403, 'Você não possui acesso a esta aula.'),
      );
      mockSuccessfulLesson();

      renderCoursePlayer();

      await user.click(await screen.findByRole('button', { name: 'Marcar como concluída' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Você não possui acesso a esta aula.',
      );

      expect(getStudentCurriculumMock).toHaveBeenCalledTimes(1);
    });

    it('should mark an already completed lesson and allow moving to the next one', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock.mockResolvedValue(curriculum);
      mockSuccessfulLesson();

      renderCoursePlayer();

      expect(await screen.findByRole('button', { name: 'Marcar como concluída' })).toBeEnabled();

      await user.click(
        screen.getByRole('button', { name: 'Próxima aula: Mapeando a jornada do hóspede' }),
      );

      await waitFor(() =>
        expect(screen.getByRole('link', { name: /Mapeando a jornada do hóspede/ })).toHaveAttribute(
          'aria-current',
          'page',
        ),
      );

      expect(completeStudentLessonMock).not.toHaveBeenCalled();
    });

    it('should offer the previous lesson and only complete on the last lesson of the course', async () => {
      getStudentCurriculumMock.mockResolvedValue(curriculum);
      mockSuccessfulLesson({ ...lesson, id: LOCKED_LESSON_ID, title: 'Parcerias locais' });

      renderAt(LOCKED_LESSON_ID);

      expect(
        await screen.findByRole('button', { name: 'Marcar como concluída' }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: 'Aula anterior: Mapeando a jornada do hóspede' }),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /Próxima aula/ })).not.toBeInTheDocument();
    });

    it('should show the buttons in the bottom navigation for a non-video lesson', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock.mockResolvedValue(curriculum);
      completeStudentLessonMock.mockResolvedValue();
      mockSuccessfulLesson({
        ...lesson,
        id: LOCKED_LESSON_ID,
        title: 'Parcerias locais',
        type: 'text',
        videoUrl: null,
      });

      renderAt(LOCKED_LESSON_ID);

      const bottomNavigation = screen.getByRole('navigation', { name: 'Navegação inferior' });

      expect(
        await within(bottomNavigation).findByRole('button', { name: 'Marcar como concluída' }),
      ).toBeInTheDocument();

      expect(screen.queryByTestId('player-actions')).not.toBeInTheDocument();

      await user.click(within(bottomNavigation).getByRole('button', { name: 'Aula anterior' }));

      await waitFor(() =>
        expect(screen.getByRole('link', { name: /Mapeando a jornada do hóspede/ })).toHaveAttribute(
          'aria-current',
          'page',
        ),
      );
    });

    it('should keep the buttons in the player and allow completing when the video lesson has no URL', async () => {
      const user = userEvent.setup();

      getStudentCurriculumMock.mockResolvedValue(pendingCurriculum);
      completeStudentLessonMock.mockResolvedValue();
      mockSuccessfulLesson({ ...lesson, videoUrl: null });

      renderCoursePlayer();

      const playerActions = screen.getByTestId('player-actions');

      const completeButton = await within(playerActions).findByRole('button', {
        name: 'Marcar como concluída',
      });

      expect(
        within(screen.getByRole('navigation', { name: 'Navegação inferior' })).queryByRole(
          'button',
        ),
      ).not.toBeInTheDocument();

      await user.click(completeButton);

      expect(completeStudentLessonMock).toHaveBeenCalledWith(COURSE_ID, LESSON_ID);
    });

    it('should keep the buttons out of a Vimeo embed', async () => {
      getStudentCurriculumMock.mockResolvedValue(pendingCurriculum);
      mockSuccessfulLesson({ ...lesson, videoUrl: 'https://vimeo.com/123456789' });

      renderCoursePlayer();

      const bottomNavigation = screen.getByRole('navigation', { name: 'Navegação inferior' });

      expect(
        await within(bottomNavigation).findByRole('button', { name: 'Marcar como concluída' }),
      ).toBeInTheDocument();

      expect(screen.getByTestId('player-actions')).toBeEmptyDOMElement();
    });
  });
});
