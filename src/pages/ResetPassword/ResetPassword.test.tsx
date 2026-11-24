import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, authService } from '@services/authService';
import { ResetPassword } from './ResetPassword';

const TOKEN = 'reset-token-abc';
const ACCOUNT_EMAIL = 'maria.silva@escapa.com.br';

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderResetPassword = (entry = `/redefinir-senha?token=${TOKEN}`) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <ResetPassword />
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

describe('ResetPassword', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('treats a link without token as invalid without calling the API', async () => {
    const getPasswordResetToken = vi.spyOn(authService, 'getPasswordResetToken');
    renderResetPassword('/redefinir-senha');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(getPasswordResetToken).not.toHaveBeenCalled();
  });

  it('shows the whole screen with the fields locked while the token loads', () => {
    vi.spyOn(authService, 'getPasswordResetToken').mockReturnValue(new Promise(() => undefined));
    renderResetPassword();

    expect(screen.getByRole('heading', { name: 'Redefinir senha' })).toBeInTheDocument();
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Nova senha')).toBeDisabled();
    expect(screen.getByLabelText('Confirmar senha')).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Redefinir senha' })).toBeDisabled();
  });

  it('shows the account e-mail after the token loads successfully', async () => {
    const getPasswordResetToken = vi
      .spyOn(authService, 'getPasswordResetToken')
      .mockResolvedValue({ email: ACCOUNT_EMAIL });
    renderResetPassword();

    expect(await screen.findByText(ACCOUNT_EMAIL)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Redefinir senha' })).toBeInTheDocument();
    expect(getPasswordResetToken).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
  });

  it('explains that an invalid or used link (404) no longer works and links to recovery and login', async () => {
    vi.spyOn(authService, 'getPasswordResetToken').mockRejectedValue(
      new AuthServiceError(404, 'Token not found'),
    );
    renderResetPassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(screen.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute(
      'href',
      '/esqueci-minha-senha',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('asks for a new link when the token expired (410)', async () => {
    vi.spyOn(authService, 'getPasswordResetToken').mockRejectedValue(
      new AuthServiceError(410, 'Token has expired'),
    );
    renderResetPassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Solicite um novo em “Esqueci minha senha”.',
    );
    expect(screen.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute(
      'href',
      '/esqueci-minha-senha',
    );
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('shows a connection message when the token cannot be validated due to a network failure', async () => {
    vi.spyOn(authService, 'getPasswordResetToken').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    renderResetPassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível validar o link. Verifique sua conexão e tente novamente.',
    );
    expect(screen.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute(
      'href',
      '/esqueci-minha-senha',
    );
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('does not send passwords that differ', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    const resetPassword = vi.spyOn(authService, 'resetPassword');
    renderResetPassword();

    await fillPasswords(user, 'senha-segura', 'outra-senha');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('As senhas devem ser iguais.');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('does not send a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    const resetPassword = vi.spyOn(authService, 'resetPassword');
    renderResetPassword();

    await fillPasswords(user, '1234567');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha deve ter pelo menos 8 caracteres.',
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('sends the user to login after resetting the password successfully', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    const resetPassword = vi.spyOn(authService, 'resetPassword').mockResolvedValue(undefined);
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
    expect(resetPassword).toHaveBeenCalledWith(TOKEN, 'senha-segura');
  });

  it('shows the password the backend rejected (400) as a field error, not as a connection problem', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(
      new AuthServiceError(400, 'Password must be at least 8 characters'),
    );
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha não foi aceita. Use pelo menos 8 caracteres.',
    );
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Verifique sua conexão e tente novamente.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveValue('senha-segura');
  });

  it('shows the password the backend rejected (422) as a field error', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(
      new AuthServiceError(422, 'Unprocessable Entity'),
    );
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha não foi aceita. Use pelo menos 8 caracteres.',
    );
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the expired message when the token expires before the password is sent (404)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(
      new AuthServiceError(404, 'Token not found'),
    );
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('shows the expired message when the token expires before the password is sent (410)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(
      new AuthServiceError(410, 'Token has expired'),
    );
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Solicite um novo em “Esqueci minha senha”.',
    );
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
  });

  it('reports a server error (500) as a server problem, not as a connection problem', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(
      new AuthServiceError(500, 'Internal Server Error'),
    );
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByText('Não foi possível redefinir a senha')).toBeInTheDocument();
    expect(
      screen.getByText('Ocorreu um erro no servidor. Tente novamente em instantes.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Verifique sua conexão e tente novamente.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveValue('senha-segura');
  });

  it('shows a toast on network failure and keeps the typed passwords', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getPasswordResetToken').mockResolvedValue({ email: ACCOUNT_EMAIL });
    vi.spyOn(authService, 'resetPassword').mockRejectedValue(new TypeError('Failed to fetch'));
    renderResetPassword();

    await fillPasswords(user, 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByText('Não foi possível redefinir a senha')).toBeInTheDocument();
    expect(screen.getByText('Verifique sua conexão e tente novamente.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveValue('senha-segura');
    expect(screen.getByLabelText('Confirmar senha')).toHaveValue('senha-segura');
    expect(screen.getByTestId('location')).toHaveTextContent('/redefinir-senha');
  });
});
