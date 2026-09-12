/**
 * utils/formatters.ts
 *
 * Funções puras de formatação de dados.
 * Todas as funções aqui devem ser stateless e testáveis de forma isolada.
 */

/**
 * Converte uma duração em segundos para o formato "Xh Ymin".
 * @example formatDuration(3661) // → "1h 01min"
 */
export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) return '0min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
};

export const formatWorkload = (durationTime: number | null): string => {
  if (durationTime === null || durationTime <= 0) return '0min';

  const hours = Math.floor(durationTime / 60);
  const minutes = durationTime % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * @example formatCurrency(1500) // → "R$ 1.500,00"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um valor em reais (não em centavos) no mesmo padrão numérico usado
 * por `maskCurrencyInput` — sem o símbolo "R$", pra preencher um campo de
 * formulário que já tem esse prefixo como addon visual.
 * @example formatDecimalInput(499) // → "499,00"
 */
export const formatDecimalInput = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Máscara de valor monetário no padrão de mercado: o usuário só digita
 * números, e eles entram da direita pra esquerda como centavos — digitar "1"
 * mostra "0,01", mais um "0" mostra "0,10", mais um "0" mostra "1,00", e assim
 * por diante. Qualquer caractere que não seja dígito (inclusive o que a
 * própria máscara insere, como o separador de milhar e a vírgula) é
 * descartado antes de recalcular o valor — então funciona tanto ao digitar
 * quanto ao apagar (backspace) o último dígito exibido.
 * @example maskCurrencyInput("100") // → "1,00"
 * @example maskCurrencyInput("150000") // → "1.500,00"
 */
export const maskCurrencyInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return '';

  const cents = Number(digits);
  return formatDecimalInput(cents / 100);
};

/**
 * Capitaliza a primeira letra de cada palavra em uma string.
 * @example toTitleCase("turismo de luxo") // → "Turismo De Luxo"
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca uma string para um comprimento máximo, adicionando "..." no final.
 * @example truncate("texto longo", 8) // → "texto..."
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};
