import type { LineChartPoint } from '@components/ui';
import type { AdminMetricsMonthlyActiveStudents } from '@/types/adminMetrics';

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const rateFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
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

export const formatAdminMetricsCompletionRate = (value: number): string =>
  `${rateFormatter.format(value)}%`;

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
