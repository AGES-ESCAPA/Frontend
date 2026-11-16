import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatDuration,
  formatCurrency,
  durationSecondsToDigitBuffer,
  extractDurationMaskDigits,
  formatDurationMaskFromDigits,
  getDurationMaskUnits,
  formatSecondsToTimecode,
  formatTime,
  parseDurationDigitBuffer,
  parseTimecodeToSeconds,
  formatWorkload,
  formatLongDate,
  formatDecimalInput,
  maskCurrencyInput,
  toTitleCase,
  truncate,
  toCourseCode,
  formatCourseVersion,
  formatCompactEnrollmentCount,
  formatMostAccessedCourseSubtitle,
} from './formatters';

describe('formatDuration', () => {
  it('should format seconds-only duration', () => {
    expect(formatDuration(45)).toBe('0min');
  });

  it('should format minutes-only duration', () => {
    expect(formatDuration(600)).toBe('10min');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(3661)).toBe('1h 01min');
  });

  it('should handle negative values gracefully', () => {
    expect(formatDuration(-10)).toBe('0min');
  });
});

describe('parseTimecodeToSeconds', () => {
  it('should convert "mm:ss" to seconds', () => {
    expect(parseTimecodeToSeconds('12:40')).toBe(760);
  });

  it('should convert "hh:mm:ss" to seconds', () => {
    expect(parseTimecodeToSeconds('1:05:30')).toBe(3930);
  });

  it('should ignore surrounding spaces', () => {
    expect(parseTimecodeToSeconds('  09:05  ')).toBe(545);
  });

  it('should return null for malformed timecodes', () => {
    expect(parseTimecodeToSeconds('12h40')).toBeNull();
    expect(parseTimecodeToSeconds('12:99')).toBeNull();
    expect(parseTimecodeToSeconds('')).toBeNull();
  });
});

describe('extractDurationMaskDigits', () => {
  it('should drop separators and leading zeros', () => {
    expect(extractDurationMaskDigits('00:32')).toBe('32');
  });

  it('should keep at most six digits', () => {
    expect(extractDurationMaskDigits('1234567')).toBe('123456');
  });
});

describe('formatDurationMaskFromDigits', () => {
  it('should fill seconds first, like a timer', () => {
    expect(formatDurationMaskFromDigits('3')).toBe('00:03');
    expect(formatDurationMaskFromDigits('32')).toBe('00:32');
    expect(formatDurationMaskFromDigits('125')).toBe('01:25');
  });

  it('should show minutes and seconds up to four digits', () => {
    expect(formatDurationMaskFromDigits('1240')).toBe('12:40');
  });

  it('should add the hours beyond four digits', () => {
    expect(formatDurationMaskFromDigits('10530')).toBe('1:05:30');
    expect(formatDurationMaskFromDigits('123456')).toBe('12:34:56');
  });
});

describe('getDurationMaskUnits', () => {
  it('should name the units shown by the mask', () => {
    expect(getDurationMaskUnits('1240')).toBe('min:seg');
    expect(getDurationMaskUnits('10530')).toBe('h:min:seg');
  });
});

describe('durationSecondsToDigitBuffer', () => {
  it('should rebuild the digit buffer from seconds', () => {
    expect(durationSecondsToDigitBuffer(32)).toBe('32');
    expect(durationSecondsToDigitBuffer(760)).toBe('1240');
    expect(durationSecondsToDigitBuffer(3930)).toBe('10530');
  });

  it('should cap the duration at 99:59:59', () => {
    expect(durationSecondsToDigitBuffer(1_000_000)).toBe('995959');
  });
});

describe('parseDurationDigitBuffer', () => {
  it('should convert the digit buffer into seconds', () => {
    expect(parseDurationDigitBuffer('32')).toBe(32);
    expect(parseDurationDigitBuffer('1240')).toBe(760);
    expect(parseDurationDigitBuffer('10530')).toBe(3930);
  });

  it('should reject minutes or seconds above 59', () => {
    expect(parseDurationDigitBuffer('1299')).toBeNull();
    expect(parseDurationDigitBuffer('7500')).toBeNull();
  });

  it('should reject an empty buffer', () => {
    expect(parseDurationDigitBuffer('')).toBeNull();
  });
});

