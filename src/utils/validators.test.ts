import { describe, expect, it } from 'vitest';
import { isValidCnpj, isValidCpf, isValidEmail } from './validators';

describe('isValidCpf', () => {
  it('accepts valid CPFs with and without mask', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('111.444.777-35')).toBe(true);
  });

  it('rejects a CPF with a wrong first check digit', () => {
    expect(isValidCpf('529.982.247-35')).toBe(false);
  });

  it('rejects a CPF with a wrong second check digit', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false);
  });

  it('rejects CPFs with the wrong length', () => {
    expect(isValidCpf('529.982.247-2')).toBe(false);
    expect(isValidCpf('529982247255')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });

  it('rejects repeated sequences even though they pass the check digit math', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
  });

  it('rejects text without digits', () => {
    expect(isValidCpf('abc.def.ghi-jk')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('accepts valid CNPJs with and without mask', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('rejects a CNPJ with a wrong first check digit', () => {
    expect(isValidCnpj('11.222.333/0001-91')).toBe(false);
  });

  it('rejects a CNPJ with a wrong second check digit', () => {
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('rejects CNPJs with the wrong length', () => {
    expect(isValidCnpj('11.222.333/0001-8')).toBe(false);
    expect(isValidCnpj('112223330001811')).toBe(false);
    expect(isValidCnpj('')).toBe(false);
  });

  it('rejects repeated sequences', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts well formed emails', () => {
    expect(isValidEmail('maria@escapa.com.br')).toBe(true);
    expect(isValidEmail('  maria@escapa.com  ')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('maria')).toBe(false);
    expect(isValidEmail('maria@escapa')).toBe(false);
    expect(isValidEmail('@escapa.com')).toBe(false);
    expect(isValidEmail('maria @escapa.com')).toBe(false);
  });
});
