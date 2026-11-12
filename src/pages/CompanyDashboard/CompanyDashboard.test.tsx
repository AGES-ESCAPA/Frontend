import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { companyReportService } from '@services/companyReportService';
import type {
  CompanyReportOverview,
  EmployeeProgress,
  EmployeeProgressFilters,
  EmployeeProgressPage,
} from '@/types/companyReport';
import { CompanyDashboard } from './CompanyDashboard';

const { overview, rows } = vi.hoisted(() => {
  const overview: CompanyReportOverview = {
    completionRate: 78.4,
    completionRateChange: 5.2,
    averageHoursPerEmployee: 12.6,
    certificatesThisQuarter: 1420,
    weeklyEngagement: 89,
    // Como a API: cargos em ordem alfabética e sem weeklyEngagementChange.
    completionByJobTitle: [
      { jobTitle: 'Governança', completionRate: 64.5 },
      { jobTitle: 'Recepção', completionRate: 92 },
    ],
    monthlyHours: [
      { month: '2026-06', averageHours: 1 },
      { month: '2026-07', averageHours: 4.5 },
      { month: '2026-08', averageHours: 8 },
      { month: '2026-09', averageHours: 10 },
      { month: '2026-10', averageHours: 12 },
      { month: '2026-11', averageHours: 9.5 },
    ],
  };

  // Dez linhas: duas páginas de oito. As concluídas são as de índice par.
  const rows: EmployeeProgress[] = Array.from({ length: 10 }, (_, index) => ({
    userId: `user-${index + 1}`,
    name: `Colaborador ${String(index + 1).padStart(2, '0')}`,
    avatarUrl: null,
    courseId: `course-${index + 1}`,
    course: `Curso ${index + 1}`,
    progress: index % 2 === 0 ? 100 : 40,
    lastAccessAt: '2026-10-01T10:00:00',
    certificateIssued: index % 2 === 0,
  }));
  rows[0] = { ...rows[0], name: 'Ana Silva', lastAccessAt: '2026-11-10T09:15:00' };
  rows[1] = { ...rows[1], name: 'João Souza', lastAccessAt: '2026-11-09T16:40:00' };

  return { overview, rows };
});

vi.mock('@services/companyReportService', () => ({
  companyReportService: {
    getOverview: vi.fn(),
    listEmployeeProgress: vi.fn(),
  },
}));

const getOverviewMock = vi.mocked(companyReportService.getOverview);
const listMock = vi.mocked(companyReportService.listEmployeeProgress);

const PAGE_SIZE = 8;

/** Faz o papel do backend: filtra pelo nome e pela situação e devolve a página pedida. */
const fakeBackend = async (
  { search, status }: EmployeeProgressFilters,
  page = 0,
): Promise<EmployeeProgressPage> => {
  const term = search
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const filtered = rows.filter((row) => {
    if (status === 'COMPLETED' && row.progress < 100) return false;
    if (status === 'IN_PROGRESS' && row.progress >= 100) return false;
    const name = row.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    return name.includes(term);
  });

  return {
    content: filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    pageNumber: page,
    pageSize: PAGE_SIZE,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
  };
};

const EMPTY_PAGE: EmployeeProgressPage = {
  content: [],
  pageNumber: 0,
  pageSize: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
};

const never = <T,>() => new Promise<T>(() => {});

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));

const renderPage = () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <MemoryRouter initialEntries={['/empresa/dashboard']}>
      <CompanyDashboard />
    </MemoryRouter>,
  );
  return user;
};

/** Renderiza e espera os dois blocos carregarem. */
const renderLoaded = async () => {
  const user = renderPage();
  await screen.findByRole('table', { name: 'Acompanhamento por colaborador' });
  await screen.findByText('Taxa de conclusão global');
  await waitFor(() => expect(screen.queryAllByRole('status', { busy: true })).toHaveLength(0));
  return user;
};

const waitForTable = () => screen.findByRole('table', { name: 'Acompanhamento por colaborador' });
const getTable = () => screen.getByRole('table', { name: 'Acompanhamento por colaborador' });
const getBodyRows = () => within(getTable()).getAllByRole('row').slice(1);
// A célula do colaborador também tem as iniciais do avatar; o curso identifica a linha.
const getCourses = () =>
  getBodyRows().map((row) => within(row).getAllByRole('cell')[1].textContent);

