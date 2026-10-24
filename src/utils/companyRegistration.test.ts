import { describe, expect, it } from 'vitest';
import type { CompanyRegistrationValues } from '@/types/auth';
import {
  buildCompanyRegistrationPayload,
  hasCompanyRegistrationErrors,
  validateCompanyRegistration,
} from './companyRegistration';

const validValues: CompanyRegistrationValues = {
  responsibleName: 'Maria Oliveira',
  cnpj: '11222333000181',
  companyName: 'Empresa Ltda.',
  email: 'contato@empresa.com.br',
  phone: '1130000000',
  password: 'senha-segura',
  passwordConfirmation: 'senha-segura',
};

describe('validateCompanyRegistration', () => {
  it('accepts a complete form', () => {
    expect(validateCompanyRegistration(validValues)).toEqual({});
  });

  it('accepts the form without a phone', () => {
    expect(validateCompanyRegistration({ ...validValues, phone: '' })).toEqual({});
  });

  it('requires every field except the phone', () => {
    const errors = validateCompanyRegistration({
      responsibleName: '  ',
      cnpj: '',
      companyName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
    });

    expect(errors).toEqual({
      responsibleName: 'Preenchimento obrigatório.',
      cnpj: 'Preenchimento obrigatório.',
      companyName: 'Preenchimento obrigatório.',
      email: 'Preenchimento obrigatório.',
      password: 'Preenchimento obrigatório.',
      passwordConfirmation: 'Preenchimento obrigatório.',
    });
  });

  it('rejects a CNPJ with wrong check digits', () => {
    expect(validateCompanyRegistration({ ...validValues, cnpj: '11222333000182' }).cnpj).toBe(
      'Informe um CNPJ válido.',
    );
  });

  it('rejects a password shorter than 8 characters', () => {
    const errors = validateCompanyRegistration({
      ...validValues,
      password: '1234567',
      passwordConfirmation: '1234567',
    });

    expect(errors.password).toBe('A senha deve ter no mínimo 8 caracteres.');
  });

  it('rejects a confirmation that differs from the password', () => {
    const errors = validateCompanyRegistration({
      ...validValues,
      passwordConfirmation: 'outra-senha',
    });

    expect(errors).toEqual({ passwordConfirmation: 'As senhas não coincidem.' });
  });
});

describe('hasCompanyRegistrationErrors', () => {
  it('ignores fields whose error was cleared', () => {
    expect(hasCompanyRegistrationErrors({ cnpj: undefined })).toBe(false);
    expect(hasCompanyRegistrationErrors({ cnpj: 'Informe um CNPJ válido.' })).toBe(true);
  });
});

describe('buildCompanyRegistrationPayload', () => {
  it('trims the text fields and leaves out the confirmation', () => {
    expect(
      buildCompanyRegistrationPayload({
        ...validValues,
        responsibleName: '  Maria Oliveira ',
        companyName: ' Empresa Ltda. ',
        email: ' contato@empresa.com.br ',
      }),
    ).toEqual({
      responsibleName: 'Maria Oliveira',
      cnpj: '11222333000181',
      companyName: 'Empresa Ltda.',
      email: 'contato@empresa.com.br',
      phone: '1130000000',
      password: 'senha-segura',
    });
  });
});
