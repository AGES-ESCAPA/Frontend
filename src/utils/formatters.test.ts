import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatCurrency,
  formatWorkload,
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
