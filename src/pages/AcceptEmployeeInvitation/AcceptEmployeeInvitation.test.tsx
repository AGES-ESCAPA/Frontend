import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyEmployeeService } from '@services/companyEmployeeService';
import { AcceptEmployeeInvitation } from './AcceptEmployeeInvitation';

vi.mock('@services/companyEmployeeService', () => ({
  companyEmployeeService: {
    getInvitation: vi.fn(),
    completeInvitation: vi.fn(),
  },
}));

describe('AcceptEmployeeInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(companyEmployeeService.getInvitation).mockResolvedValue({
      name: 'Ana Lima',
      email: 'ana@empresa.com.br',
      companyName: 'Empresa Escapa',
    });
    vi.mocked(companyEmployeeService.completeInvitation).mockResolvedValue();
  });

  it('creates a password for the validated invite and confirms activation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/convite?token=invite-token']}>
        <AcceptEmployeeInvitation />
      </MemoryRouter>,
    );

    expect(await screen.findByText('ana@empresa.com.br')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Nova senha/), 'password-123');
    await user.type(screen.getByLabelText(/^Confirme a senha/), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Criar senha e ativar acesso' }));

    await waitFor(() =>
      expect(companyEmployeeService.completeInvitation).toHaveBeenCalledWith({
        token: 'invite-token',
        password: 'password-123',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Acesso ativado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login');
  });

  it('requires matching passwords before sending the request', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/convite?token=invite-token']}>
        <AcceptEmployeeInvitation />
      </MemoryRouter>,
    );

    await screen.findByText('ana@empresa.com.br');
    await user.type(screen.getByLabelText(/^Nova senha/), 'password-123');
    await user.type(screen.getByLabelText(/^Confirme a senha/), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Criar senha e ativar acesso' }));

    expect(await screen.findByText('As senhas precisam ser iguais.')).toBeInTheDocument();
    expect(companyEmployeeService.completeInvitation).not.toHaveBeenCalled();
  });
});
