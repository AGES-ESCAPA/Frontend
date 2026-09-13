import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatCurrency,
  durationSecondsToDigitBuffer,
  formatDurationMaskFromDigits,
  formatSecondsToDurationMask,
  formatSecondsToTimecode,
  parseDurationDigitBuffer,
  parseDurationMask,
  parseTimecodeToSeconds,
  formatWorkload,
  formatDecimalInput,
  maskCurrencyInput,
  toTitleCase,
  truncate,
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

describe('formatDurationMaskFromDigits', () => {
  it('should pad partial minutes as 000:00', () => {
    expect(formatDurationMaskFromDigits('12')).toBe('012:00');
  });

  it('should split the last two digits as seconds', () => {
    expect(formatDurationMaskFromDigits('1240')).toBe('012:40');
  });
});

describe('formatSecondsToDurationMask', () => {
  it('should format seconds into 000:00', () => {
    expect(formatSecondsToDurationMask(760)).toBe('012:40');
  });
});

describe('durationSecondsToDigitBuffer', () => {
  it('should rebuild the digit buffer from seconds', () => {
    expect(durationSecondsToDigitBuffer(760)).toBe('1240');
  });
});

describe('parseDurationDigitBuffer', () => {
  it('should convert the digit buffer into seconds', () => {
    expect(parseDurationDigitBuffer('1240')).toBe(760);
  });

  it('should reject buffers that produce invalid seconds', () => {
    expect(parseDurationDigitBuffer('1299')).toBeNull();
  });
});

describe('parseDurationMask', () => {
  it('should convert 000:00 into seconds', () => {
    expect(parseDurationMask('012:40')).toBe(760);
  });

  it('should reject seconds above 59', () => {
    expect(parseDurationMask('012:60')).toBeNull();
  });

  it('should reject incomplete masks', () => {
    expect(parseDurationMask('12:40')).toBeNull();
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

describe('formatCurrency', () => {
  it('should format a value as BRL', () => {
    expect(formatCurrency(1500)).toContain('1.500');
    expect(formatCurrency(1500)).toContain('R$');
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
