import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CourseHeader } from './CourseHeader';
import { featuredCourse } from '@/data/courses';

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
});
