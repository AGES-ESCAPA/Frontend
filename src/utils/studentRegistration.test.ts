import {
  mapRegistrationErrors,
  validateRegistrationField,
  validateStudentRegistration,
} from './studentRegistration';
import type { StudentRegistrationValues } from '@/types/auth';

const valid: StudentRegistrationValues = {
  name: ' Maria da Silva ',
  cpf: '52998224725',
  email: ' MARIA@EXEMPLO.COM ',
  phone: '',
  password: ' senha segura ',
  confirmPassword: ' senha segura ',
};

describe('studentRegistration', () => {
  it('accepts optional phone and does not normalize passwords', () => {
    expect(validateStudentRegistration(valid)).toEqual({});
    expect(
      validateRegistrationField('confirmPassword', {
        ...valid,
        confirmPassword: valid.password.trim(),
      }),
    ).toBe('As senhas devem ser iguais.');
  });
  it('reports all missing required fields while leaving an empty phone valid', () => {
    expect(
      validateStudentRegistration({
        name: ' ',
        cpf: '',
        email: '',
        phone: '',
        password: '        ',
        confirmPassword: '',
      }),
    ).toEqual({
      name: 'Informe seu nome completo.',
      cpf: 'Informe seu CPF.',
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
      confirmPassword: 'Confirme sua senha.',
    });
  });
  it.each(['51999990000', '5133330000', '(51) 99999-0000'])(
    'accepts Brazilian phone %s',
    (phone) => {
      expect(validateRegistrationField('phone', { ...valid, phone })).toBeUndefined();
    },
  );
  it('rejects incomplete phone, short password, invalid email and names over the limit', () => {
    expect(
      validateStudentRegistration({
        ...valid,
        name: 'a'.repeat(256),
        email: 'maria@',
        phone: '519',
        password: '1234567',
        confirmPassword: '1234567',
      }),
    ).toEqual({
      name: 'O nome deve ter no máximo 255 caracteres.',
      email: 'Informe um e-mail válido.',
      phone: 'Informe um telefone com DDD e 10 ou 11 dígitos.',
      password: 'A senha deve ter pelo menos 8 caracteres.',
    });
    expect(
      validateRegistrationField('email', { ...valid, email: `${'a'.repeat(250)}@b.com` }),
    ).toBe('O e-mail deve ter no máximo 255 caracteres.');
  });
  it('maps concatenated backend validations without depending on their order', () => {
    expect(mapRegistrationErrors(400, 'Invalid phone, Invalid CPF, Invalid email')).toEqual({
      phone: 'Informe um telefone com DDD e 10 ou 11 dígitos.',
      cpf: 'Informe um CPF válido.',
      email: 'Informe um e-mail válido.',
    });
    expect(mapRegistrationErrors(400, 'Unknown validation')).toEqual({});
    expect(mapRegistrationErrors(500, 'Invalid CPF')).toEqual({});
  });
});
