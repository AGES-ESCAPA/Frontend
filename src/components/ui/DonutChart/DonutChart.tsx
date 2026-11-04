import { useId } from 'react';
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

interface SegmentStyle {
  fill: string;
  colorName: string;
  baseColor: string;
  patternId?: string;
  patternAngle?: number;
}

const CHART_COLORS: ChartColor[] = [
  { value: 'var(--color-info-300)', accessibleName: 'azul claro' },
  { value: 'var(--color-success-300)', accessibleName: 'verde claro' },
  { value: 'var(--color-warning-300)', accessibleName: 'amarelo' },
  { value: 'var(--color-secondary-300)', accessibleName: 'roxo claro' },
  { value: 'var(--color-primary-300)', accessibleName: 'azul' },
  { value: 'var(--color-error-300)', accessibleName: 'vermelho' },
];

const TRACK_COLOR = 'var(--color-primary-700)';
const EMPTY_MESSAGE = 'Nenhum dado disponível para o gráfico.';
const formatValue = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
const toSafeValue = (value: number): number => (Number.isFinite(value) ? Math.max(value, 0) : 0);
const clamp = (value: number, max: number): number => Math.min(toSafeValue(value), max);

const getLabelHash = (label: string): number => {
  let hash = 2166136261;

  for (const character of label.trim()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

// Resolve collisions in a stable order, independent of the API response order.
// Repeated labels still receive separate styles.
const getSegmentStyles = (segments: DonutChartSegment[], id: string): SegmentStyle[] => {
  const stylesByIndex: SegmentStyle[] = new Array(segments.length);
  const takenSlots = new Set<number>();
  const sortedIndices = segments
    .map((_, index) => index)
    .sort(
      (left, right) =>
        segments[left].label.localeCompare(segments[right].label, 'pt-BR', {
          sensitivity: 'variant',
        }) ||
        segments[left].value - segments[right].value ||
        left - right,
    );

  for (const index of sortedIndices) {
    const preferredSlot = getLabelHash(segments[index].label) % CHART_COLORS.length;
    let offset = 0;
    let slot: number;
    do {
      slot =
        Math.floor(offset / CHART_COLORS.length) * CHART_COLORS.length +
        ((preferredSlot + offset) % CHART_COLORS.length);
      offset += 1;
    } while (takenSlots.has(slot));
    takenSlots.add(slot);

    const color = CHART_COLORS[slot % CHART_COLORS.length];
    const patternLevel = Math.floor(slot / CHART_COLORS.length);
    const patternId = patternLevel ? `${id}-pattern-${index}` : undefined;
    stylesByIndex[index] = {
      fill: patternId ? `url(#${patternId})` : color.value,
      baseColor: color.value,
      colorName: patternLevel
        ? `${color.accessibleName} com listras diagonais, padrão ${patternLevel}`
        : color.accessibleName,
      patternId,
      patternAngle: patternLevel ? (patternLevel * 37) % 180 : undefined,
    };
  }

  return stylesByIndex;
};

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
  const id = useId().replace(/:/g, '');
  const safeSegments = segments.map((segment) => ({
    ...segment,
    value: toSafeValue(segment.value),
  }));
  const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0);
  const isProgress = variant === 'progress';
  const progressMax = isProgress ? toSafeValue(props.max) : 0;
  const progressValue = isProgress ? clamp(safeSegments[0]?.value ?? 0, progressMax) : 0;
  const hasData = isProgress
    ? progressMax > 0
    : safeSegments.length > 0 && Number.isFinite(total) && total > 0;
  const chartData = isProgress
    ? [
        { label: safeSegments[0]?.label ?? centerLabel, value: progressValue },
        { label: 'Restante', value: progressMax - progressValue },
      ]
    : safeSegments;
  const segmentStyles = getSegmentStyles(safeSegments, id);
  const summary = !hasData
    ? EMPTY_MESSAGE
    : isProgress
      ? `${safeSegments[0]?.label ?? centerLabel}: ${formatValue(progressValue)} de ${formatValue(progressMax)}, ${formatValue((progressValue / progressMax) * 100)}%.`
      : safeSegments
          .map((segment) => `${segment.label}: ${formatValue(segment.value)}%.`)
          .join(' ');
  const accessibleName = `${ariaLabel}. ${centerValue} ${centerLabel}. ${summary}`;

  return (
    <section
      className={`${styles.root} ${variant === 'distribution' && showLegend ? styles.distribution : ''} ${className}`.trim()}
    >
      <div className={styles.chart} role="img" aria-label={accessibleName}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <defs>
                {segmentStyles.map((style) =>
                  style.patternId ? (
                    <pattern
                      key={style.patternId}
                      id={style.patternId}
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                      patternTransform={`rotate(${style.patternAngle})`}
                    >
                      <rect width="8" height="8" fill={style.baseColor} />
                      <path d="M0 0V8" stroke="var(--color-surface)" strokeWidth="2" />
                    </pattern>
                  ) : null,
                )}
              </defs>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="86%"
                stroke="none"
                startAngle={0}
                endAngle={-360}
                rootTabIndex={-1}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      isProgress
                        ? index === 0
                          ? CHART_COLORS[0].value
                          : TRACK_COLOR
                        : segmentStyles[index].fill
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

      {variant === 'distribution' && showLegend && hasData ? (
        <ul className={styles.legend} aria-label="Legenda do gráfico">
          {safeSegments.map((segment, index) => {
            const style = segmentStyles[index];

            return (
              <li key={index} className={styles.legendItem}>
                <svg className={styles.legendSwatch} aria-hidden="true">
                  <rect width="100%" height="100%" fill={style.fill} />
                </svg>
                <span>
                  {segment.label}: {formatValue(segment.value)}%. Cor: {style.colorName}.
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};
