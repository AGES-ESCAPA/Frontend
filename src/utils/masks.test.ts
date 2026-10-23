import { describe, expect, it } from 'vitest';
import { maskCnpj, maskCpf, maskPhone, normalizeCnpj, onlyDigits } from './masks';

describe('onlyDigits', () => {
  it('removes every non-digit character', () => {
    expect(onlyDigits('123.456.789-09')).toBe('12345678909');
    expect(onlyDigits('(51) 99999-0001')).toBe('51999990001');
    expect(onlyDigits('abc')).toBe('');
  });
});

describe('maskCpf', () => {
  it('formats progressively while typing', () => {
    expect(maskCpf('1')).toBe('1');
    expect(maskCpf('123')).toBe('123');
    expect(maskCpf('1234')).toBe('123.4');
    expect(maskCpf('123456')).toBe('123.456');
    expect(maskCpf('1234567')).toBe('123.456.7');
    expect(maskCpf('123456789')).toBe('123.456.789');
    expect(maskCpf('1234567890')).toBe('123.456.789-0');
    expect(maskCpf('12345678909')).toBe('123.456.789-09');
  });

  it('formats a pasted value that already has punctuation or letters', () => {
    expect(maskCpf('123.456.789-09')).toBe('123.456.789-09');
    expect(maskCpf('12a3b456c789d09')).toBe('123.456.789-09');
  });

  it('ignores digits beyond 11', () => {
    expect(maskCpf('123456789012345')).toBe('123.456.789-01');
  });

  it('returns an empty string for empty or non-numeric input', () => {
    expect(maskCpf('')).toBe('');
    expect(maskCpf('abc')).toBe('');
  });
});

describe('maskCnpj', () => {
  it('formats progressively while typing', () => {
    expect(maskCnpj('1')).toBe('1');
    expect(maskCnpj('12')).toBe('12');
    expect(maskCnpj('123')).toBe('12.3');
    expect(maskCnpj('12345')).toBe('12.345');
    expect(maskCnpj('123456')).toBe('12.345.6');
    expect(maskCnpj('12345678')).toBe('12.345.678');
    expect(maskCnpj('123456789')).toBe('12.345.678/9');
    expect(maskCnpj('123456780001')).toBe('12.345.678/0001');
    expect(maskCnpj('1234567800019')).toBe('12.345.678/0001-9');
    expect(maskCnpj('12345678000195')).toBe('12.345.678/0001-95');
  });

  it('formats a pasted value that already has punctuation', () => {
    expect(maskCnpj('12.345.678/0001-95')).toBe('12.345.678/0001-95');
  });

  it('ignores digits beyond 14', () => {
    expect(maskCnpj('1234567800019599')).toBe('12.345.678/0001-95');
  });

  it('returns an empty string for empty input', () => {
    expect(maskCnpj('')).toBe('');
  });
});

describe('maskPhone', () => {
  it('formats progressively while typing', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone('5')).toBe('(5');
    expect(maskPhone('51')).toBe('(51');
    expect(maskPhone('519')).toBe('(51) 9');
    expect(maskPhone('519999')).toBe('(51) 9999');
    expect(maskPhone('5199999')).toBe('(51) 9999-9');
  });

  it('formats a landline with 10 digits', () => {
    expect(maskPhone('5133334444')).toBe('(51) 3333-4444');
  });

  it('formats a mobile number with 11 digits', () => {
    expect(maskPhone('51999990001')).toBe('(51) 99999-0001');
  });

  it('formats a pasted value that already has punctuation', () => {
    expect(maskPhone('(51) 99999-0001')).toBe('(51) 99999-0001');
  });

  it('ignores digits beyond 11', () => {
    expect(maskPhone('5199999000199')).toBe('(51) 99999-0001');
  });
});

describe('normalizeCnpj', () => {
  it('removes punctuation and uppercases letters', () => {
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });

  it('keeps numeric CNPJs unchanged', () => {
    expect(normalizeCnpj('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('accepts only digits in the last two positions', () => {
    expect(normalizeCnpj('12ABC34501DEXY')).toBe('12ABC34501DE');
    expect(normalizeCnpj('12ABC34501DE3X5')).toBe('12ABC34501DE35');
  });

  it('ignores characters beyond 14', () => {
    expect(normalizeCnpj('12ABC34501DE3599')).toBe('12ABC34501DE35');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeCnpj('')).toBe('');
  });
});

describe('maskCnpj with letters (alphanumeric CNPJ)', () => {
  it('formats progressively while typing', () => {
    expect(maskCnpj('12A')).toBe('12.A');
    expect(maskCnpj('12ABC')).toBe('12.ABC');
    expect(maskCnpj('12ABC345')).toBe('12.ABC.345');
    expect(maskCnpj('12ABC3450')).toBe('12.ABC.345/0');
    expect(maskCnpj('12ABC34501DE')).toBe('12.ABC.345/01DE');
    expect(maskCnpj('12ABC34501DE3')).toBe('12.ABC.345/01DE-3');
    expect(maskCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
  });

  it('uppercases a pasted value typed in lowercase', () => {
    expect(maskCnpj('12.abc.345/01de-35')).toBe('12.ABC.345/01DE-35');
  });

  it('ignores letters in the check digit positions', () => {
    expect(maskCnpj('12ABC34501DE3X5')).toBe('12.ABC.345/01DE-35');
  });
});