describe('formatSecondsToTimecode', () => {
  it('should format durations under an hour as "mm:ss"', () => {
    expect(formatSecondsToTimecode(760)).toBe('12:40');
  });

  it('should format durations of an hour or more as "hh:mm:ss"', () => {
    expect(formatSecondsToTimecode(3930)).toBe('1:05:30');
  });

  it('should clamp negative values to zero', () => {
    expect(formatSecondsToTimecode(-5)).toBe('0:00');
  });
});

describe('formatWorkload', () => {
  it('should format minute-based workload from the public API', () => {
    expect(formatWorkload(480)).toBe('8h');
    expect(formatWorkload(90)).toBe('1h 30min');
    expect(formatWorkload(12)).toBe('12min');
  });

  it('should handle empty values', () => {
    expect(formatWorkload(null)).toBe('0min');
    expect(formatWorkload(0)).toBe('0min');
  });
});

describe('formatLongDate', () => {
  it('should format an ISO date in full Portuguese, without shifting the day', () => {
    expect(formatLongDate('2026-08-21')).toBe('21 de agosto de 2026');
    expect(formatLongDate('2026-01-01')).toBe('1 de janeiro de 2026');
  });
});

describe('formatCurrency', () => {
  it('should format a value as BRL with two decimal places', () => {
    // O Intl separa "R$" do valor com espaço não separável (\u00a0).
    expect(formatCurrency(1500)).toBe('R$\u00a01.500,00');
    expect(formatCurrency(249.9)).toBe('R$\u00a0249,90');
  });
});

describe('formatDecimalInput', () => {
  it('should format an integer with two decimal places', () => {
    expect(formatDecimalInput(499)).toBe('499,00');
  });

  it('should add a thousands separator', () => {
    expect(formatDecimalInput(1500)).toBe('1.500,00');
  });

  it('should keep a fractional value with two decimal places', () => {
    expect(formatDecimalInput(499.9)).toBe('499,90');
  });
});

describe('maskCurrencyInput', () => {
  it('should treat the first digit as cents', () => {
    expect(maskCurrencyInput('1')).toBe('0,01');
  });

  it('should shift digits in from the right as the user types', () => {
    expect(maskCurrencyInput('100')).toBe('1,00');
    expect(maskCurrencyInput('1000')).toBe('10,00');
  });

  it('should add a thousands separator once the value grows past it', () => {
    expect(maskCurrencyInput('150000')).toBe('1.500,00');
  });

  it('should ignore any non-digit characters already in the display value', () => {
    expect(maskCurrencyInput('1.500,00')).toBe('1.500,00');
  });

  it('should return an empty string once every digit is removed', () => {
    expect(maskCurrencyInput('')).toBe('');
  });

  it('should behave like a backspace when the last digit is dropped', () => {
    expect(maskCurrencyInput('1,0')).toBe('0,10');
  });
});

describe('toTitleCase', () => {
  it('should capitalize each word', () => {
    expect(toTitleCase('turismo de luxo')).toBe('Turismo De Luxo');
  });
});

describe('truncate', () => {
  it('should not truncate strings within the limit', () => {
    expect(truncate('curto', 10)).toBe('curto');
  });

  it('should truncate long strings with ellipsis', () => {
    expect(truncate('texto muito longo', 8)).toBe('texto...');
  });
});

describe('toCourseCode', () => {
  it('should use the first letter of the first two significant words', () => {
    expect(toCourseCode('Atendimento de Excelencia em Hospedagem')).toBe('AE');
    expect(toCourseCode('Gestao de Reservas e Overbooking')).toBe('GR');
    expect(toCourseCode('Ingles para Recepcao')).toBe('IR');
  });

  it('should fall back to the first two letters of a single word', () => {
    expect(toCourseCode('Hospitalidade')).toBe('HO');
  });
});

describe('formatCourseVersion', () => {
  it('should format major and minor as vX.Y', () => {
    expect(formatCourseVersion(1, 2)).toBe('v1.2');
    expect(formatCourseVersion(null, null)).toBe('v0.0');
  });
});

