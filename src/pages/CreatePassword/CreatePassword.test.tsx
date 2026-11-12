import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { CreatePassword } from './CreatePassword';

const TOKEN = 'convite-felipe-andrade-dev';

const invite = {
  name: 'Felipe Andrade',
  email: 'felipe.andrade@vistamar.com.br',
  companyName: 'Pousada Vista Mar LTDA',
};

const employee: AuthUser = {
  id: 'employee-1',
  name: 'Felipe Andrade',
  email: 'felipe.andrade@vistamar.com.br',
  role: 'EMPLOYEE',
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderCreatePassword = (entry = `/criar-senha?token=${TOKEN}`) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <CreatePassword />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );

const fillPasswords = async (
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  confirmation = password,
) => {
  await waitFor(() => expect(screen.getByLabelText('Nova senha')).toBeEnabled());
  await user.type(screen.getByLabelText('Nova senha'), password);
  await user.type(screen.getByLabelText('Confirmar senha'), confirmation);
};

describe('CreatePassword', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows the company name and the employee e-mail of the invite', async () => {
    const getInvite = vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    renderCreatePassword();

    expect(
      await screen.findByText('Pousada Vista Mar LTDA - felipe.andrade@vistamar.com.br'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument();
    expect(getInvite).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
  });

  it('shows the whole screen with the fields locked while the invite loads', () => {
    vi.spyOn(authService, 'getInvite').mockReturnValue(new Promise(() => undefined));
    renderCreatePassword();

    expect(screen.getByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Carregando convite' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toBeDisabled();
    expect(screen.getByLabelText('Confirmar senha')).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Criar' })).toBeDisabled();
  });

  it('starts the session and opens My Courses after creating the password', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    const createInvitePassword = vi
      .spyOn(authService, 'createInvitePassword')
      .mockResolvedValue({ token: 'jwt-token', user: employee, expiresIn: 3600 });
    renderCreatePassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/meus-cursos'));
    expect(createInvitePassword).toHaveBeenCalledWith(TOKEN, 'senha-segura');
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
  });

  it('does not send passwords that differ', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    const createInvitePassword = vi.spyOn(authService, 'createInvitePassword');
    renderCreatePassword();

    await fillPasswords(user, 'senha-segura', 'outra-senha');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('As senhas devem ser iguais.');
    expect(createInvitePassword).not.toHaveBeenCalled();
  });

  it('does not send a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    const createInvitePassword = vi.spyOn(authService, 'createInvitePassword');
    renderCreatePassword();

    await fillPasswords(user, '1234567');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha deve ter pelo menos 8 caracteres.',
    );
    expect(createInvitePassword).not.toHaveBeenCalled();
  });

  it('explains that an invalid or used link (404) no longer works and links to login', async () => {
    vi.spyOn(authService, 'getInvite').mockRejectedValue(
      new AuthServiceError(404, 'Invite not found'),
    );
    renderCreatePassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('asks for a new invite when the link expired (410)', async () => {
    vi.spyOn(authService, 'getInvite').mockRejectedValue(
      new AuthServiceError(410, 'Invite has expired'),
    );
    renderCreatePassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Peça ao gestor da sua empresa um novo convite.',
    );
    expect(screen.queryByRole('link', { name: 'Ir para o login' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('shows the expired message when the invite expires before the password is sent', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    vi.spyOn(authService, 'createInvitePassword').mockRejectedValue(
      new AuthServiceError(410, 'Invite has expired'),
    );
    renderCreatePassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Peça ao gestor da sua empresa um novo convite.',
    );
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('shows a toast on network failure and keeps the typed passwords', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getInvite').mockResolvedValue(invite);
    vi.spyOn(authService, 'createInvitePassword').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    renderCreatePassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByText('Não foi possível criar a senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveValue('senha-segura');
    expect(screen.getByLabelText('Confirmar senha')).toHaveValue('senha-segura');
    expect(screen.getByTestId('location')).toHaveTextContent('/criar-senha');
  });

  it('treats a link without token as invalid without calling the API', async () => {
    const getInvite = vi.spyOn(authService, 'getInvite');
    renderCreatePassword('/criar-senha');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado',
    );
    expect(getInvite).not.toHaveBeenCalled();
  });
});
