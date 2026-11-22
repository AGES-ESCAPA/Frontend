import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminUsers } from '@hooks/useAdminUsers';
import type { UseAdminUsersResult } from '@hooks/useAdminUsers';
import { adminUserService } from '@services/adminUserService';
import type { AdminUser, AdminUserDetail } from '@/types/adminUser';
import { UserManagement } from './UserManagement';

vi.mock('@hooks/useAdminUsers', () => ({ useAdminUsers: vi.fn() }));
vi.mock('@services/adminUserService', () => ({
  adminUserService: {
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
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

const useAdminUsersMock = vi.mocked(useAdminUsers);
const getByIdMock = vi.mocked(adminUserService.getById);
const updateMock = vi.mocked(adminUserService.update);
const deactivateMock = vi.mocked(adminUserService.deactivate);

const users: AdminUser[] = [
  {
    id: 'user-1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    userType: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-17T12:00:00',
  },
  {
    id: 'user-2',
    name: 'Pousada Vista Mar',
    email: 'rh@vistamar.com.br',
    userType: 'COMPANY',
    status: 'INACTIVE',
    createdAt: '2026-07-02T09:00:00',
  },
  {
    id: 'user-3',
    name: 'Admin Escapa',
    email: 'admin@escapa.com',
    userType: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00',
  },
  {
    id: 'user-4',
    name: 'Luciana Prado',
    email: 'luciana.prado@vistamar.com.br',
    userType: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-03-01T10:00:00',
  },
];

const defaultResult: UseAdminUsersResult = {
  users,
  status: 'success',
  errorMessage: null,
  reload: vi.fn(),
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserManagement />
    </MemoryRouter>,
  );

const studentDetail: AdminUserDetail = {
  ...users[0],
  cpf: '39011122233',
  phone: '51991203344',
};

describe('UserManagement', () => {
  beforeEach(() => {
    useAdminUsersMock.mockReturnValue({ ...defaultResult, reload: vi.fn() });
    getByIdMock.mockReset();
    updateMock.mockReset();
    deactivateMock.mockReset();
    getByIdMock.mockResolvedValue(studentDetail);
  });

  it('renders the users returned by useAdminUsers', () => {
    renderPage();

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();
    expect(screen.getByText('rh@vistamar.com.br')).toBeInTheDocument();
    expect(screen.getAllByText('Empresa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
  });

  it('marks Usuários as the menu link for this page', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Usuários' });
    expect(link).toHaveAttribute('href', '/admin/usuarios');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('shows the totals from the loaded users', () => {
    renderPage();

    const summary = within(screen.getByRole('region', { name: 'Resumo dos usuários' }));
    expect(summary.getByText('4')).toBeInTheDocument();
    expect(summary.getAllByText('1')).toHaveLength(4);
    expect(summary.getByText('incluindo todos os perfis')).toBeInTheDocument();
    expect(summary.getByText('vinculados a empresas')).toBeInTheDocument();
    expect(summary.getByText('equipe da plataforma')).toBeInTheDocument();
    expect(summary.getByText('contas corporativas')).toBeInTheDocument();
  });

  it('shows placeholders in the totals while they load', () => {
    useAdminUsersMock.mockReturnValue({
      users: [],
      status: 'loading',
      errorMessage: null,
      reload: vi.fn(),
    });

    renderPage();

    const summary = within(screen.getByRole('region', { name: 'Resumo dos usuários' }));
    expect(summary.getAllByText('—')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando usuários');
  });

  it('shows the empty-list message when there are no users', () => {
    useAdminUsersMock.mockReturnValue({
      users: [],
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
    });

    renderPage();

    expect(
      screen.getByText('Nenhum usuário encontrado para os filtros selecionados.'),
    ).toBeInTheDocument();
  });

  it('shows a network error with a retry action', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    useAdminUsersMock.mockReturnValue({
      users: [],
      status: 'error',
      errorMessage: 'Falha ao carregar usuários.',
      reload,
    });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar usuários.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('filters the list by type without changing the global summary cards', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'COMPANY');

    expect(screen.getByText('Pousada Vista Mar')).toBeInTheDocument();
    expect(screen.queryByText('Ana Paula Ferreira')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 usuários')).toBeInTheDocument();

    const summary = within(screen.getByRole('region', { name: 'Resumo dos usuários' }));
    expect(summary.getByText('4')).toBeInTheDocument();
    expect(summary.getAllByText('1')).toHaveLength(4);
  });

  it('filters the list by status', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');

    expect(screen.getByText('Pousada Vista Mar')).toBeInTheDocument();
    expect(screen.queryByText('Ana Paula Ferreira')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Escapa')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 usuários')).toBeInTheDocument();
  });

  it('paginates the loaded users', async () => {
    const user = userEvent.setup();
    const manyUsers = Array.from({ length: 11 }, (_, index) => ({
      id: `user-${index}`,
      name: `Usuário ${index + 1}`,
      email: `user${index + 1}@email.com`,
      userType: 'STUDENT',
      status: 'ACTIVE',
      createdAt: '2026-08-17T12:00:00',
    }));
    useAdminUsersMock.mockReturnValue({
      users: manyUsers,
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Mostrando 10 de 11 usuários')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.queryByText('Usuário 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(screen.getByText('Usuário 11')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
  });

  it('searches by name and goes back to the first page', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Buscar usuário' }), 'vista mar');

    await waitFor(() => expect(screen.queryByText('Ana Paula Ferreira')).not.toBeInTheDocument());
    expect(screen.getByText('Pousada Vista Mar')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 usuários')).toBeInTheDocument();
  });

  it('keeps the row when the API omits the status', () => {
    useAdminUsersMock.mockReturnValue({
      ...defaultResult,
      users: [{ ...users[0], status: undefined }],
    });

    renderPage();

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('opens the detail modal with the selected user registration fields', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole('button', { name: 'Editar usuário Ana Paula Ferreira' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Bloquear usuário Ana Paula Ferreira' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver usuário Ana Paula Ferreira' }));

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await waitFor(() => {
      expect(getByIdMock).toHaveBeenCalledWith('user-1', expect.any(AbortSignal));
    });
    expect(within(dialog).getByRole('button', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Bloquear acesso' })).toBeInTheDocument();
    expect(within(dialog).getByText('Nome completo')).toBeInTheDocument();
    expect(within(dialog).getByText('CPF')).toBeInTheDocument();
    expect(within(dialog).getByText('390.111.222-33')).toBeInTheDocument();
    expect(within(dialog).getByText('ana.ferreira@email.com')).toBeInTheDocument();
    expect(within(dialog).getByText('(51) 99120-3344')).toBeInTheDocument();
    expect(within(dialog).getByText('Ativo')).toBeInTheDocument();
    expect(within(dialog).getByText('17/08/2026')).toBeInTheDocument();
  });

  it('edits registration fields from the view modal title icon and reloads the list', async () => {
    const reload = vi.fn();
    useAdminUsersMock.mockReturnValue({ ...defaultResult, reload });
    updateMock.mockResolvedValue({
      ...studentDetail,
      name: 'Ana Atualizada',
      phone: '51988887777',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver usuário Ana Paula Ferreira' }));
    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Editar usuário' }));

    const editDialog = await screen.findByRole('dialog', { name: 'Editar usuário' });
    const nameInput = within(editDialog).getByLabelText('Nome completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ana Atualizada');
    await user.click(within(editDialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Ana Atualizada' }),
      );
    });
    expect(reload).toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'Detalhe do usuário' })).toBeInTheDocument();
    expect(within(dialog).getByText('Ana Atualizada')).toBeInTheDocument();
  });

  it('blocks the user from the detail modal after destructive confirmation', async () => {
    const reload = vi.fn();
    useAdminUsersMock.mockReturnValue({ ...defaultResult, reload });
    deactivateMock.mockResolvedValue({ ...studentDetail, status: 'INACTIVE' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Ver usuário Ana Paula Ferreira' }));
    const dialog = await screen.findByRole('dialog', { name: 'Detalhe do usuário' });
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear acesso' }));

    const confirm = await screen.findByRole('dialog', { name: 'Bloquear acesso?' });
    await user.click(within(confirm).getByRole('button', { name: 'Bloquear acesso' }));

    await waitFor(() => {
      expect(deactivateMock).toHaveBeenCalledWith('user-1');
    });
    expect(reload).toHaveBeenCalled();
    expect(within(dialog).getByText('Inativo')).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Bloquear acesso' }),
    ).not.toBeInTheDocument();
  });
});
