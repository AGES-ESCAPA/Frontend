import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, authService } from '@services/authService';
import { ForgotPassword } from './ForgotPassword';

const ACCOUNT_EMAIL = 'maria.silva@escapa.com.br';

const renderForgotPassword = (entry = '/esqueci-minha-senha') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <ForgotPassword />
      </AuthProvider>
    </MemoryRouter>,
  );

describe('ForgotPassword', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the recovery form with e-mail field and links', () => {
    renderForgotPassword();

    expect(screen.getByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('placeholder', 'email@escapa.com.br');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('button', { name: 'Enviar link' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('shows an inline error when the e-mail field is empty', async () => {
    const user = userEvent.setup();
    const requestPasswordReset = vi.spyOn(authService, 'requestPasswordReset');
    renderForgotPassword();

    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o e-mail da sua conta.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows the success message and a login link after the request succeeds', async () => {
    const user = userEvent.setup();
    const requestPasswordReset = vi
      .spyOn(authService, 'requestPasswordReset')
      .mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('E-mail'), ACCOUNT_EMAIL);
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(
      await screen.findByText(
        'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Verifique sua caixa de entrada.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(requestPasswordReset).toHaveBeenCalledWith(ACCOUNT_EMAIL);
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
  });

  it('shows a validation error when the backend rejects the e-mail (400)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'requestPasswordReset').mockRejectedValue(
      new AuthServiceError(400, 'Invalid email'),
    );
    renderForgotPassword();

    await user.type(screen.getByLabelText('E-mail'), 'invalido');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Verifique sua conexão e tente novamente.')).not.toBeInTheDocument();
  });

  it('shows a validation error when the backend rejects the e-mail (422)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'requestPasswordReset').mockRejectedValue(
      new AuthServiceError(422, 'Unprocessable Entity'),
    );
    renderForgotPassword();

    await user.type(screen.getByLabelText('E-mail'), 'invalido');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports a server error (500) as a server problem, not as a connection problem', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'requestPasswordReset').mockRejectedValue(
      new AuthServiceError(500, 'Internal Server Error'),
    );
    renderForgotPassword();

    await user.type(screen.getByLabelText('E-mail'), ACCOUNT_EMAIL);
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('Não foi possível enviar o link')).toBeInTheDocument();
    expect(
      screen.getByText('Ocorreu um erro no servidor. Tente novamente em instantes.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Verifique sua conexão e tente novamente.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveValue(ACCOUNT_EMAIL);
  });

  it('shows a toast on network failure and keeps the typed e-mail', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'requestPasswordReset').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    renderForgotPassword();

    await user.type(screen.getByLabelText('E-mail'), ACCOUNT_EMAIL);
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('Não foi possível enviar o link')).toBeInTheDocument();
    expect(screen.getByText('Verifique sua conexão e tente novamente.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveValue(ACCOUNT_EMAIL);
  });

  it('clears the inline error when the user types again', async () => {
    const user = userEvent.setup();
    const requestPasswordReset = vi.spyOn(authService, 'requestPasswordReset');
    renderForgotPassword();

    await user.click(screen.getByRole('button', { name: 'Enviar link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o e-mail da sua conta.');

    await user.type(screen.getByLabelText('E-mail'), 'm');

    await waitFor(() =>
      expect(screen.queryByRole('alert', { name: /Informe o e-mail/i })).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid', 'true');
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});
