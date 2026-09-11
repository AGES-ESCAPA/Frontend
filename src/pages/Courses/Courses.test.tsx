import { render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Courses } from './Courses';

// A Sidebar navega via Link do react-router — a página precisa de um Router.
const renderCourses = (): RenderResult => render(<Courses />, { wrapper: MemoryRouter });

describe('Courses', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/courses?role=student');
  });

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

    expect(coursesLink).toHaveAttribute('href', '/courses?role=student');
    expect(coursesLink).toHaveAttribute('aria-current', 'page');
  });

  it('should offer the Course Builder only to the admin profile', () => {
    renderCourses();
    expect(screen.queryByRole('link', { name: 'Novo Curso' })).not.toBeInTheDocument();

    window.history.replaceState({}, '', '/courses?role=admin');
    renderCourses();

    expect(screen.getByRole('link', { name: 'Novo Curso' })).toHaveAttribute(
      'href',
      '/admin/cursos/novo',
    );
  });

  it.each([
    ['admin', 'Admin', 'Admin'],
    ['company', 'Empresa', 'Escapa!'],
  ])('should render the %s variant', (role, roleLabel, userName) => {
    window.history.replaceState({}, '', `/courses?role=${role}`);
    renderCourses();

    expect(
      screen.getByRole('complementary', {
        name: new RegExp(`menu lateral — ${roleLabel}`, 'i'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(userName, 'i') })).toBeInTheDocument();
  });
});
