import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { PublicCourseCard, PublicCoursesPage } from '@/types/course';
import { Home } from './Home';

const getCoursesMock = vi.mocked(courseService.getCourses);

vi.mock('@services/courseService', () => ({
  courseService: {
    getCourses: vi.fn(),
  },
}));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const buildCourse = (overrides: Partial<PublicCourseCard> = {}): PublicCourseCard => ({
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelência em Hospedagem',
  shortDescription: 'A jornada do hospede...',
  category: 'Hospitalidade',
  level: 'INICIANTE',
  durationTime: 480,
  lessonsCount: 5,
  price: 249.9,
  thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
  instructor: 'Beatriz Nunes',
  ratingAverage: 4.5,
  reviewsCount: 2,
  ...overrides,
});

const buildPage = (courses: PublicCourseCard[]): PublicCoursesPage => ({
  content: courses,
  pageNumber: 0,
  pageSize: courses.length || 10,
  totalElements: courses.length,
  totalPages: courses.length > 0 ? 1 : 0,
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cursos/:courseId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Home', () => {
  beforeEach(() => {
    getCoursesMock.mockReset();
  });

  it('should render the public navbar and institutional footer', async () => {
    getCoursesMock.mockResolvedValue(buildPage([]));
    renderHome();

    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /página inicial/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /acessar a plataforma/i })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: /rodapé institucional/i })).toBeInTheDocument();

    await waitFor(() => expect(getCoursesMock).toHaveBeenCalled());
  });

  it('should show skeleton loading while the API request is pending', () => {
    getCoursesMock.mockReturnValue(new Promise(() => undefined));
    renderHome();

    expect(
      screen.getByRole('status', { name: /carregando cursos em destaque/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /carregando cursos$/i })).toBeInTheDocument();
  });

  it('should render featured and catalog course cards from the API', async () => {
    const course = buildCourse();
    getCoursesMock.mockResolvedValue(buildPage([course]));
    renderHome();

    expect(await screen.findAllByRole('heading', { name: course.title })).toHaveLength(2);
    expect(screen.getAllByText(course.shortDescription).length).toBeGreaterThan(0);
    expect(screen.getAllByText('8h').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*249/).length).toBeGreaterThan(0);
    expect(screen.getByText('1 curso encontrado')).toBeInTheDocument();
  });

  it('should navigate to the course details page when a card is clicked', async () => {
    const user = userEvent.setup();
    const course = buildCourse();
    getCoursesMock.mockResolvedValue(buildPage([course]));
    renderHome();

    const cards = await screen.findAllByRole('button', {
      name: `Ver detalhes do curso ${course.title}`,
    });
    await user.click(cards[0]);

    expect(screen.getByTestId('location')).toHaveTextContent(`/cursos/${course.id}`);
  });

  it('should show a generic error with retry when the API fails', async () => {
    const user = userEvent.setup();
    getCoursesMock.mockRejectedValue(new Error('network'));
    renderHome();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/não foi possível carregar os cursos/i)).toBeInTheDocument();

    getCoursesMock.mockResolvedValue(buildPage([buildCourse()]));
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(await screen.findByRole('heading', { name: /cursos em destaque/i })).toBeInTheDocument();
    expect(await screen.findAllByText('Atendimento de Excelência em Hospedagem')).not.toHaveLength(
      0,
    );
  });

  it('should request the public courses route with category and level filters', async () => {
    const user = userEvent.setup();
    getCoursesMock.mockResolvedValue(buildPage([]));
    renderHome();

    await waitFor(() => expect(screen.getByText(/0 cursos encontrados/i)).toBeInTheDocument());
    getCoursesMock.mockClear();

    await user.click(screen.getByRole('tab', { name: 'Inteligência Artificial' }));
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

  it('should search courses by title through the public API', async () => {
    const user = userEvent.setup();
    getCoursesMock.mockResolvedValue(buildPage([]));
    renderHome();

    await waitFor(() => expect(screen.getByText(/0 cursos encontrados/i)).toBeInTheDocument());
    getCoursesMock.mockClear();

    await user.type(screen.getByRole('textbox', { name: /buscar cursos/i }), 'IA');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(getCoursesMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'IA' }),
        expect.any(AbortSignal),
      );
    });
  });

  it('should keep catalog filters independent from each other', async () => {
    getCoursesMock.mockResolvedValue(buildPage([]));
    renderHome();

    await waitFor(() => expect(screen.getByText(/0 cursos encontrados/i)).toBeInTheDocument());

    const categoryTabs = screen.getByRole('tablist', { name: 'Categoria' });
    const levelTabs = screen.getByRole('tablist', { name: 'Nível' });

    expect(within(categoryTabs).getByRole('tab', { name: 'Todos' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(within(levelTabs).getByRole('tab', { name: 'Todos' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });
});
