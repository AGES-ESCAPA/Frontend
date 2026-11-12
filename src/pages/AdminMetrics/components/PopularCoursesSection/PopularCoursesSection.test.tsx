import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { PopularCoursesSectionProps } from '@/types/adminMetrics';
import { PopularCoursesSection } from './PopularCoursesSection';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({
    children,
    accessibilityLayer,
  }: {
    children: ReactNode;
    accessibilityLayer: boolean;
  }) => <svg data-accessibility-layer={String(accessibilityLayer)}>{children}</svg>,
  Pie: ({
    children,
    data,
    rootTabIndex,
  }: {
    children: ReactNode;
    data: unknown[];
    rootTabIndex: number;
  }) => (
    <g data-testid="pie" data-segment-count={data.length} data-root-tab-index={rootTabIndex}>
      {children}
    </g>
  ),
  Cell: ({ fill }: { fill: string }) => <path data-testid="chart-segment" data-fill={fill} />,
}));

const BASE_PROPS: PopularCoursesSectionProps = {
  mostAccessedCourse: {
    courseId: 'course-1',
    title: 'Turismo de Aventura',
    enrollments: 4820,
  },
  topCourses: [
    {
      courseId: 'course-1',
      title: 'Condutor de Turismo de Aventura',
      enrollments: 4820,
    },
    {
      courseId: 'course-2',
      title: 'Ecoturismo e Educação Ambiental',
      enrollments: 3940,
    },
    {
      courseId: 'course-3',
      title: 'Gestão de Pousadas e Hostels',
      enrollments: 3120,
    },
    {
      courseId: 'course-4',
      title: 'Marketing Digital para Destinos',
      enrollments: 2890,
    },
    {
      courseId: 'course-5',
      title: 'Introdução ao Patrimônio Cultural',
      enrollments: 1840,
    },
  ],
  categoriesCount: 4,
  enrollmentsByCategory: [
    { category: 'Hospitalidade', percentage: 45 },
    { category: 'Inteligência Artificial', percentage: 25 },
    { category: 'Inovação', percentage: 18 },
    { category: 'Marketing', percentage: 12 },
  ],
};

