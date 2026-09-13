import { render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Courses } from './Courses';

const renderCourses = (path = '/aluno/cursos'): RenderResult =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Courses />
    </MemoryRouter>,
  );

describe('Courses', () => {
  it('should integrate the student Sidebar and authenticated Navbar', () => {
    renderCourses();

    expect(
      screen.getByRole('complementary', { name: /menu lateral — aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /perfil de jorge amado/i })).toBeInTheDocument();
  });

  it('should mark Courses as the current sidebar destination', () => {
    renderCourses();

    const sidebar = screen.getByRole('complementary');
    const coursesLink = within(sidebar).getByRole('link', { name: 'Cursos' });

    expect(coursesLink).toHaveAttribute('href', '/aluno/cursos');
    expect(coursesLink).toHaveAttribute('aria-current', 'page');
  });

  it('should offer the Course Builder only to the admin profile', () => {
    renderCourses('/aluno/cursos');
    expect(screen.queryByRole('link', { name: 'Novo Curso' })).not.toBeInTheDocument();

    renderCourses('/admin/cursos');

    expect(screen.getByRole('link', { name: 'Novo Curso' })).toHaveAttribute(
      'href',
      '/admin/cursos/novo',
    );
  });

  it.each([
    ['/admin/cursos', 'Admin', 'Admin'],
    ['/empresa/cursos', 'Empresa', 'Escapa!'],
  ])('should render the variant for %s', (path, roleLabel, userName) => {
    renderCourses(path);

    expect(
      screen.getByRole('complementary', {
        name: new RegExp(`menu lateral — ${roleLabel}`, 'i'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(userName, 'i') })).toBeInTheDocument();
  });
});
