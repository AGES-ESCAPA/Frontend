import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyEmployeeService } from '@services/companyEmployeeService';
import { EmployeeInvitation } from './EmployeeInvitation';

vi.mock('@components/layout', () => ({
  Footer: () => null,
  Navbar: () => null,
}));

vi.mock('@services/companyEmployeeService', () => ({
  companyEmployeeService: {
    completeInvitation: vi.fn(),
  },
}));

describe('EmployeeInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida a confirmação da senha antes de enviar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/cadastro/colaborador/convite?token=valid-token']}>
        <EmployeeInvitation />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nova senha'), 'password-123');
    await user.type(screen.getByLabelText('Confirme a senha'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Ativar acesso' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não correspondem.');
    expect(companyEmployeeService.completeInvitation).not.toHaveBeenCalled();
  });

  it('conclui convite e mostra a confirmação de acesso', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.completeInvitation).mockResolvedValueOnce();

    render(
      <MemoryRouter initialEntries={['/cadastro/colaborador/convite?token=valid-token']}>
        <EmployeeInvitation />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nova senha'), 'password-123');
    await user.type(screen.getByLabelText('Confirme a senha'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Ativar acesso' }));

    await waitFor(() =>
      expect(companyEmployeeService.completeInvitation).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'password-123',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sua senha foi criada e o acesso está ativo.',
    );
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
  });

  it('informa quando o link não possui token', () => {
    render(
      <MemoryRouter initialEntries={['/cadastro/colaborador/convite']}>
        <EmployeeInvitation />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O link do convite está incompleto ou inválido.',
    );
    expect(screen.getByRole('button', { name: 'Ativar acesso' })).toBeDisabled();
  });
});
