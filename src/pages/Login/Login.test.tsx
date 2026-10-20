import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { Login } from './Login';

const student: AuthUser = {
  id: 'user-1',
  name: 'Jorge Amado',
  email: 'jorge@example.com',
  role: 'STUDENT',
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderLogin = (entry = '/login') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Login />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );

describe('Login', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the login fields and recovery links', () => {
    renderLogin();

    expect(screen.getByAltText('escapa! - Plataforma de Cursos')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/Senha/)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/esqueci-minha-senha',
    );
    expect(screen.getByRole('link', { name: 'Criar uma conta' })).toHaveAttribute(
      'href',
      '/cadastro',
    );
  });

  it('starts the session and sends a student to their default panel', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue({ token: 'jwt-token', user: student });
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/meus-cursos'));
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
  });

  it('returns to the protected route that originated the login', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue({ token: 'jwt-token', user: student });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/login', state: { returnTo: '/checkout/course-1' } }]}
      >
        <AuthProvider>
          <Login />
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/checkout/course-1'),
    );
  });

  it('shows a generic error for invalid credentials without clearing the e-mail', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValue(new AuthServiceError(401, 'Unauthorized'));
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(student.email);
  });

  it('explains when the account is disabled', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValue(new AuthServiceError(403, 'Forbidden'));
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta conta está desativada.');
  });

  it('shows a retry toast for network failures', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValue(new TypeError('Failed to fetch'));
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Não foi possível entrar')).toBeInTheDocument();
  });
});
