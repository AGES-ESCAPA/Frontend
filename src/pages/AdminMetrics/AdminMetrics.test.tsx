import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { adminMetricsService } from '@services/adminMetricsService';
import type { AdminCourseMetrics } from '@/types/adminMetrics';
import { AdminMetrics } from './AdminMetrics';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));

vi.mock('@services/adminMetricsService', () => ({
  adminMetricsService: {
    getCourseMetrics: vi.fn(),
  },
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

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/metricas']}>
      <AdminMetrics />
    </MemoryRouter>,
  );

describe('AdminMetrics — estrutura da US-36', () => {
  beforeEach(() => {
    vi.mocked(adminMetricsService.getCourseMetrics).mockResolvedValue(MOCK_API_COURSE_METRICS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the authenticated shell and all metric areas', async () => {
    renderPage();
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Relatórios Gerais & Métricas' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('article', { name: 'Alunos ativos' })).toBeInTheDocument();
    expect(within(main).getByRole('article', { name: 'Empresas parceiras' })).toBeInTheDocument();
    expect(
      within(main).getByRole('region', { name: 'Taxa Média de Conclusão' }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole('region', { name: 'Evolução de Alunos Ativos' }),
    ).toBeInTheDocument();

    for (const title of ['Taxa Média de Conclusão', 'Evolução de Alunos Ativos']) {
      const panel = within(main).getByRole('region', { name: title });
      expect(within(panel).getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(within(main).getByRole('region', { name: 'Evolução de Alunos Ativos' })).toHaveAttribute(
      'id',
      'evolucao',
    );
    expect(await screen.findByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
  });

  it('keeps the existing administrative navigation with metrics selected', async () => {
    renderPage();
    const navigation = screen.getByRole('navigation', { name: 'Navegação do perfil Admin' });
    const metricsLink = within(navigation).getByRole('link', { name: 'Métricas' });
    expect(metricsLink).toHaveAttribute('href', '/admin/metricas');
    expect(metricsLink).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: 'Gestão de Cursos' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(await screen.findByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
  });

  it('shows unavailable indicators and the existing decorative donut without inventing values', async () => {
    renderPage();
    for (const label of ['Alunos ativos', 'Empresas parceiras']) {
      const card = screen.getByRole('article', { name: label });
      expect(within(card).getByText('—')).toBeInTheDocument();
      expect(within(card).getByText('Dados ainda não disponíveis.')).toBeInTheDocument();
    }
    const completion = screen.getByRole('region', { name: 'Taxa Média de Conclusão' });
    expect(within(completion).getByText('—')).toBeInTheDocument();
    expect(within(completion).getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(within(completion).queryByRole('img')).not.toBeInTheDocument();
    expect(within(completion).getByText('Dados ainda não disponíveis.')).toBeInTheDocument();
    const evolution = screen.getByRole('region', { name: 'Evolução de Alunos Ativos' });
    expect(within(evolution).getByText('Últimos seis meses')).toBeInTheDocument();
    expect(within(evolution).getByText('Dados ainda não disponíveis.')).toBeInTheDocument();
    expect(await screen.findByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
  });
});

describe('AdminMetrics — integração US-37 (Cursos Mais Populares #190)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as métricas de cursos.',
    );

    // Os indicadores globais da US-36 permanecem visíveis e intactos.
    expect(screen.getByRole('article', { name: 'Alunos ativos' })).toHaveTextContent(
      'Dados ainda não disponíveis.',
    );
    expect(screen.getByRole('article', { name: 'Empresas parceiras' })).toHaveTextContent(
      'Dados ainda não disponíveis.',
    );
    expect(screen.getByRole('region', { name: 'Taxa Média de Conclusão' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryButton);

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(await within(leaderCard).findByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
    expect(adminMetricsService.getCourseMetrics).toHaveBeenCalledTimes(2);
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
