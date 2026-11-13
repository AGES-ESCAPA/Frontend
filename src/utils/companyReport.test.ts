import type { EmployeeProgress } from '@/types/companyReport';
import {
  formatHours,
  formatLastAccess,
  formatMonthLabel,
  formatPercent,
  isCompleted,
} from './companyReport';

const row = (overrides: Partial<EmployeeProgress>): EmployeeProgress => ({
  userId: 'user',
  name: 'Ana Silva',
  avatarUrl: null,
  courseId: 'course',
  course: 'Curso',
  progress: 50,
  lastAccessAt: null,
  certificateIssued: false,
  ...overrides,
});

describe('formatPercent', () => {
  it.each([
    [78.4, '78,4%'],
    [89, '89%'],
    [12.36, '12,4%'],
    [0, '0%'],
  ])('should format %d as %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
});

describe('formatHours', () => {
  it.each([
    [12.6, '12,6h'],
    [20, '20h'],
  ])('should format %d as %s', (value, expected) => {
    expect(formatHours(value)).toBe(expected);
  });
});

describe('formatMonthLabel', () => {
  it.each([
    ['2026-03', 'Mar'],
    ['2026-08', 'Ago'],
    ['2026-12', 'Dez'],
  ])('should abbreviate %s as %s', (month, expected) => {
    expect(formatMonthLabel(month)).toBe(expected);
  });

  it.each(['2026-13', 'março', ''])(
    'should return %j unchanged when it is not YYYY-MM',
    (month) => {
      expect(formatMonthLabel(month)).toBe(month);
    },
  );
});

describe('formatLastAccess', () => {
  const now = new Date(2026, 10, 10, 14, 0);

  it('should show the time for an access earlier today', () => {
    expect(formatLastAccess('2026-11-10T09:15:00', now)).toBe('Hoje, 09:15');
  });

  it('should show the time for an access yesterday, even late at night', () => {
    expect(formatLastAccess('2026-11-09T23:40:00', now)).toBe('Ontem, 23:40');
  });

  it('should show the date for an access two or more days ago', () => {
    expect(formatLastAccess('2026-08-18T16:40:00', now)).toBe('18 Ago 2026');
  });

  it('should accept the nanoseconds the backend sends', () => {
    expect(formatLastAccess('2026-11-10T09:15:49.461540389', now)).toBe('Hoje, 09:15');
  });

  it('should say the employee never accessed when there is no date', () => {
    expect(formatLastAccess(null, now)).toBe('Nunca acessou');
  });

  it('should show a dash for an invalid date', () => {
    expect(formatLastAccess('ontem', now)).toBe('—');
  });
});

describe('isCompleted', () => {
  it.each([
    [100, true],
    [99, false],
  ])('should treat a progress of %d as completed: %s', (progress, expected) => {
    expect(isCompleted(row({ progress }))).toBe(expected);
  });
});
