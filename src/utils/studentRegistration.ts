import type {
  RegistrationErrors,
  RegistrationField,
  StudentRegistrationValues,
} from '@/types/auth';
import { onlyDigits } from '@utils/masks';
import { isValidCpf, isValidEmail } from '@utils/validators';

export const REGISTRATION_FIELDS: RegistrationField[] = [
  'name',
  'cpf',
  'email',
  'phone',
  'password',
  'confirmPassword',
];

export const validateRegistrationField = (
  field: RegistrationField,
  values: StudentRegistrationValues,
): string | undefined => {
  const value = values[field];
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Informe seu nome completo.';
      if (value.trim().length > 255) return 'O nome deve ter no máximo 255 caracteres.';
      break;
    case 'cpf':
      if (!value) return 'Informe seu CPF.';
      if (!isValidCpf(value)) return 'Informe um CPF válido.';
      break;
    case 'email':
      if (!value.trim()) return 'Informe seu e-mail.';
      if (value.trim().length > 255) return 'O e-mail deve ter no máximo 255 caracteres.';
      if (!isValidEmail(value)) return 'Informe um e-mail válido.';
      break;
    case 'phone':
      if (value.trim() && !/^\d{10,11}$/.test(onlyDigits(value))) {
        return 'Informe um telefone com DDD e 10 ou 11 dígitos.';
      }
      break;
    case 'password':
      if (!value.trim()) return 'Informe sua senha.';
      if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
      break;
    case 'confirmPassword':
      if (!value) return 'Confirme sua senha.';
      if (value !== values.password) return 'As senhas devem ser iguais.';
      break;
  }
  return undefined;
};

export const validateStudentRegistration = (
  values: StudentRegistrationValues,
): RegistrationErrors =>
  Object.fromEntries(
    REGISTRATION_FIELDS.flatMap((field) => {
      const error = validateRegistrationField(field, values);
      return error === undefined ? [] : [[field, error]];
    }),
  );

const API_FIELD_ERRORS: Record<string, [RegistrationField, string]> = {
  'Name is required': ['name', 'Informe seu nome completo.'],
  'CPF is required': ['cpf', 'Informe seu CPF.'],
  'Invalid CPF': ['cpf', 'Informe um CPF válido.'],
  'Email is required': ['email', 'Informe seu e-mail.'],
  'Invalid email': ['email', 'Informe um e-mail válido.'],
  'Password is required': ['password', 'Informe sua senha.'],
  'Password must be at least 8 characters': [
    'password',
    'A senha deve ter pelo menos 8 caracteres.',
  ],
  'Invalid phone': ['phone', 'Informe um telefone com DDD e 10 ou 11 dígitos.'],
  'name must have at most 255 characters': ['name', 'O nome deve ter no máximo 255 caracteres.'],
  'email must have at most 255 characters': [
    'email',
    'O e-mail deve ter no máximo 255 caracteres.',
  ],
  'phone must have at most 255 characters': [
    'phone',
    'O telefone deve ter no máximo 255 caracteres.',
  ],
};

export const mapRegistrationErrors = (
  status: number,
  message: string | null,
): RegistrationErrors => {
  if (status === 409) {
    if (message === 'email already registered')
      return { email: 'Este e-mail já está cadastrado. Entre na sua conta.' };
    if (message === 'cpf already registered') return { cpf: 'Este CPF já está cadastrado.' };
    return {};
  }
  if (status !== 400 || message === null) return {};
  return Object.fromEntries(
    message.split(',').flatMap((part) => {
      const error = API_FIELD_ERRORS[part.trim()];
      return error === undefined ? [] : [error];
    }),
  );
};
