import { render, screen, within } from '@testing-library/react';
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

  it('displays the leader course title and formats the enrollments count in the Most Accessed Course card', () => {
    render(<PopularCoursesSection {...BASE_PROPS} />);

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });

    expect(within(leaderCard).getByText('Turismo de Aventura')).toBeInTheDocument();
    expect(within(leaderCard).getByText('4.820 matrículas')).toBeInTheDocument();
  });

  it('supports singular enrollment formatting and custom enrollmentsLabel on the leader card', () => {
    const { rerender } = render(
      <PopularCoursesSection
        {...BASE_PROPS}
        mostAccessedCourse={{
          courseId: 'course-1',
          title: 'Hospitalidade Executiva',
          enrollments: 1,
        }}
      />,
    );

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(within(leaderCard).getByText('Hospitalidade Executiva')).toBeInTheDocument();
    expect(within(leaderCard).getByText('1 matrícula')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection
        {...BASE_PROPS}
        mostAccessedCourse={{
          courseId: 'course-1',
          title: 'Turismo de Aventura',
          enrollments: 4820,
          enrollmentsLabel: 'Mais de 4,8 mil matrículas',
        }}
      />,
    );

    expect(within(leaderCard).getByText('Mais de 4,8 mil matrículas')).toBeInTheDocument();
  });

  it('shows a safe fallback when mostAccessedCourse is null or enrollments is omitted', () => {
    const { rerender } = render(
      <PopularCoursesSection {...BASE_PROPS} mostAccessedCourse={null} />,
    );

    const leaderCard = screen.getByRole('article', { name: 'Curso Mais Acessado' });
    expect(within(leaderCard).getByText('—')).toBeInTheDocument();
    expect(within(leaderCard).getByText('Nenhuma matrícula registrada')).toBeInTheDocument();

    rerender(
      <PopularCoursesSection {...BASE_PROPS} mostAccessedCourse={{ title: 'Curso Inicial' }} />,
    );

    expect(within(leaderCard).getByText('Curso Inicial')).toBeInTheDocument();
    expect(within(leaderCard).getByText('0 matrículas')).toBeInTheDocument();
  });

  it('renders up to five ranked courses in the exact received order with their positions and enrollments', () => {
    render(
      <PopularCoursesSection
        {...BASE_PROPS}
        topCourses={[
          ...BASE_PROPS.topCourses,
          {
            courseId: 'course-6',
            title: 'Curso Excedente Não Exibido',
            enrollments: 900,
          },
        ]}
      />,
    );

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

    expect(screen.queryByText('Curso Excedente Não Exibido')).not.toBeInTheDocument();
  });

  it('renders the empty message when topCourses is empty', () => {
    render(<PopularCoursesSection {...BASE_PROPS} topCourses={[]} />);

    expect(screen.getByText('Nenhum curso com matrículas registradas.')).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Top 5 cursos por matrículas' }),
    ).not.toBeInTheDocument();
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

    expect(
      screen.getByRole('img', {
        name: /Distribuição por tipo de curso\. 0 Categorias\. Nenhum dado disponível/i,
      }),
    ).toBeInTheDocument();
  });

  it('applies the responsive grid containers for KPI and chart panels and preserves custom className', () => {
    render(<PopularCoursesSection {...BASE_PROPS} className="custom-metrics-section" />);

    const region = screen.getByRole('region', {
      name: 'Indicadores de cursos mais populares',
    });

    expect(region.className).toMatch(/section/);
    expect(region.className).toMatch(/custom-metrics-section/);
    expect(region.className).not.toMatch(/undefined/);
    expect(region.children).toHaveLength(2);
    expect(region.children[0].className).toMatch(/kpiGrid/);
    expect(region.children[1].className).toMatch(/chartsGrid/);
  });
});
