import type { InvitePasswordErrors, InvitePasswordValues } from '@/types/auth';

export const INVITE_PASSWORD_MIN_LENGTH = 8;

export const INVITE_PASSWORD_INITIAL_VALUES: InvitePasswordValues = {
  password: '',
  passwordConfirmation: '',
};

export const validateInvitePassword = (values: InvitePasswordValues): InvitePasswordErrors => {
  const errors: InvitePasswordErrors = {};

  if (values.password === '') {
    errors.password = 'Informe sua senha.';
  } else if (values.password.length < INVITE_PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${INVITE_PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (values.passwordConfirmation === '') {
    errors.passwordConfirmation = 'Confirme sua senha.';
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'As senhas devem ser iguais.';
  }

  return errors;
};

export const hasInvitePasswordErrors = (errors: InvitePasswordErrors): boolean =>
  Object.values(errors).some((message) => message !== undefined);
