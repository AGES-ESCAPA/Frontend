import type { ComponentProps } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCourseNavigation } from '@/data/courseNavigation';
import { CourseNavigationSidebar } from './CourseNavigationSidebar';

type SidebarProps = ComponentProps<typeof CourseNavigationSidebar>;

const buildLessonHref = (lessonId: string) => `/aluno/cursos/curso-1/aulas/${lessonId}`;

const renderSidebar = (props: Partial<SidebarProps> = {}) =>
  render(
    <MemoryRouter>
      <CourseNavigationSidebar
        {...mockCourseNavigation}
        currentLessonId="experiencias-imersivas"
        buildLessonHref={buildLessonHref}
        {...props}
      />
    </MemoryRouter>,
  );

const getModuleTrigger = (title: string) => screen.getByRole('button', { name: new RegExp(title) });

describe('CourseNavigationSidebar', () => {
  it('should render the title, the course progress and the modules', () => {
    renderSidebar();

    expect(screen.getByRole('navigation', { name: 'Conteúdo do curso' })).toBeInTheDocument();
    expect(screen.getByText('Progresso do curso')).toBeInTheDocument();
    expect(screen.getByText('2/13')).toBeInTheDocument();
    const progress = screen.getByRole('progressbar', { name: 'Progresso do curso' });
    expect(Number(progress.getAttribute('aria-valuenow'))).toBeCloseTo((2 / 13) * 100);
    mockCourseNavigation.modules.forEach(({ title }) => {
      expect(getModuleTrigger(title)).toBeInTheDocument();
    });
  });

  it('should use the success appearance on the progress bar once the course is completed', () => {
    renderSidebar({ completedLessons: 13, totalLessons: 13 });

    expect(screen.getByRole('progressbar').className).toMatch(/success/);
  });

  it('should open only the module that contains the current lesson by default', () => {
    renderSidebar();

    expect(getModuleTrigger('Fundamentos do Turismo Receptivo')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(getModuleTrigger('Operação e Logística de Viagens')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('should keep every module closed when there is no current lesson', () => {
    renderSidebar({ currentLessonId: undefined });

    mockCourseNavigation.modules.forEach(({ title }) => {
      expect(getModuleTrigger(title)).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('should highlight the current lesson', () => {
    renderSidebar();

    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(
      'Experiências Imersivas na Prática',
    );
  });

  it('should allow several modules to be open at the same time', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(getModuleTrigger('Operação e Logística de Viagens'));

    expect(getModuleTrigger('Fundamentos do Turismo Receptivo')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(getModuleTrigger('Operação e Logística de Viagens')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('should collapse and expand the whole menu from the header', async () => {
    const user = userEvent.setup();
    renderSidebar();
    const toggle = screen.getByRole('button', { name: 'Conteúdo do curso' });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Progresso do curso')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Progresso do curso')).toBeInTheDocument();
  });

  it('should open the module of the new current lesson without closing the others', () => {
    const { rerender } = renderSidebar();
    const unlockedModules = mockCourseNavigation.modules.map((courseModule) =>
      courseModule.id === 'operacao-logistica'
        ? {
            ...courseModule,
            locked: false,
            lessons: courseModule.lessons.map((lesson) => ({
              ...lesson,
              status: 'AVAILABLE' as const,
            })),
          }
        : courseModule,
    );

    rerender(
      <MemoryRouter>
        <CourseNavigationSidebar
          {...mockCourseNavigation}
          modules={unlockedModules}
          currentLessonId="transporte"
          buildLessonHref={buildLessonHref}
        />
      </MemoryRouter>,
    );

    expect(getModuleTrigger('Operação e Logística de Viagens')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(getModuleTrigger('Fundamentos do Turismo Receptivo')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(
      'Transporte e Traslados',
    );
  });

  it('should navigate to a lesson without reloading the page', async () => {
    const user = userEvent.setup();

    // Simula a Sala de Aula: a rota define a aula atual e o menu fica montado entre as navegações.
    const Classroom = () => {
      const { lessonId } = useParams();
      const location = useLocation();
      return (
        <>
          <CourseNavigationSidebar
            {...mockCourseNavigation}
            currentLessonId={lessonId}
            buildLessonHref={buildLessonHref}
          />
          <p data-testid="location">{location.pathname}</p>
        </>
      );
    };

    render(
      <MemoryRouter initialEntries={[buildLessonHref('experiencias-imersivas')]}>
        <Routes>
          <Route path="/aluno/cursos/:courseId/aulas/:lessonId" element={<Classroom />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: /Introdução ao Turismo de Aventura/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/aluno/cursos/curso-1/aulas/introducao-turismo-aventura',
    );
    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(
      'Introdução ao Turismo de Aventura',
    );
  });
});
