import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe('Login', () => {
  it('should render the logo and the platform subtitle', () => {
    renderLogin();

    expect(screen.getByAltText('escapa! - Plataforma de Cursos')).toBeInTheDocument();
    expect(screen.getByText('Plataforma de cursos')).toBeInTheDocument();
  });

  it('should render one courses link for each role', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: 'Estudante' })).toHaveAttribute(
      'href',
      '/courses?role=student',
    );
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/courses?role=admin',
    );
    expect(screen.getByRole('link', { name: 'Empresa' })).toHaveAttribute(
      'href',
      '/courses?role=company',
    );
  });
});
