import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';

import { useAuth } from '../../hooks/useAuth';
import { vi } from 'vitest';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const renderLogin = () => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
};

describe('Login', () => {
  it('should render the logo and the platform subtitle', () => {
    renderLogin();

    expect(screen.getByAltText('escapa! - Plataforma de Cursos')).toBeInTheDocument();
    expect(screen.getByText('Plataforma de cursos')).toBeInTheDocument();
  });

  it('should render fallback buttons for Aluno and Admin', () => {
    renderLogin();

    expect(screen.getByRole('button', { name: 'Aluno' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
  });

  it('should render the login form', () => {
    renderLogin();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});
