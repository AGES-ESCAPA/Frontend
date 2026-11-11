import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import type { CompanyReportOverview, EmployeeProgress } from '@/types/companyReport';
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

vi.mock('@/data/companyReport', () => ({
  mockCompanyReportOverview: overview,
  mockEmployeeProgress: rows,
}));

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

const getTable = () => screen.getByRole('table', { name: 'Acompanhamento por colaborador' });
const getBodyRows = () => within(getTable()).getAllByRole('row').slice(1);
// A célula do colaborador também tem as iniciais do avatar; o curso identifica a linha.
const getCourses = () =>
  getBodyRows().map((row) => within(row).getAllByRole('cell')[1].textContent);

describe('CompanyDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 10, 10, 14, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page inside the company shell with Métricas selected', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard de Engajamento' }),
    ).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: /Navegação do perfil/ });
    expect(within(navigation).getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the four team indicators formatted, with the monthly variation where it exists', () => {
    renderPage();
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

  it('shows no variation on the cards whose indicator has no previous month', () => {
    renderPage();

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

  it('shows the weekly engagement variation once the API sends it', () => {
    overview.weeklyEngagementChange = -2.1;
    try {
      renderPage();

      expect(
        within(screen.getByRole('article', { name: 'Engajamento semanal' })).getByText(
          'queda de 2,1% em relação ao último mês',
        ),
      ).toBeInTheDocument();
    } finally {
      delete overview.weeklyEngagementChange;
    }
  });

  it('shows the completion rate of each job title on a 0 to 100 scale, in the order of the API', () => {
    renderPage();
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

  it('draws the monthly hours chart with abbreviated months', () => {
    renderPage();
    const chart = screen.getByRole('img', { name: /Média mensal de horas por colaborador/ });

    expect(chart).toHaveAccessibleName(
      'Média mensal de horas por colaborador. Jun: 1h. Jul: 4,5h. Ago: 8h. Set: 10h. Out: 12h. Nov: 9,5h.',
    );
  });

  it('lists the employee, course, progress, last access and certificate of each row', () => {
    renderPage();

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

  it('shows eight rows per page and moves between pages', async () => {
    const user = renderPage();

    expect(getBodyRows()).toHaveLength(8);
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 8 de 10 registros');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(getCourses()).toEqual(['Curso 9', 'Curso 10']);
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página 1' }));

    expect(getBodyRows()).toHaveLength(8);
  });

  it('keeps only completed or in-progress courses and returns to the first page', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    await user.click(screen.getByRole('tab', { name: 'Concluídos' }));

    expect(getBodyRows()).toHaveLength(5);
    getBodyRows().forEach((row) => expect(within(row).getByText('100%')).toBeInTheDocument());
    expect(screen.queryByRole('navigation', { name: 'Paginação do acompanhamento' })).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Em Andamento' }));

    expect(getBodyRows()).toHaveLength(5);
    getBodyRows().forEach((row) => expect(within(row).getByText('40%')).toBeInTheDocument());
  });

  it('searches the employee name after the typing pause and returns to the first page', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'Página 2' }));

    await user.type(screen.getByRole('textbox', { name: 'Buscar colaborador pelo nome' }), 'joao');
    act(() => vi.advanceTimersByTime(300));

    expect(getCourses()).toEqual(['Curso 2']);
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1 de 1 registros');
  });

  it('tells the manager when no row matches the search and the filter', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('tab', { name: 'Concluídos' }));
    await user.type(screen.getByRole('textbox', { name: 'Buscar colaborador pelo nome' }), 'joao');
    act(() => vi.advanceTimersByTime(300));

    expect(
      screen.getByText('Nenhum colaborador encontrado para a busca ou o filtro.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 0 de 0 registros');
  });
});
