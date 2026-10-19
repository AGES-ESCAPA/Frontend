import { onlyDigits } from './masks';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const MOD = 11;

const CPF_FIRST_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CPF_SECOND_WEIGHTS = [11, ...CPF_FIRST_WEIGHTS];
const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_SECOND_WEIGHTS = [6, ...CNPJ_FIRST_WEIGHTS];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sequências como 111.111.111-11 passam na conta, mas não são documentos reais. */
const hasRepeatedDigits = (digits: string): boolean => /^(\d)\1+$/.test(digits);

/** Dígito verificador: soma ponderada, resto por 11 (resto < 2 vira 0). */
const checkDigit = (digits: string, weights: number[]): number => {
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const remainder = sum % MOD;
  return remainder < 2 ? 0 : MOD - remainder;
};

/** Aceita CPF com ou sem máscara. */
export const isValidCpf = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length !== CPF_LENGTH || hasRepeatedDigits(digits)) return false;

  return (
    checkDigit(digits, CPF_FIRST_WEIGHTS) === Number(digits[9]) &&
    checkDigit(digits, CPF_SECOND_WEIGHTS) === Number(digits[10])
  );
};

/** Aceita CNPJ numérico com ou sem máscara (CNPJ alfanumérico ainda não é suportado). */
export const isValidCnpj = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length !== CNPJ_LENGTH || hasRepeatedDigits(digits)) return false;

  return (
    checkDigit(digits, CNPJ_FIRST_WEIGHTS) === Number(digits[12]) &&
    checkDigit(digits, CNPJ_SECOND_WEIGHTS) === Number(digits[13])
  );
};

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());
