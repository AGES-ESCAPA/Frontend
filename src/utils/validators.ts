import { onlyDigits } from './masks';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const MOD = 11;
const ASCII_ZERO = 48;

const CPF_FIRST_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CPF_SECOND_WEIGHTS = [11, ...CPF_FIRST_WEIGHTS];
const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_SECOND_WEIGHTS = [6, ...CNPJ_FIRST_WEIGHTS];

/** 12 posições alfanuméricas seguidas de 2 dígitos verificadores numéricos. */
const CNPJ_PATTERN = /^[0-9A-Z]{12}[0-9]{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sequências como 111.111.111-11 passam na conta, mas não são documentos reais. */
const hasRepeatedChars = (value: string): boolean => /^(.)\1+$/.test(value);

/** Número vale ele mesmo; letra vale o código ASCII menos 48 (A = 17, B = 18...). */
const charValue = (char: string): number => char.charCodeAt(0) - ASCII_ZERO;

/** Dígito verificador: soma ponderada, resto por 11 (resto < 2 vira 0). */
const checkDigit = (chars: string, weights: number[]): number => {
  const sum = weights.reduce((total, weight, index) => total + charValue(chars[index]) * weight, 0);
  const remainder = sum % MOD;
  return remainder < 2 ? 0 : MOD - remainder;
};

/** Aceita CPF com ou sem máscara. */
export const isValidCpf = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length !== CPF_LENGTH || hasRepeatedChars(digits)) return false;

  return (
    checkDigit(digits, CPF_FIRST_WEIGHTS) === Number(digits[9]) &&
    checkDigit(digits, CPF_SECOND_WEIGHTS) === Number(digits[10])
  );
};

/** Aceita CNPJ numérico ou alfanumérico, com ou sem máscara, em maiúsculas ou minúsculas. */
export const isValidCnpj = (value: string): boolean => {
  const chars = value.replace(/[^0-9a-z]/gi, '').toUpperCase();
  if (chars.length !== CNPJ_LENGTH || !CNPJ_PATTERN.test(chars) || hasRepeatedChars(chars)) {
    return false;
  }

  return (
    checkDigit(chars, CNPJ_FIRST_WEIGHTS) === Number(chars[12]) &&
    checkDigit(chars, CNPJ_SECOND_WEIGHTS) === Number(chars[13])
  );
};

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());
