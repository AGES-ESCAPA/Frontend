import { render, screen, waitFor, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import { getStudentCurriculum } from '@services/curriculumService';
import { getStudentEnrollments, type StudentCourseCardResponse } from '@services/enrollmentService';
import type { PublicCourseCard, PublicCoursesPage } from '@/types/course';
import styles from '@components/ui/CourseCard/CourseCard.module.css';
import { Courses } from './Courses';

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourses: vi.fn(),
    getCourseFilters: vi.fn(),
  },
}));

vi.mock('@services/enrollmentService', () => ({
  getStudentEnrollments: vi.fn(),
}));

vi.mock('@services/curriculumService', () => ({
  getStudentCurriculum: vi.fn(),
}));

const getCoursesMock = vi.mocked(courseService.getCourses);
const getFiltersMock = vi.mocked(courseService.getCourseFilters);

const courseFilters = {
  categories: ['Gastronomia', 'Inteligência Artificial'],
  levels: ['INICIANTE', 'AVANCADO'],
};
const getEnrollmentsMock = vi.mocked(getStudentEnrollments);
const getCurriculumMock = vi.mocked(getStudentCurriculum);

const course: PublicCourseCard = {
  id: 'e0000000-0000-4000-e000-000000000005',
  title: 'Inovação em Destinos Turísticos',
  shortDescription:
    'Como criar e gerir destinos turísticos competitivos e inovadores no mercado global',
  category: 'Inovação',
  level: 'AVANCADO',
  durationTime: 840,
  lessonsCount: 38,
  price: 127,
  thumbnailUrl: 'https://cdn.escapa.com/courses/inovacao.jpg',
  instructor: 'Thamires Magalhães',
  ratingAverage: 4.7,
  reviewsCount: 94,
};

const emptyPage: PublicCoursesPage = {
  content: [],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
};

const pageWithCourse: PublicCoursesPage = {
  content: [course],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
};

const emptyEnrollments = {
  content: [],
  pageNumber: 0,
  pageSize: 50,
  totalElements: 0,
  totalPages: 0,
};

const acquiredEnrollment: StudentCourseCardResponse = {
  courseId: course.id,
  title: course.title,
  instructor: course.instructor,
  thumbnailUrl: course.thumbnailUrl,
  durationTime: course.durationTime,
  lessonsCount: course.lessonsCount ?? 0,
  progressPercentage: 20,
  enrollmentStatus: 'IN_PROGRESS',
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderCourses = (path = '/aluno/cursos'): RenderResult =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Courses />
    </MemoryRouter>,
  );

const waitForCatalog = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('status', { name: /carregando cursos/i })).not.toBeInTheDocument();
  });
};

