import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompanySeats } from '@hooks/useCompanySeats';
import { useCompanyEmployees } from '@hooks/useCompanyEmployees';
import {
  CompanyEmployeeServiceError,
  companyEmployeeService,
} from '@services/companyEmployeeService';
import type * as CompanyEmployeeServiceModule from '@services/companyEmployeeService';
import type { UseCompanySeatsResult } from '@hooks/useCompanySeats';
import type { UseCompanyEmployeesResult } from '@hooks/useCompanyEmployees';
import { CompanyEmployees } from './CompanyEmployees';

vi.mock('@hooks/useCompanySeats', () => ({
  useCompanySeats: vi.fn(),
}));

vi.mock('@hooks/useCompanyEmployees', () => ({
  useCompanyEmployees: vi.fn(),
}));

vi.mock('@services/companyEmployeeService', async (importOriginal) => {
  const actual = await importOriginal<typeof CompanyEmployeeServiceModule>();

  return {
    ...actual,
    companyEmployeeService: {
      ...actual.companyEmployeeService,
      createEmployee: vi.fn(),
      resendInvite: vi.fn(),
    },
  };
});

vi.mock('@components/layout', () => ({
  SIDEBAR_MENU_PRESETS: {
    company: [],
  },
  AuthenticatedLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

const seatsMock = vi.mocked(useCompanySeats);
const employeesMock = vi.mocked(useCompanyEmployees);

const reloadSeats = vi.fn();
const reloadEmployees = vi.fn();

const seatsResult: UseCompanySeatsResult = {
  seats: {
    seatsTotal: 10,
    seatsUsed: 9,
    seatsAvailable: 1,
    employeesTotal: 9,
    employeesActive: 6,
  },
  status: 'success',
  errorMessage: null,
  reload: reloadSeats,
};

const employeesResult: UseCompanyEmployeesResult = {
  employees: [
    {
      id: 'employee-1',
      name: 'Ana Paula Ferreira',
      email: 'ana@empresa.com.br',
      jobTitle: 'Recepção',
      status: 'ACTIVE',
      assignedCourses: 3,
      avatarUrl: null,
    },
  ],
  status: 'success',
  errorMessage: null,
  totalElements: 11,
  totalPages: 2,
  reload: reloadEmployees,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <CompanyEmployees />
    </MemoryRouter>,
  );

const CurrentLocation = () => {
  const location = useLocation();

  return (
    <output aria-label="Localização atual">
      {location.pathname}
      {location.search}
    </output>
  );
};

describe('CompanyEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    seatsMock.mockReturnValue(seatsResult);
    employeesMock.mockReturnValue(employeesResult);
  });

  it('mantém a tabela e a paginação visíveis durante uma nova consulta', () => {
    employeesMock.mockReturnValue({
      ...employeesResult,
      status: 'loading',
    });

    renderPage();

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();

    expect(screen.getByText('Atualizando colaboradores...')).toBeInTheDocument();

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();

    expect(
      screen.queryByRole('status', {
        name: 'Carregando colaboradores',
      }),
    ).not.toBeInTheDocument();
  });

  it('mostra números e colaboradores reais retornados pelos hooks', () => {
    renderPage();

    expect(screen.getByText('Vagas contratadas')).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('9/10 vagas')).toBeInTheDocument();

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('exibe skeletons enquanto carrega', () => {
    seatsMock.mockReturnValue({
      ...seatsResult,
      seats: null,
      status: 'loading',
    });

    employeesMock.mockReturnValue({
      ...employeesResult,
      employees: [],
      status: 'loading',
    });

    renderPage();

    expect(
      screen.getByRole('status', {
        name: 'Carregando resumo de vagas',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('status', {
        name: 'Carregando colaboradores',
      }),
    ).toBeInTheDocument();
  });

  it('busca no servidor após debounce e volta à primeira página', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'Próxima',
      }),
    );

    expect(employeesMock).toHaveBeenLastCalledWith('', 1);

    vi.useFakeTimers();

    try {
      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'Buscar colaborador por nome ou e-mail',
        }),
        {
          target: { value: 'ana' },
        },
      );

      act(() => vi.advanceTimersByTime(300));

      expect(employeesMock).toHaveBeenLastCalledWith('ana', 0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('mostra mensagem de primeiro cadastro para empresa vazia', () => {
    employeesMock.mockReturnValue({
      ...employeesResult,
      employees: [],
      totalElements: 0,
      totalPages: 0,
    });

    renderPage();

    expect(screen.getByText('Nenhum colaborador cadastrado')).toBeInTheDocument();
  });

  it('distingue busca sem resultados da empresa vazia', () => {
    employeesMock.mockImplementation((search) => ({
      ...employeesResult,
      employees: search ? [] : employeesResult.employees,
      totalElements: search ? 0 : 11,
    }));

    renderPage();

    vi.useFakeTimers();

    try {
      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'Buscar colaborador por nome ou e-mail',
        }),
        {
          target: { value: 'inexistente' },
        },
      );

      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByText('Nenhum resultado para a busca')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('mostra erro e permite tentar novamente', async () => {
    const user = userEvent.setup();

    employeesMock.mockReturnValue({
      ...employeesResult,
      status: 'error',
      errorMessage: 'Falha de rede',
    });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede');

    await user.click(
      screen.getByRole('button', {
        name: 'Tentar carregar os colaboradores novamente',
      }),
    );

    expect(reloadEmployees).toHaveBeenCalledOnce();
  });

  it('recarrega resumo e lista ao atualizar', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'Atualizar dados',
      }),
    );

    expect(reloadSeats).toHaveBeenCalledOnce();
    expect(reloadEmployees).toHaveBeenCalledOnce();
  });

  it('informa que a edição ainda não está disponível, sem chamar API de escrita', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'Editar colaborador',
      }),
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Edição de Ana Paula Ferreira estará disponível em breve.',
    );
    expect(companyEmployeeService.createEmployee).not.toHaveBeenCalled();
    expect(companyEmployeeService.resendInvite).not.toHaveBeenCalled();
  });

  it('cadastra um colaborador pela API e atualiza os dados da tela', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockResolvedValueOnce({
      id: 'employee-2',
      name: 'Joana Silva',
      email: 'joana@empresa.com.br',
      status: 'PENDING',
      assignedCourses: 2,
      avatarUrl: null,
      inviteSent: true,
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    expect(screen.queryByRole('textbox', { name: 'Cargo' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(companyEmployeeService.createEmployee).toHaveBeenCalledWith({
        name: 'Joana Silva',
        email: 'joana@empresa.com.br',
      }),
    );
    expect(reloadEmployees).toHaveBeenCalled();
    expect(reloadSeats).toHaveBeenCalled();
    expect(await screen.findByText('Colaborador cadastrado')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Cadastrar Colaborador' })).not.toBeInTheDocument();
    expect(
      screen.getByText('O convite para criar a senha foi enviado por e-mail.'),
    ).toBeInTheDocument();
  });

  it('keeps the employee when invitation delivery fails and offers a resend action', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockResolvedValueOnce({
      id: 'employee-2',
      name: 'Joana Silva',
      email: 'joana@empresa.com.br',
      status: 'PENDING',
      assignedCourses: 2,
      avatarUrl: null,
      inviteSent: false,
    });
    vi.mocked(companyEmployeeService.resendInvite).mockResolvedValueOnce({
      id: 'employee-2',
      email: 'joana@empresa.com.br',
      inviteSent: true,
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Colaborador cadastrado, convite não enviado'),
    ).toBeInTheDocument();
    expect(reloadEmployees).toHaveBeenCalled();
    expect(reloadSeats).toHaveBeenCalled();

    await user.click(screen.getByText('Reenviar convite'));

    await waitFor(() =>
      expect(companyEmployeeService.resendInvite).toHaveBeenCalledWith('employee-2'),
    );
    expect(await screen.findByText('Convite reenviado')).toBeInTheDocument();
  });

  it('reenvia o convite do colaborador pendente selecionado', async () => {
    const user = userEvent.setup();
    employeesMock.mockReturnValue({
      ...employeesResult,
      employees: [{ ...employeesResult.employees[0], status: 'PENDING' }],
    });
    vi.mocked(companyEmployeeService.resendInvite).mockResolvedValueOnce({
      id: 'employee-1',
      email: 'ana@empresa.com.br',
      inviteSent: true,
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Reenviar convite' }));

    await waitFor(() =>
      expect(companyEmployeeService.resendInvite).toHaveBeenCalledWith('employee-1'),
    );
    expect(await screen.findByText('Convite reenviado')).toBeInTheDocument();
    expect(
      screen.getByText('Um novo e-mail foi enviado para Ana Paula Ferreira.'),
    ).toBeInTheDocument();
  });

  it('avisa quando a API não consegue enviar o convite novamente', async () => {
    const user = userEvent.setup();
    employeesMock.mockReturnValue({
      ...employeesResult,
      employees: [{ ...employeesResult.employees[0], status: 'PENDING' }],
    });
    vi.mocked(companyEmployeeService.resendInvite).mockResolvedValueOnce({
      id: 'employee-1',
      email: 'ana@empresa.com.br',
      inviteSent: false,
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Reenviar convite' }));

    expect(await screen.findByText('Convite não enviado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Não foi possível enviar o convite para ana@empresa.com.br. Tente novamente mais tarde.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the seats notice instead of opening the employee form when no seats remain', async () => {
    const user = userEvent.setup();
    seatsMock.mockReturnValue({
      ...seatsResult,
      seats: {
        ...seatsResult.seats!,
        seatsUsed: 10,
        seatsAvailable: 0,
      },
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));

    expect(screen.getByRole('dialog', { name: 'Vagas esgotadas' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Cadastrar Colaborador' })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Suas vagas acabaram. Compre mais assentos para cadastrar um novo colaborador.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the seats notice and checkout action when the last seat was taken concurrently', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockRejectedValueOnce(
      new CompanyEmployeeServiceError(
        409,
        'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.',
      ),
    );

    render(
      <MemoryRouter>
        <CompanyEmployees />
        <CurrentLocation />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('dialog', { name: 'Vagas esgotadas' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Cadastrar Colaborador' })).not.toBeInTheDocument();
    expect(reloadEmployees).not.toHaveBeenCalled();
    expect(reloadSeats).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Comprar vagas' }));
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent(
      '/checkout/assentos?quantidade=1',
    );
  });

  it('shows an API duplicate-email conflict beside the email field and preserves form values', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockRejectedValueOnce(
      new CompanyEmployeeServiceError(409, 'Este e-mail já está cadastrado.'),
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Joana Silva');
    const emailField = screen.getByRole('textbox', { name: 'E-mail corporativo' });
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
    expect(emailField).toHaveValue('joana@empresa.com.br');
  });

  it('displays the API validation message for a 400 response', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockRejectedValueOnce(
      new CompanyEmployeeServiceError(400, 'Informe um nome válido.'),
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um nome válido.');
    expect(screen.getByRole('dialog', { name: 'Cadastrar Colaborador' })).toBeInTheDocument();
  });

  it('preserves entered form values after a network failure', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockRejectedValueOnce(
      new CompanyEmployeeServiceError(
        0,
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      ),
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor.',
    );
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Joana Silva');
    expect(screen.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveValue(
      'joana@empresa.com.br',
    );
  });
});
