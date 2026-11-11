import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineChart } from './LineChart';
import type { LineChartPoint } from './LineChart';

const data: LineChartPoint[] = [
  { label: 'Mar', value: 0 },
  { label: 'Abr', value: 5 },
  { label: 'Mai', value: 12 },
  { label: 'Jun', value: 20 },
];

const formatHours = (value: number) => `${value}h`;

const renderChart = (points: LineChartPoint[] = data) =>
  render(
    <LineChart
      data={points}
      valueFormatter={formatHours}
      height={240}
      ariaLabel="Evolução mensal de horas"
    />,
  );

describe('LineChart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should draw one dot per item with its label on the horizontal axis', () => {
    const { container } = renderChart();

    expect(container.querySelectorAll('.recharts-line-dot')).toHaveLength(4);
    for (const { label } of data) {
      expect(screen.getByText(label, { selector: 'tspan' })).toBeInTheDocument();
    }
  });

  it('should expose the name and a summary of the values to screen readers', () => {
    renderChart();

    expect(
      screen.getByRole('img', {
        name: 'Evolução mensal de horas. Mar: 0h. Abr: 5h. Mai: 12h. Jun: 20h.',
      }),
    ).toBeInTheDocument();
  });

  it('should format the vertical axis ticks with valueFormatter', () => {
    renderChart();

    expect(screen.getByText('20h', { selector: 'tspan' })).toBeInTheDocument();
    expect(screen.getByText('0h', { selector: 'tspan' })).toBeInTheDocument();
  });

  it('should show the label and the formatted value in the tooltip on hover', async () => {
    const { container } = renderChart();
    const surface = container.querySelector('.recharts-wrapper');

    expect(surface).not.toBeNull();
    fireEvent.mouseMove(surface as Element, { clientX: 780, clientY: 100 });

    const value = await screen.findByText('20h', { selector: 'strong' });
    expect(value.previousElementSibling).toHaveTextContent('Jun');
  });

  it('should not add tab stops inside the image role', async () => {
    const user = userEvent.setup();
    renderChart();

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('should skip the dot of an invalid value and announce it as missing', () => {
    const { container } = renderChart([
      { label: 'Mar', value: 10 },
      { label: 'Abr', value: Number.NaN },
      { label: 'Mai', value: 15 },
    ]);

    expect(container.querySelectorAll('.recharts-line-dot')).toHaveLength(2);
    expect(
      screen.getByRole('img', {
        name: 'Evolução mensal de horas. Mar: 10h. Abr: sem dados. Mai: 15h.',
      }),
    ).toBeInTheDocument();
  });

  it('should keep a series of zeros as a chart', () => {
    const { container } = renderChart([
      { label: 'Mar', value: 0 },
      { label: 'Abr', value: 0 },
    ]);

    expect(screen.queryByText('Nenhum dado disponível.')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-line-dot')).toHaveLength(2);
  });

  it('should show a message instead of the chart when there is no data', () => {
    const { container } = renderChart([]);

    expect(screen.getByText('Nenhum dado disponível.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should show the message when every value is invalid', () => {
    renderChart([{ label: 'Mar', value: Number.NaN }]);

    expect(screen.getByText('Nenhum dado disponível.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should show a custom empty message', () => {
    render(
      <LineChart
        data={[]}
        valueFormatter={formatHours}
        height={240}
        ariaLabel="Evolução mensal de horas"
        emptyMessage="Ainda não há horas registradas."
      />,
    );

    expect(screen.getByText('Ainda não há horas registradas.')).toBeInTheDocument();
  });

  describe('variants', () => {
    const renderMinimal = () =>
      render(
        <LineChart
          data={data}
          valueFormatter={formatHours}
          height={240}
          ariaLabel="Evolução de alunos ativos"
          variant="minimal"
        />,
      );

    it('should draw solid grid lines and filled dots by default', () => {
      const { container } = renderChart();
      const gridLine = container.querySelector('.recharts-cartesian-grid-horizontal line');

      expect(gridLine).toHaveAttribute('stroke', 'var(--color-secondary-100)');
      expect(gridLine).not.toHaveAttribute('stroke-dasharray');
      expect(container.querySelector('.recharts-line-dot')).toHaveAttribute(
        'fill',
        'var(--color-white)',
      );
    });

    it('should draw four dashed grid lines and hollow dots in the minimal variant', () => {
      const { container } = renderMinimal();
      const gridLines = container.querySelectorAll('.recharts-cartesian-grid-horizontal line');

      expect(gridLines).toHaveLength(4);
      gridLines.forEach((line) => {
        expect(line).toHaveAttribute('stroke', 'var(--color-border)');
        expect(line).toHaveAttribute('stroke-dasharray', '4 4');
      });
      expect(container.querySelector('.recharts-line-dot')).toHaveAttribute(
        'fill',
        'var(--color-surface)',
      );
    });

    it('should hide the vertical axis and keep the values in the summary in the minimal variant', () => {
      renderMinimal();

      expect(screen.queryByText('20h', { selector: 'tspan' })).not.toBeInTheDocument();
      expect(screen.getByText('Jun', { selector: 'tspan' })).toBeInTheDocument();
      expect(
        screen.getByRole('img', {
          name: 'Evolução de alunos ativos. Mar: 0h. Abr: 5h. Mai: 12h. Jun: 20h.',
        }),
      ).toBeInTheDocument();
    });

    it('should show the formatted value in the tooltip of the minimal variant', async () => {
      const { container } = renderMinimal();
      const surface = container.querySelector('.recharts-wrapper');

      expect(surface).not.toBeNull();
      fireEvent.mouseMove(surface as Element, { clientX: 780, clientY: 100 });

      const value = await screen.findByText('20h', { selector: 'strong' });
      expect(value.previousElementSibling).toHaveTextContent('Jun');
    });
  });

  it('keeps all six points and their summary when axis labels adapt to a narrow container', () => {
    class NarrowResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: 180, height: 240 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }

      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', NarrowResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 42, 12),
    );
    const monthlyData = [
      { label: 'jun. 26', value: 10 },
      { label: 'jul. 26', value: 0 },
      { label: 'ago. 26', value: 12 },
      { label: 'set. 26', value: 13 },
      { label: 'out. 26', value: 14 },
      { label: 'nov. 26', value: 15 },
    ];
    const { container } = render(
      <LineChart
        data={monthlyData}
        valueFormatter={formatHours}
        height={240}
        ariaLabel="Evolução mensal"
        variant="minimal"
        xAxisInterval="preserveStartEnd"
      />,
    );

    expect(container.querySelectorAll('.recharts-line-dot')).toHaveLength(6);
    expect(
      screen.getByRole('img', {
        name: 'Evolução mensal. jun. 26: 10h. jul. 26: 0h. ago. 26: 12h. set. 26: 13h. out. 26: 14h. nov. 26: 15h.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('jun. 26', { selector: 'tspan' })).toBeInTheDocument();
    expect(screen.getByText('nov. 26', { selector: 'tspan' })).toBeInTheDocument();
    expect(
      container.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick').length,
    ).toBeLessThan(6);
  });

  it('should follow the container width and keep the given height', () => {
    let notifyResize: (width: number) => void = () => undefined;

    class ControlledResizeObserver {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      // O tooltip do recharts também observa o próprio tamanho: só o contêiner define a largura.
      observe(target: Element) {
        if (!target.classList.contains('recharts-responsive-container')) return;

        notifyResize = (width) =>
          this.callback(
            [{ contentRect: { width, height: 240 } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        notifyResize(320);
      }

      unobserve() {}

      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ControlledResizeObserver);

    const { container } = renderChart();
    const surface = () => container.querySelector('svg.recharts-surface');

    expect(surface()).toHaveAttribute('width', '320');
    expect(surface()).toHaveAttribute('height', '240');

    act(() => notifyResize(500));

    expect(surface()).toHaveAttribute('width', '500');
  });
});
