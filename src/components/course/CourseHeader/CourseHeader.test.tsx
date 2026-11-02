import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import type { UserRole } from '@/types/auth';
import { getCourseAccessPath } from '@utils/courseAccess';
import { loadOwnedCourseIds } from '@utils/ownedCourses';
import { CourseHeader } from './CourseHeader';
import { featuredCourse } from '@/data/courses';
import type { CourseSummary } from '@/types/course';

vi.mock('@utils/ownedCourses', () => ({ loadOwnedCourseIds: vi.fn() }));
vi.mock('@utils/courseAccess', () => ({ getCourseAccessPath: vi.fn() }));

const loadOwnedMock = vi.mocked(loadOwnedCourseIds);
const accessPathMock = vi.mocked(getCourseAccessPath);

const authAs = (role: UserRole): AuthContextValue => ({
  user: { id: 'user-1', name: 'Mariana Costa', email: 'mariana@email.com', role },
  isAuthenticated: true,
  isRestoring: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
});

const withAuth = (role: UserRole, children: ReactNode) => (
  <AuthContext.Provider value={authAs(role)}>{children}</AuthContext.Provider>
);

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
};

describe('CourseHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    loadOwnedMock.mockReset().mockResolvedValue(new Set());
    accessPathMock.mockReset();
  });

  it('renders course information, badges and purchase action', () => {
    render(
      <MemoryRouter>
        <CourseHeader course={featuredCourse} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: featuredCourse.title })).toBeInTheDocument();
    expect(screen.getByText(featuredCourse.category)).toBeInTheDocument();
    expect(screen.getByText(featuredCourse.level)).toBeInTheDocument();
    expect(screen.getByText('Certificado')).toBeInTheDocument();
    expect(screen.getByText(featuredCourse.price)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastre-se para Comprar' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Imagem ilustrativa do curso' })).toBeInTheDocument();
  });

  it('shows the instructor avatar with the first letter of the name', () => {
    render(
      <MemoryRouter>
        <CourseHeader
          course={{
            ...featuredCourse,
            instructor: { name: 'Barbara Diogo', role: featuredCourse.instructor.role },
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders the cover image when thumbnailUrl is present', () => {
    render(
      <MemoryRouter>
        <CourseHeader
          course={{
            ...featuredCourse,
            thumbnailUrl: 'https://cdn.escapa.com/courses/atendimento.jpg',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Capa do curso' })).toHaveAttribute(
      'src',
      'https://cdn.escapa.com/courses/atendimento.jpg',
    );
    expect(
      screen.queryByRole('img', { name: 'Imagem ilustrativa do curso' }),
    ).not.toBeInTheDocument();
  });

  it('sends unauthenticated visitors to registration and stores the checkout as the way back', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/cursos/${featuredCourse.id}`]}>
        <CourseHeader course={featuredCourse} />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Cadastre-se para Comprar' }));

    expect(localStorage.getItem('escapa:purchase-redirect')).toBe(`/checkout/${featuredCourse.id}`);
    expect(screen.getByTestId('location')).toHaveTextContent(
      `/cadastro?returnTo=${encodeURIComponent(`/checkout/${featuredCourse.id}`)}`,
    );
  });

  it('offers the purchase to a logged user and opens the checkout of the course', async () => {
    const user = userEvent.setup();
    localStorage.setItem('access_token', 'token-de-teste');

    render(
      <MemoryRouter initialEntries={[`/cursos/${featuredCourse.id}`]}>
        <CourseHeader course={featuredCourse} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', { name: 'Cadastre-se para Comprar' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Comprar curso' }));

    expect(screen.getByTestId('location')).toHaveTextContent(`/checkout/${featuredCourse.id}`);
    expect(localStorage.getItem('escapa:purchase-redirect')).toBeNull();
  });

  it('lets a student who already owns the course open it instead of buying it again', async () => {
    const user = userEvent.setup();
    loadOwnedMock.mockResolvedValue(new Set([featuredCourse.id]));
    accessPathMock.mockResolvedValue(`/aluno/cursos/${featuredCourse.id}/aulas/aula-1`);

    render(
      withAuth(
        'STUDENT',
        <MemoryRouter initialEntries={[`/cursos/${featuredCourse.id}`]}>
          <CourseHeader course={featuredCourse} />
          <LocationProbe />
        </MemoryRouter>,
      ),
    );

    await user.click(await screen.findByRole('button', { name: 'Acessar curso' }));

    expect(screen.queryByRole('button', { name: 'Comprar curso' })).not.toBeInTheDocument();
    expect(accessPathMock).toHaveBeenCalledWith(featuredCourse.id);
    expect(screen.getByTestId('location')).toHaveTextContent(
      `/aluno/cursos/${featuredCourse.id}/aulas/aula-1`,
    );
  });

  it('keeps the purchase for a student who does not own the course yet', async () => {
    loadOwnedMock.mockResolvedValue(new Set(['outro-curso']));

    render(
      withAuth(
        'STUDENT',
        <MemoryRouter>
          <CourseHeader course={featuredCourse} />
        </MemoryRouter>,
      ),
    );

    expect(await screen.findByRole('button', { name: 'Comprar curso' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Acessar curso' })).not.toBeInTheDocument();
  });

  it('does not look up enrollments for a company, which buys the course for its team', () => {
    render(
      withAuth(
        'COMPANY',
        <MemoryRouter>
          <CourseHeader course={featuredCourse} />
        </MemoryRouter>,
      ),
    );

    expect(screen.getByRole('button', { name: 'Comprar curso' })).toBeEnabled();
    expect(loadOwnedMock).not.toHaveBeenCalled();
  });

  it('offers free lessons when every lesson in the course is free', async () => {
    const user = userEvent.setup();
    const onViewFreeLessons = vi.fn();
    const freeOnlyCourse: CourseSummary = {
      ...featuredCourse,
      modules: [
        {
          id: 'gratis',
          title: 'Módulo gratuito',
          lessonCount: 2,
          totalMinutes: 20,
          lessons: [
            { id: 'aula-1', title: 'Aula 1', type: 'video', durationMinutes: 10, isFree: true },
            { id: 'aula-2', title: 'Aula 2', type: 'text', durationMinutes: 10, isFree: true },
          ],
        },
      ],
    };

    render(
      <MemoryRouter>
        <CourseHeader course={freeOnlyCourse} onViewFreeLessons={onViewFreeLessons} />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('button', { name: 'Ver aulas grátis (2)' });
    expect(cta).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cadastre-se para Comprar' }),
    ).not.toBeInTheDocument();

    await user.click(cta);

    expect(onViewFreeLessons).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('escapa:purchase-redirect')).toBeNull();
  });
});
