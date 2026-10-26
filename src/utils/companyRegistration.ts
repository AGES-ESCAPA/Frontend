import { isValidCnpj } from '@utils/validators';
import type {
  CompanyRegistrationErrors,
  CompanyRegistrationPayload,
  CompanyRegistrationValues,
} from '@/types/auth';

export const COMPANY_PASSWORD_MIN_LENGTH = 8;

const REQUIRED_MESSAGE = 'Preenchimento obrigatório.';

export const COMPANY_REGISTRATION_INITIAL_VALUES: CompanyRegistrationValues = {
  responsibleName: '',
  cnpj: '',
  companyName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirmation: '',
};

export const validateCompanyRegistration = (
  values: CompanyRegistrationValues,
): CompanyRegistrationErrors => {
  const errors: CompanyRegistrationErrors = {};

  if (values.responsibleName.trim() === '') {
    errors.responsibleName = REQUIRED_MESSAGE;
  }

  if (values.cnpj === '') {
    errors.cnpj = REQUIRED_MESSAGE;
  } else if (!isValidCnpj(values.cnpj)) {
    errors.cnpj = 'Informe um CNPJ válido.';
  }

  if (values.companyName.trim() === '') {
    errors.companyName = REQUIRED_MESSAGE;
  }

  if (values.email.trim() === '') {
    errors.email = REQUIRED_MESSAGE;
  }

  if (values.password === '') {
    errors.password = REQUIRED_MESSAGE;
  } else if (values.password.length < COMPANY_PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter no mínimo ${COMPANY_PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (values.passwordConfirmation === '') {
    errors.passwordConfirmation = REQUIRED_MESSAGE;
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'As senhas não coincidem.';
  }

  return errors;
};

export const hasCompanyRegistrationErrors = (errors: CompanyRegistrationErrors): boolean =>
  Object.values(errors).some((message) => message !== undefined);

export const buildCompanyRegistrationPayload = (
  values: CompanyRegistrationValues,
): CompanyRegistrationPayload => ({
  responsibleName: values.responsibleName.trim(),
  cnpj: values.cnpj,
  companyName: values.companyName.trim(),
  email: values.email.trim(),
  phone: values.phone,
  password: values.password,
});
