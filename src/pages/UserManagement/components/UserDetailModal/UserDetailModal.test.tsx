import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminUserServiceError, adminUserService } from '@services/adminUserService';
import type { AdminUser, AdminUserDetail } from '@/types/adminUser';
import { UserDetailModal } from './UserDetailModal';

vi.mock('@services/adminUserService', () => ({
  adminUserService: {
    getById: vi.fn(),
    update: vi.fn(),
    requestEmailChange: vi.fn(),
    deactivate: vi.fn(),
  },
  AdminUserServiceError: class AdminUserServiceError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'AdminUserServiceError';
      this.status = status;
    }
  },
}));

const getByIdMock = vi.mocked(adminUserService.getById);
const updateMock = vi.mocked(adminUserService.update);
const requestEmailChangeMock = vi.mocked(adminUserService.requestEmailChange);
const deactivateMock = vi.mocked(adminUserService.deactivate);

const baseUser: AdminUser = {
  id: 'user-1',
  name: 'Ana Paula Ferreira',
  email: 'ana.ferreira@email.com',
  userType: 'STUDENT',
  status: 'ACTIVE',
  createdAt: '2026-08-17T12:00:00',
};

const studentDetail: AdminUserDetail = {
  ...baseUser,
  cpf: '39011122233',
  phone: '51991203344',
};

const companyDetail: AdminUserDetail = {
  id: 'co-1',
  name: 'Carlos Silva',
  email: 'rh@vistamar.com.br',
  userType: 'COMPANY',
  status: 'ACTIVE',
  createdAt: '2026-07-02T09:00:00',
  cnpj: '12345678000190',
  companyName: 'Pousada Vista Mar',
  phone: '5133334444',
};

const employeeDetail: AdminUserDetail = {
  id: 'emp-1',
  name: 'Luciana Prado',
  email: 'luciana.prado@vistamar.com.br',
  userType: 'EMPLOYEE',
  status: 'ACTIVE',
  createdAt: '2026-03-01T10:00:00',
  companyName: 'Pousada Vista Mar',
};

const adminDetail: AdminUserDetail = {
  id: 'adm-1',
  name: 'Admin Escapa',
  email: 'admin@escapa.com',
  userType: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-01-10T08:00:00',
};

const renderModal = (
  user: AdminUser,
  options: { initialMode?: 'view' | 'edit'; onUserChanged?: () => void } = {},
) => {
  const onOpenChange = vi.fn();
  const onUserChanged = options.onUserChanged ?? vi.fn();

  render(
    <UserDetailModal
      open
      onOpenChange={onOpenChange}
      user={user}
      initialMode={options.initialMode}
      onUserChanged={onUserChanged}
    />,
  );

  return { onOpenChange, onUserChanged };
};

