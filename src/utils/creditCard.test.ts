import { describe, expect, it } from 'vitest';
import {
  isValidCardCvv,
  isValidCardExpiry,
  isValidCardHolderName,
  isValidCardNumber,
  maskCardCvv,
  maskCardExpiry,
  maskCardHolderName,
  maskCardNumber,
} from './creditCard';

describe('maskCardNumber', () => {
  it('should group digits in blocks of 4', () => {
    expect(maskCardNumber('1234567891011121')).toBe('1234 5678 9101 1121');
    expect(maskCardNumber('12345')).toBe('1234 5');
  });

  it('should drop non-digits and limit to 19 digits', () => {
    expect(maskCardNumber('12ab-34')).toBe('1234');
    expect(maskCardNumber('1'.repeat(25))).toBe('1111 1111 1111 1111 111');
    expect(maskCardNumber('')).toBe('');
  });
});

describe('isValidCardNumber', () => {
  it('should accept numbers that pass the Luhn algorithm, with or without mask', () => {
    expect(isValidCardNumber('4539 1488 0343 6467')).toBe(true);
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  it('should reject numbers that fail the Luhn algorithm', () => {
    expect(isValidCardNumber('4539 1488 0343 6468')).toBe(false);
    expect(isValidCardNumber('1234 5678 9101 1121')).toBe(false);
  });

  it('should reject numbers that are empty, too short or too long', () => {
    expect(isValidCardNumber('')).toBe(false);
    expect(isValidCardNumber('4111 1111')).toBe(false);
    expect(isValidCardNumber('0'.repeat(20))).toBe(false);
  });
});

describe('maskCardExpiry', () => {
  it('should format as MM/AA', () => {
    expect(maskCardExpiry('0328')).toBe('03/28');
    expect(maskCardExpiry('032')).toBe('03/2');
    expect(maskCardExpiry('12')).toBe('12');
    expect(maskCardExpiry('1')).toBe('1');
  });

  it('should prefix a zero when the first digit cannot start a month', () => {
    expect(maskCardExpiry('4')).toBe('04/');
  });

  it('should ignore non-digits and extra digits', () => {
    expect(maskCardExpiry('03/28')).toBe('03/28');
    expect(maskCardExpiry('03289')).toBe('03/28');
    expect(maskCardExpiry('a')).toBe('');
  });
});

describe('isValidCardExpiry', () => {
  const now = new Date(2026, 9, 15);

  it('should accept the current month and future dates', () => {
    expect(isValidCardExpiry('10/26', now)).toBe(true);
    expect(isValidCardExpiry('01/27', now)).toBe(true);
  });

  it('should reject expired cards', () => {
    expect(isValidCardExpiry('09/26', now)).toBe(false);
    expect(isValidCardExpiry('03/24', now)).toBe(false);
  });

  it('should reject invalid months and incomplete values', () => {
    expect(isValidCardExpiry('13/30', now)).toBe(false);
    expect(isValidCardExpiry('00/30', now)).toBe(false);
    expect(isValidCardExpiry('03/2', now)).toBe(false);
    expect(isValidCardExpiry('', now)).toBe(false);
  });
});

describe('CVV', () => {
  it('should keep only up to 4 digits', () => {
    expect(maskCardCvv('12a345')).toBe('1234');
  });

  it('should accept 3 or 4 digits and reject anything else', () => {
    expect(isValidCardCvv('123')).toBe(true);
    expect(isValidCardCvv('1234')).toBe(true);
    expect(isValidCardCvv('12')).toBe(false);
    expect(isValidCardCvv('')).toBe(false);
  });
});

describe('card holder name', () => {
  it('should uppercase and strip invalid characters', () => {
    expect(maskCardHolderName('Jorge Amado 2')).toBe('JORGE AMADO ');
    expect(maskCardHolderName("d'ávila-silva")).toBe("D'ÁVILA-SILVA");
  });

  it('should require at least 3 characters besides spaces', () => {
    expect(isValidCardHolderName('JORGE AMADO')).toBe(true);
    expect(isValidCardHolderName('  ')).toBe(false);
    expect(isValidCardHolderName('AB')).toBe(false);
  });
});
