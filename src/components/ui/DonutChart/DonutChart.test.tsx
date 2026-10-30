import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DonutChart } from './DonutChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: ReactNode }) => <svg>{children}</svg>,
  Pie: ({ children, data }: { children: ReactNode; data: unknown[] }) => (
    <g data-testid="pie" data-segment-count={data.length}>
      {children}
    </g>
  ),
  Cell: ({ fill }: { fill: string }) => <path data-testid="chart-segment" data-fill={fill} />,
}));

describe('DonutChart', () => {
  it('renders a proportional progress chart with its center content', () => {
    render(
      <DonutChart
        variant="progress"
        segments={[{ label: 'Conclusões', value: 68 }]}
        max={100}
        centerValue="68%"
        centerLabel="Taxa média de conclusão"
        ariaLabel="Taxa média de conclusão"
      />,
    );

    expect(screen.getByRole('img', { name: /68 de 100/i })).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('Taxa média de conclusão')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toHaveAttribute('data-segment-count', '2');
  });

  it('limits the progress value to its maximum', () => {
    render(
      <DonutChart
        variant="progress"
        segments={[{ label: 'Conclusões', value: 150 }]}
        max={100}
        centerValue="100%"
        centerLabel="Taxa média de conclusão"
        ariaLabel="Taxa média de conclusão"
      />,
    );

    expect(screen.getByRole('img', { name: /100 de 100/i })).toBeInTheDocument();
  });

  it('renders one segment per distribution category', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[
          { label: 'Hospitalidade', value: 60 },
          { label: 'Tecnologia', value: 40 },
        ]}
        centerValue={2}
        centerLabel="Categorias"
        ariaLabel="Distribuição de matrículas"
      />,
    );

    expect(screen.getByTestId('pie')).toHaveAttribute('data-segment-count', '2');
    expect(screen.getAllByTestId('chart-segment')).toHaveLength(2);
  });

  it('shows an accessible legend with labels, percentages and category colors', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[{ label: 'Hospitalidade', value: 100 }]}
        centerValue={1}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição de matrículas"
      />,
    );

    expect(screen.getByRole('list', { name: 'Legenda do gráfico' })).toHaveTextContent(
      /Hospitalidade: 100%. Cor:/,
    );
  });

  it('keeps the category color stable across equivalent renders', () => {
    const props = {
      variant: 'distribution' as const,
      segments: [{ label: 'Hospitalidade', value: 50 }],
      centerValue: 1,
      centerLabel: 'Categorias',
      showLegend: true,
      ariaLabel: 'Distribuição de matrículas',
    };
    const { rerender } = render(<DonutChart {...props} />);
    const initialColor = screen.getByTestId('chart-segment').getAttribute('data-fill');

    rerender(
      <DonutChart
        {...props}
        segments={[{ label: 'Outra categoria', value: 50 }, ...props.segments]}
      />,
    );

    const categorySegment = screen.getAllByTestId('chart-segment')[1].getAttribute('data-fill');

    expect(categorySegment).toBe(initialColor);
  });

  it('uses the design-system colors defined for dashboard categories', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[
          { label: 'Hospitalidade', value: 42 },
          { label: 'Inteligência Artificial', value: 28 },
          { label: 'Inovação', value: 18 },
          { label: 'Marketing', value: 12 },
        ]}
        centerValue={4}
        centerLabel="Categorias"
        ariaLabel="Distribuição de matrículas"
      />,
    );

    expect(
      screen.getAllByTestId('chart-segment').map((segment) => segment.getAttribute('data-fill')),
    ).toEqual([
      'var(--color-info-300)',
      'var(--color-info-500)',
      'var(--color-secondary-500)',
      'var(--color-success-400)',
    ]);
  });

  it('keeps the distribution in a responsive layout when its legend is visible', () => {
    const { container } = render(
      <DonutChart
        variant="distribution"
        segments={[{ label: 'Hospitalidade', value: 100 }]}
        centerValue={1}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição de matrículas"
      />,
    );

    expect(container.firstChild?.className).toMatch(/distribution/);
  });

  it('shows a safe empty state without rendering invalid arcs', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[]}
        centerValue={0}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição de matrículas"
      />,
    );

    expect(screen.getByText('Nenhum dado disponível para o gráfico.')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Legenda do gráfico' })).toBeEmptyDOMElement();
  });
});
