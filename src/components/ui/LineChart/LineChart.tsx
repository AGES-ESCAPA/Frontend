import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import styles from './LineChart.module.css';

export interface LineChartPoint {
  label: string;
  value: number;
}

export type LineChartValueFormatter = (value: number) => string;

export type LineChartVariant = 'default' | 'minimal';

export interface LineChartProps {
  data: LineChartPoint[];
  /** Texto do eixo vertical, do tooltip e do resumo para leitor de tela (ex.: "12h"). */
  valueFormatter: LineChartValueFormatter;
  /** Altura do gráfico em pixels; a largura acompanha o contêiner. */
  height: number;
  ariaLabel: string;
  /** `default`: eixo vertical e grade sólida (US-35). `minimal`: sem eixo vertical e com grade tracejada (US-36). */
  variant?: LineChartVariant;
  /** Adapta os rótulos ao espaço disponível sem remover pontos da série. */
  xAxisInterval?: number | 'preserveStartEnd';
  emptyMessage?: string;
  className?: string;
}

const DEFAULT_EMPTY_MESSAGE = 'Nenhum dado disponível.';
const NO_VALUE_TEXT = 'sem dados';
const LINE_COLOR = 'var(--color-info-200)';
const SURFACE_COLOR = 'var(--color-surface)';
const CURSOR_COLOR = 'var(--color-border)';
const Y_AXIS_TICK = { fill: 'var(--color-text-muted)', fontSize: 'var(--text-body-5)' };
const Y_AXIS_TICK_GAP = 8;
const X_AXIS_TICK_GAP = 16;
const X_AXIS_LABEL_HEIGHT = 13;

const VARIANT_STYLES = {
  default: {
    gridColor: 'var(--color-secondary-100)',
    gridDash: undefined,
    dotFill: 'var(--color-white)',
    xAxisTick: { ...Y_AXIS_TICK, fontWeight: 'var(--font-weight-semibold)' },
    xAxisPadding: { left: 0, right: 0 },
    yAxisTickCount: 5,
    // O `width="auto"` do YAxis mede o rótulo uma vez, às vezes antes de a Inter carregar. Com
    // a fonte final o texto fica mais largo: a margem esquerda evita que ele seja cortado.
    margin: { top: 8, right: 16, bottom: 0, left: Y_AXIS_TICK_GAP },
  },
  minimal: {
    gridColor: 'var(--color-border)',
    gridDash: '4 4',
    dotFill: SURFACE_COLOR,
    xAxisTick: { ...Y_AXIS_TICK, fontFamily: 'var(--font-mono)' },
    // Sem eixo vertical, o recuo mantém inteiros os rótulos do primeiro e do último ponto.
    xAxisPadding: { left: 24, right: 24 },
    yAxisTickCount: 4,
    margin: { top: 8, right: 0, bottom: 0, left: 0 },
  },
} as const;

interface ChartTooltipProps extends TooltipContentProps {
  valueFormatter: LineChartValueFormatter;
}

const ChartTooltip = ({ active, payload, label, valueFormatter }: ChartTooltipProps) => {
  const value = payload?.[0]?.value;

  if (!active || typeof value !== 'number') return null;

  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}</span>
      <strong className={styles.tooltipValue}>{valueFormatter(value)}</strong>
    </div>
  );
};

export const LineChart = ({
  data,
  valueFormatter,
  height,
  ariaLabel,
  variant = 'default',
  xAxisInterval = 0,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  className = '',
}: LineChartProps) => {
  if (!data.some((point) => Number.isFinite(point.value))) {
    return <p className={`${styles.empty} ${className}`.trim()}>{emptyMessage}</p>;
  }

  // Valor inválido vira `null`: o recharts deixa um intervalo na linha em vez de desenhar NaN.
  const chartData = data.map((point) => ({
    label: point.label,
    value: Number.isFinite(point.value) ? point.value : null,
  }));
  const summary = chartData
    .map(
      ({ label, value }) => `${label}: ${value === null ? NO_VALUE_TEXT : valueFormatter(value)}.`,
    )
    .join(' ');
  const variantStyles = VARIANT_STYLES[variant];

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      role="img"
      aria-label={`${ariaLabel}. ${summary}`}
    >
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <RechartsLineChart
          data={chartData}
          accessibilityLayer={false}
          margin={variantStyles.margin}
        >
          <CartesianGrid
            vertical={false}
            stroke={variantStyles.gridColor}
            strokeDasharray={variantStyles.gridDash}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={variantStyles.xAxisTick}
            padding={variantStyles.xAxisPadding}
            interval={xAxisInterval}
            tickSize={0}
            tickMargin={X_AXIS_TICK_GAP}
            height={X_AXIS_TICK_GAP + X_AXIS_LABEL_HEIGHT}
          />
          <YAxis
            hide={variant === 'minimal'}
            tickCount={variantStyles.yAxisTickCount}
            axisLine={false}
            tickLine={false}
            tick={Y_AXIS_TICK}
            tickFormatter={valueFormatter}
            tickSize={0}
            tickMargin={Y_AXIS_TICK_GAP}
            allowDecimals={false}
            width="auto"
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: CURSOR_COLOR }}
            content={(props) => <ChartTooltip {...props} valueFormatter={valueFormatter} />}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke={LINE_COLOR}
            strokeWidth={3}
            dot={{ r: 3, fill: variantStyles.dotFill, stroke: LINE_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: LINE_COLOR, stroke: SURFACE_COLOR }}
            isAnimationActive={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
