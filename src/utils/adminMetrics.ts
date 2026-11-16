import type { LineChartPoint } from '@components/ui';
import type { AdminMetricsMonthlyActiveStudents } from '@/types/adminMetrics';

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const MONTH_LABELS = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
];

export const formatAdminMetricsCount = (value: number): string => countFormatter.format(value);

/**
 * Inteiro exibido na taxa de conclusão. As duas casas decimais até 50 arredondam para baixo;
 * acima de 50, para cima.
 */
export const roundAdminMetricsCompletionRate = (value: number): number => {
  const hundredths = Math.round(value * 100);
  const sign = hundredths < 0 ? -1 : 1;
  const absolute = Math.abs(hundredths);
  const whole = Math.trunc(absolute / 100);
  const decimals = absolute % 100;

  return (decimals <= 50 ? whole : whole + 1) * sign;
};

export const formatAdminMetricsCompletionRate = (value: number): string =>
  `${countFormatter.format(roundAdminMetricsCompletionRate(value))}%`;

/** Rótulo fixo do produto (mar. 26), independente de Date, locale do sistema e fuso. */
export const formatAdminMetricsMonth = (month: string): string => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new RangeError('Mês inválido: esperado YYYY-MM.');
  }
  return `${MONTH_LABELS[Number(month.slice(5)) - 1]} ${month.slice(2, 4)}`;
};

export const mapAdminMetricsMonthlySeries = (
  months: AdminMetricsMonthlyActiveStudents[],
): LineChartPoint[] =>
  months.map(({ month, activeStudents }) => ({
    label: formatAdminMetricsMonth(month),
    value: activeStudents,
  }));
