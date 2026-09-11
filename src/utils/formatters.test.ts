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

describe('formatCurrency', () => {
  it('should format a value as BRL', () => {
    expect(formatCurrency(1500)).toContain('1.500');
    expect(formatCurrency(1500)).toContain('R$');
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
