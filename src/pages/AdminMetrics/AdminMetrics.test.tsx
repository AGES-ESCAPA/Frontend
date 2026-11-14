import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { adminMetricsService, AdminMetricsServiceError } from '@services/adminMetricsService';
import type * as AdminMetricsServiceModule from '@services/adminMetricsService';
import type { AdminCourseMetrics, AdminMetricsOverview } from '@/types/adminMetrics';
import { adminMetricsOverview, zeroAdminMetricsOverview } from '@/test/adminMetricsFixtures';
import { AdminMetrics } from './AdminMetrics';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));
vi.mock('@services/adminMetricsService', async (importOriginal) => ({
  ...(await importOriginal<typeof AdminMetricsServiceModule>()),
  adminMetricsService: { getOverview: vi.fn(), getCourseMetrics: vi.fn() },
}));

const MOCK_API_COURSE_METRICS: AdminCourseMetrics = {
  mostAccessedCourse: {
    courseId: 'e0000000-0000-4000-e000-000000000001',
    title: 'Turismo de Aventura',
    enrollments: 4820,
  },
  topCourses: [
    {
      courseId: 'e0000000-0000-4000-e000-000000000001',
      title: 'Turismo de Aventura',
      enrollments: 4820,
    },
    {
      courseId: 'e0000000-0000-4000-e000-000000000002',
      title: 'Ecoturismo e Educação Ambiental',
      enrollments: 3940,
    },
  ],
  categoriesCount: 2,
  enrollmentsByCategory: [
    { category: 'Hospitalidade', percentage: 66.67 },
    { category: 'Inteligência Artificial', percentage: 33.33 },
  ],
};

const getOverviewMock = vi.mocked(adminMetricsService.getOverview);
const getCourseMetricsMock = vi.mocked(adminMetricsService.getCourseMetrics);
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/metricas']}>
      <AdminMetrics />
    </MemoryRouter>,
  );

beforeEach(() => {
  getOverviewMock.mockReset().mockResolvedValue(adminMetricsOverview);
  getCourseMetricsMock.mockReset().mockResolvedValue(MOCK_API_COURSE_METRICS);
});

