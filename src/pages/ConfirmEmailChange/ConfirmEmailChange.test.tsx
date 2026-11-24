import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthServiceError, authService } from '@services/authService';
import { ConfirmEmailChange } from './ConfirmEmailChange';

const TOKEN = 'email-change-token-xyz';

const tokenDetails = {
  name: 'Carlos Mendes',
  currentEmail: 'carlos.antigo@escapa.com.br',
  newEmail: 'carlos.novo@escapa.com.br',
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderConfirmEmailChange = (entry = `/confirmar-email?token=${TOKEN}`) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <ConfirmEmailChange />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );

describe('ConfirmEmailChange', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('treats a link without token as invalid without calling the API', async () => {
    const getEmailChangeToken = vi.spyOn(authService, 'getEmailChangeToken');
    renderConfirmEmailChange('/confirmar-email');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
    expect(getEmailChangeToken).not.toHaveBeenCalled();
  });

  it('shows a loading status while the token is being validated', () => {
    vi.spyOn(authService, 'getEmailChangeToken').mockReturnValue(new Promise(() => undefined));
    renderConfirmEmailChange();

    expect(screen.getByRole('heading', { name: 'Confirmar novo e-mail' })).toBeInTheDocument();
    expect(screen.getByText('Validando o link…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar novo e-mail' })).not.toBeInTheDocument();
  });

  it('shows the user name and both e-mails when the token is ready', async () => {
    const getEmailChangeToken = vi
      .spyOn(authService, 'getEmailChangeToken')
      .mockResolvedValue(tokenDetails);
    renderConfirmEmailChange();

    expect(
      await screen.findByText(
        `Olá, ${tokenDetails.name}. Confirme a alteração de ${tokenDetails.currentEmail} para ${tokenDetails.newEmail}.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar novo e-mail' })).toBeInTheDocument();
    expect(getEmailChangeToken).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
  });

  it('sends the user to login after confirming the new e-mail successfully', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getEmailChangeToken').mockResolvedValue(tokenDetails);
    const confirmEmailChange = vi
      .spyOn(authService, 'confirmEmailChange')
      .mockResolvedValue(undefined);
    renderConfirmEmailChange();

    await user.click(await screen.findByRole('button', { name: 'Confirmar novo e-mail' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
    expect(confirmEmailChange).toHaveBeenCalledWith(TOKEN);
  });

  it('explains that an invalid or used link (404) no longer works on load', async () => {
    vi.spyOn(authService, 'getEmailChangeToken').mockRejectedValue(
      new AuthServiceError(404, 'Token not found'),
    );
    renderConfirmEmailChange();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Confirmar novo e-mail' })).not.toBeInTheDocument();
  });

  it('explains that the link expired (410) on load', async () => {
    vi.spyOn(authService, 'getEmailChangeToken').mockRejectedValue(
      new AuthServiceError(410, 'Token has expired'),
    );
    renderConfirmEmailChange();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Peça ao administrador para solicitar um novo e-mail.',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
  });

  it('shows the invalid message when the token is rejected on confirm (404)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getEmailChangeToken').mockResolvedValue(tokenDetails);
    vi.spyOn(authService, 'confirmEmailChange').mockRejectedValue(
      new AuthServiceError(404, 'Token not found'),
    );
    renderConfirmEmailChange();

    await user.click(await screen.findByRole('button', { name: 'Confirmar novo e-mail' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link é inválido ou já foi usado.',
    );
    expect(screen.queryByRole('button', { name: 'Confirmar novo e-mail' })).not.toBeInTheDocument();
  });

  it('shows the expired message when the token is rejected on confirm (410)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getEmailChangeToken').mockResolvedValue(tokenDetails);
    vi.spyOn(authService, 'confirmEmailChange').mockRejectedValue(
      new AuthServiceError(410, 'Token has expired'),
    );
    renderConfirmEmailChange();

    await user.click(await screen.findByRole('button', { name: 'Confirmar novo e-mail' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este link expirou. Peça ao administrador para solicitar um novo e-mail.',
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/confirmar-email');
  });

  it('shows a toast on network failure when confirming', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getEmailChangeToken').mockResolvedValue(tokenDetails);
    vi.spyOn(authService, 'confirmEmailChange').mockRejectedValue(new TypeError('Failed to fetch'));
    renderConfirmEmailChange();

    await user.click(await screen.findByRole('button', { name: 'Confirmar novo e-mail' }));

    expect(await screen.findByText('Não foi possível confirmar')).toBeInTheDocument();
    expect(screen.getByText('Verifique sua conexão e tente novamente.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar novo e-mail' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/confirmar-email');
  });

  it('reports a server error (500) when confirming', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'getEmailChangeToken').mockResolvedValue(tokenDetails);
    vi.spyOn(authService, 'confirmEmailChange').mockRejectedValue(
      new AuthServiceError(500, 'Internal Server Error'),
    );
    renderConfirmEmailChange();

    await user.click(await screen.findByRole('button', { name: 'Confirmar novo e-mail' }));

    expect(await screen.findByText('Não foi possível confirmar')).toBeInTheDocument();
    expect(
      screen.getByText('Ocorreu um erro no servidor. Tente novamente em instantes.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Verifique sua conexão e tente novamente.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar novo e-mail' })).toBeInTheDocument();
  });
});
