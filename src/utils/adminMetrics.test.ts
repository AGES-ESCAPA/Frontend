import { adminMetricsOverview } from '@/test/adminMetricsFixtures';
import {
  formatAdminMetricsCompletionRate,
  formatAdminMetricsCount,
  formatAdminMetricsMonth,
  mapAdminMetricsMonthlySeries,
} from './adminMetrics';

describe('admin metrics formatters', () => {
  it.each([
    [0, '0'],
    [842, '842'],
    [1532, '1.532'],
    [12847, '12.847'],
  ])('formats the count %s as %s', (value, expected) => {
    expect(formatAdminMetricsCount(value)).toBe(expected);
  });

  it.each([
    [0, '0%'],
    [68, '68%'],
    [68.5, '68,5%'],
    [66.67, '66,67%'],
    [100, '100%'],
  ])('formats the rate %s as %s', (value, expected) => {
    expect(formatAdminMetricsCompletionRate(value)).toBe(expected);
  });

  it.each([
    ['2026-01', 'jan. 26'],
    ['2026-02', 'fev. 26'],
    ['2026-03', 'mar. 26'],
    ['2026-04', 'abr. 26'],
    ['2026-05', 'mai. 26'],
    ['2026-06', 'jun. 26'],
    ['2026-07', 'jul. 26'],
    ['2026-08', 'ago. 26'],
    ['2026-09', 'set. 26'],
    ['2026-10', 'out. 26'],
    ['2026-11', 'nov. 26'],
    ['2026-12', 'dez. 26'],
    ['2027-01', 'jan. 27'],
  ])('formats the calendar month %s as %s', (value, expected) => {
    expect(formatAdminMetricsMonth(value)).toBe(expected);
  });

  it.each(['', '2026-00', '2026-13', '2026-1', '2026-01-01', 'invalid'])(
    'rejects the invalid calendar month %s',
    (month) => {
      expect(() => formatAdminMetricsMonth(month)).toThrow(RangeError);
    },
  );

  it('preserves every monthly value and its order without changing the input', () => {
    const months = structuredClone(adminMetricsOverview.activeStudentsByMonth);
    const original = structuredClone(months);

    expect(mapAdminMetricsMonthlySeries(months)).toEqual([
      { label: 'jun. 26', value: 9500 },
      { label: 'jul. 26', value: 0 },
      { label: 'ago. 26', value: 11230 },
      { label: 'set. 26', value: 12001 },
      { label: 'out. 26', value: 12700 },
      { label: 'nov. 26', value: 13001 },
    ]);
    expect(months).toEqual(original);
  });
});