describe('Courses', () => {
  beforeEach(() => {
    getCoursesMock.mockReset().mockResolvedValue(emptyPage);
    getFiltersMock.mockReset().mockResolvedValue(courseFilters);
    getEnrollmentsMock.mockReset().mockResolvedValue(emptyEnrollments);
    getCurriculumMock.mockReset();
  });

  it('should integrate the student Sidebar and authenticated Navbar', async () => {
    renderCourses();
    await waitForCatalog();

    expect(
      screen.getByRole('complementary', { name: /menu lateral — aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /perfil de jorge amado/i })).toBeInTheDocument();
  });

  it('should mark Courses as the current sidebar destination', async () => {
    renderCourses();
    await waitForCatalog();

    const sidebar = screen.getByRole('complementary');
    const coursesLink = within(sidebar).getByRole('link', { name: 'Cursos' });

    expect(coursesLink).toHaveAttribute('href', '/aluno/cursos');
    expect(coursesLink).toHaveAttribute('aria-current', 'page');
  });

  it('should offer the Course Builder only to the admin profile', async () => {
    renderCourses('/aluno/cursos');
    await waitForCatalog();
    expect(screen.queryByRole('link', { name: 'Novo Curso' })).not.toBeInTheDocument();

    renderCourses('/admin/cursos');
    await waitForCatalog();

    expect(screen.getByRole('link', { name: 'Novo Curso' })).toHaveAttribute(
      'href',
      '/admin/cursos/novo',
    );
  });

  it.each([
    ['/admin/cursos', 'Admin', 'Admin'],
    ['/empresa/cursos', 'Empresa', 'Escapa!'],
  ])('should render the variant for %s', async (path, roleLabel, userName) => {
    renderCourses(path);
    await waitForCatalog();

    expect(
      screen.getByRole('complementary', {
        name: new RegExp(`menu lateral — ${roleLabel}`, 'i'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(userName, 'i') })).toBeInTheDocument();
  });

  it('shows the public catalog headings, search and filters', async () => {
    renderCourses();
    await waitForCatalog();

    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cursos em Destaque' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Todos os Cursos' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar cursos/i })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Gastronomia' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Iniciante' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Avançado' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Marketing' })).not.toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Categoria' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Nível' })).toBeInTheDocument();
    expect(screen.getByText('0 cursos encontrados')).toBeInTheDocument();
  });

  it('shows the price on courses the student has not purchased', async () => {
    getCoursesMock.mockResolvedValue(pageWithCourse);

    renderCourses();

    expect(await screen.findAllByText(course.title)).not.toHaveLength(0);
    expect(screen.getAllByText(/R\$\s*127,00/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Adquirido')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /acessar o curso/i })).not.toBeInTheDocument();
  });

  it('shows purchased courses in grayscale with the acquired tag and access button', async () => {
    getCoursesMock.mockResolvedValue(pageWithCourse);
    getEnrollmentsMock.mockResolvedValue({
      ...emptyEnrollments,
      content: [acquiredEnrollment],
      totalElements: 1,
      totalPages: 1,
    });

    renderCourses();

    expect(await screen.findAllByText('Adquirido')).not.toHaveLength(0);
    expect(
      screen.getAllByRole('button', { name: /acessar o curso inovação/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/R\$\s*127,00/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /capa do curso inovação/i })[0]).toHaveClass(
      styles.imageAcquired,
    );
  });

  it('opens the classroom when the student accesses a purchased course', async () => {
    getCoursesMock.mockResolvedValue(pageWithCourse);
    getEnrollmentsMock.mockResolvedValue({
      ...emptyEnrollments,
      content: [acquiredEnrollment],
      totalElements: 1,
      totalPages: 1,
    });
    getCurriculumMock.mockResolvedValue({
      courseId: course.id,
      completedLessons: 0,
      totalLessons: 1,
      modules: [
        {
          id: 'module-1',
          title: 'Módulo 1',
          locked: false,
          completedLessons: 0,
          totalLessons: 1,
          lessons: [
            {
              id: 'lesson-1',
              title: 'Aula 1',
              durationMinutes: 10,
              status: 'AVAILABLE',
            },
          ],
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/aluno/cursos']}>
        <Routes>
          <Route path="/aluno/cursos" element={<Courses />} />
          <Route path="/aluno/cursos/:courseId/aulas/:lessonId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const [accessButton] = await screen.findAllByRole('button', { name: /acessar o curso/i });
    await userEvent.click(accessButton);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        `/aluno/cursos/${course.id}/aulas/lesson-1`,
      );
    });
  });

  it('requests the catalog with the selected category and level', async () => {
    const user = userEvent.setup();
    renderCourses();
    await waitForCatalog();
    getCoursesMock.mockClear();

    await user.click(await screen.findByRole('tab', { name: 'Inteligência Artificial' }));
    await user.click(screen.getByRole('tab', { name: 'Iniciante' }));

    await waitFor(() => {
      expect(getCoursesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Inteligência Artificial',
          level: 'Iniciante',
        }),
        expect.any(AbortSignal),
      );
    });
  });

  it('keeps the company catalog priced and does not load student enrollments', async () => {
    getCoursesMock.mockResolvedValue(pageWithCourse);

    renderCourses('/empresa/cursos');

    expect((await screen.findAllByText(/R\$\s*127,00/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Adquirido')).not.toBeInTheDocument();
    expect(getEnrollmentsMock).not.toHaveBeenCalled();
  });
});
