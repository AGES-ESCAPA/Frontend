import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompanySeats } from '@hooks/useCompanySeats';
import { useCompanyEmployees } from '@hooks/useCompanyEmployees';
import type { UseCompanySeatsResult } from '@hooks/useCompanySeats';
import type { UseCompanyEmployeesResult } from '@hooks/useCompanyEmployees';
import { CompanyEmployees } from './CompanyEmployees';

vi.mock('@hooks/useCompanySeats', () => ({
  useCompanySeats: vi.fn(),
}));

vi.mock('@hooks/useCompanyEmployees', () => ({
  useCompanyEmployees: vi.fn(),
}));

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

    expect(screen.getByRole('status')).toHaveTextContent('Edição de Ana Paula Ferreira');
  });
});