describe('formatTime', () => {
  it('should format seconds only with two-digit minutes', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(59)).toBe('00:59');
  });

  it('should format minutes and seconds as "mm:ss"', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(551)).toBe('09:11');
    expect(formatTime(1450)).toBe('24:10');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should switch to "h:mm:ss" from one hour on', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(36000)).toBe('10:00:00');
  });

  it('should drop fractions of a second', () => {
    expect(formatTime(551.9)).toBe('09:11');
  });

  it('should return "00:00" for negative or invalid values', () => {
    expect(formatTime(-10)).toBe('00:00');
    expect(formatTime(Number.NaN)).toBe('00:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('00:00');
  });
});

describe('formatDateTime', () => {
  it('should format a local date time in Portuguese', () => {
    expect(formatDateTime('2026-10-24T15:32:49')).toBe('24 de outubro de 2026 às 15:32');
  });

  it('should accept the nanosecond precision the backend serializes', () => {
    expect(formatDateTime('2026-10-24T15:32:49.461540389')).toBe('24 de outubro de 2026 às 15:32');
  });

  it('should return an empty string for an invalid value', () => {
    expect(formatDateTime('not a date')).toBe('');
    expect(formatDateTime('')).toBe('');
  });
});

describe('formatCompactEnrollmentCount', () => {
  it('keeps counts below 1000 as full integers', () => {
    expect(formatCompactEnrollmentCount(0)).toBe('0');
    expect(formatCompactEnrollmentCount(1)).toBe('1');
    expect(formatCompactEnrollmentCount(42)).toBe('42');
    expect(formatCompactEnrollmentCount(999)).toBe('999');
  });

  it('formats counts from 1000 onwards using pt-BR compact notation without non-breaking spaces', () => {
    expect(formatCompactEnrollmentCount(1000)).toBe('1 mil');
    expect(formatCompactEnrollmentCount(4820)).toBe('4,8 mil');
    expect(formatCompactEnrollmentCount(12500)).toBe('12,5 mil');
  });

  it('rounds down so the compact count never exceeds the real one', () => {
    expect(formatCompactEnrollmentCount(4850)).toBe('4,8 mil');
    expect(formatCompactEnrollmentCount(4960)).toBe('4,9 mil');
    expect(formatCompactEnrollmentCount(999999)).toBe('999,9 mil');
    expect(formatCompactEnrollmentCount(1250000)).toBe('1,2 mi');
  });

  it('clamps negative, fractional or non-finite values safely to zero or integer', () => {
    expect(formatCompactEnrollmentCount(-25)).toBe('0');
    expect(formatCompactEnrollmentCount(Number.NaN)).toBe('0');
    expect(formatCompactEnrollmentCount(Number.POSITIVE_INFINITY)).toBe('0');
    expect(formatCompactEnrollmentCount(850.9)).toBe('850');
  });
});

describe('formatMostAccessedCourseSubtitle', () => {
  it('says "Mais de" when the compact notation hides part of the count', () => {
    expect(formatMostAccessedCourseSubtitle(4820)).toBe('Mais de 4,8 mil matrículas');
    expect(formatMostAccessedCourseSubtitle(4960)).toBe('Mais de 4,9 mil matrículas');
    expect(formatMostAccessedCourseSubtitle(999999)).toBe('Mais de 999,9 mil matrículas');
  });

  it('shows the exact count when the compact notation is exact', () => {
    expect(formatMostAccessedCourseSubtitle(1000)).toBe('1 mil matrículas');
    expect(formatMostAccessedCourseSubtitle(4800)).toBe('4,8 mil matrículas');
  });

  it('shows the exact count with singular and plural below 1000', () => {
    expect(formatMostAccessedCourseSubtitle(1)).toBe('1 matrícula');
    expect(formatMostAccessedCourseSubtitle(420)).toBe('420 matrículas');
    expect(formatMostAccessedCourseSubtitle(0)).toBe('0 matrículas');
    expect(formatMostAccessedCourseSubtitle(Number.NaN)).toBe('0 matrículas');
  });
});