describe('AdminMetrics — integração da US-36', () => {
  it('preserves the authenticated shell and all four metric areas', async () => {
    renderPage();
    await screen.findByText('68%');
    const main = within(screen.getByRole('main'));
    expect(
      main.getByRole('heading', { level: 1, name: 'Relatórios Gerais & Métricas' }),
    ).toBeInTheDocument();
    expect(main.getByRole('article', { name: 'Alunos ativos' })).toBeInTheDocument();
    expect(main.getByRole('article', { name: 'Empresas parceiras' })).toBeInTheDocument();
    for (const title of ['Taxa Média de Conclusão', 'Evolução de Alunos Ativos']) {
      expect(
        within(main.getByRole('region', { name: title })).getByRole('heading', {
          level: 2,
          name: title,
        }),
      ).toBeInTheDocument();
    }
    expect(main.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toHaveAttribute(
      'id',
      'evolucao',
    );
    expect(main.getByText('Últimos seis meses')).toBeInTheDocument();
  });

  it('keeps metrics selected in the administrative navigation', async () => {
    renderPage();
    await screen.findByText('68%');
    const navigation = within(
      screen.getByRole('navigation', { name: 'Navegação do perfil Admin' }),
    );
    expect(navigation.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'href',
      '/admin/metricas',
    );
    expect(navigation.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(navigation.getByRole('link', { name: 'Gestão de Cursos' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('shows four independently labelled skeletons while the overview is pending', () => {
    getOverviewMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    const main = within(screen.getByRole('main'));
    for (const name of [
      'Carregando alunos ativos',
      'Carregando empresas parceiras',
      'Carregando taxa média de conclusão',
      'Carregando evolução de alunos ativos',
    ]) {
      expect(main.getByRole('status', { name })).toHaveAttribute('aria-busy', 'true');
    }
    for (const name of ['Taxa Média de Conclusão', 'Evolução de Alunos Ativos']) {
      expect(within(main.getByRole('region', { name })).queryByRole('img')).not.toBeInTheDocument();
    }
    expect(main.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(getOverviewMock).toHaveBeenCalledOnce();
  });

  it('shows real Brazilian counts and an accessible progress donut using the actual rate', async () => {
    renderPage();
    await screen.findByText('68%');
    expect(
      within(screen.getByRole('article', { name: 'Alunos ativos' })).getByText('12.847'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Empresas parceiras' })).getByText('1.532'),
    ).toBeInTheDocument();
    const completion = within(screen.getByRole('region', { name: 'Taxa Média de Conclusão' }));
    expect(
      completion.getByRole('img', { name: /Taxa média de conclusão.*68 de 100, 68%/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Dados ainda não disponíveis.')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a fractional rate with a Brazilian decimal separator', async () => {
    getOverviewMock.mockResolvedValue({ ...adminMetricsOverview, averageCompletionRate: 66.67 });
    renderPage();
    expect(await screen.findByText('66,67%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /66,67 de 100, 66,67%/ })).toBeInTheDocument();
  });

  it('draws six monthly points including zero and keeps every formatted value accessible', async () => {
    renderPage();
    const chart = await screen.findByRole('img', {
      name: 'Evolução de Alunos Ativos. jun. 26: 9.500. jul. 26: 0. ago. 26: 11.230. set. 26: 12.001. out. 26: 12.700. nov. 26: 13.001.',
    });
    expect(chart.querySelectorAll('.recharts-line-dot')).toHaveLength(6);
    expect(
      within(screen.getByRole('article', { name: 'Alunos ativos' })).getByText('12.847'),
    ).toBeInTheDocument();
  });

  it('renders a zero overview as successful metrics and six zero points', async () => {
    getOverviewMock.mockResolvedValue(zeroAdminMetricsOverview);
    renderPage();
    expect(await screen.findByText('0%')).toBeInTheDocument();
    for (const label of ['Alunos ativos', 'Empresas parceiras']) {
      expect(
        within(screen.getByRole('article', { name: label })).getByText('0'),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole('img', { name: /Taxa média de conclusão.*0 de 100, 0%/ }),
    ).toBeInTheDocument();
    const chart = screen.getByRole('img', {
      name: 'Evolução de Alunos Ativos. jun. 26: 0. jul. 26: 0. ago. 26: 0. set. 26: 0. out. 26: 0. nov. 26: 0.',
    });
    expect(chart.querySelectorAll('.recharts-line-dot')).toHaveLength(6);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum dado disponível.')).not.toBeInTheDocument();
  });

  it.each([
    [new AdminMetricsServiceError(0, 'Verifique sua conexão.'), 'Verifique sua conexão.'],
    [
      new AdminMetricsServiceError(404, 'Resource not found: /api/v1/admin/metrics/overview'),
      'Não foi possível carregar os indicadores. Tente novamente.',
    ],
    [
      new AdminMetricsServiceError(500, 'Internal error'),
      'Não foi possível carregar os indicadores. Tente novamente.',
    ],
  ])(
    'shows an error and retry action for %s without inventing zero values',
    async (error, message) => {
      getOverviewMock.mockRejectedValue(error);
      renderPage();
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getAllByRole('button', { name: 'Tentar novamente' })).toHaveLength(1);
      for (const label of ['Alunos ativos', 'Empresas parceiras']) {
        expect(
          within(screen.getByRole('article', { name: label })).getByText('—'),
        ).toBeInTheDocument();
      }
      const main = within(screen.getByRole('main'));
      for (const name of ['Taxa Média de Conclusão', 'Evolução de Alunos Ativos']) {
        expect(
          within(main.getByRole('region', { name })).queryByRole('img'),
        ).not.toBeInTheDocument();
      }
      expect(main.getByRole('img', { name: /Distribuição por tipo de curso/ })).toBeInTheDocument();
      expect(main.queryByRole('status')).not.toBeInTheDocument();
      expect(
        main.getByRole('region', { name: 'Indicadores de cursos mais populares' }),
      ).toBeInTheDocument();
    },
  );

  it('retries after a failure, shows skeletons and recovers without reloading the page', async () => {
    const user = userEvent.setup();
    let resolveRetry!: (data: AdminMetricsOverview) => void;
    const retry = new Promise<AdminMetricsOverview>((resolve) => {
      resolveRetry = resolve;
    });
    getOverviewMock
      .mockRejectedValueOnce(new AdminMetricsServiceError(0, 'Verifique sua conexão.'))
      .mockReturnValueOnce(retry);
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('status')).toHaveLength(4);
    expect(getOverviewMock).toHaveBeenCalledTimes(2);
    resolveRetry(adminMetricsOverview);
    expect(await screen.findByText('68%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('AdminMetrics — integração US-37 (Cursos Mais Populares #190)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the popular courses blocks alongside the overview', async () => {
    renderPage();
    await screen.findByText('68%');

    expect(
      await within(screen.getByRole('article', { name: 'Curso Mais Acessado' })).findByText(
        'Turismo de Aventura',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Distribuição por Tipo de Curso' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Top 5 Empresas Mais Engajadas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Top 5 Cursos por Acesso' })).toBeInTheDocument();
  });

  it('shows independent loading skeletons in the three course blocks while the request is pending', () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockReturnValue(
      new Promise<AdminCourseMetrics>(() => {}),
    );

    renderPage();

    expect(
      screen.getByRole('status', { name: 'Carregando curso mais acessado' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Carregando distribuição por tipo de curso' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Carregando ranking de cursos' }),
    ).toBeInTheDocument();
  });

  it('renders real course metrics with compact formatting, ordered ranking and category distribution', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockResolvedValue(MOCK_API_COURSE_METRICS);

    renderPage();

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(await within(leaderCard).findByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();

    const rankingList = screen.getByRole('list', { name: 'Top 5 cursos por matrículas' });
    const items = within(rankingList).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(items[0]).getByText('4.820')).toBeInTheDocument();
    expect(within(items[1]).getByText('Ecoturismo e Educação Ambiental')).toBeInTheDocument();
    expect(within(items[1]).getByText('3.940')).toBeInTheDocument();

    const distributionChart = screen.getByRole('img', {
      name: /Distribuição por tipo de curso\. 2 Categorias\. Hospitalidade: 66,67%\. Inteligência Artificial: 33,33%/i,
    });
    expect(within(distributionChart).getByText('2')).toBeInTheDocument();
    expect(within(distributionChart).getByText('Categorias')).toBeInTheDocument();

    const legend = screen.getByRole('list', { name: 'Legenda do gráfico' });
    expect(legend).toHaveTextContent(/Hospitalidade: 66,67%/);
    expect(legend).toHaveTextContent(/Inteligência Artificial: 33,33%/);
  });

  it('shows informative empty messages without rendering an empty chart when the platform has no enrollments', async () => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockResolvedValue({
      mostAccessedCourse: null,
      topCourses: [],
      categoriesCount: 0,
      enrollmentsByCategory: [],
    });

    renderPage();

    expect(
      await screen.findByText('Nenhuma matrícula registrada por categoria.'),
    ).toBeInTheDocument();

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(within(leaderCard).getByText('—')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Nenhuma matrícula registrada')).toBeInTheDocument();

    expect(screen.getByText('Nenhum curso com matrículas registradas.')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /Distribuição por tipo de curso/i }),
    ).not.toBeInTheDocument();
  });

  it('handles course metrics error and retries only the course endpoint while keeping US-36 indicators intact', async () => {
    const user = userEvent.setup();
    vi.mocked(adminMetricsService.getCourseMetrics)
      .mockRejectedValueOnce(new Error('Não foi possível carregar as métricas de cursos.'))
      .mockResolvedValueOnce(MOCK_API_COURSE_METRICS);

    renderPage();
    await screen.findByText('68%');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as métricas de cursos.',
    );

    // Os indicadores globais da US-36 permanecem visíveis e intactos.
    expect(screen.getByRole('article', { name: 'Alunos ativos' })).toHaveTextContent('12.847');
    expect(screen.getByRole('article', { name: 'Empresas parceiras' })).toHaveTextContent('1.532');
    expect(screen.getByRole('region', { name: 'Taxa Média de Conclusão' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryButton);

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(await within(leaderCard).findByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
    expect(adminMetricsService.getCourseMetrics).toHaveBeenCalledTimes(2);
    expect(getOverviewMock).toHaveBeenCalledOnce();
  });

  it('aborts the course metrics request when the page unmounts', () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(adminMetricsService.getCourseMetrics).mockImplementation((signal) => {
      capturedSignal = signal;
      return new Promise<AdminCourseMetrics>(() => {});
    });

    const { unmount } = renderPage();

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