describe('CompanyDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 10, 10, 14, 0));
    getOverviewMock.mockReset().mockResolvedValue(overview);
    listMock.mockReset().mockImplementation(fakeBackend);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page inside the company shell with Métricas selected', async () => {
    await renderLoaded();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard de Engajamento' }),
    ).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: /Navegação do perfil/ });
    expect(within(navigation).getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the four team indicators formatted, with the monthly variation where it exists', async () => {
    await renderLoaded();
    const card = (name: string) => screen.getByRole('article', { name });

    const completion = card('Taxa de conclusão global');
    expect(within(completion).getByText('78,4%')).toBeInTheDocument();
    expect(
      within(completion).getByText('aumento de 5,2% em relação ao último mês'),
    ).toBeInTheDocument();

    const hours = card('Média de horas cursadas');
    expect(within(hours).getByText('12,6h')).toBeInTheDocument();
    expect(within(hours).getByText('por colaborador')).toBeInTheDocument();

    const certificates = card('Certificados emitidos');
    expect(within(certificates).getByText('1.420')).toBeInTheDocument();
    expect(within(certificates).getByText('no trimestre atual')).toBeInTheDocument();

    const engagement = card('Engajamento semanal');
    expect(within(engagement).getByText('89%')).toBeInTheDocument();
    expect(within(engagement).getByText('colaboradores ativos')).toBeInTheDocument();
  });

  it('shows no variation on the cards whose indicator has no previous month', async () => {
    await renderLoaded();

    for (const name of [
      'Média de horas cursadas',
      'Certificados emitidos',
      'Engajamento semanal',
    ]) {
      expect(
        within(screen.getByRole('article', { name })).queryByText(/em relação ao último mês/),
      ).not.toBeInTheDocument();
    }
  });

  it('shows the weekly engagement variation once the API sends it', async () => {
    getOverviewMock.mockResolvedValue({ ...overview, weeklyEngagementChange: -2.1 });
    await renderLoaded();

    expect(
      within(screen.getByRole('article', { name: 'Engajamento semanal' })).getByText(
        'queda de 2,1% em relação ao último mês',
      ),
    ).toBeInTheDocument();
  });

  it('shows the completion rate of each job title on a 0 to 100 scale, in the order of the API', async () => {
    await renderLoaded();
    const list = screen.getByRole('list', { name: 'Taxa de conclusão por departamento' });

    const [first, second] = within(list).getAllByRole('progressbar');
    expect(first).toHaveAccessibleName('Governança');
    expect(second).toHaveAccessibleName('Recepção');
    expect(within(list).getByRole('progressbar', { name: 'Recepção' })).toHaveAttribute(
      'aria-valuenow',
      '92',
    );
    expect(within(list).getByText('64,5%')).toBeInTheDocument();
  });

  it('draws the monthly hours chart with abbreviated months', async () => {
    await renderLoaded();
    const chart = screen.getByRole('img', { name: /Média mensal de horas por colaborador/ });

    expect(chart).toHaveAccessibleName(
      'Média mensal de horas por colaborador. Jun: 1h. Jul: 4,5h. Ago: 8h. Set: 10h. Out: 12h. Nov: 9,5h.',
    );
  });

  it('lists the employee, course, progress, last access and certificate of each row', async () => {
    await renderLoaded();

    expect(
      within(getTable())
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Colaborador', 'Curso', '% Progresso', 'Último acesso', 'Certificado']);

    const [ana, joao] = getBodyRows();
    expect(within(ana).getByText('Ana Silva')).toBeInTheDocument();
    expect(within(ana).getByText('Curso 1')).toBeInTheDocument();
    expect(within(ana).getByText('100%')).toBeInTheDocument();
    expect(within(ana).getByText('Hoje, 09:15')).toBeInTheDocument();
    expect(within(ana).getByText('Sim')).toBeInTheDocument();

    expect(within(joao).getByText('40%')).toBeInTheDocument();
    expect(within(joao).getByText('Ontem, 16:40')).toBeInTheDocument();
    expect(within(joao).getByText('Não')).toBeInTheDocument();

    expect(within(getBodyRows()[2]).getByText('01 Out 2026')).toBeInTheDocument();
  });

  it('asks the API for the next page and moves between pages', async () => {
    const user = await renderLoaded();

    expect(getBodyRows()).toHaveLength(8);
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 8 de 10 registros');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    await waitFor(() => expect(getCourses()).toEqual(['Curso 9', 'Curso 10']));

    expect(listMock).toHaveBeenLastCalledWith(
      { search: '', status: null },
      1,
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página 1' }));
    await waitFor(() => expect(getBodyRows()).toHaveLength(8));
  });

  it('sends the status filter to the API and reloads from the first page', async () => {
    const user = await renderLoaded();
    await user.click(screen.getByRole('button', { name: 'Página 2' }));
    await waitFor(() => expect(getCourses()).toEqual(['Curso 9', 'Curso 10']));

    await user.click(screen.getByRole('tab', { name: 'Concluídos' }));
    await waitFor(() => expect(getBodyRows()).toHaveLength(5));

    expect(listMock).toHaveBeenLastCalledWith(
      { search: '', status: 'COMPLETED' },
      0,
      expect.any(AbortSignal),
    );
    getBodyRows().forEach((row) => expect(within(row).getByText('100%')).toBeInTheDocument());
    expect(screen.queryByRole('navigation', { name: 'Paginação do acompanhamento' })).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Em Andamento' }));
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith(
        { search: '', status: 'IN_PROGRESS' },
        0,
        expect.any(AbortSignal),
      ),
    );
    await waitForTable();

    getBodyRows().forEach((row) => expect(within(row).getByText('40%')).toBeInTheDocument());
  });

  it('sends the search after the typing pause and reloads from the first page', async () => {
    const user = await renderLoaded();
    await user.click(screen.getByRole('button', { name: 'Página 2' }));
    await waitFor(() => expect(getCourses()).toEqual(['Curso 9', 'Curso 10']));

    await user.type(screen.getByRole('textbox', { name: 'Buscar colaborador pelo nome' }), 'joao');
    act(() => vi.advanceTimersByTime(300));
    await waitFor(() => expect(getCourses()).toEqual(['Curso 2']));

    expect(listMock).toHaveBeenLastCalledWith(
      { search: 'joao', status: null },
      0,
      expect.any(AbortSignal),
    );
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1 de 1 registros');
  });

  it('keeps the table, not the empty company message, when the search finds no row', async () => {
    const user = await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Concluídos' }));
    await waitFor(() => expect(getBodyRows()).toHaveLength(5));
    await user.type(screen.getByRole('textbox', { name: 'Buscar colaborador pelo nome' }), 'joao');
    act(() => vi.advanceTimersByTime(300));

    expect(
      await screen.findByText('Nenhum colaborador encontrado para a busca ou o filtro.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 0 de 0 registros');
    expect(
      screen.queryByRole('link', { name: 'Ir para Gestão de Colaboradores' }),
    ).not.toBeInTheDocument();
  });

  describe('states', () => {
    it('shows a skeleton on each block while it loads', () => {
      getOverviewMock.mockReturnValue(never());
      listMock.mockReturnValue(never());
      renderPage();

      for (const label of [
        'Carregando taxa de conclusão global',
        'Carregando média de horas cursadas',
        'Carregando certificados emitidos',
        'Carregando engajamento semanal',
        'Carregando conclusão por departamento',
        'Carregando evolução mensal de horas',
        'Carregando acompanhamento por colaborador',
      ]) {
        expect(screen.getByRole('status', { name: label })).toHaveAttribute('aria-busy', 'true');
      }
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('sends a company without employees to the Employee Management', async () => {
      listMock.mockResolvedValue(EMPTY_PAGE);
      renderPage();

      const link = await screen.findByRole('link', { name: 'Ir para Gestão de Colaboradores' });

      expect(link).toHaveAttribute('href', '/empresa/colaboradores');
      expect(
        screen.getByRole('heading', { name: 'Sua equipe ainda não está em nenhum curso' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Indicadores da equipe' })).toBeNull();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('keeps the table when the indicators fail and retries only them', async () => {
      getOverviewMock
        .mockRejectedValueOnce(new Error('Não foi possível conectar ao servidor.'))
        .mockResolvedValueOnce(overview);
      const user = renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Não foi possível conectar ao servidor.',
      );
      await waitForTable();
      expect(getBodyRows()).toHaveLength(8);
      expect(
        within(screen.getByRole('article', { name: 'Taxa de conclusão global' })).getByText('—'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Gráfico indisponível.')).toHaveLength(2);

      await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

      expect(await screen.findByText('78,4%')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(getOverviewMock).toHaveBeenCalledTimes(2);
      expect(listMock).toHaveBeenCalledTimes(1);
    });

    it('keeps the indicators when the table fails and retries only it', async () => {
      listMock
        .mockRejectedValueOnce(new Error('Falha de rede no acompanhamento.'))
        .mockImplementation(fakeBackend);
      const user = renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Falha de rede no acompanhamento.',
      );
      expect(await screen.findByText('78,4%')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Ir para Gestão de Colaboradores' }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      await waitForTable();

      expect(getBodyRows()).toHaveLength(8);
      expect(getOverviewMock).toHaveBeenCalledTimes(1);
      expect(listMock).toHaveBeenCalledTimes(2);
    });
  });
});
