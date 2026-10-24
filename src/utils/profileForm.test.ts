import { describe, expect, it } from 'vitest';
import {
  mapProfileApiError,
  toLocalPhoneDigits,
  toProfileFormValues,
  validateProfileForm,
} from './profileForm';
import type { UserProfile } from '@/types/profile';

const company: UserProfile = {
  profile: 'COMPANY',
  editable: true,
  name: 'Ana Responsável',
  email: 'contato@vistamar.com.br',
  cpf: null,
  phone: '51999990001',
  companyName: 'Pousada Vista Mar LTDA',
  cnpj: '12345678000191',
  avatarUrl: null,
};

describe('toLocalPhoneDigits', () => {
  it('drops the country code and the mask of phones saved by old registrations', () => {
    expect(toLocalPhoneDigits('+55 51 99120-3344')).toBe('51991203344');
  });

  it('keeps a phone that already has only area code and number', () => {
    expect(toLocalPhoneDigits('5133334444')).toBe('5133334444');
  });

  it('returns an empty string when there is no phone', () => {
    expect(toLocalPhoneDigits(null)).toBe('');
  });
});

describe('toProfileFormValues', () => {
  it('fills the form with the editable fields of the profile', () => {
    expect(toProfileFormValues({ ...company, phone: '+55 51 99999-0001' })).toEqual({
      name: 'Ana Responsável',
      phone: '51999990001',
      companyName: 'Pousada Vista Mar LTDA',
    });
  });
});

describe('validateProfileForm', () => {
  it('accepts a blank phone, because the phone is optional', () => {
    expect(validateProfileForm({ name: 'Mariana', phone: '', companyName: '' }, 'STUDENT')).toEqual(
      {},
    );
  });

  it('requires the name and rejects a phone with too few digits', () => {
    expect(validateProfileForm({ name: '  ', phone: '5199', companyName: '' }, 'STUDENT')).toEqual({
      name: 'Preenchimento obrigatório.',
      phone: 'Informe um telefone válido.',
    });
  });

  it('requires the legal name only for companies', () => {
    const values = { name: 'Ana', phone: '', companyName: ' ' };

    expect(validateProfileForm(values, 'COMPANY')).toEqual({
      companyName: 'Preenchimento obrigatório.',
    });
    expect(validateProfileForm(values, 'STUDENT')).toEqual({});
  });
});

describe('mapProfileApiError', () => {
  it('maps the backend field messages to the field errors of the form', () => {
    expect(mapProfileApiError('phone is invalid')).toEqual({
      phone: 'Informe um telefone válido.',
    });
    expect(mapProfileApiError('companyName is required')).toEqual({
      companyName: 'Preenchimento obrigatório.',
    });
    expect(mapProfileApiError('name must have at most 255 characters')).toEqual({
      name: 'Use no máximo 255 caracteres.',
    });
  });

  it('returns null for messages that are not about a form field', () => {
    expect(mapProfileApiError('Profile cannot be edited by this user')).toBeNull();
  });
});
