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

const profileDestinations: Array<{ role: AuthUser['role']; destination: string }> = [
  { role: 'STUDENT', destination: '/meus-cursos' },
  { role: 'EMPLOYEE', destination: '/meus-cursos' },
  { role: 'COMPANY', destination: '/empresa/colaboradores' },
  { role: 'ADMIN', destination: '/admin/cursos' },
];

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

    expect(screen.getByRole('heading', { name: 'Painel de login' })).toBeInTheDocument();
    expect(screen.getByAltText('escapa!')).toBeInTheDocument();
    expect(screen.getByText('cursos')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('placeholder', 'email@escapa.com.br');
    expect(screen.getByLabelText(/Senha/)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/Senha/)).toHaveAttribute('placeholder', '*******');
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/esqueci-minha-senha',
    );
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro');
    expect(
      screen.getByText(
        `© ${new Date().getFullYear()} Escapa! Cursos. Todos os direitos reservados.`,
      ),
    ).toBeInTheDocument();
  });

  it.each(profileDestinations)(
    'starts the session and sends a $role to their panel',
    async ({ role, destination }) => {
      const user = userEvent.setup();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const authenticatedUser = { ...student, id: `user-${role}`, role };
      vi.spyOn(authService, 'login').mockResolvedValue({
        token: 'jwt-token',
        expiresIn: 120,
        user: authenticatedUser,
      });
      renderLogin();

      await user.type(screen.getByLabelText(/E-mail/), authenticatedUser.email);
      await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(destination));
      expect(localStorage.getItem('access_token')).toBe('jwt-token');
      expect(localStorage.getItem('access_token_expires_at')).toBe(String(now + 120_000));
    },
  );

  it('returns to the protected route that originated the login', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 120,
      user: student,
    });

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

  it('returns to the pending purchase route after login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('escapa:purchase-redirect', '/cursos/course-1');
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 120,
      user: student,
    });
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/cursos/course-1'),
    );
    expect(localStorage.getItem('escapa:purchase-redirect')).toBeNull();
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
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(student.email);
  });

  it('preserves the form and retries after a network failure', async () => {
    const user = userEvent.setup();
    const login = vi
      .spyOn(authService, 'login')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ token: 'jwt-token', expiresIn: 120, user: student });
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Não foi possível entrar')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(student.email);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(login).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/meus-cursos'));
  });

  it('prevents duplicate submissions while the login is in progress', async () => {
    const user = userEvent.setup();
    let resolveLogin: (session: {
      token: string;
      user: AuthUser;
      expiresIn: number;
    }) => void = () => undefined;
    const pendingLogin = new Promise<{ token: string; user: AuthUser; expiresIn: number }>(
      (resolve) => {
        resolveLogin = resolve;
      },
    );
    const login = vi.spyOn(authService, 'login').mockReturnValue(pendingLogin);
    renderLogin();

    await user.type(screen.getByLabelText(/E-mail/), student.email);
    await user.type(screen.getByLabelText(/Senha/), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(login).toHaveBeenCalledTimes(1);

    resolveLogin({ token: 'jwt-token', expiresIn: 120, user: student });
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/meus-cursos'));
  });

  it('sends an already authenticated user to their own panel', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({ ...student, role: 'COMPANY' });
    renderLogin();

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/empresa/colaboradores'),
    );
  });
});
