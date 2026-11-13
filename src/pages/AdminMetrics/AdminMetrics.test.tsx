import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';
import { AdminMetrics } from './AdminMetrics';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));

const renderPage = (courseMetrics?: PopularCoursesMetricsData) =>
  render(
    <MemoryRouter initialEntries={['/admin/metricas']}>
      <AdminMetrics courseMetrics={courseMetrics} />
    </MemoryRouter>,
  );

describe('AdminMetrics — estrutura da US-36', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the authenticated shell and all metric areas', () => {
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
  });

  it('keeps the existing administrative navigation with metrics selected', () => {
    renderPage();
    const navigation = screen.getByRole('navigation', { name: 'Navegação do perfil Admin' });
    const metricsLink = within(navigation).getByRole('link', { name: 'Métricas' });
    expect(metricsLink).toHaveAttribute('href', '/admin/metricas');
    expect(metricsLink).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: 'Gestão de Cursos' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('shows unavailable indicators and the existing decorative donut without inventing values', () => {
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
  });

  it('renders the page without requesting metrics from the backend', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    expect(screen.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('AdminMetrics — integração US-37 (Cursos Populares)', () => {
  it('renders the popular courses metric blocks and rankings', () => {
    renderPage();

    expect(screen.getByRole('article', { name: 'Curso Mais Acessado' })).toHaveTextContent(
      'Turismo de Aventura',
    );
    expect(
      screen.getByRole('heading', { name: 'Distribuição por Tipo de Curso' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Top 5 Empresas Mais Engajadas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Top 5 Cursos por Acesso' })).toBeInTheDocument();
  });

  it('passes custom courseMetrics props down to the popular courses section', () => {
    const customMetrics: PopularCoursesMetricsData = {
      mostAccessedCourse: {
        courseId: 'c-10',
        title: 'Sommelier e Enologia Aplicada',
        enrollments: 640,
      },
      topCourses: [
        {
          courseId: 'c-10',
          title: 'Sommelier e Enologia Aplicada',
          enrollments: 640,
        },
        {
          courseId: 'c-20',
          title: 'Recepção Bilíngue na Hotelaria',
          enrollments: 410,
        },
      ],
      categoriesCount: 2,
      enrollmentsByCategory: [
        { category: 'Gastronomia', percentage: 60.95 },
        { category: 'Hospitalidade', percentage: 39.05 },
      ],
    };

    renderPage(customMetrics);

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(within(leaderCard).getByText('Sommelier e Enologia Aplicada')).toBeInTheDocument();
    expect(within(leaderCard).getByText('640 matrículas')).toBeInTheDocument();

    const rankingList = screen.getByRole('list', { name: 'Top 5 cursos por matrículas' });
    expect(within(rankingList).getAllByRole('listitem')).toHaveLength(2);
    expect(within(rankingList).getByText('Recepção Bilíngue na Hotelaria')).toBeInTheDocument();

    const legend = screen.getByRole('list', { name: 'Legenda do gráfico' });
    expect(legend).toHaveTextContent(/Gastronomia: 60,95%/);
    expect(legend).toHaveTextContent(/Hospitalidade: 39,05%/);
  });
});
