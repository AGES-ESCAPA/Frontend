/**
 * utils/creditCard.ts
 *
 * Máscaras e validações de cartão de crédito, executadas só no navegador
 * (compra simulada). Funções puras: nenhum dado do cartão é guardado aqui.
 */

const CARD_NUMBER_MAX_DIGITS = 19;
const CARD_NUMBER_MIN_DIGITS = 13;

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/**
 * Máscara do número do cartão em grupos de 4 dígitos.
 * @example maskCardNumber('1234567891011121') // → "1234 5678 9101 1121"
 */
export const maskCardNumber = (raw: string): string =>
  (
    onlyDigits(raw)
      .slice(0, CARD_NUMBER_MAX_DIGITS)
      .match(/.{1,4}/g) ?? []
  ).join(' ');

/**
 * Valida o número do cartão pelo algoritmo de Luhn (13 a 19 dígitos).
 * Aceita o número com ou sem a máscara.
 * @example isValidCardNumber('4539 1488 0343 6467') // → true
 */
export const isValidCardNumber = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length < CARD_NUMBER_MIN_DIGITS || digits.length > CARD_NUMBER_MAX_DIGITS) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

/**
 * Máscara da validade no formato MM/AA. Um primeiro dígito maior que 1 já
 * vira o mês com zero à esquerda ("4" → "04/").
 * @example maskCardExpiry('0328') // → "03/28"
 */
export const maskCardExpiry = (raw: string): string => {
  const digits = onlyDigits(raw).slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) return `0${digits}/`;
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

/**
 * Valida a validade MM/AA: mês de 01 a 12 e cartão não vencido. O cartão vale
 * até o último dia do mês informado.
 * @example isValidCardExpiry('03/24', new Date(2026, 9, 1)) // → false
 */
export const isValidCardExpiry = (value: string, now: Date = new Date()): boolean => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
};

/** Mantém só dígitos do CVV (máximo 4). */
export const maskCardCvv = (raw: string): string => onlyDigits(raw).slice(0, 4);

/** O CVV tem 3 dígitos (maioria das bandeiras) ou 4 (American Express). */
export const isValidCardCvv = (value: string): boolean => /^\d{3,4}$/.test(value);

/** Nome impresso: só letras, espaços, apóstrofo e hífen, em maiúsculas. */
export const maskCardHolderName = (raw: string): string =>
  raw.replace(/[^\p{L}\s'-]/gu, '').toUpperCase();

const CARD_HOLDER_NAME_MIN_LETTERS = 3;

/**
 * O nome impresso precisa ter ao menos 3 letras, sem contar espaços, apóstrofos
 * e hifens ("A B" e "AB" são recusados).
 * @example isValidCardHolderName('A B') // → false
 */
export const isValidCardHolderName = (value: string): boolean =>
  (value.match(/\p{L}/gu) ?? []).length >= CARD_HOLDER_NAME_MIN_LETTERS;
