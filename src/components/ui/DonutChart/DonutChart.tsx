import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import styles from './DonutChart.module.css';

export interface DonutChartSegment {
  label: string;
  value: number;
}

interface CommonDonutChartProps {
  segments: DonutChartSegment[];
  centerValue: string | number;
  centerLabel: string;
  showLegend?: boolean;
  ariaLabel: string;
  className?: string;
}

interface ProgressDonutChartProps extends CommonDonutChartProps {
  variant: 'progress';
  max: number;
}

interface DistributionDonutChartProps extends CommonDonutChartProps {
  variant: 'distribution';
  max?: never;
}

export type DonutChartProps = ProgressDonutChartProps | DistributionDonutChartProps;

interface ChartColor {
  value: string;
  accessibleName: string;
}

const CHART_COLORS: ChartColor[] = [
  { value: 'var(--color-info-300)', accessibleName: 'azul informativo' },
  { value: 'var(--color-success-300)', accessibleName: 'verde de sucesso' },
  { value: 'var(--color-warning-300)', accessibleName: 'amarelo de atenção' },
  { value: 'var(--color-secondary-400)', accessibleName: 'roxo secundário' },
  { value: 'var(--color-primary-300)', accessibleName: 'azul primário claro' },
  { value: 'var(--color-success-400)', accessibleName: 'verde escuro' },
  { value: 'var(--color-warning-200)', accessibleName: 'amarelo claro' },
  { value: 'var(--color-secondary-300)', accessibleName: 'roxo claro' },
  { value: 'var(--color-info-200)', accessibleName: 'azul informativo claro' },
  { value: 'var(--color-primary-400)', accessibleName: 'azul primário' },
  { value: 'var(--color-success-200)', accessibleName: 'verde claro' },
  { value: 'var(--color-secondary-500)', accessibleName: 'roxo secundário intenso' },
];

const TRACK_COLOR = 'var(--color-primary-700)';
const EMPTY_MESSAGE = 'Nenhum dado disponível para o gráfico.';

const CATEGORY_COLORS: Record<string, ChartColor> = {
  hospitalidade: { value: 'var(--color-info-300)', accessibleName: 'azul informativo' },
  'inteligência artificial': {
    value: 'var(--color-info-500)',
    accessibleName: 'azul informativo escuro',
  },
  inovação: { value: 'var(--color-secondary-500)', accessibleName: 'roxo secundário intenso' },
  marketing: { value: 'var(--color-success-400)', accessibleName: 'verde de sucesso' },
};

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

const toSafeValue = (value: number): number => (Number.isFinite(value) ? Math.max(value, 0) : 0);

const getLabelHash = (label: string): number => {
  let hash = 2166136261;

  for (const character of label.trim().toLocaleLowerCase('pt-BR')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const getSegmentColor = (label: string): ChartColor =>
  CATEGORY_COLORS[label.trim().toLocaleLowerCase('pt-BR')] ??
  CHART_COLORS[getLabelHash(label) % CHART_COLORS.length];

const formatValue = (value: number): string => new Intl.NumberFormat('pt-BR').format(value);

export const DonutChart = (props: DonutChartProps) => {
  const {
    variant,
    segments,
    centerValue,
    centerLabel,
    showLegend = false,
    ariaLabel,
    className = '',
  } = props;
  const safeSegments = segments.map((segment) => ({
    ...segment,
    value: toSafeValue(segment.value),
  }));
  const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0);
  const isProgress = variant === 'progress';
  const progressMax = variant === 'progress' ? Math.max(props.max, 0) : 0;
  const progressValue = isProgress ? clamp(safeSegments[0]?.value ?? 0, progressMax) : 0;
  const hasData = isProgress ? progressMax > 0 : safeSegments.length > 0 && total > 0;
  const chartData = isProgress
    ? [
        { label: safeSegments[0]?.label ?? centerLabel, value: progressValue },
        { label: 'Restante', value: progressMax - progressValue },
      ]
    : safeSegments;
  const summary = isProgress
    ? `${formatValue(progressValue)} de ${formatValue(progressMax)}.`
    : safeSegments.map((segment) => `${segment.label}: ${formatValue(segment.value)}%.`).join(' ');
  const accessibleName = `${ariaLabel}. ${summary || EMPTY_MESSAGE}`;

  return (
    <section
      className={`${styles.root} ${variant === 'distribution' && showLegend ? styles.distribution : ''} ${className}`.trim()}
    >
      <div className={styles.chart} role="img" aria-label={accessibleName}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="86%"
                stroke="none"
              >
                {chartData.map((segment, index) => (
                  <Cell
                    key={`${segment.label}-${index}`}
                    fill={
                      isProgress
                        ? index === 0
                          ? CHART_COLORS[0].value
                          : TRACK_COLOR
                        : getSegmentColor(segment.label).value
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.empty}>{EMPTY_MESSAGE}</p>
        )}

        <div className={styles.center}>
          <strong className={styles.centerValue}>{centerValue}</strong>
          <span className={styles.centerLabel}>{centerLabel}</span>
        </div>
      </div>

      {variant === 'distribution' && showLegend ? (
        <ul className={styles.legend} aria-label="Legenda do gráfico">
          {safeSegments.map((segment) => {
            const color = getSegmentColor(segment.label);

            return (
              <li key={segment.label} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ backgroundColor: color.value }}
                  aria-hidden="true"
                />
                <span>
                  {segment.label}: {formatValue(segment.value)}%. Cor: {color.accessibleName}.
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};
