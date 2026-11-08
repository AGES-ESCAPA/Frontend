import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DonutChart } from './DonutChart';
import styles from './DonutChart.module.css';

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

    expect(
      screen.getByRole('img', {
        name: /Taxa média de conclusão\. 68% Taxa média de conclusão\. Conclusões: 68 de 100, 68%/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('Taxa média de conclusão')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toHaveAttribute('data-segment-count', '2');
    expect(screen.getByTestId('pie')).toHaveAttribute('data-root-tab-index', '-1');
    expect(screen.getByTestId('pie').parentElement).toHaveAttribute(
      'data-accessibility-layer',
      'false',
    );
  });

  it('applies the compact size only when it is requested', () => {
    const chart = (size?: 'compact') => (
      <DonutChart
        variant="progress"
        segments={[{ label: 'Conclusões', value: 68 }]}
        max={100}
        centerValue="68%"
        centerLabel=""
        ariaLabel="Taxa média de conclusão"
        size={size}
      />
    );

    const { container, rerender } = render(chart());
    expect(container.querySelector('section')).not.toHaveClass(styles.compact);

    rerender(chart('compact'));
    expect(container.querySelector('section')).toHaveClass(styles.compact);
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
    expect(
      screen.getByRole('img', {
        name: /Distribuição de matrículas\. 2 Categorias\. Hospitalidade: 60%\. Tecnologia: 40%/i,
      }),
    ).toBeInTheDocument();
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

  it('assigns distinct colors when labels hash to the same palette entry', () => {
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

    const fills = screen
      .getAllByTestId('chart-segment')
      .map((segment) => segment.getAttribute('data-fill'));
    expect(new Set(fills).size).toBe(2);
    expect(fills.every((fill) => fill?.startsWith('var(--color-'))).toBe(true);
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

    expect(container.firstElementChild?.className).toMatch(/distribution/);
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
    expect(screen.queryByRole('list', { name: 'Legenda do gráfico' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /0 Categorias\. Nenhum dado disponível/i }),
    ).toBeInTheDocument();
  });

  it('announces the segment and its percentage for progress values other than 100', () => {
    render(
      <DonutChart
        variant="progress"
        segments={[{ label: 'Aulas concluídas', value: 30 }]}
        max={40}
        centerValue="75%"
        centerLabel="Conclusão"
        ariaLabel="Progresso do curso"
      />,
    );

    expect(
      screen.getByRole('img', { name: /75% Conclusão\. Aulas concluídas: 30 de 40, 75%/i }),
    ).toBeInTheDocument();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'shows an empty state for an invalid maximum (%s)',
    (max) => {
      render(
        <DonutChart
          variant="progress"
          segments={[{ label: 'Aulas concluídas', value: 30 }]}
          max={max}
          centerValue="0%"
          centerLabel="Conclusão"
          ariaLabel="Progresso do curso"
        />,
      );

      expect(screen.queryByTestId('pie')).not.toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: /0% Conclusão\. Nenhum dado disponível/i }),
      ).toBeInTheDocument();
    },
  );

  it('announces no data when distribution values are all zero', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[
          { label: 'A', value: 0 },
          { label: 'B', value: 0 },
        ]}
        centerValue={2}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição"
      />,
    );

    expect(screen.queryByTestId('pie')).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /2 Categorias\. Nenhum dado disponível/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('keeps distinct assignments when category order changes', () => {
    const segments = [
      { label: 'Hospitalidade', value: 60 },
      { label: 'Tecnologia', value: 40 },
    ];
    const { rerender } = render(
      <DonutChart
        variant="distribution"
        segments={segments}
        centerValue={2}
        centerLabel="Categorias"
        ariaLabel="Distribuição"
      />,
    );
    const initialFills = screen
      .getAllByTestId('chart-segment')
      .map((node) => node.getAttribute('data-fill'));

    rerender(
      <DonutChart
        variant="distribution"
        segments={[...segments].reverse()}
        centerValue={2}
        centerLabel="Categorias"
        ariaLabel="Distribuição"
      />,
    );

    expect(
      screen.getAllByTestId('chart-segment').map((node) => node.getAttribute('data-fill')),
    ).toEqual([...initialFills].reverse());
  });

  it('renders repeated and case-distinct labels with distinct swatches', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[
          { label: 'A', value: 20 },
          { label: 'A', value: 10 },
          { label: 'Marketing', value: 30 },
          { label: 'MARKETING', value: 40 },
        ]}
        centerValue={4}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição"
      />,
    );

    const fills = screen
      .getAllByTestId('chart-segment')
      .map((node) => node.getAttribute('data-fill'));
    expect(new Set(fills).size).toBe(4);
    expect(screen.getByRole('list').children).toHaveLength(4);
  });

  it('handles labels that match object prototype properties', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={[
          { label: 'constructor', value: 30 },
          { label: '__proto__', value: 70 },
        ]}
        centerValue={2}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição"
      />,
    );

    expect(screen.getByRole('list')).toHaveTextContent(/constructor: 30%\. Cor: \w+/);
    expect(screen.getByRole('list')).toHaveTextContent(/__proto__: 70%\. Cor: \w+/);
    expect(
      screen.getAllByTestId('chart-segment').every((node) => node.getAttribute('data-fill')),
    ).toBe(true);
  });

  it('uses a matching hatch pattern in the arc and legend beyond the palette size', () => {
    render(
      <DonutChart
        variant="distribution"
        segments={Array.from({ length: 13 }, (_, index) => ({
          label: `Categoria ${index}`,
          value: 1,
        }))}
        centerValue={13}
        centerLabel="Categorias"
        showLegend
        ariaLabel="Distribuição"
      />,
    );

    const fills = screen
      .getAllByTestId('chart-segment')
      .map((node) => node.getAttribute('data-fill'));
    expect(new Set(fills).size).toBe(13);
    const patternedArc = screen
      .getAllByTestId('chart-segment')
      .find((node) => node.getAttribute('data-fill')?.startsWith('url(#'));
    expect(patternedArc).toBeDefined();
    const fill = patternedArc?.getAttribute('data-fill');
    expect(screen.getByRole('list').querySelector(`rect[fill="${fill}"]`)).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveTextContent(/com listras diagonais/);
  });
});