describe('PopularCoursesSection', () => {
  it('renders the Most Accessed Course card, the category distribution panel and the Top 5 ranking panel', () => {
    render(<PopularCoursesSection {...BASE_PROPS} />);

    const region = screen.getByRole('region', {
      name: 'Indicadores de cursos mais populares',
    });

    expect(
      within(region).getByRole('article', { name: 'Curso Mais Acessado' }),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole('heading', { name: 'Distribuição por Tipo de Curso' }),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole('heading', { name: 'Top 5 Cursos por Acesso' }),
    ).toBeInTheDocument();
  });

  it('displays the leader course title and formats the enrollments count with compact notation', () => {
    const { rerender } = render(<PopularCoursesSection {...BASE_PROPS} />);

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });

    expect(within(leaderCard).getByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection
        {...BASE_PROPS}
        mostAccessedCourse={{
          courseId: 'course-1',
          title: 'Hospitalidade Executiva',
          enrollments: 420,
        }}
      />,
    );

    expect(within(leaderCard).getByText('Hospitalidade Executiva')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Mais de 420 matrículas')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection
        {...BASE_PROPS}
        mostAccessedCourse={{
          courseId: 'course-1',
          title: 'Hospitalidade Executiva',
          enrollments: 1,
        }}
      />,
    );

    expect(within(leaderCard).getByText('Mais de 1 matrícula')).toBeInTheDocument();
  });

  it('renders independent loading skeletons for each of the three course blocks when status is loading', () => {
    render(<PopularCoursesSection {...BASE_PROPS} status="loading" />);

    expect(screen.getByRole('status', { name: 'Carregando curso mais acessado' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.getByRole('status', { name: 'Carregando distribuição por tipo de curso' }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Carregando ranking de cursos' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    expect(screen.queryByText('Turismo de Aventura')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Top 5 cursos por matrículas' }),
    ).not.toBeInTheDocument();
  });

  it('replaces the card, ranking and distribution with informative messages when there are no eligible enrollments', () => {
    render(
      <PopularCoursesSection
        mostAccessedCourse={null}
        topCourses={[]}
        categoriesCount={0}
        enrollmentsByCategory={[]}
        status="success"
      />,
    );

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(within(leaderCard).getByText('—')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Nenhuma matrícula registrada')).toBeInTheDocument();

    expect(screen.getByText('Nenhuma matrícula registrada por categoria.')).toBeInTheDocument();
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();

    expect(screen.getByText('Nenhum curso com matrículas registradas.')).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Top 5 cursos por matrículas' }),
    ).not.toBeInTheDocument();
  });

  it('shows the error message and retry button when status is error and calls onRetry when clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { rerender } = render(
      <PopularCoursesSection
        {...BASE_PROPS}
        status="error"
        errorMessage="Falha ao buscar métricas de cursos."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao buscar métricas de cursos.');
    expect(screen.getAllByText('Indicador indisponível.')).toHaveLength(3);
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<PopularCoursesSection {...BASE_PROPS} status="error" errorMessage={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as métricas de cursos.',
    );
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('renders ranked courses in the exact received order with their positions and enrollments', () => {
    render(<PopularCoursesSection {...BASE_PROPS} />);

    const rankingList = screen.getByRole('list', { name: 'Top 5 cursos por matrículas' });
    expect(rankingList.tagName).toBe('OL');

    const items = within(rankingList).getAllByRole('listitem');
    expect(items).toHaveLength(5);

    expect(within(items[0]).getByText('1')).toBeInTheDocument();
    expect(within(items[0]).getByText('Condutor de Turismo de Aventura')).toBeInTheDocument();
    expect(within(items[0]).getByText('4.820')).toBeInTheDocument();

    expect(within(items[1]).getByText('2')).toBeInTheDocument();
    expect(within(items[1]).getByText('Ecoturismo e Educação Ambiental')).toBeInTheDocument();
    expect(within(items[1]).getByText('3.940')).toBeInTheDocument();

    expect(within(items[2]).getByText('3')).toBeInTheDocument();
    expect(within(items[2]).getByText('Gestão de Pousadas e Hostels')).toBeInTheDocument();
    expect(within(items[2]).getByText('3.120')).toBeInTheDocument();

    expect(within(items[3]).getByText('4')).toBeInTheDocument();
    expect(within(items[3]).getByText('Marketing Digital para Destinos')).toBeInTheDocument();
    expect(within(items[3]).getByText('2.890')).toBeInTheDocument();

    expect(within(items[4]).getByText('5')).toBeInTheDocument();
    expect(within(items[4]).getByText('Introdução ao Patrimônio Cultural')).toBeInTheDocument();
    expect(within(items[4]).getByText('1.840')).toBeInTheDocument();
  });

  it('renders the category distribution DonutChart with proportional segments, legend and center count', () => {
    const { rerender } = render(
      <PopularCoursesSection
        {...BASE_PROPS}
        categoriesCount={2}
        enrollmentsByCategory={[
          { category: 'Hospitalidade', percentage: 66.67 },
          { category: 'Gastronomia', percentage: 33.33 },
        ]}
      />,
    );

    expect(screen.getByTestId('pie')).toHaveAttribute('data-segment-count', '2');
    const chart = screen.getByRole('img', {
      name: /Distribuição por tipo de curso\. 2 Categorias\. Hospitalidade: 66,67%\. Gastronomia: 33,33%/i,
    });
    expect(chart).toBeInTheDocument();

    const legend = screen.getByRole('list', { name: 'Legenda do gráfico' });
    expect(legend).toHaveTextContent(/Hospitalidade: 66,67%/);
    expect(legend).toHaveTextContent(/Gastronomia: 33,33%/);
    expect(within(chart).getByText('2')).toBeInTheDocument();
    expect(within(chart).getByText('Categorias')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection
        {...BASE_PROPS}
        categoriesCount={1}
        enrollmentsByCategory={[{ category: 'Hospitalidade', percentage: 100 }]}
      />,
    );

    const singleCategoryChart = screen.getByRole('img', {
      name: /Distribuição por tipo de curso\. 1 Categoria\./i,
    });
    expect(within(singleCategoryChart).getByText('1')).toBeInTheDocument();
    expect(within(singleCategoryChart).getByText('Categoria')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection {...BASE_PROPS} categoriesCount={-3} enrollmentsByCategory={[]} />,
    );

    expect(screen.getByText('Nenhuma matrícula registrada por categoria.')).toBeInTheDocument();
  });

  it('renders optional layout slots alongside the popular courses cards and panels', () => {
    render(
      <PopularCoursesSection
        {...BASE_PROPS}
        className="custom-metrics-section"
        kpiLeadingCards={<article aria-label="KPI Inicial">120</article>}
        kpiTrailingCards={<article aria-label="KPI Final">68%</article>}
        middlePanel={<section aria-label="Painel Central">Ranking Empresas</section>}
        bottomPanel={<section aria-label="Painel Inferior">Evolução</section>}
      />,
    );

    const region = screen.getByRole('region', {
      name: 'Indicadores de cursos mais populares',
    });

    expect(region).toHaveClass('custom-metrics-section');
    expect(within(region).getByRole('article', { name: 'KPI Inicial' })).toHaveTextContent('120');
    expect(
      within(region).getByRole('article', { name: 'Curso Mais Acessado' }),
    ).toBeInTheDocument();
    expect(within(region).getByRole('article', { name: 'KPI Final' })).toHaveTextContent('68%');
    expect(within(region).getByRole('region', { name: 'Painel Central' })).toHaveTextContent(
      'Ranking Empresas',
    );
    expect(within(region).getByRole('region', { name: 'Painel Inferior' })).toHaveTextContent(
      'Evolução',
    );
  });
});
