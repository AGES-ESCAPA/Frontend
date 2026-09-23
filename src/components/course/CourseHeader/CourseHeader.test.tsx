import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { CourseHeader } from './CourseHeader';
import { featuredCourse } from '@/data/courses';
import type { CourseSummary } from '@/types/course';

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

describe('CourseHeader', () => {
  beforeEach(() => localStorage.clear());

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

  it('stores the purchase destination and redirects unauthenticated visitors to login', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/cursos/${featuredCourse.id}`]}>
        <CourseHeader course={featuredCourse} />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Cadastre-se para Comprar' }));

    expect(localStorage.getItem('escapa:purchase-redirect')).toBe(`/cursos/${featuredCourse.id}`);
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
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
