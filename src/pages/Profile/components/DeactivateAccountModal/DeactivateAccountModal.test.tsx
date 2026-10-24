import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileServiceError, profileService } from '@services/profileService';
import { DeactivateAccountModal } from './DeactivateAccountModal';

vi.mock('@services/profileService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, profileService: { deactivateAccount: vi.fn() } };
});

const deactivateAccountMock = vi.mocked(profileService.deactivateAccount);

const renderModal = () => {
  const onDeactivated = vi.fn();
  const onOpenChange = vi.fn();
  render(<DeactivateAccountModal open onOpenChange={onOpenChange} onDeactivated={onDeactivated} />);
  return { onDeactivated, onOpenChange };
};

describe('DeactivateAccountModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks for the current password before calling the API', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }));

    expect(await screen.findByText('Informe sua senha atual.')).toBeInTheDocument();
    expect(deactivateAccountMock).not.toHaveBeenCalled();
  });

  it('deactivates with the typed password and notifies the page', async () => {
    deactivateAccountMock.mockResolvedValue();
    const { onDeactivated } = renderModal();

    await userEvent.type(screen.getByLabelText(/Confirme sua senha atual/), 'escapa@2026');
    await userEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }));

    await waitFor(() => expect(onDeactivated).toHaveBeenCalledOnce());
    expect(deactivateAccountMock).toHaveBeenCalledWith('escapa@2026');
  });

  it('shows the wrong password under the field and does not finish the deactivation', async () => {
    deactivateAccountMock.mockRejectedValue(
      new ProfileServiceError(400, 'Current password is incorrect'),
    );
    const { onDeactivated } = renderModal();

    await userEvent.type(screen.getByLabelText(/Confirme sua senha atual/), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }));

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument();
    expect(onDeactivated).not.toHaveBeenCalled();
  });

  it('shows a general error when the request fails for another reason', async () => {
    deactivateAccountMock.mockRejectedValue(new TypeError('Failed to fetch'));
    renderModal();

    await userEvent.type(screen.getByLabelText(/Confirme sua senha atual/), 'escapa@2026');
    await userEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }));

    expect(
      await screen.findByText('Não foi possível desativar a conta. Tente novamente em instantes.'),
    ).toBeInTheDocument();
  });

  it('closes when the user cancels', async () => {
    const { onOpenChange } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
