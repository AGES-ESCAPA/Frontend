const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const PHONE_MAX_LENGTH = 11;

/** Remove tudo que não for dígito. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

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

/** 00.000.000/0000-00, formatando progressivamente enquanto o usuário digita. */
export const maskCnpj = (value: string): string => {
  const digits = onlyDigits(value).slice(0, CNPJ_LENGTH);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
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
