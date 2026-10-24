import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';
import { Login } from './Login';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

    expect(screen.getByRole('link', { name: 'Aluno' })).toHaveAttribute('href', '/aluno/cursos');
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/cursos');
    expect(screen.getByRole('link', { name: 'Empresa' })).toHaveAttribute(
      'href',
      '/empresa/cursos',
    );
  });

  // Confirma que o perfil escolhido fica disponível para a guarda após o clique.
  it('stores the selected demo profile before navigating', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('link', { name: 'Admin' }));

    expect(localStorage.getItem('escapa_mock_user_role')).toBe('admin');
  });
});
