import { onlyDigits } from '@utils/masks';
import type { ProfileType, UserProfile } from '@/types/profile';

export interface ProfileFormValues {
  name: string;
  /** Só dígitos, como o `MaskedInput` devolve. */
  phone: string;
  companyName: string;
}

export type ProfileFormField = keyof ProfileFormValues;
export type ProfileFormErrors = Partial<Record<ProfileFormField, string>>;

/** Limite das colunas VARCHAR(255) do backend. */
export const PROFILE_TEXT_MAX_LENGTH = 255;

const BRAZIL_COUNTRY_CODE = '55';
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;

const REQUIRED_MESSAGE = 'Preenchimento obrigatório.';
const INVALID_PHONE_MESSAGE = 'Informe um telefone válido.';
const TOO_LONG_MESSAGE = `Use no máximo ${PROFILE_TEXT_MAX_LENGTH} caracteres.`;

/**
 * Telefone salvo para o campo com máscara. Cadastros antigos guardam o número com DDI e
 * máscara ("+55 51 99120-3344"); o campo trabalha só com DDD e número.
 */
export const toLocalPhoneDigits = (phone: string | null): string => {
  const digits = onlyDigits(phone ?? '');
  const local =
    digits.length > PHONE_MAX_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE)
      ? digits.slice(BRAZIL_COUNTRY_CODE.length)
      : digits;
  return local.slice(0, PHONE_MAX_DIGITS);
};

export const toProfileFormValues = (profile: UserProfile): ProfileFormValues => ({
  name: profile.name,
  phone: toLocalPhoneDigits(profile.phone),
  companyName: profile.companyName ?? '',
});

/** Mesmas regras do cadastro (US-21 e US-22): textos obrigatórios e telefone opcional de 10 ou 11 dígitos. */
export const validateProfileForm = (
  values: ProfileFormValues,
  profile: ProfileType,
): ProfileFormErrors => {
  const errors: ProfileFormErrors = {};

  if (!values.name.trim()) errors.name = REQUIRED_MESSAGE;
  if (profile === 'COMPANY' && !values.companyName.trim()) errors.companyName = REQUIRED_MESSAGE;
  if (
    values.phone &&
    (values.phone.length < PHONE_MIN_DIGITS || values.phone.length > PHONE_MAX_DIGITS)
  ) {
    errors.phone = INVALID_PHONE_MESSAGE;
  }

  return errors;
};

/**
 * Converte a mensagem de um `400` da API ("phone is invalid", "companyName is required")
 * no erro do campo correspondente. Devolve `null` quando a mensagem não é de um campo.
 */
export const mapProfileApiError = (message: string): ProfileFormErrors | null => {
  const field = message.trim().split(/\s/)[0];
  const isTooLong = message.includes('at most');

  if (field === 'phone') return { phone: isTooLong ? TOO_LONG_MESSAGE : INVALID_PHONE_MESSAGE };
  if (field === 'name' || field === 'companyName') {
    return { [field]: isTooLong ? TOO_LONG_MESSAGE : REQUIRED_MESSAGE };
  }

  return null;
};