describe('UserDetailModal', () => {
  beforeEach(() => {
    getByIdMock.mockReset();
    updateMock.mockReset();
    requestEmailChangeMock.mockReset();
    deactivateMock.mockReset();
  });

  it('does not render the dialog when open is false', () => {
    getByIdMock.mockResolvedValue(studentDetail);
    render(<UserDetailModal open={false} onOpenChange={vi.fn()} user={baseUser} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByIdMock).not.toHaveBeenCalled();
  });

  it('shows student registration fields after loading', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Nome completo')).toBeInTheDocument());
    expect(within(dialog).getByText('390.111.222-33')).toBeInTheDocument();
    expect(within(dialog).getByText('Aluno')).toBeInTheDocument();
    expect(within(dialog).getByText('Ativo')).toBeInTheDocument();
  });

  it('shows company-specific fields', async () => {
    getByIdMock.mockResolvedValue(companyDetail);
    renderModal({
      id: companyDetail.id,
      name: companyDetail.name,
      email: companyDetail.email,
      userType: 'COMPANY',
      status: 'ACTIVE',
      createdAt: companyDetail.createdAt,
    });

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() =>
      expect(within(dialog).getByText('Nome do responsável')).toBeInTheDocument(),
    );
    expect(within(dialog).getByText('CNPJ')).toBeInTheDocument();
    expect(within(dialog).getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(within(dialog).getByText('Razão social / Nome fantasia')).toBeInTheDocument();
    expect(within(dialog).getByText('Empresa')).toBeInTheDocument();
  });

  it('shows employee-specific fields', async () => {
    getByIdMock.mockResolvedValue(employeeDetail);
    renderModal({
      id: employeeDetail.id,
      name: employeeDetail.name,
      email: employeeDetail.email,
      userType: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: employeeDetail.createdAt,
    });

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Nome completo')).toBeInTheDocument());
    expect(within(dialog).getByText('Empresa')).toBeInTheDocument();
    expect(within(dialog).getByText('Pousada Vista Mar')).toBeInTheDocument();
    expect(within(dialog).getByText('Colaborador')).toBeInTheDocument();
  });

  it('shows admin-specific fields', async () => {
    getByIdMock.mockResolvedValue(adminDetail);
    renderModal({
      id: adminDetail.id,
      name: adminDetail.name,
      email: adminDetail.email,
      userType: 'ADMIN',
      status: 'ACTIVE',
      createdAt: adminDetail.createdAt,
    });

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Nome')).toBeInTheDocument());
    expect(within(dialog).queryByText('CPF')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Admin')).toBeInTheDocument();
  });

  it('shows the inactive badge and hides block action for inactive users', async () => {
    getByIdMock.mockResolvedValue({ ...studentDetail, status: 'INACTIVE' });
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Inativo')).toBeInTheDocument());
    expect(
      within(dialog).queryByRole('button', { name: 'Bloquear acesso' }),
    ).not.toBeInTheDocument();
  });

  it('shows the pending status badge', async () => {
    getByIdMock.mockResolvedValue({ ...studentDetail, status: 'PENDING' });
    renderModal({ ...baseUser, status: 'PENDING' });

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Pendente')).toBeInTheDocument());
  });

  it('shows the pending email banner in view mode', async () => {
    getByIdMock.mockResolvedValue({
      ...studentDetail,
      pendingEmail: 'novo.email@email.com',
    });
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    expect(
      await within(dialog).findByText(/aguardando confirmação para alterar o e-mail/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('novo.email@email.com')).toBeInTheDocument();
  });

  it('shows the API message when loading the detail fails with AdminUserServiceError', async () => {
    getByIdMock.mockRejectedValue(new AdminUserServiceError(500, 'Servidor indisponível.'));
    renderModal(baseUser);

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível.');
  });

  it('shows a generic message when loading fails with an unexpected error', async () => {
    getByIdMock.mockRejectedValue(new Error('network'));
    renderModal(baseUser);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o detalhe do usuário.',
    );
  });

  it('opens in edit mode and blocks save when required fields are empty', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    const nameInput = within(dialog).getByLabelText('Nome completo');
    await user.clear(nameInput);
    await user.clear(within(dialog).getByLabelText('E-mail'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findAllByText('Preenchimento obrigatório.')).toHaveLength(2);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('validates the email format before saving', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('E-mail')).toBeInTheDocument());

    const emailInput = within(dialog).getByLabelText('E-mail');
    await user.clear(emailInput);
    await user.type(emailInput, 'invalido');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('saves profile data and requests email change when the address changes', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    updateMock.mockResolvedValue({ ...studentDetail, name: 'Ana Atualizada' });
    requestEmailChangeMock.mockResolvedValue({
      ...studentDetail,
      name: 'Ana Atualizada',
      email: 'ana.ferreira@email.com',
      pendingEmail: 'nova.ana@email.com',
    });

    const onUserChanged = vi.fn();
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit', onUserChanged });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    const nameInput = within(dialog).getByLabelText('Nome completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ana Atualizada');

    const emailInput = within(dialog).getByLabelText('E-mail');
    await user.clear(emailInput);
    await user.type(emailInput, 'nova.ana@email.com');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Ana Atualizada' }),
      );
    });
    expect(requestEmailChangeMock).toHaveBeenCalledWith('user-1', 'nova.ana@email.com');
    expect(onUserChanged).toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'Detalhe do usuário' })).toBeInTheDocument();
  });

  it('maps AdminUserServiceError to field, email and form messages on save', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    updateMock.mockRejectedValue(new AdminUserServiceError(400, 'email is invalid'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findByText('Informe um e-mail válido.')).toBeInTheDocument();

    updateMock.mockRejectedValue(new AdminUserServiceError(400, 'email is same as current'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(
      await within(dialog).findByText('Informe um e-mail diferente do atual.'),
    ).toBeInTheDocument();

    updateMock.mockRejectedValue(new AdminUserServiceError(409, 'email already in use'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findByText('Este e-mail já está em uso.')).toBeInTheDocument();

    updateMock.mockRejectedValue(new AdminUserServiceError(400, 'name is required'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findAllByText('Preenchimento obrigatório.')).not.toHaveLength(0);

    updateMock.mockRejectedValue(new AdminUserServiceError(500, 'Falha inesperada no servidor.'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findByText('Falha inesperada no servidor.')).toBeInTheDocument();
  });

  it('enters edit mode from the view title action', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Editar usuário' }));

    expect(screen.getByRole('dialog', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Nome completo')).toHaveValue('Ana Paula Ferreira');
  });

  it('cancels edit and restores view mode without persisting changes', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    await user.clear(within(dialog).getByLabelText('Nome completo'));
    await user.type(within(dialog).getByLabelText('Nome completo'), 'Nome temporário');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('dialog', { name: 'Detalhe do usuário' })).toBeInTheDocument();
    expect(within(dialog).getByText('Ana Paula Ferreira')).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('shows dashes for missing student CPF and phone in view mode', async () => {
    getByIdMock.mockResolvedValue({
      ...studentDetail,
      cpf: null,
      phone: '',
    });
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('CPF')).toBeInTheDocument());
    expect(within(dialog).getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows the email change hint in edit mode when there is no pending email', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    expect(
      await within(dialog).findByText(/alterar o e-mail envia um link de confirmação/i),
    ).toBeInTheDocument();
  });

  it('shows the pending email notice in edit mode when a change is already pending', async () => {
    getByIdMock.mockResolvedValue({
      ...studentDetail,
      pendingEmail: 'pendente@email.com',
    });
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    expect(
      await within(dialog).findByText(/já existe uma troca pendente para/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('pendente@email.com')).toBeInTheDocument();
  });

  it('saves student data without requesting email change when the address is unchanged', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    updateMock.mockResolvedValue({ ...studentDetail, name: 'Ana Atualizada' });

    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    await user.clear(within(dialog).getByLabelText('Nome completo'));
    await user.type(within(dialog).getByLabelText('Nome completo'), 'Ana Atualizada');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledOnce());
    expect(requestEmailChangeMock).not.toHaveBeenCalled();
  });

  it('clears the name field error after the user corrects the input', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    await user.clear(within(dialog).getByLabelText('Nome completo'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await within(dialog).findByText('Preenchimento obrigatório.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Nome completo'), 'Ana corrigida');
    expect(within(dialog).queryByText('Preenchimento obrigatório.')).not.toBeInTheDocument();
  });

  it('saves company fields including company name and phone', async () => {
    getByIdMock.mockResolvedValue(companyDetail);
    updateMock.mockResolvedValue({ ...companyDetail, companyName: 'Nova Razão LTDA' });

    const user = userEvent.setup();
    renderModal(
      {
        id: companyDetail.id,
        name: companyDetail.name,
        email: companyDetail.email,
        userType: 'COMPANY',
        status: 'ACTIVE',
        createdAt: companyDetail.createdAt,
      },
      { initialMode: 'edit' },
    );

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() =>
      expect(within(dialog).getByLabelText('Nome do responsável')).toBeInTheDocument(),
    );

    await user.clear(within(dialog).getByLabelText('Razão social / Nome fantasia'));
    await user.type(
      within(dialog).getByLabelText('Razão social / Nome fantasia'),
      'Nova Razão LTDA',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('co-1', {
        name: 'Carlos Silva',
        phone: '5133334444',
        companyName: 'Nova Razão LTDA',
      });
    });
  });

  it('saves employee data without sending phone in the payload', async () => {
    getByIdMock.mockResolvedValue(employeeDetail);
    updateMock.mockResolvedValue({ ...employeeDetail, name: 'Luciana Atualizada' });

    const user = userEvent.setup();
    renderModal(
      {
        id: employeeDetail.id,
        name: employeeDetail.name,
        email: employeeDetail.email,
        userType: 'EMPLOYEE',
        status: 'ACTIVE',
        createdAt: employeeDetail.createdAt,
      },
      { initialMode: 'edit' },
    );

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());

    await user.clear(within(dialog).getByLabelText('Nome completo'));
    await user.type(within(dialog).getByLabelText('Nome completo'), 'Luciana Atualizada');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('emp-1', {
        name: 'Luciana Atualizada',
        phone: undefined,
        companyName: undefined,
      });
    });
  });

  it('shows a generic message when save fails with an unexpected error', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    updateMock.mockRejectedValue(new Error('network'));

    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome completo')).toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(
      await within(dialog).findByText('Não foi possível salvar os dados do usuário.'),
    ).toBeInTheDocument();
  });

  it('maps an email conflict without invalid or same keywords to the in-use message', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    updateMock.mockRejectedValue(new AdminUserServiceError(409, 'email conflict at server'));

    const user = userEvent.setup();
    renderModal(baseUser, { initialMode: 'edit' });

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('E-mail')).toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Este e-mail já está em uso.')).toBeInTheDocument();
  });

  it('deactivates the user after confirming block access', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    deactivateMock.mockResolvedValue({ ...studentDetail, status: 'INACTIVE' });
    const onUserChanged = vi.fn();
    const user = userEvent.setup();

    renderModal(baseUser, { onUserChanged });

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => expect(within(dialog).getByText('Ativo')).toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear acesso' }));

    const confirm = await screen.findByRole('dialog', { name: 'Bloquear acesso?' });
    await user.click(within(confirm).getByRole('button', { name: 'Bloquear acesso' }));

    await waitFor(() => expect(deactivateMock).toHaveBeenCalledWith('user-1'));
    expect(onUserChanged).toHaveBeenCalled();
    expect(within(dialog).getByText('Inativo')).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Bloquear acesso' }),
    ).not.toBeInTheDocument();
  });

  it('shows the API message when deactivate fails with AdminUserServiceError', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    deactivateMock.mockRejectedValue(new AdminUserServiceError(500, 'Conta já inativa.'));

    const user = userEvent.setup();
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear acesso' }));

    const confirm = await screen.findByRole('dialog', { name: 'Bloquear acesso?' });
    await user.click(within(confirm).getByRole('button', { name: 'Bloquear acesso' }));

    expect(await within(confirm).findByRole('alert')).toHaveTextContent('Conta já inativa.');
    expect(deactivateMock).toHaveBeenCalledOnce();
  });

  it('shows a generic message when deactivate fails unexpectedly', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    deactivateMock.mockRejectedValue(new Error('network'));

    const user = userEvent.setup();
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear acesso' }));

    const confirm = await screen.findByRole('dialog', { name: 'Bloquear acesso?' });
    await user.click(within(confirm).getByRole('button', { name: 'Bloquear acesso' }));

    expect(await within(confirm).findByRole('alert')).toHaveTextContent(
      'Não foi possível bloquear o usuário.',
    );
  });

  it('closes the block confirmation without calling deactivate', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const user = userEvent.setup();
    renderModal(baseUser);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear acesso' }));

    const confirm = await screen.findByRole('dialog', { name: 'Bloquear acesso?' });
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Bloquear acesso?' })).not.toBeInTheDocument();
    });
    expect(deactivateMock).not.toHaveBeenCalled();
  });

  it('calls onOpenChange when the modal is closed', async () => {
    getByIdMock.mockResolvedValue(studentDetail);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(<UserDetailModal open onOpenChange={onOpenChange} user={baseUser} />);

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('reloads user detail when the modal is opened again', async () => {
    getByIdMock.mockResolvedValue(studentDetail);

    const Harness = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Reabrir
          </button>
          <UserDetailModal open={open} onOpenChange={setOpen} user={baseUser} initialMode="view" />
        </>
      );
    };

    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    expect(getByIdMock).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Reabrir' }));
    await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('saves company fields without sending phone for admin profile', async () => {
    getByIdMock.mockResolvedValue(adminDetail);
    updateMock.mockResolvedValue(adminDetail);

    const user = userEvent.setup();
    renderModal(
      {
        id: adminDetail.id,
        name: adminDetail.name,
        email: adminDetail.email,
        userType: 'ADMIN',
        status: 'ACTIVE',
        createdAt: adminDetail.createdAt,
      },
      { initialMode: 'edit' },
    );

    const dialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    await waitFor(() => expect(within(dialog).getByLabelText('Nome')).toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('adm-1', {
        name: 'Admin Escapa',
        phone: undefined,
        companyName: undefined,
      });
    });
  });
});
