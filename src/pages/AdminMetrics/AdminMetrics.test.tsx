import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { PopularCoursesMetricsData } from '@/types/adminMetrics';
import { AdminMetrics } from './AdminMetrics';

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

describe('AdminMetrics', () => {
  it('integrates the admin Sidebar with Metrics as the active section', () => {
    render(
      <MemoryRouter initialEntries={['/admin/metricas']}>
        <AdminMetrics />
      </MemoryRouter>,
    );

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — admin/i });
    const metricsLink = within(sidebar).getByRole('link', { name: 'Métricas' });

    expect(sidebar).toBeInTheDocument();
    expect(metricsLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders the page heading and the default popular courses metrics blocks', () => {
    render(
      <MemoryRouter initialEntries={['/admin/metricas']}>
        <AdminMetrics />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Métricas da Plataforma' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Curso Mais Acessado' })).toHaveTextContent(
      'Turismo de Aventura',
    );
    expect(
      screen.getByRole('heading', { name: 'Distribuição por Tipo de Curso' }),
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

    render(
      <MemoryRouter initialEntries={['/admin/metricas']}>
        <AdminMetrics courseMetrics={customMetrics} />
      </MemoryRouter>,
    );

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
