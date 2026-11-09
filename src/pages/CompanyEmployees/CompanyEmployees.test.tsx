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
      updateEmployee: vi.fn(),
      resendInvitation: vi.fn(),
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

  it('abre o formulário de edição com os dados do colaborador selecionado', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'Editar colaborador',
      }),
    );

    expect(screen.getByRole('heading', { name: 'Editar Colaborador' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toHaveValue(
      'Ana Paula Ferreira',
    );
    expect(screen.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveValue(
      'ana@empresa.com.br',
    );
    expect(screen.getByRole('textbox', { name: 'Cargo' })).toHaveValue('Recepção');
  });

  it('cadastra um colaborador pela API e atualiza os dados da tela', async () => {
    const user = userEvent.setup();
    vi.mocked(companyEmployeeService.createEmployee).mockResolvedValueOnce(
      employeesResult.employees[0],
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.type(screen.getByRole('textbox', { name: 'Cargo' }), 'Recepcionista');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(companyEmployeeService.createEmployee).toHaveBeenCalledWith({
        name: 'Joana Silva',
        email: 'joana@empresa.com.br',
        jobTitle: 'Recepcionista',
      }),
    );
    expect(reloadEmployees).toHaveBeenCalled();
    expect(reloadSeats).toHaveBeenCalled();
    expect(
      await screen.findByText(
        'Colaborador cadastrado. O convite de acesso foi enviado por e-mail.',
      ),
    ).toBeInTheDocument();
  });

  it('reenvia o convite do colaborador pendente selecionado', async () => {
    const user = userEvent.setup();
    employeesMock.mockReturnValue({
      ...employeesResult,
      employees: [{ ...employeesResult.employees[0], status: 'PENDING' }],
    });
    vi.mocked(companyEmployeeService.resendInvitation).mockResolvedValueOnce(
      employeesResult.employees[0],
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Reenviar convite' }));

    await waitFor(() =>
      expect(companyEmployeeService.resendInvitation).toHaveBeenCalledWith('employee-1'),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Convite reenviado para Ana Paula Ferreira.',
    );
  });

  it('reports the unavailable seats error and keeps the employee form open', async () => {
    const user = userEvent.setup();
    seatsMock.mockReturnValue({
      ...seatsResult,
      seats: {
        ...seatsResult.seats!,
        seatsUsed: 10,
        seatsAvailable: 0,
      },
    });
    vi.mocked(companyEmployeeService.createEmployee).mockRejectedValueOnce(
      new CompanyEmployeeServiceError(
        409,
        'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.',
      ),
    );

    renderPage();

    expect(screen.getByRole('button', { name: 'Comprar mais vagas' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cadastrar Colaborador' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Silva');
    await user.type(
      screen.getByRole('textbox', { name: 'E-mail corporativo' }),
      'joana@empresa.com.br',
    );
    await user.type(screen.getByRole('textbox', { name: 'Cargo' }), 'Recepcionista');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.',
    );
    expect(screen.getByRole('dialog', { name: 'Cadastrar Colaborador' })).toBeInTheDocument();
    expect(reloadEmployees).not.toHaveBeenCalled();
    expect(reloadSeats).not.toHaveBeenCalled();
  });

  it('navigates the company with no available seats to seat checkout', async () => {
    const user = userEvent.setup();
    seatsMock.mockReturnValue({
      ...seatsResult,
      seats: {
        ...seatsResult.seats!,
        seatsUsed: 10,
        seatsAvailable: 0,
      },
    });

    render(
      <MemoryRouter>
        <CompanyEmployees />
        <CurrentLocation />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Comprar mais vagas' }));

    expect(screen.getByLabelText('Localização atual')).toHaveTextContent(
      '/checkout/assentos?quantidade=1',
    );
  });
});
