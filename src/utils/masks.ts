const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const CNPJ_BASE_LENGTH = 12;
const PHONE_MAX_LENGTH = 11;

/** Remove tudo que não for dígito. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/**
 * Normaliza um CNPJ numérico ou alfanumérico: remove a pontuação e converte para
 * maiúsculas. As 12 primeiras posições aceitam letras e números; as 2 últimas
 * (dígitos verificadores) aceitam somente números. O excedente é descartado.
 */
export const normalizeCnpj = (value: string): string => {
  const cleaned = value.replace(/[^0-9a-z]/gi, '').toUpperCase();
  const base = cleaned.slice(0, CNPJ_BASE_LENGTH);
  const checkDigits = onlyDigits(cleaned.slice(CNPJ_BASE_LENGTH)).slice(
    0,
    CNPJ_LENGTH - CNPJ_BASE_LENGTH,
  );

  return base + checkDigits;
};

/** 000.000.000-00, formatando progressivamente enquanto o usuário digita. */
export const maskCpf = (value: string): string => {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

/** AA.AAA.AAA/AAAA-00 (numérico ou alfanumérico), formatando progressivamente. */
export const maskCnpj = (value: string): string => {
  const chars = normalizeCnpj(value);

  if (chars.length <= 2) return chars;
  if (chars.length <= 5) return `${chars.slice(0, 2)}.${chars.slice(2)}`;
  if (chars.length <= 8) {
    return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5)}`;
  }
  if (chars.length <= 12) {
    return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8)}`;
  }
  return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8, 12)}-${chars.slice(12)}`;
};

/**
 * Telefone brasileiro com DDD: (00) 0000-0000 (fixo, 10 dígitos)
 * ou (00) 00000-0000 (celular, 11 dígitos).
 */
export const maskPhone = (value: string): string => {
  const digits = onlyDigits(value).slice(0, PHONE_MAX_LENGTH);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
