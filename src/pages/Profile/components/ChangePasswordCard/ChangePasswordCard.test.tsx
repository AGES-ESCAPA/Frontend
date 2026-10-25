import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileServiceError, profileService } from '@services/profileService';
import { ChangePasswordCard } from './ChangePasswordCard';

vi.mock('@services/profileService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    profileService: { changePassword: vi.fn() },
  };
});

const changePasswordMock = vi.mocked(profileService.changePassword);

const renderCard = () => {
  const onNotify = vi.fn();
  render(<ChangePasswordCard onNotify={onNotify} />);
  return {
    onNotify,
    current: screen.getByLabelText(/^Senha atual/),
    next: screen.getByLabelText(/^Nova senha/),
    confirm: screen.getByLabelText(/^Confirmar nova senha/),
    submit: screen.getByRole('button', { name: 'Alterar Senha' }),
  };
};

const fillAndSubmit = async (
  fields: ReturnType<typeof renderCard>,
  values = { current: 'escapa@2026', next: 'nova@senha2026', confirm: 'nova@senha2026' },
) => {
  await userEvent.type(fields.current, values.current);
  await userEvent.type(fields.next, values.next);
  await userEvent.type(fields.confirm, values.confirm);
  await userEvent.click(fields.submit);
};

describe('ChangePasswordCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('changes the password, confirms it and clears the three fields', async () => {
    changePasswordMock.mockResolvedValue();
    const fields = renderCard();

    await fillAndSubmit(fields);

    await waitFor(() =>
      expect(fields.onNotify).toHaveBeenCalledWith(
        'success',
        'Senha alterada',
        'Sua nova senha já está valendo.',
      ),
    );
    expect(changePasswordMock).toHaveBeenCalledWith('escapa@2026', 'nova@senha2026');
    expect(fields.current).toHaveValue('');
    expect(fields.next).toHaveValue('');
    expect(fields.confirm).toHaveValue('');
  });

  it('shows a wrong current password under "Senha atual" and keeps the other fields', async () => {
    changePasswordMock.mockRejectedValue(
      new ProfileServiceError(400, 'Current password is incorrect'),
    );
    const fields = renderCard();

    await fillAndSubmit(fields, {
      current: 'errada123',
      next: 'nova@senha2026',
      confirm: 'nova@senha2026',
    });

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument();
    expect(fields.current).toHaveAttribute('aria-invalid', 'true');
    expect(fields.current).toHaveValue('errada123');
    expect(fields.next).toHaveValue('nova@senha2026');
    expect(fields.confirm).toHaveValue('nova@senha2026');
    expect(fields.onNotify).not.toHaveBeenCalled();
  });

  it('shows a weak password from the API under "Nova senha"', async () => {
    changePasswordMock.mockRejectedValue(
      new ProfileServiceError(400, 'Password must be at least 8 characters'),
    );
    const fields = renderCard();

    await fillAndSubmit(fields);

    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres.'),
    ).toBeInTheDocument();
    expect(fields.next).toHaveAttribute('aria-invalid', 'true');
    expect(fields.current).not.toHaveAttribute('aria-invalid', 'true');
    expect(fields.onNotify).not.toHaveBeenCalled();
  });

  it('notifies a network failure with a toast and keeps the typed values', async () => {
    changePasswordMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const fields = renderCard();

    await fillAndSubmit(fields);

    await waitFor(() =>
      expect(fields.onNotify).toHaveBeenCalledWith(
        'error',
        'Não foi possível alterar a senha',
        'Verifique sua conexão e tente novamente.',
      ),
    );
    expect(fields.current).toHaveValue('escapa@2026');
    expect(fields.next).toHaveValue('nova@senha2026');
  });

  it('validates the fields before calling the API', async () => {
    const fields = renderCard();

    await fillAndSubmit(fields, { current: 'escapa@2026', next: 'curta', confirm: 'outra' });

    expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('As senhas devem ser iguais.')).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('shows the loading button and does not send twice while the request is pending', async () => {
    let resolveRequest: () => void = () => {};
    changePasswordMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const fields = renderCard();

    await fillAndSubmit(fields);
    await userEvent.click(fields.submit);

    expect(fields.submit).toBeDisabled();
    expect(fields.current).toBeDisabled();
    expect(changePasswordMock).toHaveBeenCalledOnce();

    resolveRequest();
    await waitFor(() => expect(fields.submit).toBeEnabled());
  });
});
